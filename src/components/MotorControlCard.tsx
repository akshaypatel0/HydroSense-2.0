/**
 * HYDROSENSE - Motor Control Card
 * 
 * Strict safety adherence:
 * - START MOTOR sends MOTOR_ON\n
 * - STOP MOTOR sends MOTOR_OFF\n
 * - Displays pending state until Arduino confirms via ACK:MOTOR_ON:OK or live data
 * - Never claims running without Arduino confirmation
 * - Prevents command dispatch if disconnected
 * - Absolutely no auto-start modes (per Section 36)
 * - Full Light (Watery Glass) and Dark theme support
 */

import React from 'react';
import { Play, Square, Loader2, ShieldCheck } from 'lucide-react';
import { BluetoothStatus } from '../types/hydrosense.ts';

interface MotorControlCardProps {
  motorRunning: boolean;
  motorPending: 'STARTING' | 'STOPPING' | null;
  bluetoothStatus: BluetoothStatus;
  onStartMotor: () => void;
  onStopMotor: () => void;
  theme?: 'dark' | 'light';
}

export const MotorControlCard: React.FC<MotorControlCardProps> = ({
  motorRunning,
  motorPending,
  bluetoothStatus,
  onStartMotor,
  onStopMotor,
  theme = 'light',
}) => {
  const isConnected = bluetoothStatus === 'CONNECTED';
  const isStarting = motorPending === 'STARTING';
  const isStopping = motorPending === 'STOPPING';
  const isLight = theme === 'light';

  return (
    <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl transition-all shadow-xl ${
      isLight
        ? 'bg-white/85 border-sky-200/80 shadow-[0_10px_30px_rgba(14,165,233,0.08)]'
        : 'bg-slate-900/50 border-white/10'
    }`}>
      {/* Header and status indicator */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`text-xs font-semibold tracking-wider uppercase block ${
            isLight ? 'text-sky-700' : 'text-slate-400'
          }`}>
            Relay Control
          </span>
          <h3 className={`text-lg font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            Motor Status
          </h3>
        </div>

        {/* Authoritative State Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${
            motorRunning
              ? (isLight ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30')
              : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800/80 text-slate-400 border-white/5')
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              motorRunning
                ? 'bg-emerald-500 animate-ping'
                : (isLight ? 'bg-slate-400' : 'bg-slate-500')
            }`}
          />
          <span className="font-mono font-bold">
            {motorRunning ? 'RUNNING' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Awaiting Arduino ACK indicator */}
      {(isStarting || isStopping) && (
        <div className={`flex items-center gap-2 p-2.5 mb-3 rounded-xl border text-xs ${
          isLight
            ? 'bg-cyan-50/90 border-cyan-200 text-cyan-900'
            : 'bg-cyan-950/60 border-cyan-800/50 text-cyan-200'
        }`}>
          <Loader2 className="w-4 h-4 animate-spin text-cyan-500 shrink-0" />
          <span className="font-medium">
            {isStarting
              ? 'Dispatched MOTOR_ON. Awaiting Arduino Mega confirmation...'
              : 'Dispatched MOTOR_OFF. Awaiting Arduino Mega confirmation...'}
          </span>
        </div>
      )}

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* START MOTOR BUTTON */}
        <button
          onClick={onStartMotor}
          disabled={!isConnected || motorRunning || isStarting}
          className={`group relative flex items-center justify-center gap-2.5 h-14 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg ${
            !isConnected || motorRunning || isStarting
              ? (isLight ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-slate-800/40 text-slate-500 border border-white/5 cursor-not-allowed')
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20 active:scale-[0.98] cursor-pointer'
          }`}
          title={!isConnected ? 'Connect to HC-05 first' : 'Start water pump relay'}
        >
          {isStarting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
          )}
          <span>START MOTOR</span>
        </button>

        {/* STOP MOTOR BUTTON */}
        <button
          onClick={onStopMotor}
          disabled={!isConnected || (!motorRunning && !isStopping)}
          className={`group relative flex items-center justify-center gap-2.5 h-14 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg ${
            !isConnected || (!motorRunning && !isStopping)
              ? (isLight ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-slate-800/40 text-slate-500 border border-white/5 cursor-not-allowed')
              : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/20 active:scale-[0.98] cursor-pointer'
          }`}
          title={!isConnected ? 'Connect to HC-05 first' : 'Immediately shut off motor relay'}
        >
          {isStopping ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Square className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
          )}
          <span>STOP MOTOR</span>
        </button>
      </div>

      {/* Safety Notice Footer */}
      <div className={`mt-3.5 pt-3 border-t flex items-center justify-between text-[11px] ${
        isLight ? 'border-sky-100 text-slate-600' : 'border-white/5 text-slate-400'
      }`}>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
          <span>Arduino 95% Cutoff & Sensor-loss Failsafe Active</span>
        </div>
        <span className="font-mono text-slate-400">HC-05 RFCOMM</span>
      </div>
    </div>
  );
};
