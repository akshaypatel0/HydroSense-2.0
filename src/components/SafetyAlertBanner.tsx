/**
 * HYDROSENSE - Safety Alert & Event Banner
 * 
 * Renders authoritative Arduino safety notifications:
 * - Target Reached (Target X% reached, Motor automatically stopped)
 * - Safety Limit Reached (95% cutoff reached, Motor automatically stopped)
 * - Sensor Safety Stop (Ultrasonic sensor stopped providing valid readings)
 * - Motor Start/Stop Ack Errors
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertOctagon, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { SafetyAlert } from '../types/hydrosense.ts';

interface SafetyAlertBannerProps {
  alert: SafetyAlert | null;
  onDismiss: () => void;
  theme?: 'dark' | 'light';
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({ alert, onDismiss, theme = 'light' }) => {
  if (!alert) return null;

  const isLight = theme === 'light';
  const isSafetyLimit = alert.type === 'SAFETY_LIMIT';
  const isSensorTimeout = alert.type === 'SENSOR_TIMEOUT';
  const isTargetReached = alert.type === 'TARGET_REACHED';
  const isError = alert.type === 'ERROR';

  let borderStyle = isLight
    ? 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-md'
    : 'border-emerald-500/40 bg-emerald-950/80 text-emerald-100';
  let Icon = CheckCircle2;
  let iconColor = isLight ? 'text-emerald-600' : 'text-emerald-400';
  let badgeColor = isLight
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';

  if (isSafetyLimit) {
    borderStyle = isLight
      ? 'border-amber-300 bg-amber-50 text-amber-950 shadow-md'
      : 'border-amber-500/50 bg-amber-950/90 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.25)]';
    Icon = AlertOctagon;
    iconColor = 'text-amber-500 animate-pulse';
    badgeColor = isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-900/70 text-amber-200 border-amber-600/60';
  } else if (isSensorTimeout) {
    borderStyle = isLight
      ? 'border-rose-300 bg-rose-50 text-rose-950 shadow-md'
      : 'border-rose-500/50 bg-rose-950/90 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.25)]';
    Icon = ShieldAlert;
    iconColor = 'text-rose-500 animate-bounce';
    badgeColor = isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-900/70 text-rose-200 border-rose-600/60';
  } else if (isError) {
    borderStyle = isLight
      ? 'border-red-300 bg-red-50 text-red-950 shadow-md'
      : 'border-red-500/40 bg-red-950/80 text-red-100';
    Icon = AlertTriangle;
    iconColor = 'text-red-500';
    badgeColor = isLight ? 'bg-red-100 text-red-800 border-red-300' : 'bg-red-900/60 text-red-300 border-red-700/50';
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full rounded-2xl border p-4 backdrop-blur-xl shadow-xl ${borderStyle} my-2`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-black/25 shrink-0 mt-0.5">
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold text-sm tracking-tight ${
                isLight ? 'text-slate-900 font-bold' : 'text-white'
              }`}>
                {alert.title}
              </h4>
              <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                Arduino Safety
              </span>
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${
              isLight ? 'text-slate-700 font-medium' : 'text-slate-200'
            }`}>
              {alert.message}
            </p>
          </div>

          <button
            onClick={onDismiss}
            className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-black/5 text-slate-500 hover:text-slate-900' : 'hover:bg-white/10 active:bg-white/20 text-slate-300 hover:text-white'
            }`}
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
