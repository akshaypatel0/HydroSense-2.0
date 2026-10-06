/**
 * HYDROSENSE - Serial Debug Console Modal
 * 
 * Shows line-based serial traffic:
 * TX: MOTOR_ON
 * RX: ACK:MOTOR_ON:OK
 * RX: DISTANCE:13.38,LEVEL:5.3,MOTOR:ON,TARGET:30.0
 * 
 * Provides quick command dispatcher, auto-scroll, log copy, and clear.
 * Supports Light (Watery Glass) and Dark theme.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Trash2, Copy, Send, Check } from 'lucide-react';
import { SerialLogEntry } from '../types/hydrosense.ts';
import { BluetoothManager } from '../services/BluetoothManager.ts';

interface DebugLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const DebugLogModal: React.FC<DebugLogModalProps> = ({ isOpen, onClose, theme = 'light' }) => {
  const [logs, setLogs] = useState<SerialLogEntry[]>([]);
  const [customCmd, setCustomCmd] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  const manager = BluetoothManager.getInstance();

  useEffect(() => {
    const unsubscribe = manager.subscribeLogs((newEntry) => {
      setLogs((prev) => [...prev.slice(-150), newEntry]);
    });
    return () => unsubscribe();
  }, [manager]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSend = (cmdToSend?: string) => {
    const text = (cmdToSend ?? customCmd).trim();
    if (!text) return;
    manager.sendCommand(text);
    if (!cmdToSend) setCustomCmd('');
  };

  const handleCopy = () => {
    const text = logs
      .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.direction}: ${l.raw}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md ${
        isLight ? 'bg-sky-950/40' : 'bg-slate-950/80'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className={`relative w-full max-w-2xl h-[85vh] rounded-3xl p-5 border shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ${
            isLight
              ? 'bg-white/95 border-sky-200 text-slate-900 shadow-[0_20px_50px_rgba(14,165,233,0.15)]'
              : 'bg-slate-900 border-white/10 text-white'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-sky-100' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-bold tracking-tight flex items-center gap-2 ${
                  isLight ? 'text-sky-950' : 'text-white'
                }`}>
                  Serial Debug Console
                </h3>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  9600 Baud · Line-Delimited (\n) Protocol
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
                title="Copy all logs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setLogs([])}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Command Bar */}
          <div className={`py-2.5 flex flex-wrap gap-1.5 border-b text-xs font-mono ${
            isLight ? 'border-sky-100' : 'border-white/5'
          }`}>
            {['STATUS', 'PING', 'MOTOR_ON', 'MOTOR_OFF', 'TARGET:50', 'TARGET:80'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleSend(cmd)}
                className={`px-2.5 py-1 rounded-lg border active:scale-95 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                }`}
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Log Stream Terminal Window */}
          <div
            ref={scrollRef}
            className="flex-1 my-3 rounded-2xl bg-slate-950 p-3.5 overflow-y-auto font-mono text-xs space-y-1.5 border border-slate-800 shadow-inner"
          >
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No serial lines yet. Connect to HC-05 or send a command.
              </div>
            ) : (
              logs.map((log) => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                let dirColor = 'text-slate-400';
                let textColor = 'text-slate-200';

                if (log.direction === 'TX') {
                  dirColor = 'text-cyan-400 font-bold';
                  textColor = 'text-cyan-200';
                } else if (log.direction === 'RX') {
                  dirColor = 'text-emerald-400 font-bold';
                  if (log.type === 'ALERT') {
                    textColor = 'text-amber-300 font-bold';
                  } else if (log.type === 'ACK') {
                    textColor = 'text-emerald-300';
                  } else {
                    textColor = 'text-slate-300';
                  }
                } else if (log.direction === 'SYS') {
                  dirColor = 'text-purple-400 font-bold';
                  textColor = 'text-purple-200';
                }

                return (
                  <div key={log.id} className="flex items-start gap-2 leading-tight">
                    <span className="text-[10px] text-slate-600 select-none shrink-0">
                      {time}
                    </span>
                    <span className={`text-[11px] select-none shrink-0 ${dirColor}`}>
                      [{log.direction}]
                    </span>
                    <span className={`break-all ${textColor}`}>
                      {log.raw}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive Command Input Box */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customCmd}
              onChange={(e) => setCustomCmd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Custom command (e.g. TARGET:75)"
              className={`flex-1 px-4 py-2 rounded-2xl border font-mono text-xs focus:outline-none focus:border-cyan-500 ${
                isLight ? 'bg-sky-50 border-sky-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={!customCmd.trim()}
              className="px-4 py-2 rounded-2xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
