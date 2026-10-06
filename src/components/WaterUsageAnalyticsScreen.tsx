/**
 * HYDROSENSE - Water Usage & Inflow Analytics Screen
 * 
 * Features:
 * - Daily inflow vs outflow volume charts
 * - 24-Hour peak consumption hourly breakdown
 * - Motor runtime statistics and delivery rates
 * - Recent refill cycle history logs with cutoff reasons
 * - High-contrast Light and Dark mode support
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, Droplets, Clock, TrendingUp, ArrowDownRight, ArrowUpRight, Zap, CheckCircle2, AlertOctagon, History, RefreshCw } from 'lucide-react';
import { TankState, LocalSettings } from '../types/hydrosense.ts';
import { WaterAnalyticsService, PumpSession, DailyUsage, HourlyUsage } from '../services/WaterAnalyticsService.ts';

interface WaterUsageAnalyticsScreenProps {
  state: TankState;
  settings: LocalSettings;
}

export const WaterUsageAnalyticsScreen: React.FC<WaterUsageAnalyticsScreenProps> = ({
  state,
  settings,
}) => {
  const [sessions, setSessions] = useState<PumpSession[]>([]);
  const [dailyData, setDailyData] = useState<DailyUsage[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyUsage[]>([]);
  const [timeRange, setTimeRange] = useState<'7D' | '24H'>('7D');

  const analytics = WaterAnalyticsService.getInstance();
  const isLight = settings.theme === 'light';

  useEffect(() => {
    setSessions(analytics.getSessions());
    setDailyData(analytics.getDailyUsage());
    setHourlyData(analytics.getHourlyUsage());
  }, []);

  const refreshData = () => {
    setSessions(analytics.getSessions());
    setDailyData(analytics.getDailyUsage());
    setHourlyData(analytics.getHourlyUsage());
  };

  // Aggregated totals
  const totalInflowToday = dailyData.length > 0 ? dailyData[dailyData.length - 1].inflowLiters : 0;
  const totalOutflowToday = dailyData.length > 0 ? dailyData[dailyData.length - 1].outflowLiters : 0;
  const totalRuntimeTodayMin = dailyData.length > 0 ? dailyData[dailyData.length - 1].pumpRuntimeMinutes : 0;

  const totalWeeklyInflow = dailyData.reduce((acc, curr) => acc + curr.inflowLiters, 0);
  const avgDailyInflow = Math.round(totalWeeklyInflow / (dailyData.length || 1));

  // Max value for bar chart scaling
  const maxDailyVolume = Math.max(...dailyData.map((d) => Math.max(d.inflowLiters, d.outflowLiters)), 800);
  const maxHourlyVolume = Math.max(...hourlyData.map((h) => h.volumeLiters), 160);

  return (
    <div className="w-full space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-500 font-semibold block">
            Telemetry & Consumption
          </span>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Water Analytics
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Comprehensive volume inflow, consumption trends, and motor cycle duty records.
          </p>
        </div>

        <button
          onClick={refreshData}
          className={`p-2 rounded-2xl border text-xs font-semibold transition-all ${
            isLight
              ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          title="Refresh analytics data"
        >
          <RefreshCw className="w-4 h-4 text-cyan-500" />
        </button>
      </div>

      {/* Top KPI Cards (4 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Inflow Today */}
        <div className={`p-4 rounded-3xl border backdrop-blur-xl shadow-lg flex flex-col justify-between ${
          isLight ? 'bg-white/80 border-slate-200 shadow-slate-200/50' : 'bg-slate-900/50 border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-400 font-medium'}>
              Inflow Today
            </span>
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {totalInflowToday.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">L</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
              <span>Pumped In</span>
            </span>
          </div>
        </div>

        {/* Metric 2: Estimated Consumption */}
        <div className={`p-4 rounded-3xl border backdrop-blur-xl shadow-lg flex flex-col justify-between ${
          isLight ? 'bg-white/80 border-slate-200 shadow-slate-200/50' : 'bg-slate-900/50 border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-400 font-medium'}>
              Usage Today
            </span>
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {totalOutflowToday.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">L</span>
            </div>
            <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-1 mt-0.5">
              <span>Outflow / Draw</span>
            </span>
          </div>
        </div>

        {/* Metric 3: Pump Runtime */}
        <div className={`p-4 rounded-3xl border backdrop-blur-xl shadow-lg flex flex-col justify-between ${
          isLight ? 'bg-white/80 border-slate-200 shadow-slate-200/50' : 'bg-slate-900/50 border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-400 font-medium'}>
              Pump Runtime
            </span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {Math.floor(totalRuntimeTodayMin / 60)}h {totalRuntimeTodayMin % 60}m
            </div>
            <span className="text-[10px] text-purple-400 font-semibold mt-0.5 block">
              Active relay duty
            </span>
          </div>
        </div>

        {/* Metric 4: Avg Delivery Rate */}
        <div className={`p-4 rounded-3xl border backdrop-blur-xl shadow-lg flex flex-col justify-between ${
          isLight ? 'bg-white/80 border-slate-200 shadow-slate-200/50' : 'bg-slate-900/50 border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-400 font-medium'}>
              Inflow Rate
            </span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
              24.2 <span className="text-xs font-sans font-normal text-slate-400">L/min</span>
            </div>
            <span className="text-[10px] text-amber-500 font-semibold mt-0.5 block">
              Flow benchmark
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Inflow vs Outflow */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl space-y-4 ${
        isLight ? 'bg-white/80 border-slate-200 shadow-slate-200/50' : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {timeRange === '7D' ? 'Daily Volume Inflow & Consumption' : '24-Hour Consumption Profile'}
              </h3>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {timeRange === '7D'
                ? `7-Day Total: ${totalWeeklyInflow.toLocaleString()} L · Daily Average: ${avgDailyInflow.toLocaleString()} L`
                : 'Hourly consumption distribution with morning and evening peak draw'}
            </p>
          </div>

          {/* Time range selector tabs */}
          <div className={`flex items-center p-1 rounded-2xl border text-xs font-semibold ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <button
              onClick={() => setTimeRange('7D')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === '7D'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('24H')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === '24H'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              24-Hour Profile
            </button>
          </div>
        </div>

        {/* Legend */}
        {timeRange === '7D' && (
          <div className="flex items-center gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-cyan-500" />
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Inflow (Pumped)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-600" />
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Usage (Draw)</span>
            </div>
          </div>
        )}

        {/* 7-DAY BAR CHART */}
        {timeRange === '7D' ? (
          <div className="pt-4 pb-2">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {dailyData.map((d, idx) => {
                const inflowHeight = `${Math.max(8, (d.inflowLiters / maxDailyVolume) * 100)}%`;
                const outflowHeight = `${Math.max(8, (d.outflowLiters / maxDailyVolume) * 100)}%`;
                const isToday = idx === dailyData.length - 1;

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Inflow bar */}
                      <div
                        className={`w-3 sm:w-4 rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-300 group-hover:brightness-110 relative ${
                          isToday ? 'ring-2 ring-cyan-400/50' : ''
                        }`}
                        style={{ height: inflowHeight }}
                        title={`Inflow: ${d.inflowLiters} L`}
                      />

                      {/* Outflow bar */}
                      <div
                        className="w-3 sm:w-4 rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-500 transition-all duration-300 group-hover:brightness-110"
                        style={{ height: outflowHeight }}
                        title={`Outflow: ${d.outflowLiters} L`}
                      />
                    </div>

                    <div className="text-center">
                      <span className={`text-[11px] font-mono font-semibold block ${
                        isToday ? 'text-cyan-500 font-bold' : isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {d.dayLabel}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 hidden sm:block">
                        {d.inflowLiters}L
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 24-HOUR HOURLY PROFILE CHART */
          <div className="pt-4 pb-2">
            <div className="h-44 flex items-end justify-between gap-1 px-1">
              {hourlyData.map((h) => {
                const barHeight = `${Math.max(6, (h.volumeLiters / maxHourlyVolume) * 100)}%`;
                const isPeak = h.volumeLiters >= 110;

                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      className={`w-full max-w-[12px] rounded-t transition-all ${
                        isPeak
                          ? 'bg-gradient-to-t from-amber-500 to-cyan-400'
                          : 'bg-gradient-to-t from-blue-700/80 to-cyan-500/80'
                      } group-hover:brightness-120`}
                      style={{ height: barHeight }}
                      title={`${h.label}: ${h.volumeLiters} Liters`}
                    />

                    {h.hour % 4 === 0 && (
                      <span className={`text-[9px] font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {h.hour === 0 ? '12A' : h.hour === 12 ? '12P' : `${h.hour % 12}${h.hour >= 12 ? 'P' : 'A'}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-white/5 font-mono">
              <span>Morning Peak: 07:00 - 09:00</span>
              <span>Evening Peak: 18:00 - 20:00</span>
            </div>
          </div>
        )}
      </div>

      {/* Pump Refill Cycle Session History Log */}
      <div className={`w-full rounded-3xl p-5 border backdrop-blur-xl shadow-xl space-y-3 ${
        isLight ? 'bg-white/80 border-slate-200 shadow-slate-200/50' : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-500" />
            <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recent Pump Refill Cycles
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {sessions.length} recorded cycles
          </span>
        </div>

        <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Every automated or manual pump cycle is logged with duration, volume delivered, and cutoff trigger.
        </p>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {sessions.map((sess) => {
            const timeStr = new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(sess.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
            const min = Math.floor(sess.durationSeconds / 60);
            const sec = sess.durationSeconds % 60;

            const isTargetReached = sess.cutoffReason === 'TARGET_REACHED';
            const isSafetyLimit = sess.cutoffReason === 'SAFETY_LIMIT';

            return (
              <div
                key={sess.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200/80 hover:bg-slate-100' : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isTargetReached
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : isSafetyLimit
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-cyan-500/15 text-cyan-400'
                  }`}>
                    {isTargetReached ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isSafetyLimit ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        +{sess.litersPumped} Liters
                      </span>
                      <span className="text-[10px] font-mono text-cyan-500 font-semibold">
                        ({sess.startLevelPercent.toFixed(0)}% → {sess.endLevelPercent.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{dateStr} at {timeStr}</span>
                      <span>·</span>
                      <span className="font-mono">{min}m {sec}s</span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                    isTargetReached
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                      : isSafetyLimit
                      ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                      : 'bg-slate-800 text-slate-400 border-white/5'
                  }`}>
                    {sess.cutoffReason.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
