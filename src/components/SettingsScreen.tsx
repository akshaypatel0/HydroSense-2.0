/**
 * HYDROSENSE - Screen 4: Settings & Developer Hub
 * 
 * Configures:
 * - SENSOR CALIBRATION: Direct entry to calibration screen for empty/full benchmark setup
 * - Tank capacity in Liters (stored locally, never sent to Arduino)
 * - Preferred target percentage (1% to 95%)
 * - Auto-reconnect with exponential backoff toggle
 * - Mode toggle: Hardware Emulated Arduino Mega 2560 vs Physical HC-05 (Web Serial)
 * - Theme Switcher: Dark Glass / Light Glass
 * - Language Switcher: English / ગુજરાતી
 * - Interactive Testing Suite (18 Verification criteria: Target Reached, 95% Cutoff, Sensor Timeout, etc.)
 * - Access to Android Native Project Code and Raw Serial Console
 */

import React, { useState } from 'react';
import { Settings, Droplet, Target, Bluetooth, Moon, Sun, Terminal, Code2, FlaskConical, CheckCircle2, AlertOctagon, ShieldAlert, Unplug, Check, Gauge, Languages, ChevronRight } from 'lucide-react';
import { LocalSettings, HARDWARE_DEFAULTS } from '../types/hydrosense.ts';
import { BluetoothManager } from '../services/BluetoothManager.ts';
import { STRINGS } from '../services/LocalizationService.ts';

