/**
 * HYDROSENSE - Screen 3: Technical Details
 * 
 * Hardware diagnostics and raw telemetry screen:
 * - Ultrasonic Distance (cm)
 * - Authoritative Water Percentage (%)
 * - Current Target (%)
 * - Motor State (ON / OFF)
 * - Calibration values: Empty distance (14.00 cm), Full distance (2.42 cm)
 * - STATUS command trigger
 * - Manual PING / PONG test with round-trip latency
 * - Buzzer acoustic profile status
 * - Hardware Pinout & Wiring reference
 * - Full Light (Watery Glass) and Dark theme support
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, Send, Radio, Bell, Cpu, Layers, Loader2, Gauge } from 'lucide-react';
import { TankState, LocalSettings, HARDWARE_DEFAULTS } from '../types/hydrosense.ts';

interface TechnicalScreenProps {
  state: TankState;
  settings?: LocalSettings;
  onSendStatus: () => void;
  onSendPing: () => void;
  onOpenDebugModal: () => void;
}

export const TechnicalScreen: React.FC<TechnicalScreenProps> = ({
  state,
  settings,
  onSendStatus,
  onSendPing,
  onOpenDebugModal,
}) => {
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const isLight = settings?.theme === 'light';

  // Automatically request STATUS when entering Technical Details screen
  useEffect(() => {
    if (state.bluetoothStatus === 'CONNECTED') {
      onSendStatus();
    }
  }, []);

  const handleRefreshStatus = () => {
    setIsRefreshingStatus(true);
    onSendStatus();
    setTimeout(() => setIsRefreshingStatus(false), 800);
  };

  const handlePingTest = () => {
    setIsTestingPing(true);
    onSendPing();
    setTimeout(() => setIsTestingPing(false), 800);
  };

  const isConnected = state.bluetoothStatus === 'CONNECTED';

  // Buzzer Acoustic Profile Calculation
  let buzzerStateDesc = 'OFF / Silent';
  let buzzerFrequency = 'Buzzer silent (<90%)';
  if (state.levelPercent !== null) {
    if (state.levelPercent >= HARDWARE_DEFAULTS.CRITICAL_LEVEL_PERCENT) {
      buzzerStateDesc = 'Continuous Alarm';
      buzzerFrequency = 'Non-stop tone (98.90%+ overflow danger)';
    } else if (state.levelPercent >= HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT) {
      buzzerStateDesc = 'Fast Beep Warning';
      buzzerFrequency = 'Rapid pulsed tone (95.0% - 98.89% safety cutoff)';
    } else if (state.levelPercent >= HARDWARE_DEFAULTS.WARNING_LEVEL_PERCENT) {
      buzzerStateDesc = 'Slow Beep Warning';
      buzzerFrequency = 'Intermittent alert tone (90.0% - 94.99%)';
    }
  }

  const cardStyle = `w-full rounded-3xl p-5 border backdrop-blur-xl transition-all shadow-xl ${
    isLight
      ? 'bg-white/85 border-sky-200/80 shadow-[0_10px_30px_rgba(14,165,233,0.08)]'
      : 'bg-slate-900/50 border-white/10'
  }`;

  const innerCardStyle = `p-3.5 rounded-2xl border ${
    isLight ? 'bg-sky-50/70 border-sky-200/70 shadow-xs' : 'bg-white/5 border-white/5'
  }`;

  return (
    <div className="w-full space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className={`text-[11px] font-mono tracking-widest uppercase font-bold block ${
            isLight ? 'text-cyan-700' : 'text-cyan-400'
          }`}>
            Hardware Diagnostics
          </span>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            Technical Details
          </h1>
        </div>

        {/* Action Button: Refresh STATUS */}
        <button
          onClick={handleRefreshStatus}
          disabled={!isConnected || isRefreshingStatus}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer ${
            isLight
              ? 'bg-white border-sky-200 text-sky-900 hover:bg-sky-50 shadow-xs'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-white/10'
          }`}
          title="Send STATUS command"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
          <span>STATUS</span>
        </button>
      </div>

      {/* Raw Sensor Readings Grid */}
      <div className={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-500" />
            <h3 className={`text-base font-bold tracking-tight ${
              isLight ? 'text-sky-950' : 'text-white'
            }`}>
              Authoritative Raw Telemetry
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
            1 Hz Serial Stream
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Distance */}
          <div className={innerCardStyle}>
            <span className={`text-[10px] block uppercase font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Distance
            </span>
            <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${
              isLight ? 'text-sky-950' : 'text-white'
            }`}>
              {state.distanceCm !== null ? `${state.distanceCm.toFixed(2)} cm` : '--'}
            </div>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-medium">Ultrasonic HC-SR04</span>
          </div>

          {/* Water Level */}
          <div className={innerCardStyle}>
            <span className={`text-[10px] block uppercase font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Water Level
            </span>
            <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${
              isLight ? 'text-cyan-800' : 'text-cyan-300'
            }`}>
              {state.levelPercent !== null ? `${state.levelPercent.toFixed(1)}%` : '--'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Arduino Authoritative</span>
          </div>

          {/* Target */}
          <div className={innerCardStyle}>
            <span className={`text-[10px] block uppercase font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Target
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300 font-mono tabular-nums mt-0.5">
              {state.targetPercent.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Cutoff Setpoint</span>
          </div>

          {/* Motor State */}
          <div className={innerCardStyle}>
            <span className={`text-[10px] block uppercase font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Motor State
            </span>
            <div
              className={`text-xl font-bold font-mono mt-0.5 ${
                state.motorRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
            >
              {state.motorRunning ? 'ON' : 'OFF'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Relay D7 Output</span>
          </div>
        </div>
      </div>

      {/* Calibration Parameters Card */}
      <div className={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <h3 className={`text-base font-bold tracking-tight ${
              isLight ? 'text-sky-950' : 'text-white'
            }`}>
              Hardware Calibration (Informational)
            </h3>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isLight ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-purple-950 text-purple-300 border-purple-800'
          }`}>
            Read-Only Firmware
          </span>
        </div>

        <p className={`text-xs mb-4 leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          These calibration benchmarks are flashed in the Arduino Mega 2560 firmware. The Android application cannot modify calibration parameters.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-sky-50/70 border-sky-200/70' : 'bg-white/5 border-white/5'
          }`}>
            <div>
              <span className={`text-xs font-semibold block ${isLight ? 'text-sky-950' : 'text-white'}`}>Empty Tank Distance</span>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sensor to tank bottom</span>
            </div>
            <span className={`font-mono text-base font-bold tabular-nums ${isLight ? 'text-sky-950' : 'text-white'}`}>
              {state.emptyDistanceCm.toFixed(2)} cm
            </span>
          </div>

          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-sky-50/70 border-sky-200/70' : 'bg-white/5 border-white/5'
          }`}>
            <div>
              <span className={`text-xs font-semibold block ${isLight ? 'text-sky-950' : 'text-white'}`}>Full Tank Distance</span>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sensor to 100% water line</span>
            </div>
            <span className={`font-mono text-base font-bold tabular-nums ${isLight ? 'text-sky-950' : 'text-white'}`}>
              {state.fullDistanceCm.toFixed(2)} cm
            </span>
          </div>
        </div>
      </div>

      {/* PING Test & Channel Verification Card */}
      <div className={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-500" />
            <h3 className={`text-base font-bold tracking-tight ${
              isLight ? 'text-sky-950' : 'text-white'
            }`}>
              RFCOMM Link Verification (PING / PONG)
            </h3>
          </div>

          <button
            onClick={handlePingTest}
            disabled={!isConnected || isTestingPing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer ${
              isLight
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 shadow-xs'
                : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
            }`}
          >
            {isTestingPing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Test Connection</span>
          </button>
        </div>

        <div className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs ${
          isLight ? 'bg-sky-50/70 border-sky-200/70' : 'bg-white/5 border-white/5'
        }`}>
          <div>
            <span className={`block font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Round-Trip Latency</span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>PING dispatched over SPP socket</span>
          </div>
          <div className={`font-mono text-base font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
            {state.pingLatencyMs !== null ? `${state.pingLatencyMs} ms` : 'Not tested'}
          </div>
        </div>
      </div>

      {/* Acoustic Buzzer State Card */}
      <div className={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-amber-500" />
          <h3 className={`text-base font-bold tracking-tight ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            Arduino Buzzer Acoustic Logic
          </h3>
        </div>

        <p className={`text-xs mb-3 leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          The buzzer is directly driven by the Arduino Mega (Pin D8). The app displays state without attempting to duplicate audio timing.
        </p>

        <div className={`p-3.5 rounded-2xl border flex items-center justify-between mb-3 ${
          isLight ? 'bg-sky-50/70 border-sky-200/70' : 'bg-white/5 border-white/5'
        }`}>
          <div>
            <span className={`text-xs font-semibold block ${isLight ? 'text-sky-950' : 'text-white'}`}>Current Tone State</span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{buzzerFrequency}</span>
          </div>
          <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-xl border ${
            isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-700/50'
          }`}>
            {buzzerStateDesc}
          </span>
        </div>

        {/* Buzzer Rules Table */}
        <div className={`space-y-1.5 text-[11px] font-mono pt-2 border-t ${
          isLight ? 'border-sky-100 text-slate-600' : 'border-white/5 text-slate-400'
        }`}>
          <div className="flex justify-between py-1">
            <span>Below 90.0%:</span>
            <span className="text-slate-400 font-sans">OFF / Silent</span>
          </div>
          <div className={`flex justify-between py-1 border-t ${isLight ? 'border-sky-100' : 'border-white/5'}`}>
            <span>90.0% – 94.9%:</span>
            <span className="text-amber-600 dark:text-amber-300 font-sans">Slow Beep</span>
          </div>
          <div className={`flex justify-between py-1 border-t ${isLight ? 'border-sky-100' : 'border-white/5'}`}>
            <span>95.0% – 98.89%:</span>
            <span className="text-amber-600 dark:text-amber-400 font-sans font-semibold">Fast Beep (Safety Cutoff)</span>
          </div>
          <div className={`flex justify-between py-1 border-t ${isLight ? 'border-sky-100' : 'border-white/5'}`}>
            <span>98.90%+:</span>
            <span className="text-rose-600 dark:text-rose-400 font-sans font-semibold">Continuous Alarm</span>
          </div>
        </div>
      </div>

      {/* Hardware Wiring Pinout Spec */}
      <div className={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-cyan-500" />
          <h3 className={`text-base font-bold tracking-tight ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            Arduino Mega 2560 & HC-05 Pinout
          </h3>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className={`p-2.5 rounded-xl flex justify-between items-center border ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-white/5 border-white/5'
          }`}>
            <span className={isLight ? 'text-slate-800' : 'text-slate-300'}>HC-05 TX</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">Mega D19 (RX1)</span>
          </div>
          <div className={`p-2.5 rounded-xl flex justify-between items-center border ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-white/5 border-white/5'
          }`}>
            <span className={isLight ? 'text-slate-800' : 'text-slate-300'}>HC-05 RX</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">Mega D18 (TX1) [via 1k/2k Divider]</span>
          </div>
          <div className={`p-2.5 rounded-xl flex justify-between items-center border ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-white/5 border-white/5'
          }`}>
            <span className={isLight ? 'text-slate-800' : 'text-slate-300'}>HC-05 Baud</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">9600 (Serial1.begin(9600))</span>
          </div>
          <div className={`p-2.5 rounded-xl flex justify-between items-center border ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-white/5 border-white/5'
          }`}>
            <span className={isLight ? 'text-slate-800' : 'text-slate-300'}>HC-SR04 Trig / Echo</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">Pins D12 / D11</span>
          </div>
          <div className={`p-2.5 rounded-xl flex justify-between items-center border ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-white/5 border-white/5'
          }`}>
            <span className={isLight ? 'text-slate-800' : 'text-slate-300'}>Motor Relay Actuation</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">Pin D7 (Active LOW/HIGH relay)</span>
          </div>
          <div className={`p-2.5 rounded-xl flex justify-between items-center border ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-white/5 border-white/5'
          }`}>
            <span className={isLight ? 'text-slate-800' : 'text-slate-300'}>Piezo Buzzer</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">Pin D8</span>
          </div>
        </div>

        <div className={`mt-4 pt-3 border-t flex justify-end ${
          isLight ? 'border-sky-100' : 'border-white/5'
        }`}>
          <button
            onClick={onOpenDebugModal}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
          >
            Open Live Serial Console (TX/RX) →
          </button>
        </div>
      </div>
    </div>
  );
};
