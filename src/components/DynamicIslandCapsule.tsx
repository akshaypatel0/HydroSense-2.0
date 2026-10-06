/**
 * HYDROSENSE - iOS Dynamic Island Live Notification Capsule
 * 
 * Features:
 * - Real-time morphing capsule inspired by iOS Dynamic Island / Live Activity
 * - Threshold-triggered expanding alerts (fires once upon crossing boundary):
 *   * Level < 50%: Half Tank Notice
 *   * Level < 30%: Low Water Warning
 *   * Level < 15%: Critical Low Level
 *   * Level < 5%: Tank Nearly Empty (Urgent)
 *   * Level = 0%: Tank Completely Empty
 * - Live Motor Activity Capsule:
 *   * Spinning pump turbine animation
 *   * Live runtime stopwatch timer (mm:ss)
 *   * Water flow ripple bars
 * - Event Auto-Expansion:
 *   * Target Reached (e.g. 80%) auto-cutoff
 *   * 95% Safety Limit auto-shutdown
 *   * Sensor Timeout / Loss of echo
 *   * Bluetooth Classic link status
 * - Interactive Tap-to-Expand:
 *   * Tapping the island expands into a rich mini-control card with quick Motor Start/Stop toggle,
 *     live capacity gauge, and distance telemetry.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplet,
  Play,
  Square,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Bluetooth,
  Radio,
  ChevronDown,
  X,
  Gauge,
  Flame,
  Zap,
} from 'lucide-react';
import { TankState, LocalSettings, DynamicIslandNotification } from '../types/hydrosense.ts';

interface DynamicIslandProps {
  state: TankState;
  settings: LocalSettings;
  onStartMotor: () => void;
  onStopMotor: () => void;
  onOpenBluetoothModal: () => void;
  className?: string;
}

export const DynamicIslandCapsule: React.FC<DynamicIslandProps> = ({
  state,
  settings,
  onStartMotor,
  onStopMotor,
  onOpenBluetoothModal,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<DynamicIslandNotification | null>(null);
  const [alertTimeoutId, setAlertTimeoutId] = useState<number | null>(null);

  // Motor stopwatch timer
  const [motorElapsedSeconds, setMotorElapsedSeconds] = useState<number>(0);

  // Threshold crossing tracking (to ensure alerts fire ONCE when crossing)
  const firedThresholdsRef = useRef<{
    below50: boolean;
    below30: boolean;
    below15: boolean;
    below5: boolean;
    isZero: boolean;
  }>({
    below50: false,
    below30: false,
    below15: false,
    below5: false,
    isZero: false,
  });

  const prevMotorRef = useRef<boolean>(false);
  const prevLevelRef = useRef<number | null>(null);
  const prevAlertIdRef = useRef<string | null>(null);

  const isConnected = state.bluetoothStatus === 'CONNECTED';
  const isLive = isConnected && state.hasReceivedData && state.levelPercent !== null;
  const level = state.levelPercent ?? 0;

  // Trigger an alert banner on the island
  const triggerIslandAlert = (notification: DynamicIslandNotification, durationMs = 7000) => {
    setActiveAlert(notification);
    if (alertTimeoutId) clearTimeout(alertTimeoutId);

    // Haptic feedback if supported & enabled
    if (settings.hapticEnabled && 'vibrate' in navigator) {
      if (notification.severity === 'critical') {
        navigator.vibrate([100, 50, 100, 50, 150]);
      } else if (notification.severity === 'warning') {
        navigator.vibrate([80, 40, 80]);
      } else {
        navigator.vibrate(60);
      }
    }

    const timer = window.setTimeout(() => {
      setActiveAlert(null);
    }, durationMs);
    setAlertTimeoutId(timer);
  };

  // Motor running stopwatch
  useEffect(() => {
    let timer: number | null = null;
    if (state.motorRunning) {
      timer = window.setInterval(() => {
        setMotorElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setMotorElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.motorRunning]);

  // Monitor level changes for one-time threshold alerts (<50, <30, <15, <5, ==0)
  useEffect(() => {
    if (!isLive || state.levelPercent === null) return;

    const curr = state.levelPercent;
    const tracker = firedThresholdsRef.current;

    // 1. Level below 50%
    if (curr < 50.0 && !tracker.below50) {
      tracker.below50 = true;
      triggerIslandAlert({
        id: `level-50-${Date.now()}`,
        type: 'LEVEL_50',
        title: 'Half Tank Alert',
        subtitle: `Water level is below 50% (${curr.toFixed(1)}% remaining)`,
        badge: '< 50%',
        severity: 'info',
        timestamp: Date.now(),
      });
    } else if (curr >= 52.0 && tracker.below50) {
      // Hysteresis reset
      tracker.below50 = false;
    }

    // 2. Level below 30%
    if (curr < 30.0 && !tracker.below30) {
      tracker.below30 = true;
      triggerIslandAlert({
        id: `level-30-${Date.now()}`,
        type: 'LEVEL_30',
        title: 'Low Water Warning',
        subtitle: `Tank is below 30% (${curr.toFixed(1)}%) · Consider refilling`,
        badge: '< 30%',
        severity: 'warning',
        timestamp: Date.now(),
      });
    } else if (curr >= 32.0 && tracker.below30) {
      tracker.below30 = false;
    }

    // 3. Level below 15%
    if (curr < 15.0 && !tracker.below15) {
      tracker.below15 = true;
      triggerIslandAlert({
        id: `level-15-${Date.now()}`,
        type: 'LEVEL_15',
        title: 'Critical Low Water',
        subtitle: `Level is at ${curr.toFixed(1)}% · Pump start recommended`,
        badge: '< 15%',
        severity: 'warning',
        timestamp: Date.now(),
      });
    } else if (curr >= 17.0 && tracker.below15) {
      tracker.below15 = false;
    }

    // 4. Level below 5%
    if (curr < 5.0 && curr > 0.0 && !tracker.below5) {
      tracker.below5 = true;
      triggerIslandAlert({
        id: `level-5-${Date.now()}`,
        type: 'LEVEL_5',
        title: 'Tank Nearly Empty!',
        subtitle: `Emergency level (${curr.toFixed(1)}%) · Refill now`,
        badge: '< 5%',
        severity: 'critical',
        timestamp: Date.now(),
      });
    } else if (curr >= 7.0 && tracker.below5) {
      tracker.below5 = false;
    }

    // 5. Level is 0%
    if (curr <= 0.0 && !tracker.isZero) {
      tracker.isZero = true;
      triggerIslandAlert({
        id: `level-0-${Date.now()}`,
        type: 'LEVEL_0',
        title: 'Tank Completely Empty',
        subtitle: '0.0% water · Ultrasonic sensor at empty benchmark (14cm)',
        badge: '0% EMPTY',
        severity: 'critical',
        timestamp: Date.now(),
      });
    } else if (curr > 1.5 && tracker.isZero) {
      tracker.isZero = false;
    }

    prevLevelRef.current = curr;
  }, [state.levelPercent, isLive]);

  // Monitor motor state transitions
  useEffect(() => {
    const wasRunning = prevMotorRef.current;
    const isRunning = state.motorRunning;

    if (!wasRunning && isRunning) {
      // Motor turned ON
      triggerIslandAlert({
        id: `motor-start-${Date.now()}`,
        type: 'MOTOR_RUNNING',
        title: 'Motor Relay Pumping',
        subtitle: 'Inflow active · Ultrasonic level updating',
        badge: 'PUMP ON',
        severity: 'success',
        timestamp: Date.now(),
      });
    } else if (wasRunning && !isRunning) {
      // Motor turned OFF
      triggerIslandAlert({
        id: `motor-stop-${Date.now()}`,
        type: 'MOTOR_STOPPED',
        title: 'Motor De-Energized',
        subtitle: 'Pump relay is OFF',
        badge: 'OFF',
        severity: 'info',
        timestamp: Date.now(),
      }, 5000);
    }

    prevMotorRef.current = isRunning;
  }, [state.motorRunning]);

  // Monitor safety events from Arduino
  useEffect(() => {
    if (state.lastAlert && state.lastAlert.id !== prevAlertIdRef.current) {
      prevAlertIdRef.current = state.lastAlert.id;
      let severity: DynamicIslandNotification['severity'] = 'info';
      if (state.lastAlert.type === 'SAFETY_LIMIT' || state.lastAlert.type === 'SENSOR_TIMEOUT') {
        severity = 'critical';
      } else if (state.lastAlert.type === 'TARGET_REACHED') {
        severity = 'success';
      }

      triggerIslandAlert({
        id: state.lastAlert.id,
        type: state.lastAlert.type as any,
        title: state.lastAlert.title,
        subtitle: state.lastAlert.message,
        badge: state.lastAlert.type === 'TARGET_REACHED' ? 'TARGET' : 'FAILSAFE',
        severity,
        timestamp: Date.now(),
      }, 8000);
    }
  }, [state.lastAlert]);

  // Format mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatedLiters = isLive ? Math.round((level / 100) * settings.tankCapacityLiters) : null;

  return (
    <div className={`w-full flex justify-center sticky top-2 z-50 pointer-events-none px-3 ${className}`}>
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32,
          mass: 0.8,
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`pointer-events-auto select-none rounded-[28px] overflow-hidden border backdrop-blur-3xl shadow-2xl transition-colors cursor-pointer ${
          isExpanded
            ? 'w-full max-w-md p-4 bg-slate-950/95 border-sky-400/30 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
            : activeAlert
            ? activeAlert.severity === 'critical'
              ? 'w-auto max-w-sm px-4 py-2 bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.35)]'
              : activeAlert.severity === 'warning'
              ? 'w-auto max-w-sm px-4 py-2 bg-amber-950/95 border-amber-500/60 text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.3)]'
              : activeAlert.severity === 'success'
              ? 'w-auto max-w-sm px-4 py-2 bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
              : 'w-auto max-w-sm px-4 py-2 bg-slate-950/95 border-cyan-500/40 text-cyan-100 shadow-[0_10px_30px_rgba(6,182,212,0.25)]'
            : state.motorRunning
            ? 'w-auto px-4 py-2 bg-slate-950/95 border-emerald-500/50 text-white shadow-[0_8px_25px_rgba(16,185,129,0.25)]'
            : 'w-auto min-w-[210px] px-3.5 py-1.5 bg-slate-950/90 border-white/15 text-slate-200 shadow-xl hover:border-cyan-400/40'
        }`}
      >
        {/* ============================================================== */}
        {/* VIEW 1: EXPANDED INTERACTIVE ISLAND HUB                        */}
        {/* ============================================================== */}
        {isExpanded ? (
          <div className="space-y-3.5" onClick={(e) => e.stopPropagation()}>
            {/* Top Bar inside Expanded Island */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Droplet className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-300">
                    HydroSense Live Island
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isConnected ? `${state.connectedDeviceName} · 9600 Baud` : 'Bluetooth Disconnected'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {state.motorRunning && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    PUMP {formatTimer(motorElapsedSeconds)}
                  </span>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Level & Volume Breakdown Bar */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                    {isLive ? level.toFixed(1) : '--'}
                  </span>
                  <span className="text-sm font-bold font-mono text-cyan-400">%</span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {calculatedLiters !== null ? `${calculatedLiters.toLocaleString()} L` : '-- L'}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    of {settings.tankCapacityLiters.toLocaleString()} L
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    level < 15
                      ? 'bg-rose-500'
                      : level < 30
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${Math.max(2, Math.min(100, level))}%` }}
                />
                {/* Target setpoint tick */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_4px_#34d399]"
                  style={{ left: `${state.targetPercent}%` }}
                  title={`Target: ${state.targetPercent}%`}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1">
                <span>0% Empty</span>
                <span className="text-emerald-400 font-semibold">Target {state.targetPercent}%</span>
                <span>95% Safety</span>
              </div>
            </div>

            {/* Quick Actions in Island */}
            <div className="grid grid-cols-2 gap-2">
              {state.motorRunning ? (
                <button
                  onClick={onStopMotor}
                  className="h-10 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/40 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP MOTOR</span>
                </button>
              ) : (
                <button
                  onClick={onStartMotor}
                  disabled={!isConnected}
                  className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START MOTOR</span>
                </button>
              )}

              <button
                onClick={onOpenBluetoothModal}
                className="h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all"
              >
                <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isConnected ? 'HC-05 Settings' : 'Connect Bluetooth'}</span>
              </button>
            </div>
          </div>
        ) : activeAlert ? (
          /* ============================================================== */
          /* VIEW 2: ACTIVE ALERT CAPSULE (Expanded notification banner)    */
          /* ============================================================== */
          <div className="flex items-center gap-3">
            {/* Animated Severity Icon */}
            <div
              className={`p-1.5 rounded-full shrink-0 ${
                activeAlert.severity === 'critical'
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : activeAlert.severity === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 animate-bounce'
                  : activeAlert.severity === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              {activeAlert.severity === 'critical' ? (
                <ShieldAlert className="w-4 h-4" />
              ) : activeAlert.severity === 'warning' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : activeAlert.severity === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Droplet className="w-4 h-4" />
              )}
            </div>

            {/* Alert Texts */}
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight truncate">
                  {activeAlert.title}
                </span>
                {activeAlert.badge && (
                  <span className="text-[9px] font-mono font-extrabold uppercase px-1 rounded bg-white/15">
                    {activeAlert.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-85 truncate leading-tight">
                {activeAlert.subtitle}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveAlert(null);
              }}
              className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : state.motorRunning ? (
          /* ============================================================== */
          /* VIEW 3: LIVE MOTOR RUNNING ACTIVITY CAPSULE                    */
          /* ============================================================== */
          <div className="flex items-center justify-between gap-3 text-xs font-mono">
            {/* Left: Spinning turbine */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-400">
                <Zap className="w-3 h-3 animate-spin text-emerald-400" />
              </div>
              <span className="font-bold text-emerald-300 tracking-wide text-[11px]">
                PUMPING
              </span>
            </div>

            {/* Center: Live Soundwave / Flow pulses */}
            <div className="flex items-center gap-0.5 h-3.5 px-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-cyan-400"
                  animate={{
                    height: ['30%', '100%', '30%'],
                  }}
                  transition={{
                    duration: 0.6 + i * 0.1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* Right: Stopwatch timer & current level */}
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="text-[11px] text-emerald-400">
                {formatTimer(motorElapsedSeconds)}
              </span>
              <span className="text-slate-500 text-[10px]">·</span>
              <span className="text-cyan-300 text-[11px]">
                {isLive ? `${level.toFixed(0)}%` : '--'}
              </span>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* VIEW 4: DEFAULT COMPACT CAPSULE                                */
          /* ============================================================== */
          <div className="flex items-center justify-between gap-2.5 text-xs font-mono">
            {/* Left: Status Icon */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  !isConnected
                    ? 'bg-slate-500'
                    : isLive
                    ? level < 15
                      ? 'bg-rose-500 animate-ping'
                      : level < 30
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                    : 'bg-blue-400'
                }`}
              />
              <span className="text-[11px] font-semibold tracking-tight text-slate-300">
                {isConnected ? 'HydroSense' : 'Offline'}
              </span>
            </div>

            {/* Center divider */}
            <span className="text-slate-600">·</span>

            {/* Right: Live percentage or Disconnected */}
            <div className="flex items-center gap-1 text-[11px]">
              {isLive ? (
                <>
                  <span className="font-bold text-white tabular-nums">
                    {level.toFixed(1)}%
                  </span>
                  <Droplet className="w-3 h-3 text-cyan-400 shrink-0" />
                </>
              ) : isConnected ? (
                <span className="text-cyan-400 text-[10px]">Awaiting Data</span>
              ) : (
                <span className="text-slate-400 text-[10px]">HC-05 Off</span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
