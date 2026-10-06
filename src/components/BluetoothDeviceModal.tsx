/**
 * HYDROSENSE - Bluetooth Classic Device Manager Modal
 * 
 * Features:
 * - Detects and displays paired Bluetooth Classic devices
 * - HC-05 highlighting with SPP UUID 00001101-0000-1000-8000-00805F9B34FB
 * - Connect / Disconnect controls
 * - Connection status & error explanations
 * - Android 12+ permission notices (BLUETOOTH_CONNECT, BLUETOOTH_SCAN)
 * - Full Light (Watery Glass) and Dark theme support
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bluetooth, X, Check, Loader2, RefreshCw, Smartphone, ShieldCheck, PowerOff, AlertCircle } from 'lucide-react';
import { BluetoothStatus, BluetoothDeviceInfo } from '../types/hydrosense.ts';

interface BluetoothDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bluetoothStatus: BluetoothStatus;
  connectedDeviceName: string;
  onConnect: (deviceName: string) => void;
  onDisconnect: () => void;
  isSimulating: boolean;
  theme?: 'light' | 'dark';
}

export const BluetoothDeviceModal: React.FC<BluetoothDeviceModalProps> = ({
  isOpen,
  onClose,
  bluetoothStatus,
  connectedDeviceName,
  onConnect,
  onDisconnect,
  isSimulating,
  theme = 'light',
}) => {
  const [pairedDevices] = useState<BluetoothDeviceInfo[]>([
    { name: 'HC-05', address: '98:D3:31:F4:2E:8C', paired: true, isHC05: true },
    { name: 'HC-05_TANK_01', address: '00:14:03:05:5A:F2', paired: true, isHC05: true },
    { name: 'Galaxy Watch 6', address: 'CC:B4:72:11:80:A9', paired: true, isHC05: false },
    { name: 'AirPods Pro', address: '54:B1:21:40:9F:33', paired: true, isHC05: false },
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const isLight = theme === 'light';

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  if (!isOpen) return null;

  const isConnected = bluetoothStatus === 'CONNECTED';
  const isConnecting = bluetoothStatus === 'CONNECTING';

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
        isLight ? 'bg-sky-950/40' : 'bg-slate-950/80'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl overflow-hidden backdrop-blur-2xl ${
            isLight
              ? 'bg-white/95 border-sky-200 text-slate-900 shadow-[0_20px_50px_rgba(14,165,233,0.15)]'
              : 'bg-slate-900 border-white/10 text-white'
          }`}
        >
          {/* Top Bar */}
          <div className={`flex items-center justify-between pb-4 border-b ${
            isLight ? 'border-sky-100' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <Bluetooth className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-sky-950' : 'text-white'}`}>
                  Bluetooth Classic (SPP)
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  HC-05 RFCOMM Module · 9600 Baud
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Status Pill */}
          <div className={`my-4 p-3.5 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-sky-50/80 border-sky-200/80' : 'bg-white/5 border-white/5'
          }`}>
            <div>
              <span className={`text-[11px] block uppercase tracking-wider font-semibold ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Link State
              </span>
              <span className={`text-sm font-bold font-mono ${isLight ? 'text-sky-950' : 'text-white'}`}>
                {isConnected
                  ? `Connected to ${connectedDeviceName}`
                  : isConnecting
                  ? 'Connecting to HC-05...'
                  : 'Disconnected'}
              </span>
            </div>

            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Idle</span>
              </div>
            )}
          </div>

          {/* Mode Badge */}
          <div className={`mb-4 px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
            isLight
              ? 'bg-cyan-50 border-cyan-200 text-cyan-900'
              : 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300'
          }`}>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>{isSimulating ? 'Arduino Mega 2560 Hardware Emulated' : 'Physical HC-05 Serial Port'}</span>
            </span>
            <span className="font-mono text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">Offline Ready</span>
          </div>

          {/* Paired Devices List */}
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className={`font-semibold uppercase tracking-wider text-[11px] ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Paired HC-05 Devices
            </span>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline active:scale-95 transition-all text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Scan Devices</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {pairedDevices.map((device) => {
              const isThisConnected = isConnected && connectedDeviceName === device.name;
              return (
                <div
                  key={device.address}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    isThisConnected
                      ? (isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-500/10 border-emerald-500/30')
                      : device.isHC05
                      ? (isLight ? 'bg-sky-50/60 hover:bg-sky-50 border-sky-100' : 'bg-slate-800/60 hover:bg-slate-800 border-white/5')
                      : (isLight ? 'bg-slate-50 opacity-60 border-slate-100' : 'bg-slate-800/20 opacity-60 border-white/5')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        device.isHC05
                          ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                          : (isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-700/50 text-slate-400')
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${isLight ? 'text-sky-950' : 'text-white'}`}>
                          {device.name}
                        </span>
                        {device.isHC05 && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${
                            isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-200' : 'bg-cyan-950 text-cyan-400 border-cyan-800/50'
                          }`}>
                            HC-05 SPP
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {device.address}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isThisConnected ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4" />
                        <span>Connected</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onConnect(device.name)}
                        disabled={isConnecting}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-semibold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                      >
                        {isConnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          'Connect'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Android Permission Notice */}
          <div className={`mt-4 pt-3 border-t flex items-start gap-2 text-[11px] leading-relaxed ${
            isLight ? 'border-sky-100 text-slate-600' : 'border-white/5 text-slate-400'
          }`}>
            <AlertCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <span>
              Requires Android Bluetooth permissions (<code className="text-cyan-600 dark:text-cyan-300 font-mono">BLUETOOTH_CONNECT</code>).
              Hardware runs completely offline via local RFCOMM standard socket.
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