interface SettingsScreenProps {
  settings: LocalSettings;
  onUpdateSettings: (newSettings: Partial<LocalSettings>) => void;
  onOpenDebugModal: () => void;
  onOpenAndroidSourceModal: () => void;
  onOpenBluetoothModal: () => void;
  onOpenCalibrationScreen: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onOpenDebugModal,
  onOpenAndroidSourceModal,
  onOpenBluetoothModal,
  onOpenCalibrationScreen,
}) => {
  const [capacityInput, setCapacityInput] = useState<string>(String(settings.tankCapacityLiters));
  const [targetInput, setTargetInput] = useState<string>(String(settings.preferredTargetPercent));
  const [saveToast, setSaveToast] = useState(false);

  const manager = BluetoothManager.getInstance();
  const isSimulating = manager.isSimulating();
  const isLight = settings.theme === 'light';
  const lang = settings.language || 'en';
  const t = STRINGS[lang];

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const capacityNum = Math.max(10, Math.min(100000, Number(capacityInput) || 1000));
    const targetNum = Math.max(1, Math.min(HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT, Number(targetInput) || 80));

    onUpdateSettings({
      tankCapacityLiters: capacityNum,
      preferredTargetPercent: targetNum,
    });
    setCapacityInput(String(capacityNum));
    setTargetInput(String(targetNum));

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const capacityPresets = [500, 750, 1000, 1500, 2000, 5000];

  return (
    <div className="w-full space-y-5 pb-8">
      {/* Header */}
      <div className="pt-1">
        <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-500 font-semibold block">
          Configuration & Engine
        </span>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Settings
        </h1>
        <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Local tank parameters, calibration, theme, and diagnostic tools.
        </p>
      </div>

      {/* SENSOR CALIBRATION FEATURE (Section 1) */}
      <button
        onClick={onOpenCalibrationScreen}
        className={`w-full p-5 rounded-3xl border transition-all text-left flex items-center justify-between group shadow-xl ${
          isLight
            ? 'bg-gradient-to-r from-cyan-50 via-white to-blue-50 border-cyan-200/80 hover:border-cyan-400 shadow-slate-200/50'
            : 'bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 border-cyan-500/30 hover:border-cyan-400/60 shadow-cyan-950/20'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 group-hover:scale-105 transition-transform">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'} group-hover:text-cyan-500 transition-colors`}>
                {t.sensorCalibration}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-500 font-semibold border border-cyan-500/30 uppercase">
                CAL_EMPTY / CAL_FULL
              </span>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {lang === 'gu' ? 'ટાંકીના ખાલી અને ભરેલા પોઈન્ટ્સ સેટ કરો' : 'Calibrate empty and 100% full ultrasonic distance benchmarks'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-cyan-500 font-semibold text-xs shrink-0">
          <span>Open</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      {/* Appearance & Language Settings Card */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl space-y-4 ${
        isLight
          ? 'bg-white/80 border-slate-200 shadow-slate-200/50'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Appearance & Language
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Theme Selector */}
          <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
          }`}>
            <span className={`text-xs font-semibold block mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Theme Mode
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  !isLight
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isLight
                    ? 'bg-cyan-600 text-white font-bold shadow-md'
                    : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
          }`}>
            <span className={`text-xs font-semibold block mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Language / ભાષા
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  lang === 'en'
                    ? (isLight ? 'bg-cyan-600 text-white font-bold' : 'bg-cyan-500 text-slate-950 font-bold')
                    : (isLight ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100' : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10')
                }`}
              >
                <span>English</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'gu' })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  lang === 'gu'
                    ? (isLight ? 'bg-cyan-600 text-white font-bold' : 'bg-cyan-500 text-slate-950 font-bold')
                    : (isLight ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100' : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10')
                }`}
              >
                <span>ગુજરાતી</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tank Parameters Card */}
      <form
        onSubmit={handleSavePreferences}
        className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl space-y-4 ${
          isLight
            ? 'bg-white/80 border-slate-200 shadow-slate-200/50'
            : 'bg-slate-900/50 border-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-500" />
            <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Tank Capacity (Local Only)
            </h3>
          </div>
          {saveToast && (
            <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold animate-pulse">
              <Check className="w-3.5 h-3.5" />
              Saved locally
            </span>
          )}
        </div>

        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Stored strictly on your device to calculate liters. This is NEVER transmitted to the Arduino.
        </p>

        <div>
          <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Capacity in Liters (L)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="10"
              max="100000"
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-2xl border font-mono text-base focus:outline-none focus:border-cyan-500 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-white/5 border-white/10 text-white'
              }`}
              placeholder="1000"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs shrink-0 transition-all shadow-md shadow-cyan-900/20"
            >
              Save
            </button>
          </div>
        </div>

        {/* Quick Capacity Presets */}
        <div>
          <span className={`text-[11px] block mb-2 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Common Tank Sizes:
          </span>
          <div className="flex flex-wrap gap-2">
            {capacityPresets.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setCapacityInput(String(size));
                  onUpdateSettings({ tankCapacityLiters: size });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                  settings.tankCapacityLiters === size
                    ? 'bg-cyan-500/20 text-cyan-600 border border-cyan-500/40 font-bold'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                }`}
              >
                {size.toLocaleString()} L
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Bluetooth & Link Preferences Card */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl space-y-4 ${
        isLight
          ? 'bg-white/80 border-slate-200 shadow-slate-200/50'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-blue-500" />
            <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Bluetooth Classic (RFCOMM)
            </h3>
          </div>
          <button
            onClick={onOpenBluetoothModal}
            className="text-xs text-cyan-500 hover:text-cyan-600 font-semibold"
          >
            Manage HC-05 →
          </button>
        </div>

        <div className="space-y-3 pt-1">
          {/* Auto Reconnect Toggle */}
          <div className={`flex items-center justify-between p-3 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
          }`}>
            <div>
              <span className={`text-xs font-semibold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Auto-Reconnect with Backoff
              </span>
              <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Attempts reconnect on unexpected link drop
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoReconnect}
              onChange={(e) => {
                const checked = e.target.checked;
                onUpdateSettings({ autoReconnect: checked });
                manager.setAutoReconnect(checked);
              }}
              className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Operating Mode Toggle */}
          <div className={`flex items-center justify-between p-3 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
          }`}>
            <div>
              <span className={`text-xs font-semibold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Hardware Mode
              </span>
              <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isSimulating ? 'Arduino Mega 2560 Simulator' : 'Physical HC-05 (Web Serial)'}
              </span>
            </div>
            <button
              onClick={() => manager.setSimulationMode(!isSimulating)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSimulating
                  ? 'bg-purple-950/70 text-purple-300 border-purple-700/50'
                  : 'bg-cyan-950/70 text-cyan-300 border-cyan-700/50'
              }`}
            >
              {isSimulating ? 'Emulated' : 'Physical'}
            </button>
          </div>
        </div>
      </div>

      {/* Developer Hardware Simulator & Testing Suite */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl space-y-4 ${
        isLight
          ? 'bg-white/80 border-slate-200 shadow-slate-200/50'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-500" />
          <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Protocol Test Suite Triggers
          </h3>
        </div>

        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Quickly simulate Arduino firmware events to test all app safety behaviors:
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => manager.simulateTargetReached()}
            className={`p-3 rounded-2xl border text-left transition-all ${
              isLight
                ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300'
                : 'bg-white/5 hover:bg-emerald-950/40 border-white/5 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target Reached</span>
            </div>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Triggers MOTOR_OFF:TARGET_REACHED
            </span>
          </button>

          <button
            onClick={() => manager.simulate95SafetyLimit()}
            className={`p-3 rounded-2xl border text-left transition-all ${
              isLight
                ? 'bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-300'
                : 'bg-white/5 hover:bg-amber-950/40 border-white/5 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold mb-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>95% Safety Cutoff</span>
            </div>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Triggers MOTOR_OFF:SAFETY_LIMIT
            </span>
          </button>

          <button
            onClick={() => manager.simulateSensorTimeout()}
            className={`p-3 rounded-2xl border text-left transition-all ${
              isLight
                ? 'bg-slate-50 hover:bg-rose-50 border-slate-200 hover:border-rose-300'
                : 'bg-white/5 hover:bg-rose-950/40 border-white/5 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Sensor Timeout</span>
            </div>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Triggers MOTOR_OFF:SENSOR_TIMEOUT
            </span>
          </button>

          <button
            onClick={() => manager.simulateDisconnect()}
            className={`p-3 rounded-2xl border text-left transition-all ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                : 'bg-white/5 hover:bg-slate-800 border-white/5'
            }`}
          >
            <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Unplug className="w-3.5 h-3.5" />
              <span>Simulate Drop</span>
            </div>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Tests auto-reconnect backoff
            </span>
          </button>
        </div>

        {/* Dynamic Island Level Threshold Test Row */}
        <div className="pt-2 border-t border-white/5">
          <span className={`text-[11px] block mb-2 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Test Dynamic Island Threshold Alerts:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '< 50% (Half)', val: 48 },
              { label: '< 30% (Low)', val: 28 },
              { label: '< 15% (Critical)', val: 14 },
              { label: '< 5% (Urgent)', val: 4 },
              { label: '0% (Empty)', val: 0 },
              { label: '75% (Reset)', val: 75 },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => manager.simulateSetLevel(btn.val)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
                    : 'bg-white/5 hover:bg-white/10 text-cyan-300 border-white/10'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Developer Project Modals Launchers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onOpenDebugModal}
          className={`p-4 rounded-3xl border flex items-center justify-between transition-all group ${
            isLight
              ? 'bg-white/80 hover:bg-white border-slate-200 shadow-sm'
              : 'bg-slate-900/60 hover:bg-slate-850 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-500 border border-cyan-500/25">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className={`text-sm font-bold group-hover:text-cyan-500 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Serial Debug Console
              </h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Live line-by-line TX / RX logs
              </p>
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-cyan-500 transition-colors">→</span>
        </button>

        <button
          onClick={onOpenAndroidSourceModal}
          className={`p-4 rounded-3xl border flex items-center justify-between transition-all group ${
            isLight
              ? 'bg-white/80 hover:bg-white border-slate-200 shadow-sm'
              : 'bg-slate-900/60 hover:bg-slate-850 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className={`text-sm font-bold group-hover:text-emerald-500 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Android Native Source
              </h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Complete Kotlin + Compose project
              </p>
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">→</span>
        </button>
      </div>
    </div>
  );
};
