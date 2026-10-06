/**
 * HYDROSENSE - Authentic Real Industrial Water Storage Tank Visualization
 * 
 * Engineering & Realistic Physical Tank Design:
 * - REAL INDUSTRIAL STORAGE TANK SILHOUETTE:
 *   * Heavy-duty cylindrical tank body with 4 horizontal reinforcement rib hoops (bands)
 *   * Domed tank roof with threaded inspection manhole lid & grip lugs
 *   * HC-SR04 Ultrasonic Transducer Sensor mounted on top with dual sound horns & cable gland
 *   * Real plumbing: Top inlet water pipe with ball valve & elbow, 98% overflow pipe, bottom brass drain spigot
 *   * Molded heavy-duty base pedestal with anchoring tabs
 * - REALISTIC 3D WATER FLUID PHYSICS:
 *   * Clear architectural cutaway showing the true water column inside
 *   * Volumetric depth gradient (brilliant cyan surface -> rich azure mid -> deep cobalt depth)
 *   * 3D elliptical curved meniscus cap that reacts in perspective to cylinder curvature
 *   * Dual harmonic wave ripples & organic dancing caustics
 *   * Active pressurized inlet water pour stream with splash ripples when motor is ON
 *   * Dynamic cavitation micro-bubbles rising with natural buoyant wobble
 * - STRICT POLICY:
 *   * When disconnected or awaiting data, the tank is completely dry & clean with no demo level
 *   * Non-obstructive HUD so the physical tank body is 100% visible and heroic
 * - DESIGN MODES:
 *   * Aquatic icy glass light theme and deep oceanic dark theme
 */

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { Droplet, Flame, AlertTriangle, ShieldCheck, Bluetooth, Radio, WifiOff } from 'lucide-react';
import { HARDWARE_DEFAULTS } from '../types/hydrosense.ts';

interface WaterTankProps {
  levelPercent: number | null;
  hasReceivedData: boolean;
  isConnected: boolean;
  targetPercent: number;
  tankCapacityLiters: number;
  motorRunning: boolean;
  theme?: 'dark' | 'light';
  onConnectClick?: () => void;
  className?: string;
}

