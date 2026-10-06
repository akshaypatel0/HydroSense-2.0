/**
 * HYDROSENSE - Sensor Calibration Screen
 * 
 * Supports Arduino Mega 2560 protocol:
 * - Current Distance: live telemetry from DISTANCE
 * - SET EMPTY -> CAL_EMPTY -> ACK:CAL_EMPTY:OK -> STATUS
 * - SET FULL  -> CAL_FULL  -> ACK:CAL_FULL:OK  -> STATUS
 * - Empty & Full point read from STATUS response (not hardcoded)
 * - Confirmation dialogs for both Empty & Full
 * - Bilingual: English and Gujarati (ગુજરાતી)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gauge, Check, CheckCircle2, AlertTriangle, Loader2, Info, RefreshCw, Radio, ShieldCheck, Languages } from 'lucide-react';
import { TankState, LocalSettings } from '../types/hydrosense.ts';
import { BluetoothManager } from '../services/BluetoothManager.ts';
import { STRINGS } from '../services/LocalizationService.ts';

interface SensorCalibrationScreenProps {
  state: TankState;
  settings: LocalSettings;
  onBack: () => void;
  onLanguageChange: (lang: 'en' | 'gu') => void;
}

export const SensorCalibrationScreen: React.FC<SensorCalibrationScreenProps> = ({
  state,
  settings,
  onBack,
  onLanguageChange,
}) => {
  const [confirmDialog, setConfirmDialog] = useState<'EMPTY' | 'FULL' | null>(null);
  const [inProgress, setInProgress] = useState<'EMPTY' | 'FULL' | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const manager = BluetoothManager.getInstance();
  const lang = settings.language || 'en';
  const t = STRINGS[lang];

  const isConnected = state.bluetoothStatus === 'CONNECTED';

  // Request fresh STATUS on mount to populate existing calibration points
  useEffect(() => {
    if (isConnected) {
      manager.sendStatusCommand();
    }
  }, [isConnected]);

  // Subscribe to calibration results
  useEffect(() => {
    const unsubscribe = manager.subscribeCalibration((result) => {
      setInProgress(null);
      if (result.success) {
        setErrorMessage(null);
        const msg = result.type === 'EMPTY' ? t.emptyCalibrated : t.fullCalibrated;
        setSuccessBanner(msg);
        const timer = setTimeout(() => setSuccessBanner(null), 4000);
        return () => clearTimeout(timer);
      } else {
        const err = result.type === 'EMPTY' ? t.emptyFailed : t.fullFailed;
        setErrorMessage(err);
      }
    });

    return () => unsubscribe();
  }, [lang, t]);

  const handleSetEmptyClick = () => {
    if (!isConnected) {
      setErrorMessage(t.btDisconnected);
      return;
    }
    setErrorMessage(null);
    setConfirmDialog('EMPTY');
  };

  const handleSetFullClick = () => {
    if (!isConnected) {
      setErrorMessage(t.btDisconnected);
      return;
    }
    setErrorMessage(null);
    setConfirmDialog('FULL');
  };

  const executeCalibration = async () => {
    const target = confirmDialog;
    setConfirmDialog(null);
    if (!target) return;

    if (!isConnected) {
      setErrorMessage(t.btDisconnected);
      return;
    }

    setInProgress(target);
    setErrorMessage(null);
    setSuccessBanner(null);

    if (target === 'EMPTY') {
      await manager.calibrateEmpty();
    } else {
      await manager.calibrateFull();
    }
  };

  // Determine if calibration is valid
  const hasCalibration = state.emptyDistanceCm > 0 && state.fullDistanceCm > 0;

  const isLight = settings.theme === 'light';

  return (
    <div className="w-full space-y-5 pb-8">
      {/* Top Bar with Back Navigation & Language Selector */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all ${
            isLight
              ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back}</span>
        </button>

        {/* Language switch */}
        <button
          onClick={() => onLanguageChange(lang === 'en' ? 'gu' : 'en')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all ${
            isLight
              ? 'bg-white/80 border-slate-200 text-slate-800 shadow-sm hover:bg-slate-100'
              : 'bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10'
          }`}
          title="Toggle English / ગુજરાતી"
        >
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono">{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
        </button>
      </div>

      {/* Screen Title */}
      <div>
        <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-500 font-semibold block">
          HC-SR04 Benchmark Setup
        </span>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {t.sensorCalibration}
        </h1>
        <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {t.sensorCalibrationDesc}
        </p>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notification Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-progress Banner */}
      {inProgress && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2.5 shadow-md animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
          <div>
            <div className="font-bold">{t.calibrating}</div>
            <div className="text-[11px] opacity-80">{t.pleaseWait}</div>
          </div>
        </div>
      )}

      {/* CARD 1: Current Distance (Live Telemetry from Arduino) */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl ${
        isLight
          ? 'bg-white/80 border-slate-200 shadow-slate-200/50'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-500" />
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {t.currentDistance}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <Radio className={`w-3.5 h-3.5 ${isConnected && state.hasReceivedData ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className={isConnected && state.hasReceivedData ? (isLight ? 'text-slate-700 font-semibold' : 'text-emerald-300 font-semibold') : 'text-slate-400'}>
              {isConnected && state.hasReceivedData ? 'Live HC-SR04' : 'Awaiting Link'}
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 py-1">
          <span className={`text-4xl sm:text-5xl font-extrabold font-mono tabular-nums tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {state.distanceCm !== null ? state.distanceCm.toFixed(2) : '--'}
          </span>
          <span className={`text-xl font-bold font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            cm
          </span>
        </div>

        <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Live distance from ultrasonic sensor head to water surface.
        </p>
      </div>

      {/* CARD 2: Calibration Points & Action Buttons */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl space-y-4 ${
        isLight
          ? 'bg-white/80 border-slate-200 shadow-slate-200/50'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.calibrationStatus}
            </h3>
          </div>

          {/* Calibrated Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            hasCalibration
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-white/5'
          }`}>
            {hasCalibration ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            <span>{hasCalibration ? t.calibrated : t.notCalibrated}</span>
          </div>
        </div>

        {/* EMPTY POINT ROW */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
        }`}>
          <div>
            <span className={`text-[11px] font-mono uppercase tracking-wider block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.emptyPoint} (0%)
            </span>
            <div className={`text-2xl font-bold font-mono tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {state.emptyDistanceCm > 0 ? `${state.emptyDistanceCm.toFixed(2)} cm` : '--'}
            </div>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Distance to bottom of empty tank
            </span>
          </div>

          <button
            onClick={handleSetEmptyClick}
            disabled={!isConnected || inProgress !== null}
            className={`min-h-[48px] px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              !isConnected || inProgress !== null
                ? 'bg-slate-800/40 text-slate-500 border border-white/5 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white shadow-cyan-900/20'
            }`}
          >
            {inProgress === 'EMPTY' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gauge className="w-4 h-4" />
            )}
            <span>[ {t.setEmpty} ]</span>
          </button>
        </div>

        {/* FULL POINT ROW */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
        }`}>
          <div>
            <span className={`text-[11px] font-mono uppercase tracking-wider block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.fullPoint} (100%)
            </span>
            <div className={`text-2xl font-bold font-mono tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {state.fullDistanceCm > 0 ? `${state.fullDistanceCm.toFixed(2)} cm` : '--'}
            </div>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Distance to top desired 100% water line
            </span>
          </div>

          <button
            onClick={handleSetFullClick}
            disabled={!isConnected || inProgress !== null}
            className={`min-h-[48px] px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              !isConnected || inProgress !== null
                ? 'bg-slate-800/40 text-slate-500 border border-white/5 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-blue-900/20'
            }`}
          >
            {inProgress === 'FULL' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gauge className="w-4 h-4" />
            )}
            <span>[ {t.setFull} ]</span>
          </button>
        </div>

        {/* Manual Refresh STATUS button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => manager.sendStatusCommand()}
            disabled={!isConnected}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.refreshStatus}</span>
          </button>
        </div>
      </div>

      {/* CARD 3: Explanation Guide */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl ${
        isLight
          ? 'bg-white/80 border-slate-200'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-cyan-500" />
          <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white'}`}>
            {t.howItWorks}
          </h4>
        </div>
        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {t.howItWorksDesc}
        </p>

        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 text-[11px] font-mono text-slate-400">
          <div className="flex justify-between">
            <span>Formula:</span>
            <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Level% = (Empty - Current) / (Empty - Full) * 100</span>
          </div>
          <div className="flex justify-between">
            <span>Commands:</span>
            <span className="text-cyan-400 font-bold">CAL_EMPTY\n / CAL_FULL\n</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-2xl ${
                  confirmDialog === 'EMPTY' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-500/15 text-blue-400'
                }`}>
                  <Gauge className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {confirmDialog === 'EMPTY' ? t.confirmEmptyTitle : t.confirmFullTitle}
                </h3>
              </div>

              <p className={`text-xs leading-relaxed mb-5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {confirmDialog === 'EMPTY' ? t.confirmEmptyMsg : t.confirmFullMsg}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className={`flex-1 min-h-[44px] rounded-xl font-semibold text-xs border transition-colors ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  {t.cancel}
                </button>

                <button
                  onClick={executeCalibration}
                  className="flex-1 min-h-[44px] rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
                >
                  {confirmDialog === 'EMPTY' ? t.setEmpty : t.setFull}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
