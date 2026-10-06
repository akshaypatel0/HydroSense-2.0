/**
 * HYDROSENSE - Local Storage & Settings Service
 * 
 * Persists safe user preferences:
 * - Tank capacity (liters)
 * - Preferred default target percentage
 * - Last connected device name
 * - UI Theme and feedback
 * 
 * Note: NEVER persists motor state or dangerous commands.
 */

import { HARDWARE_DEFAULTS, LocalSettings } from '../types/hydrosense.ts';

const SETTINGS_KEY = 'hydrosense_settings_v1';

const DEFAULT_SETTINGS: LocalSettings = {
  tankCapacityLiters: HARDWARE_DEFAULTS.DEFAULT_CAPACITY_LITERS,
  preferredTargetPercent: HARDWARE_DEFAULTS.DEFAULT_TARGET_PERCENT,
  lastConnectedDeviceName: 'HC-05',
  theme: 'light',
  language: 'en',
  autoReconnect: true,
  hapticEnabled: true,
};

export class StorageService {
  public static loadSettings(): LocalSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          // Guardrails
          tankCapacityLiters: Math.max(10, Math.min(100000, Number(parsed.tankCapacityLiters) || DEFAULT_SETTINGS.tankCapacityLiters)),
          preferredTargetPercent: Math.max(1, Math.min(HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT, Number(parsed.preferredTargetPercent) || DEFAULT_SETTINGS.preferredTargetPercent)),
        };
      }
    } catch {
      // LocalStorage access failure or invalid JSON
    }
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: Partial<LocalSettings>): LocalSettings {
    const current = this.loadSettings();
    const updated: LocalSettings = {
      ...current,
      ...settings,
    };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  }
}
