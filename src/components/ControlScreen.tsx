/**
 * HYDROSENSE - Screen 2: Control
 * 
 * Focuses on:
 * - Target level regulation (1% to 95%)
 * - Motor relay control with safety interlocking
 * - Volume calculations in Liters
 * - Hardware safety architecture documentation
 * - Full Light (Watery Glass) and Dark theme support
 */

import React from 'react';
import { Target, Shield, Droplets, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { TankState, LocalSettings } from '../types/hydrosense.ts';
import { MotorControlCard } from './MotorControlCard.tsx';
import { TargetLevelCard } from './TargetLevelCard.tsx';
import { SafetyAlertBanner } from './SafetyAlertBanner.tsx';

interface ControlScreenProps {
  state: TankState;
  settings: LocalSettings;
  onStartMotor: () => void;
  onStopMotor: () => void;
  onSetTarget: (target: number) => void;
  onDismissAlert: () => void;
}

export const ControlScreen: React.FC<ControlScreenProps> = ({
  state,
  settings,
  onStartMotor,
  onStopMotor,
  onSetTarget,
  onDismissAlert,
}) => {
  const isConnected = state.bluetoothStatus === 'CONNECTED';
  const isLight = settings.theme === 'light';

  // Volume computations
  const currentLiters = state.levelPercent !== null
    ? Math.round((state.levelPercent / 100) * settings.tankCapacityLiters)
    : 0;
  const targetLiters = Math.round((state.targetPercent / 100) * settings.tankCapacityLiters);
  const remainingLitersToTarget = Math.max(0, targetLiters - currentLiters);
  const emptyHeadroomLiters = Math.max(0, settings.tankCapacityLiters - currentLiters);

  return (
    <div className="w-full space-y-5 pb-6">
      {/* Header */}
      <div className="pt-1">
        <span className={`text-[11px] font-mono tracking-widest uppercase font-bold block ${
          isLight ? 'text-cyan-700' : 'text-cyan-400'
        }`}>
          Setpoint & Relay
        </span>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
          isLight ? 'text-sky-950' : 'text-white'
        }`}>
          Control Center
        </h1>
        <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Adjust automated shutoff setpoint and actuate the water pump relay.
        </p>
      </div>

      <SafetyAlertBanner alert={state.lastAlert} onDismiss={onDismissAlert} theme={settings.theme} />

      {/* Target Level Configuration Card */}
      <TargetLevelCard
        currentTargetPercent={state.targetPercent}
        isConnected={isConnected}
        onSetTarget={onSetTarget}
        theme={settings.theme}
      />

      {/* Primary Motor Relay Actuation Card */}
      <MotorControlCard
        motorRunning={state.motorRunning}
        motorPending={state.motorPending}
        bluetoothStatus={state.bluetoothStatus}
        onStartMotor={onStartMotor}
        onStopMotor={onStopMotor}
        theme={settings.theme}
      />

      {/* Volume Transfer Breakdown Card */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl transition-all shadow-xl ${
        isLight
          ? 'bg-white/85 border-sky-200/80 shadow-[0_10px_30px_rgba(14,165,233,0.08)]'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-4 h-4 text-cyan-500" />
          <h3 className={`text-base font-bold tracking-tight ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            Volume & Delivery Estimation
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-sky-50/70 border-sky-200/70 shadow-xs' : 'bg-white/5 border-white/5'
          }`}>
            <span className={`text-[10px] block uppercase font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Current Volume
            </span>
            <div className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
              isLight ? 'text-sky-950' : 'text-white'
            }`}>
              {state.levelPercent !== null ? `${currentLiters.toLocaleString()} L` : '-- L'}
            </div>
            <span className={`text-[10px] font-mono ${
              isLight ? 'text-cyan-700 font-semibold' : 'text-cyan-400/80'
            }`}>
              {state.levelPercent !== null ? `${state.levelPercent.toFixed(1)}% of Tank` : 'Awaiting Data'}
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-sky-50/70 border-sky-200/70 shadow-xs' : 'bg-white/5 border-white/5'
          }`}>
            <span className={`text-[10px] block uppercase font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Target Volume
            </span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-300 font-mono tabular-nums mt-0.5">
              {targetLiters.toLocaleString()} L
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-mono font-medium">
              {state.targetPercent}% Setpoint
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border col-span-2 sm:col-span-1 ${
            isLight ? 'bg-sky-50/70 border-sky-200/70 shadow-xs' : 'bg-white/5 border-white/5'
          }`}>
            <span className={`text-[10px] block uppercase font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Inflow to Target
            </span>
            <div className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
              isLight ? 'text-cyan-800' : 'text-cyan-200'
            }`}>
              {remainingLitersToTarget.toLocaleString()} L
            </div>
            <span className={`text-[10px] font-mono ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Headroom: {emptyHeadroomLiters.toLocaleString()} L
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Safety Architecture Card */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl transition-all shadow-xl ${
        isLight
          ? 'bg-white/85 border-sky-200/80 shadow-[0_10px_30px_rgba(14,165,233,0.08)]'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-emerald-500" />
          <h3 className={`text-base font-bold tracking-tight ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            Arduino Safety Architecture
          </h3>
        </div>

        <p className={`text-xs leading-relaxed mb-4 ${
          isLight ? 'text-slate-600' : 'text-slate-300'
        }`}>
          The Arduino Mega 2560 is the absolute safety authority. The Android application functions as a monitoring and command console. If communication is lost, Arduino maintains autonomous protection.
        </p>

        <div className="space-y-2.5">
          <div className={`flex items-start gap-3 p-3 rounded-2xl border ${
            isLight ? 'bg-sky-50/70 border-sky-200/70' : 'bg-white/5 border-white/5'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <div>
              <h4 className={`text-xs font-semibold ${isLight ? 'text-sky-950' : 'text-white'}`}>
                Target Auto-Cutoff
              </h4>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                When water reaches target percentage, Arduino de-energizes the motor relay and broadcasts <code className="text-cyan-600 dark:text-cyan-300 font-mono">MOTOR_OFF:TARGET_REACHED</code>.
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3 p-3 rounded-2xl border ${
            isLight ? 'bg-sky-50/70 border-sky-200/70' : 'bg-white/5 border-white/5'
          }`}>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className={`text-xs font-semibold ${isLight ? 'text-sky-950' : 'text-white'}`}>
                95% Hard Failsafe Limit
              </h4>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Regardless of requested targets, any reading reaching 95.0% forces immediate motor shutdown via <code className="text-amber-600 dark:text-amber-300 font-mono">MOTOR_OFF:SAFETY_LIMIT</code>.
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3 p-3 rounded-2xl border ${
            isLight ? 'bg-sky-50/70 border-sky-200/70' : 'bg-white/5 border-white/5'
          }`}>
            <Cpu className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className={`text-xs font-semibold ${isLight ? 'text-sky-950' : 'text-white'}`}>
                Ultrasonic Sensor-Loss Protection
              </h4>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                If the HC-SR04 ultrasonic sensor stops providing valid echo pulses while pumping, the motor is aborted via <code className="text-rose-600 dark:text-rose-300 font-mono">MOTOR_OFF:SENSOR_TIMEOUT</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
