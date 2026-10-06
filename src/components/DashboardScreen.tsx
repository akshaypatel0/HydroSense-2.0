/**
 * HYDROSENSE - Screen 1: Dashboard
 * 
 * Layout:
 * - Top: Brand HYDROSENSE & Subtitle Smart Water Tank, Bluetooth status
 * - Safety Alert Banner (Target Reached, 95% Cutoff, Sensor Timeout)
 * - Center: Large animated water tank (WaterTankVisualization)
 * - Below: Motor Status & Controls (START MOTOR / STOP MOTOR)
 * - Compact cards: System Health & Target quick info
 */

import React from 'react';
import { Bluetooth, Radio, ShieldCheck, ChevronRight } from 'lucide-react';
import { TankState, LocalSettings } from '../types/hydrosense.ts';
import { WaterTankVisualization } from './WaterTankVisualization.tsx';
import { MotorControlCard } from './MotorControlCard.tsx';
import { TargetLevelCard } from './TargetLevelCard.tsx';
import { SystemHealthSection } from './SystemHealthSection.tsx';
import { SafetyAlertBanner } from './SafetyAlertBanner.tsx';

interface DashboardScreenProps {
  state: TankState;
  settings: LocalSettings;
  onStartMotor: () => void;
  onStopMotor: () => void;
  onSetTarget: (target: number) => void;
  onOpenBluetoothModal: () => void;
  onDismissAlert: () => void;
  onNavigateToControl: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  state,
  settings,
  onStartMotor,
  onStopMotor,
  onSetTarget,
  onOpenBluetoothModal,
  onDismissAlert,
  onNavigateToControl,
}) => {
  const isConnected = state.bluetoothStatus === 'CONNECTED';
  const isConnecting = state.bluetoothStatus === 'CONNECTING';

  const isLight = settings.theme === 'light';

  return (
    <div className="w-full space-y-5 pb-6">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className={`text-[11px] font-mono tracking-widest uppercase font-bold block ${
            isLight ? 'text-cyan-700' : 'text-cyan-400'
          }`}>
            Smart Water Tank
          </span>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            HYDROSENSE
          </h1>
        </div>

        {/* Bluetooth Link Status Badge */}
        <button
          onClick={onOpenBluetoothModal}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all backdrop-blur-md shadow-sm cursor-pointer ${
            isConnected
              ? (isLight ? 'bg-sky-100/90 border-sky-300 text-sky-900 hover:bg-sky-200/80 shadow-sky-200/40' : 'bg-blue-950/70 border-blue-500/40 text-blue-200 hover:bg-blue-900/60')
              : isConnecting
              ? (isLight ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse' : 'bg-amber-950/70 border-amber-500/40 text-amber-200 animate-pulse')
              : (isLight ? 'bg-white/80 border-sky-200 text-slate-700 hover:bg-sky-50 shadow-slate-200/50' : 'bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-800')
          }`}
          title="Manage Bluetooth Classic connection"
        >
          <Bluetooth
            className={`w-4 h-4 ${
              isConnected ? (isLight ? 'text-cyan-600' : 'text-cyan-400') : isConnecting ? 'text-amber-500' : (isLight ? 'text-slate-400' : 'text-slate-400')
            }`}
          />
          <span className="font-mono text-xs">
            {isConnected ? 'HC-05' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-emerald-500'
                : isConnecting
                ? 'bg-amber-400 animate-ping'
                : 'bg-slate-400'
            }`}
          />
        </button>
      </div>

      {/* Safety Alert Notification */}
      <SafetyAlertBanner alert={state.lastAlert} onDismiss={onDismissAlert} theme={settings.theme} />

      {/* Main Animated Water Tank Visualization */}
      <div className="flex flex-col items-center justify-center py-2">
        <WaterTankVisualization
          levelPercent={state.levelPercent}
          hasReceivedData={state.hasReceivedData}
          isConnected={isConnected}
          targetPercent={state.targetPercent}
          tankCapacityLiters={settings.tankCapacityLiters}
          motorRunning={state.motorRunning}
          theme={settings.theme}
          onConnectClick={onOpenBluetoothModal}
        />
      </div>

      {/* Primary Motor Control Card */}
      <MotorControlCard
        motorRunning={state.motorRunning}
        motorPending={state.motorPending}
        bluetoothStatus={state.bluetoothStatus}
        onStartMotor={onStartMotor}
        onStopMotor={onStopMotor}
        theme={settings.theme}
      />

      {/* Target Level Quick Card */}
      <TargetLevelCard
        currentTargetPercent={state.targetPercent}
        isConnected={isConnected}
        onSetTarget={onSetTarget}
        theme={settings.theme}
      />

      {/* System Health Diagnostics Section */}
      <SystemHealthSection
        state={state}
        onConnectClick={onOpenBluetoothModal}
        theme={settings.theme}
      />
    </div>
  );
};
