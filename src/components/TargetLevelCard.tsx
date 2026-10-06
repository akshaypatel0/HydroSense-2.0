/**
 * HYDROSENSE - Target Level Control Card
 * 
 * Features:
 * - Slider clamped strictly between 1% and 95% (never > 95%)
 * - Precise +/- stepper buttons (min 44px tap targets)
 * - Quick preset buttons: 30%, 50%, 70%, 80%, 90%
 * - Sends TARGET:x\n only on release (pointerUp/changeEnd) to prevent serial flooding
 * - Awaiting confirmation indicator for ACK:TARGET:OK
 * - Full Light (Watery Glass) and Dark theme support
 */

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Check, Loader2 } from 'lucide-react';
import { HARDWARE_DEFAULTS } from '../types/hydrosense.ts';

interface TargetLevelCardProps {
  currentTargetPercent: number;
  isConnected: boolean;
  onSetTarget: (newTarget: number) => void;
  theme?: 'dark' | 'light';
  className?: string;
}

export const TargetLevelCard: React.FC<TargetLevelCardProps> = ({
  currentTargetPercent,
  isConnected,
  onSetTarget,
  theme = 'light',
  className = '',
}) => {
  const [sliderValue, setSliderValue] = useState<number>(currentTargetPercent);
  const [isAwaitingAck, setIsAwaitingAck] = useState<boolean>(false);
  const [lastAckTime, setLastAckTime] = useState<number | null>(null);
  const isLight = theme === 'light';

  // Sync internal slider value when remote target arrives from Arduino
  useEffect(() => {
    setSliderValue(currentTargetPercent);
    if (isAwaitingAck) {
      setIsAwaitingAck(false);
      setLastAckTime(Date.now());
      const timer = setTimeout(() => setLastAckTime(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTargetPercent]);

  const commitTarget = (val: number) => {
    const clamped = Math.max(1, Math.min(HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT, Math.round(val)));
    setSliderValue(clamped);
    if (clamped !== currentTargetPercent && isConnected) {
      setIsAwaitingAck(true);
      onSetTarget(clamped);
    }
  };

  const adjustBy = (delta: number) => {
    const next = Math.max(1, Math.min(HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT, sliderValue + delta));
    commitTarget(next);
  };

  const quickPresets = [30, 50, 70, 80, 90];

  return (
    <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl transition-all shadow-xl ${
      isLight
        ? 'bg-white/85 border-sky-200/80 shadow-[0_10px_30px_rgba(14,165,233,0.08)]'
        : 'bg-slate-900/50 border-white/10'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`text-xs font-semibold tracking-wider uppercase block ${
            isLight ? 'text-sky-700' : 'text-slate-400'
          }`}>
            Cutoff Threshold
          </span>
          <h3 className={`text-lg font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-sky-950' : 'text-white'
          }`}>
            Target Level
          </h3>
        </div>

        {/* Value & Confirmation Pill */}
        <div className="flex items-center gap-2">
          {isAwaitingAck ? (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${
              isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-800' : 'bg-cyan-950/70 border-cyan-800 text-cyan-300'
            }`}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending...</span>
            </div>
          ) : lastAckTime ? (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
            }`}>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Confirmed</span>
            </div>
          ) : null}

          <div className={`px-3.5 py-1.5 rounded-2xl border font-mono font-bold text-xl tabular-nums shadow-xs ${
            isLight ? 'bg-sky-50 border-sky-200 text-sky-950' : 'bg-white/5 border-white/10 text-white'
          }`}>
            {sliderValue}%
          </div>
        </div>
      </div>

      {/* Slider & Stepper Row */}
      <div className="flex items-center gap-3 my-2">
        <button
          onClick={() => adjustBy(-1)}
          disabled={!isConnected || sliderValue <= 1}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
            isLight
              ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-white/5'
          }`}
          title="Decrease Target 1%"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min="1"
            max="95"
            step="1"
            value={sliderValue}
            disabled={!isConnected}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            onMouseUp={() => commitTarget(sliderValue)}
            onTouchEnd={() => commitTarget(sliderValue)}
            className={`w-full h-2.5 rounded-lg appearance-none cursor-pointer focus:outline-none disabled:opacity-40 ${
              isLight ? 'bg-sky-200/80 accent-cyan-600' : 'bg-slate-800 accent-cyan-400'
            }`}
          />
        </div>

        <button
          onClick={() => adjustBy(1)}
          disabled={!isConnected || sliderValue >= HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
            isLight
              ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-white/5'
          }`}
          title="Increase Target 1%"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Preset Buttons */}
      <div className={`mt-4 pt-3 border-t ${isLight ? 'border-sky-100' : 'border-white/5'}`}>
        <div className={`flex items-center justify-between text-[11px] mb-2 ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          <span className="font-medium">Quick Targets</span>
          <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Max limit: 95%</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {quickPresets.map((pct) => {
            const isSelected = sliderValue === pct;
            return (
              <button
                key={pct}
                onClick={() => commitTarget(pct)}
                disabled={!isConnected}
                className={`min-h-[40px] rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? (isLight ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30' : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20')
                    : (isLight ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200/80' : 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border border-white/5')
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {pct}%
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