export const WaterTankVisualization: React.FC<WaterTankProps> = ({
  levelPercent,
  hasReceivedData,
  isConnected,
  targetPercent,
  tankCapacityLiters,
  motorRunning,
  theme = 'light',
  onConnectClick,
  className = '',
}) => {
  // STRICT: Only show water when connected AND real data has arrived from Arduino
  const isLive = isConnected && hasReceivedData && levelPercent !== null;
  const currentLevel = isLive ? Math.max(0, Math.min(100, levelPercent as number)) : 0;

  // Spring physics for smooth fluid level interpolation
  const springLevel = useSpring(currentLevel, {
    stiffness: 45,
    damping: 16,
    mass: 0.8,
  });

  const [displayedPercent, setDisplayedPercent] = useState<number>(currentLevel);

  useEffect(() => {
    springLevel.set(currentLevel);
  }, [currentLevel, springLevel]);

  useEffect(() => {
    const unsubscribe = springLevel.on('change', (latest) => {
      setDisplayedPercent(latest);
    });
    return () => unsubscribe();
  }, [springLevel]);

  // Fluid height style spring
  const fluidHeightSpring = useTransform(springLevel, (val) => `${Math.max(0, Math.min(100, val))}%`);

  // Calculated liters strictly from authoritative Arduino level
  const currentLiters = isLive ? Math.round((displayedPercent / 100) * tankCapacityLiters) : null;

  const isLight = theme === 'light';

  // Status visual nuances
  const isHighLevel = isLive && displayedPercent >= HARDWARE_DEFAULTS.WARNING_LEVEL_PERCENT && displayedPercent < HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT;
  const isWarning = isLive && displayedPercent >= HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT && displayedPercent < HARDWARE_DEFAULTS.CRITICAL_LEVEL_PERCENT;
  const isCritical = isLive && displayedPercent >= HARDWARE_DEFAULTS.CRITICAL_LEVEL_PERCENT;

  // Fluid coloration based on level & safety
  let waterDeepGradient = isLight
    ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.90) 0%, rgba(14, 165, 233, 0.93) 35%, rgba(2, 132, 199, 0.96) 70%, rgba(3, 105, 161, 0.99) 100%)'
    : 'linear-gradient(180deg, rgba(34, 211, 238, 0.85) 0%, rgba(2, 132, 199, 0.92) 40%, rgba(3, 105, 161, 0.95) 75%, rgba(15, 23, 42, 0.98) 100%)';
  let surfaceColor = isLight ? '#7dd3fc' : '#38bdf8';
  let surfaceBorder = isLight ? '#bae6fd' : '#e0f2fe';
  let surfaceGlow = isLight ? 'rgba(14, 165, 233, 0.45)' : 'rgba(56, 189, 248, 0.5)';
  let statusBadgeLabel = isLive ? 'Normal' : isConnected ? 'Awaiting Data...' : 'Disconnected';
  let StatusIcon = isLive ? ShieldCheck : isConnected ? Radio : WifiOff;
  let statusTextColor = isLight ? 'text-sky-700' : 'text-cyan-400';

  if (isCritical) {
    waterDeepGradient = isLight
      ? 'linear-gradient(180deg, rgba(251, 113, 133, 0.92) 0%, rgba(225, 29, 72, 0.95) 50%, rgba(159, 18, 57, 0.99) 100%)'
      : 'linear-gradient(180deg, rgba(251, 113, 133, 0.88) 0%, rgba(225, 29, 72, 0.94) 50%, rgba(76, 5, 25, 0.98) 100%)';
    surfaceColor = '#fda4af';
    surfaceBorder = '#ffe4e6';
    surfaceGlow = 'rgba(244, 63, 94, 0.5)';
    statusBadgeLabel = 'Critical High (98.9%+)';
    StatusIcon = AlertTriangle;
    statusTextColor = isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold';
  } else if (isWarning) {
    waterDeepGradient = isLight
      ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.90) 0%, rgba(217, 119, 6, 0.94) 50%, rgba(146, 64, 14, 0.99) 100%)'
      : 'linear-gradient(180deg, rgba(251, 191, 36, 0.85) 0%, rgba(217, 119, 6, 0.92) 50%, rgba(69, 26, 3, 0.98) 100%)';
    surfaceColor = '#fde68a';
    surfaceBorder = '#fef3c7';
    surfaceGlow = 'rgba(245, 158, 11, 0.5)';
    statusBadgeLabel = '95% Safety Cutoff';
    StatusIcon = AlertTriangle;
    statusTextColor = isLight ? 'text-amber-700 font-bold' : 'text-amber-400 font-bold';
  } else if (isHighLevel) {
    waterDeepGradient = isLight
      ? 'linear-gradient(180deg, rgba(45, 212, 191, 0.90) 0%, rgba(13, 148, 136, 0.94) 50%, rgba(15, 118, 110, 0.99) 100%)'
      : 'linear-gradient(180deg, rgba(45, 212, 191, 0.85) 0%, rgba(13, 148, 136, 0.92) 50%, rgba(4, 47, 46, 0.98) 100%)';
    surfaceColor = '#99f6e4';
    surfaceBorder = '#ccfbf1';
    surfaceGlow = 'rgba(20, 184, 166, 0.45)';
    statusBadgeLabel = 'High Level (90%+)';
    StatusIcon = Flame;
    statusTextColor = isLight ? 'text-teal-700 font-semibold' : 'text-teal-300 font-semibold';
  }

  // Target setpoint line position
  const targetBottomOffset = `${Math.max(2, Math.min(95, targetPercent))}%`;

  return (
    <div className={`relative flex flex-col items-center justify-center select-none w-full max-w-sm ${className}`}>

      {/* ============================================================== */}
      {/* REAL PHYSICAL STORAGE TANK ASSEMBLY CONTAINER                  */}
      {/* ============================================================== */}
      <div className="relative w-full flex flex-col items-center">

        {/* 1. TOP PLUMBING & HC-SR04 ULTRASONIC SENSOR UNIT */}
        <div className="relative w-72 sm:w-80 h-16 flex items-end justify-center z-30">
          {/* Inlet Pipe with 90° Brass Elbow & Ball Valve (Top Left) */}
          <div className="absolute left-3 bottom-0 flex items-end">
            {/* Horizontal inlet pipe from supply */}
            <div className={`w-8 h-3.5 rounded-l-md border-y border-l shadow-sm ${
              isLight ? 'bg-gradient-to-b from-sky-400 to-sky-600 border-sky-700' : 'bg-gradient-to-b from-blue-600 to-blue-800 border-blue-900'
            }`} />
            {/* Brass shutoff ball valve with red handle */}
            <div className="relative flex flex-col items-center -mx-0.5">
              <div className="w-5 h-1.5 rounded-full bg-red-600 shadow-sm mb-0.5 -translate-y-1" />
              <div className="w-3.5 h-4.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 border border-amber-800 rounded-sm shadow-xs" />
            </div>
            {/* 90° Elbow going down into tank shoulder */}
            <div className={`w-4 h-6 rounded-tr-lg border-t border-r shadow-xs ${
              isLight ? 'bg-gradient-to-b from-sky-400 to-sky-600 border-sky-700' : 'bg-gradient-to-b from-blue-600 to-blue-800 border-blue-900'
            }`} />
          </div>

          {/* Elevated Central Manhole Dome & HC-SR04 Ultrasonic Transducer */}
          <div className="flex flex-col items-center">
            {/* Ultrasonic Cable Gland & Shielded Wire */}
            <div className="w-1.5 h-3 bg-slate-800 border border-slate-700 rounded-t-sm shadow-xs" />

            {/* HC-SR04 Dual Transducer Cylinder Housing */}
            <div className="relative px-3 py-1 rounded-t-xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border border-slate-400 shadow-md flex items-center gap-2 -mb-0.5 z-10">
              {/* Transmitter Horn Eye */}
              <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-cyan-400/80 animate-ping" />
              </div>
              <span className="text-[8px] font-mono font-extrabold text-slate-800 tracking-tighter uppercase">
                HC-SR04
              </span>
              {/* Receiver Horn Eye */}
              <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              </div>
            </div>

            {/* Threaded Inspection Manhole Lid with Ribbed Grips */}
            <div className={`w-32 h-5 rounded-t-2xl border-t border-x flex items-center justify-between px-3 shadow-md ${
              isLight
                ? 'bg-gradient-to-b from-sky-600 via-sky-700 to-sky-800 border-sky-500 text-sky-100'
                : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-slate-600 text-slate-300'
            }`}>
              {/* Grip ridges */}
              <div className="flex gap-1">
                <span className="w-1.5 h-2 rounded-sm bg-black/30" />
                <span className="w-1.5 h-2 rounded-sm bg-black/30" />
              </div>
              <span className="text-[8px] font-mono tracking-widest uppercase font-bold opacity-80">
                INSPECTION LID
              </span>
              <div className="flex gap-1">
                <span className="w-1.5 h-2 rounded-sm bg-black/30" />
                <span className="w-1.5 h-2 rounded-sm bg-black/30" />
              </div>
            </div>
          </div>

          {/* Overflow Elbow Pipe (Top Right at 98% mark) */}
          <div className="absolute right-3 bottom-0 flex items-end">
            {/* Overflow elbow */}
            <div className={`w-4 h-5 rounded-tl-lg border-t border-l ${
              isLight ? 'bg-gradient-to-b from-slate-300 to-slate-400 border-slate-500' : 'bg-gradient-to-b from-slate-700 to-slate-800 border-slate-600'
            }`} />
            {/* Downward discharge pipe */}
            <div className={`w-3.5 h-8 border-x border-b rounded-b-sm shadow-xs ${
              isLight ? 'bg-gradient-to-b from-slate-300 to-slate-400 border-slate-500' : 'bg-gradient-to-b from-slate-700 to-slate-800 border-slate-600'
            }`} />
          </div>
        </div>

        {/* 2. REAL CYLINDRICAL TANK BODY WITH HORIZONTAL REINFORCEMENT RIBS */}
        <div className={`relative w-72 sm:w-80 h-[380px] rounded-t-[32px] rounded-b-[20px] overflow-hidden border-2 shadow-2xl flex flex-col justify-end transition-all duration-300 ${
          isLight
            ? 'bg-gradient-to-r from-sky-200/90 via-sky-50/95 to-sky-200/90 border-sky-400/80 shadow-[0_20px_50px_rgba(14,165,233,0.18),0_4px_12px_rgba(0,0,0,0.05)]'
            : 'bg-gradient-to-r from-slate-900/95 via-slate-950/95 to-slate-900/95 border-sky-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
        }`}>

          {/* 3D CYLINDRICAL SPECULAR SHADING (Left reflection highlight & dark rim occlusions) */}
          {/* Left specular reflection stripe */}
          <div className="absolute inset-y-0 left-6 w-8 bg-gradient-to-r from-white/35 via-white/10 to-transparent pointer-events-none z-25" />
          <div className="absolute inset-y-0 left-10 w-0.5 bg-white/40 pointer-events-none z-25 blur-[0.2px]" />
          
          {/* Right curved rim shadow */}
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/20 via-black/5 to-transparent pointer-events-none z-25" />
          {/* Left curved rim shadow */}
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-25" />

          {/* 4 PROMINENT HORIZONTAL REINFORCEMENT RIBS (Standard on real tanks!) */}
          {[20, 42, 64, 85].map((pos) => (
            <div
              key={pos}
              className={`absolute inset-x-0 h-4 pointer-events-none z-20 flex items-center border-y shadow-xs ${
                isLight
                  ? 'bg-gradient-to-r from-sky-300/80 via-white/70 to-sky-300/80 border-sky-400/50 shadow-[0_2px_4px_rgba(14,165,233,0.1)]'
                  : 'bg-gradient-to-r from-slate-800/80 via-slate-700/60 to-slate-800/80 border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
              }`}
              style={{ bottom: `${pos}%` }}
            >
              {/* Embossed rivet/hoop line */}
              <div className="w-full h-0.5 bg-white/30" />
            </div>
          ))}

          {/* MEASUREMENT SCALE (EMBOSSED DIRECTLY ONTO TANK BODY) */}
          <div className="absolute inset-y-6 right-3 flex flex-col justify-between items-end pointer-events-none z-25 opacity-90">
            {[100, 90, 75, 50, 25, 10, 0].map((tick) => (
              <div key={tick} className="flex items-center gap-1">
                <span className={`text-[10px] font-mono font-extrabold tabular-nums drop-shadow-xs ${
                  isLight ? 'text-sky-950' : 'text-slate-200'
                }`}>
                  {tick}%
                </span>
                <div
                  className={`h-0.5 rounded-full ${
                    tick === 100 || tick === 50 || tick === 0
                      ? (isLight ? 'w-4 bg-sky-900 shadow-xs' : 'w-4 bg-white shadow-xs')
                      : tick === 75 || tick === 25
                      ? (isLight ? 'w-3 bg-sky-700' : 'w-3 bg-sky-300')
                      : (isLight ? 'w-2 bg-sky-500' : 'w-2 bg-slate-400')
                  }`}
                />
              </div>
            ))}
          </div>

          {/* 95% HARD SAFETY CUTOFF REFERENCE LINE */}
          <div
            className="absolute left-2 right-12 pointer-events-none z-25 flex items-center border-b border-dashed border-rose-500"
            style={{ bottom: '95%' }}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider text-white font-extrabold px-1.5 py-0.5 -translate-y-2.5 bg-rose-600 rounded shadow-xs">
              95% Cutoff
            </span>
          </div>

          {/* TARGET LEVEL SETPOINT LINE */}
          <div
            className="absolute left-2 right-12 pointer-events-none z-25 flex items-center border-b-2 border-emerald-500 transition-all duration-300"
            style={{ bottom: targetBottomOffset }}
          >
            <span className="text-[9px] font-mono tracking-tight text-white font-bold px-2 py-0.5 -translate-y-3 bg-emerald-600 rounded-md shadow-md">
              Target {Math.round(targetPercent)}%
            </span>
          </div>

          {/* ACTIVE INLET WATER POUR STREAM (Gushes from top inlet pipe when motor is ON) */}
          {motorRunning && isLive && (
            <div className="absolute top-0 left-6 w-5 bottom-0 pointer-events-none z-20 overflow-hidden">
              {/* Pressurized stream */}
              <div className="w-2 h-full mx-auto bg-gradient-to-b from-white via-cyan-200 to-sky-400 animate-water-stream rounded-full blur-[0.4px] shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
            </div>
          )}

          {/* REALISTIC 3D WATER COLUMN BODY (RENDERED ONLY WHEN LIVE DATA IS CONNECTED) */}
          {isLive ? (
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-b-[18px] overflow-hidden transition-all duration-500"
              style={{
                height: fluidHeightSpring,
                background: waterDeepGradient,
                boxShadow: `0 -6px 30px ${surfaceGlow}`,
              }}
            >
              {/* 3D Curved Meniscus Wave Layer (Perspective Elliptical Top Surface) */}
              <div className="absolute top-0 inset-x-0 h-8 -translate-y-4 pointer-events-none overflow-visible">
                {/* Elliptical Meniscus Surface Cap with physical curvature */}
                <div
                  className="w-full h-7 rounded-[100%] shadow-lg border-t-2"
                  style={{
                    backgroundColor: surfaceColor,
                    borderColor: surfaceBorder,
                    boxShadow: `0 0 25px ${surfaceGlow}`,
                  }}
                />

                {/* Animated Undulating Wave Ripple 1 */}
                <svg
                  className="w-[200%] h-4 -translate-y-4 animate-wave-1 opacity-70"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,25 C150,70 350,-10 500,45 C650,100 900,0 1200,35 L1200,120 L0,120 Z"
                    fill="rgba(255,255,255,0.55)"
                  />
                </svg>

                {/* Animated Undulating Wave Ripple 2 */}
                <svg
                  className="w-[200%] h-4 -translate-y-5 animate-wave-2 opacity-40"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,45 C200,-10 400,80 600,20 C800,90 1000,10 1200,50 L1200,120 L0,120 Z"
                    fill="rgba(255,255,255,0.35)"
                  />
                </svg>

                {/* Splash turbulence ripples if motor is actively pumping */}
                {motorRunning && (
                  <div className="absolute top-1/2 left-6 -translate-x-1/2 -translate-y-1/2 w-8 h-3 rounded-full border-2 border-white/90 animate-splash-ripple" />
                )}
              </div>

              {/* Dynamic Cavitation Micro-Bubbles (Ascend when motor is pumping) */}
              {motorRunning && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute bottom-0 rounded-full bg-white/95 shadow-[0_0_5px_rgba(255,255,255,0.9)]"
                      style={{
                        left: `${6 + (i * 6)}%`,
                        width: `${2.5 + (i % 3) * 2}px`,
                        height: `${2.5 + (i % 3) * 2}px`,
                      }}
                      animate={{
                        y: ['0%', '-400%'],
                        x: [0, (i % 2 === 0 ? 5 : -5), 0],
                        opacity: [0, 0.95, 0],
                        scale: [0.6, 1.3],
                      }}
                      transition={{
                        duration: 1.1 + (i % 4) * 0.3,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Depth Sunlight Caustics Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/25 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3)_0%,_transparent_75%)] pointer-events-none animate-caustics" />
            </motion.div>
          ) : (
            /* DRY TANK INTERIOR (WHEN DISCONNECTED / NO DATA) */
            <div className="absolute inset-x-4 bottom-4 h-12 rounded-b-[18px] border-t border-sky-400/20 bg-gradient-to-t from-sky-950/15 to-transparent pointer-events-none flex items-center justify-center">
              <div className="w-12 h-3 rounded-full bg-sky-950/20 border border-white/10" />
            </div>
          )}

          {/* INTEGRATED DIGITAL HUD GAUGE PILL (CLEAN, DOES NOT COVER TANK BODY!) */}
          <div className="relative z-30 my-auto mx-auto flex flex-col items-center justify-center text-center">
            <div className={`px-5 py-3 rounded-2xl backdrop-blur-xl border shadow-xl transition-all ${
              isLight
                ? 'bg-white/90 border-sky-300/80 shadow-[0_10px_25px_rgba(14,165,233,0.15)] text-slate-900'
                : 'bg-slate-950/85 border-sky-400/30 shadow-black/80 text-white'
            }`}>
              {/* Percentage */}
              <div className="flex items-baseline justify-center gap-0.5">
                <span className={`text-4xl sm:text-5xl font-extrabold font-mono tabular-nums tracking-tight ${
                  isLight ? 'text-sky-950' : 'text-white'
                }`}>
                  {isLive ? displayedPercent.toFixed(1) : '--'}
                </span>
                <span className={`text-lg sm:text-xl font-bold font-mono ${
                  isLight ? 'text-sky-600' : 'text-sky-400'
                }`}>
                  %
                </span>
              </div>

              {/* Volume in Liters */}
              <div className={`flex items-center justify-center gap-1.5 text-xs font-mono font-bold mt-1 ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                <Droplet className="w-3.5 h-3.5 text-cyan-500 fill-current shrink-0" />
                <span>
                  {currentLiters !== null ? `${currentLiters.toLocaleString()} L` : '-- L'}
                </span>
                <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>/</span>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                  {tankCapacityLiters.toLocaleString()} L
                </span>
              </div>

              {/* Action Button if disconnected */}
              {!isConnected ? (
                <button
                  onClick={onConnectClick}
                  className="mt-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>Connect to HC-05</span>
                </button>
              ) : isConnected && !isLive ? (
                <span className="text-[10px] font-mono text-cyan-600 font-semibold mt-1.5 animate-pulse flex items-center justify-center gap-1">
                  <Radio className="w-3 h-3 animate-spin" />
                  <span>Awaiting Telemetry...</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* 3. HEAVY-DUTY TANK BASE PEDESTAL WITH BRASS DRAIN SPIGOT */}
        <div className="relative w-76 sm:w-84 h-12 flex items-start justify-between px-4 z-30 -mt-1">
          {/* Bottom Brass Drain Valve Spigot (Left) */}
          <div className="flex items-center -translate-y-2">
            <div className="w-3 h-4 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 border border-amber-800 rounded-sm shadow-xs" />
            <div className="w-4 h-2 bg-slate-700 border border-slate-600 rounded-r-sm" />
            <div className="w-1.5 h-3 bg-red-600 rounded-sm -translate-x-3 -translate-y-2 shadow-xs" title="Drain Valve" />
          </div>

          {/* Heavy-Duty Molded Base Ring Skirt */}
          <div className={`flex-1 h-7 rounded-b-2xl border-b-2 border-x-2 flex items-center justify-center gap-6 shadow-lg ${
            isLight
              ? 'bg-gradient-to-b from-sky-300 via-sky-400 to-sky-500 border-sky-600 text-sky-950'
              : 'bg-gradient-to-b from-slate-800 via-slate-900 to-black border-slate-700 text-slate-400'
          }`}>
            {/* Anchor bolt tabs */}
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-500 shadow-inner" />
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest opacity-80">
              INDUSTRIAL WATER STORAGE
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-500 shadow-inner" />
          </div>

          {/* Right Base Anchor */}
          <div className="w-4 h-2 rounded-r-md bg-slate-600 -translate-y-2 opacity-60" />
        </div>
      </div>
    </div>
  );
};
