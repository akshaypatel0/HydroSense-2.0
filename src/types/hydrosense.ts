/**
 * HYDROSENSE - Smart Water Tank Monitoring & Control
 * Core Domain Models and Protocol Definitions
 */

export const HARDWARE_DEFAULTS = {
  EMPTY_DISTANCE_CM: 14.0,
  FULL_DISTANCE_CM: 2.42,
  SAFETY_LIMIT_PERCENT: 95.0,
  WARNING_LEVEL_PERCENT: 90.0,
  CRITICAL_LEVEL_PERCENT: 98.9,
  DEFAULT_TARGET_PERCENT: 80.0,
  DEFAULT_CAPACITY_LITERS: 1000,
  HC05_SPP_UUID: '00001101-0000-1000-8000-00805F9B34FB',
  BAUD_RATE: 9600,
  STALE_DATA_TIMEOUT_MS: 5000,
} as const;

export type BluetoothStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type SensorStatus = 'OK' | 'TIMEOUT' | 'ERROR';

export type ControllerStatus = 'ONLINE' | 'INTERRUPTED' | 'OFFLINE';

export type BuzzerState = 'NORMAL' | 'HIGH_LEVEL' | 'WARNING' | 'CRITICAL';

export interface SafetyAlert {
  id: string;
  type: 'TARGET_REACHED' | 'SAFETY_LIMIT' | 'SENSOR_TIMEOUT' | 'CONNECTION_LOST' | 'ERROR';
  title: string;
  message: string;
  timestamp: number;
  levelPercent?: number;
  isDismissed?: boolean;
}

export type IslandAlertSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface DynamicIslandNotification {
  id: string;
  type:
    | 'LEVEL_50'
    | 'LEVEL_30'
    | 'LEVEL_15'
    | 'LEVEL_5'
    | 'LEVEL_0'
    | 'MOTOR_RUNNING'
    | 'MOTOR_STOPPED'
    | 'TARGET_REACHED'
    | 'SAFETY_LIMIT'
    | 'SENSOR_TIMEOUT'
    | 'CONNECTED'
    | 'DISCONNECTED'
    | 'MANUAL';
  title: string;
  subtitle: string;
  badge?: string;
  severity: IslandAlertSeverity;
  timestamp: number;
}

export interface TankState {
  distanceCm: number | null;
  levelPercent: number | null;
  hasReceivedData: boolean;
  targetPercent: number;
  motorRunning: boolean;
  motorPending: 'STARTING' | 'STOPPING' | null;
  bluetoothStatus: BluetoothStatus;
  connectedDeviceName: string;
  lastUpdateTimestamp: number | null;
  isStale: boolean;
  sensorStatus: SensorStatus;
  controllerStatus: ControllerStatus;
  emptyDistanceCm: number;
  fullDistanceCm: number;
  buzzerStatus: BuzzerState;
  lastAlert: SafetyAlert | null;
  pingLatencyMs: number | null;
  calibrationPending: 'EMPTY' | 'FULL' | null;
}

export interface LocalSettings {
  tankCapacityLiters: number;
  preferredTargetPercent: number;
  lastConnectedDeviceName: string;
  theme: 'dark' | 'light';
  language: 'en' | 'gu';
  autoReconnect: boolean;
  hapticEnabled: boolean;
}

export interface SerialLogEntry {
  id: string;
  timestamp: number;
  direction: 'TX' | 'RX' | 'SYS';
  raw: string;
  type?: 'LIVE_DATA' | 'ACK' | 'ALERT' | 'STATUS' | 'PING' | 'ERROR';
}

export interface BluetoothDeviceInfo {
  name: string;
  address: string;
  paired: boolean;
  isHC05: boolean;
}
