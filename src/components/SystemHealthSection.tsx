/**
 * HYDROSENSE - System Health & Hardware Status
 * 
 * Provides:
 * - Sensor: OK / TIMEOUT / ERROR
 * - Bluetooth: Connected (HC-05) / Disconnected / Connecting
 * - Controller: Online / Interrupted / Offline
 * - Stale Data Monitor: "Last update: 1s ago" / "Connection may be interrupted"
 * - Buzzer Status: Normal / High Level / Safety Warning
 * - Full Light (Watery Glass) and Dark theme support
 */

import React, { useEffect, useState } from 'react';
import { Activity, Bluetooth, Radio, Cpu, Bell, AlertTriangle } from 'lucide-react';
import { TankState } from '../types/hydrosense.ts';

interface SystemHealthSectionProps {
  state: TankState;
  onConnectClick?: () => void;
  theme?: 'dark' | 'light';
}

export const SystemHealthSection: React.FC<SystemHealthSectionProps> = ({
  state,
  onConnectClick,
  theme = 'light',
}) => {
  const [elapsedSec, setElapsedSec] = useState<number | null>(null);
  const isLight = theme === 'light';

  // Live timer for elapsed time since last data packet
  useEffect(() => {
    const updateElapsed = () => {
      if (state.lastUpdateTimestamp) {
        const sec = Math.floor((Date.now() - state.lastUpdateTimestamp) / 1000);
        setElapsedSec(sec);
      } else {
        setElapsedSec(null);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [state.lastUpdateTimestamp]);

  const isConnected = state.bluetoothStatus === 'CONNECTED';
  const isConnecting = state.bluetoothStatus === 'CONNECTING';

  // Elapsed text formatting
  let lastDataText = 'No recent data';
  if (state.lastUpdateTimestamp !== null && elapsedSec !== null) {
    if (elapsedSec <= 1) {
      lastDataText = '1 sec ago';
    } else if (elapsedSec < 60) {
      lastDataText = `${elapsedSec} sec ago`;
    } else {
      lastDataText = `${Math.floor(elapsedSec / 60)}m ago`;
    }
  }

  // Buzzer label
  let buzzerLabel = 'Normal';
  let buzzerColor = isLight ? 'text-slate-700' : 'text-slate-300';
  if (state.buzzerStatus === 'CRITICAL') {
    buzzerLabel = 'Continuous Beep (98.9%+)';
    buzzerColor = 'text-rose-600 dark:text-rose-400 font-semibold';
  } else if (state.buzzerStatus === 'WARNING') {
    buzzerLabel = 'Fast Beep (Safety Cutoff)';
    buzzerColor = 'text-amber-600 dark:text-amber-400 font-semibold';
  } else if (state.buzzerStatus === 'HIGH_LEVEL') {
    buzzerLabel = 'Slow Beep (90%+)';
    buzzerColor = 'text-amber-500 dark:text-amber-300';
  }

  return (
    <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl transition-all shadow-xl ${
      isLight
        ? 'bg-white/85 border-sky-200/80 shadow-[0_10px_30px_rgba(14,165,233,0.08)]'
        : 'bg-slate-900/50 border-white/10'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`text-xs font-semibold tracking-wider uppercase block ${
            isLight ? 'text-sky-700' : 'text-slate-400'
          }`}>
            Diagnostics
          </span>
          <h3 className={`text-lg font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            System Health
          </h3>
        </div>

        {/* Stale Warning Indicator */}
        {state.isStale && isConnected && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Connection may be interrupted</span>
          </div>
        )}
      </div>

      {/* Grid of 4 Health Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Ultrasonic Sensor */}
        <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
          isLight ? 'bg-sky-50/70 border-sky-200/70 shadow-xs' : 'bg-white/5 border-white/5'
        }`}>
          <div className={`flex items-center justify-between text-xs mb-2 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <span>Sensor</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                state.sensorStatus === 'OK'
                  ? 'bg-emerald-500'
                  : state.sensorStatus === 'TIMEOUT'
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className={`font-semibold text-sm font-mono ${
              isLight ? 'text-sky-950' : 'text-white'
            }`}>
              {state.sensorStatus === 'OK'
                ? 'OK'
                : state.sensorStatus === 'TIMEOUT'
                ? 'TIMEOUT'
                : 'OFFLINE'}
            </span>
          </div>
          <span className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            HC-SR04 Ultrasonic
          </span>
        </div>

        {/* Metric 2: Bluetooth */}
        <div
          onClick={!isConnected ? onConnectClick : undefined}
          className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-colors ${
            isLight ? 'bg-sky-50/70 border-sky-200/70 shadow-xs' : 'bg-white/5 border-white/5'
          } ${!isConnected ? 'cursor-pointer hover:bg-sky-100/70' : ''}`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <span>Bluetooth</span>
            <Bluetooth className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-500'
                  : isConnecting
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-slate-400'
              }`}
            />
            <span className={`font-semibold text-sm font-mono ${
              isLight ? 'text-sky-950' : 'text-white'
            }`}>
              {isConnected
                ? 'Connected'
                : isConnecting
                ? 'Connecting'
                : 'Disconnected'}
            </span>
          </div>
          <span className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {isConnected ? state.connectedDeviceName : 'Tap to connect'}
          </span>
        </div>

        {/* Metric 3: Controller */}
        <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
          isLight ? 'bg-sky-50/70 border-sky-200/70 shadow-xs' : 'bg-white/5 border-white/5'
        }`}>
          <div className={`flex items-center justify-between text-xs mb-2 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <span>Controller</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                state.controllerStatus === 'ONLINE'
                  ? 'bg-emerald-500'
                  : state.controllerStatus === 'INTERRUPTED'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className={`font-semibold text-sm font-mono ${
              isLight ? 'text-sky-950' : 'text-white'
            }`}>
              {state.controllerStatus === 'ONLINE'
                ? 'Online'
                : state.controllerStatus === 'INTERRUPTED'
                ? 'Interrupted'
                : 'Offline'}
            </span>
          </div>
          <span className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Arduino Mega 2560
          </span>
        </div>

        {/* Metric 4: Last Data Heartbeat */}
        <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
          isLight ? 'bg-sky-50/70 border-sky-200/70 shadow-xs' : 'bg-white/5 border-white/5'
        }`}>
          <div className={`flex items-center justify-between text-xs mb-2 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <span>Last data</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`font-semibold text-sm font-mono ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            {lastDataText}
          </div>
          <span className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            1 Hz Serial stream
          </span>
        </div>
      </div>

      {/* Buzzer and Hardware Status Footer Bar */}
      <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between text-xs gap-2 ${
        isLight ? 'border-sky-100 text-slate-600' : 'border-white/5 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-medium">Buzzer:</span>
          <span className={`font-mono text-xs ${buzzerColor}`}>{buzzerLabel}</span>
        </div>

        {state.pingLatencyMs !== null && isConnected && (
          <div className="font-mono text-[11px]">
            RFCOMM Ping: <span className="text-cyan-600 dark:text-cyan-300 font-semibold">{state.pingLatencyMs}ms</span>
          </div>
        )}
      </div>
    </div>
  );
};
