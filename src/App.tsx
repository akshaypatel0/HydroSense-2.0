/**
 * HYDROSENSE - Smart Water Tank Monitoring & Control
 * Root Application Container
 * 
 * Manages:
 * - 4 Navigation Views: Dashboard, Control, Technical, Settings
 * - Bottom ergonomic tab navigation bar (Thumb-Zone optimized)
 * - Real-time state subscription to BluetoothManager
 * - Modals for Bluetooth Classic pairing, Serial Debug Console, and Android Native Project Code
 * - Local settings persistence via StorageService
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart3, Sliders, Cpu, Settings as SettingsIcon, Bluetooth, Terminal, Code2 } from 'lucide-react';
import { TankState, LocalSettings } from './types/hydrosense.ts';
import { BluetoothManager } from './services/BluetoothManager.ts';
import { StorageService } from './services/StorageService.ts';
import { DashboardScreen } from './components/DashboardScreen.tsx';
import { WaterUsageAnalyticsScreen } from './components/WaterUsageAnalyticsScreen.tsx';
import { ControlScreen } from './components/ControlScreen.tsx';
import { TechnicalScreen } from './components/TechnicalScreen.tsx';
import { SettingsScreen } from './components/SettingsScreen.tsx';
import { SensorCalibrationScreen } from './components/SensorCalibrationScreen.tsx';
import { BluetoothDeviceModal } from './components/BluetoothDeviceModal.tsx';
import { DebugLogModal } from './components/DebugLogModal.tsx';
import { AndroidSourceModal } from './components/AndroidSourceModal.tsx';
import { DynamicIslandCapsule } from './components/DynamicIslandCapsule.tsx';

type TabType = 'dashboard' | 'analytics' | 'control' | 'technical' | 'settings' | 'calibration';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [settings, setSettings] = useState<LocalSettings>(() => StorageService.loadSettings());
  const [tankState, setTankState] = useState<TankState>(() => BluetoothManager.getInstance().getState());

  // Modal open states
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [isAndroidSourceModalOpen, setIsAndroidSourceModalOpen] = useState(false);

  const manager = BluetoothManager.getInstance();
  const isLight = settings.theme === 'light';

  // Startup behavior: Starts in DISCONNECTED state. Only connects when user initiates!
  useEffect(() => {
    // 1. Subscribe to Bluetooth state
    const unsubscribe = manager.subscribe((newState) => {
      setTankState(newState);
    });

    // 2. Configure auto-reconnect setting
    manager.setAutoReconnect(settings.autoReconnect);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateSettings = (newSettings: Partial<LocalSettings>) => {
    const updated = StorageService.saveSettings(newSettings);
    setSettings(updated);
  };

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'control' as TabType, label: 'Control', icon: Sliders },
    { id: 'technical' as TabType, label: 'Technical', icon: Cpu },
    { id: 'settings' as TabType, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
      isLight ? 'bg-gradient-to-b from-sky-50 via-cyan-50/30 to-blue-50/60 text-slate-900 selection:bg-cyan-500/20 selection:text-cyan-800' : 'bg-slate-950 text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200'
    }`}>
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full blur-[140px] ${
          isLight ? 'bg-cyan-300/35' : 'bg-cyan-600/10'
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full blur-[150px] ${
          isLight ? 'bg-blue-300/30' : 'bg-blue-700/10'
        }`} />
      </div>

      {/* iOS Live Activity Dynamic Island Capsule */}
      <DynamicIslandCapsule
        state={tankState}
        settings={settings}
        onStartMotor={() => manager.startMotor()}
        onStopMotor={() => manager.stopMotor()}
        onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
      />

      {/* Main Content Area (Max width 640px for smartphone/tablet ergonomic focus) */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-24">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            state={tankState}
            settings={settings}
            onStartMotor={() => manager.startMotor()}
            onStopMotor={() => manager.stopMotor()}
            onSetTarget={(target) => manager.setTarget(target)}
            onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
            onDismissAlert={() => manager.dismissLastAlert()}
            onNavigateToControl={() => setActiveTab('control')}
          />
        )}

        {activeTab === 'analytics' && (
          <WaterUsageAnalyticsScreen
            state={tankState}
            settings={settings}
          />
        )}

        {activeTab === 'control' && (
          <ControlScreen
            state={tankState}
            settings={settings}
            onStartMotor={() => manager.startMotor()}
            onStopMotor={() => manager.stopMotor()}
            onSetTarget={(target) => manager.setTarget(target)}
            onDismissAlert={() => manager.dismissLastAlert()}
          />
        )}

        {activeTab === 'technical' && (
          <TechnicalScreen
            state={tankState}
            settings={settings}
            onSendStatus={() => manager.sendStatusCommand()}
            onSendPing={() => manager.sendPing()}
            onOpenDebugModal={() => setIsDebugModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenDebugModal={() => setIsDebugModalOpen(true)}
            onOpenAndroidSourceModal={() => setIsAndroidSourceModalOpen(true)}
            onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
            onOpenCalibrationScreen={() => setActiveTab('calibration')}
          />
        )}

        {activeTab === 'calibration' && (
          <SensorCalibrationScreen
            state={tankState}
            settings={settings}
            onBack={() => setActiveTab('settings')}
            onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
          />
        )}
      </main>

      {/* Fixed Bottom Tab Navigation Bar (Thumb Zone Pattern 1) */}
      <nav className={`fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl border-t pb-safe transition-colors ${
        isLight ? 'bg-white/90 border-sky-200/80 text-slate-700 shadow-[0_-4px_25px_rgba(14,165,233,0.08)]' : 'bg-slate-950/85 border-white/10 text-slate-300'
      }`}>
        <div className="max-w-xl mx-auto grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === 'settings' && activeTab === 'calibration');
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center h-full min-h-[44px] transition-all group active:scale-95 cursor-pointer"
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? (isLight ? 'text-cyan-700 bg-cyan-50 font-bold shadow-xs' : 'text-cyan-400 bg-cyan-500/10')
                      : (isLight ? 'text-slate-500 group-hover:text-slate-800' : 'text-slate-400 group-hover:text-slate-200')
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                    isActive
                      ? (isLight ? 'text-cyan-750 font-bold' : 'text-cyan-300 font-semibold')
                      : (isLight ? 'text-slate-500' : 'text-slate-400')
                  }`}
                >
                  {item.label}
                </span>

                {/* Subtle active pip */}
                {isActive && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bluetooth Classic Pairing Modal */}
      <BluetoothDeviceModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        bluetoothStatus={tankState.bluetoothStatus}
        connectedDeviceName={tankState.connectedDeviceName}
        onConnect={(deviceName) => manager.connect(deviceName)}
        onDisconnect={() => manager.disconnect()}
        isSimulating={manager.isSimulating()}
        theme={settings.theme}
      />

      {/* Serial Debug Console Modal */}
      <DebugLogModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        theme={settings.theme}
      />

      {/* Android Native Source Code Explorer */}
      <AndroidSourceModal
        isOpen={isAndroidSourceModalOpen}
        onClose={() => setIsAndroidSourceModalOpen(false)}
        theme={settings.theme}
      />
    </div>
  );
}
