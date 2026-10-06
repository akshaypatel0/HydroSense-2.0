/**
 * HYDROSENSE - Bluetooth Communication Service & Hardware Controller
 * 
 * Manages RFCOMM/Serial connection to HC-05 (UUID: 00001101-0000-1000-8000-00805F9B34FB)
 * Line-based communication (newline delimited \n).
 * Includes auto-reconnection, stale-data watchdog, and built-in Arduino Mega 2560 emulator.
 */

import { HARDWARE_DEFAULTS, TankState, SafetyAlert, SerialLogEntry } from '../types/hydrosense.ts';
import { ArduinoSerialParser, ParsedSerialMessage } from './ArduinoSerialParser.ts';
import { WaterAnalyticsService } from './WaterAnalyticsService.ts';

export type StateListener = (state: TankState) => void;
export type LogListener = (entry: SerialLogEntry) => void;
export type CalibrationListener = (result: { type: 'EMPTY' | 'FULL'; success: boolean; message: string }) => void;

export class BluetoothManager {
  private static instance: BluetoothManager | null = null;

  private state: TankState = {
    distanceCm: null,
    levelPercent: null,
    hasReceivedData: false,
    targetPercent: HARDWARE_DEFAULTS.DEFAULT_TARGET_PERCENT,
    motorRunning: false,
    motorPending: null,
    bluetoothStatus: 'DISCONNECTED',
    connectedDeviceName: 'HC-05',
    lastUpdateTimestamp: null,
    isStale: false,
    sensorStatus: 'OK',
    controllerStatus: 'OFFLINE',
    emptyDistanceCm: HARDWARE_DEFAULTS.EMPTY_DISTANCE_CM,
    fullDistanceCm: HARDWARE_DEFAULTS.FULL_DISTANCE_CM,
    buzzerStatus: 'NORMAL',
    lastAlert: null,
    pingLatencyMs: null,
    calibrationPending: null,
  };

  private stateListeners: Set<StateListener> = new Set();
  private logListeners: Set<LogListener> = new Set();
  private calibrationListeners: Set<CalibrationListener> = new Set();

  // Watchdogs and timers
  private staleCheckTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private isAutoReconnectEnabled = true;

  // Ping tracking
  private lastPingSentTimestamp: number | null = null;

  // Simulation mode vs Hardware WebSerial
  private isSimulationMode = true;
  private simInterval: number | null = null;
  private simDistance = 13.38;
  private simLevel = 5.3;
  private simTarget = 80.0;
  private simMotor = false;
  private simSensorFault = false;
  private simEmptyDistance: number = HARDWARE_DEFAULTS.EMPTY_DISTANCE_CM;
  private simFullDistance: number = HARDWARE_DEFAULTS.FULL_DISTANCE_CM;

  // WebSerial port reference (when in browser with Web Serial API)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialPort: any = null;
  private serialReader: ReadableStreamDefaultReader<string> | null = null;
  private serialWriter: WritableStreamDefaultWriter<string> | null = null;
  private incomingBuffer = '';

  private constructor() {
    this.startStaleDataWatchdog();
  }

  public static getInstance(): BluetoothManager {
    if (!BluetoothManager.instance) {
      BluetoothManager.instance = new BluetoothManager();
    }
    return BluetoothManager.instance;
  }

  public getState(): TankState {
    return { ...this.state };
  }

  public isSimulating(): boolean {
    return this.isSimulationMode;
  }

  public setSimulationMode(enabled: boolean) {
    if (this.isSimulationMode === enabled) return;
    this.isSimulationMode = enabled;
    if (this.state.bluetoothStatus === 'CONNECTED') {
      this.disconnect();
    }
    this.addLog('SYS', `Operating mode switched to: ${enabled ? 'Simulated Arduino Mega 2560' : 'Physical HC-05 (Web Serial / RFCOMM)'}`);
  }

  public subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public subscribeLogs(listener: LogListener): () => void {
    this.logListeners.add(listener);
    return () => {
      this.logListeners.delete(listener);
    };
  }

  public subscribeCalibration(listener: CalibrationListener): () => void {
    this.calibrationListeners.add(listener);
    return () => {
      this.calibrationListeners.delete(listener);
    };
  }

  private notifyCalibrationResult(type: 'EMPTY' | 'FULL', success: boolean, message: string) {
    this.calibrationListeners.forEach((l) => l({ type, success, message }));
  }

  private notify() {
    const currentState = this.getState();
    this.stateListeners.forEach((listener) => listener(currentState));
  }

  private addLog(direction: 'TX' | 'RX' | 'SYS', raw: string, type?: SerialLogEntry['type']) {
    const entry: SerialLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      direction,
      raw,
      type,
    };
    this.logListeners.forEach((listener) => listener(entry));
  }

  /**
   * Connect to HC-05
   */
  public async connect(deviceName = 'HC-05'): Promise<boolean> {
    if (this.state.bluetoothStatus === 'CONNECTED' || this.state.bluetoothStatus === 'CONNECTING') {
      return false;
    }

    this.clearReconnectTimer();
    this.state.bluetoothStatus = 'CONNECTING';
    this.state.connectedDeviceName = deviceName;
    this.notify();
    this.addLog('SYS', `Connecting to ${deviceName} (SPP UUID: ${HARDWARE_DEFAULTS.HC05_SPP_UUID})...`);

    if (this.isSimulationMode) {
      // Simulate realistic connection delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      this.state.bluetoothStatus = 'CONNECTED';
      this.state.controllerStatus = 'ONLINE';
      this.reconnectAttempts = 0;
      this.notify();
      this.addLog('SYS', `Connected to ${deviceName}`);

      // Startup protocol: send PING and STATUS
      this.sendPing();
      this.sendStatusCommand();

      // Start simulated 1/sec periodic broadcast
      this.startSimulatedBroadcast();
      return true;
    }

    // Physical Web Serial connection (Chromium)
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser. Running in simulated HC-05 mode is recommended.');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navSerial = (navigator as any).serial;
      this.serialPort = await navSerial.requestPort();
      await this.serialPort.open({ baudRate: HARDWARE_DEFAULTS.BAUD_RATE });

      const textDecoder = new TextDecoderStream();
      this.serialPort.readable.pipeTo(textDecoder.writable);
      this.serialReader = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(this.serialPort.writable);
      this.serialWriter = textEncoder.writable.getWriter();

      this.state.bluetoothStatus = 'CONNECTED';
      this.state.controllerStatus = 'ONLINE';
      this.reconnectAttempts = 0;
      this.notify();
      this.addLog('SYS', `Connected to physical HC-05 at ${HARDWARE_DEFAULTS.BAUD_RATE} baud`);

      // Read loop
      this.startHardwareReadLoop();

      // Startup protocol
      this.sendPing();
      this.sendStatusCommand();
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.state.bluetoothStatus = 'ERROR';
      this.notify();
      this.addLog('SYS', `Connection error: ${errMsg}`, 'ERROR');
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * Disconnect manually
   */
  public async disconnect() {
    this.clearReconnectTimer();
    this.stopSimulatedBroadcast();

    if (this.serialReader) {
      try {
        await this.serialReader.cancel();
      } catch {
        // ignore
      }
      this.serialReader = null;
    }
    if (this.serialWriter) {
      try {
        await this.serialWriter.close();
      } catch {
        // ignore
      }
      this.serialWriter = null;
    }
    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch {
        // ignore
      }
      this.serialPort = null;
    }

    this.state.bluetoothStatus = 'DISCONNECTED';
    this.state.controllerStatus = 'OFFLINE';
    this.state.isStale = true;
    this.state.hasReceivedData = false;
    this.state.distanceCm = null;
    this.state.levelPercent = null;
    this.state.calibrationPending = null;
    this.notify();
    this.addLog('SYS', 'Disconnected from HC-05');
  }

  /**
   * Send a command with guaranteed newline \n
   */
  public async sendCommand(command: string): Promise<boolean> {
    const cleanCmd = command.trim();
    if (!cleanCmd) return false;

    if (this.state.bluetoothStatus !== 'CONNECTED') {
      this.addLog('SYS', `Cannot send "${cleanCmd}": Bluetooth is disconnected`, 'ERROR');
      return false;
    }

    const payload = `${cleanCmd}\n`;
    this.addLog('TX', cleanCmd);

    if (this.isSimulationMode) {
      // Process simulated hardware reply
      this.processSimulatedCommand(cleanCmd);
      return true;
    }

    if (this.serialWriter) {
      try {
        await this.serialWriter.write(payload);
        return true;
      } catch (err) {
        this.addLog('SYS', `Write failed: ${String(err)}`, 'ERROR');
        this.handleConnectionLost();
        return false;
      }
    }

    return false;
  }

  /**
   * Convenience Command: START MOTOR
   */
  public startMotor() {
    if (this.state.bluetoothStatus !== 'CONNECTED') {
      this.triggerAlert({
        id: `err-${Date.now()}`,
        type: 'ERROR',
        title: 'Connection Required',
        message: 'Connect to HC-05 first before starting the motor.',
        timestamp: Date.now(),
      });
      return;
    }
    this.state.motorPending = 'STARTING';
    this.notify();
    this.sendCommand('MOTOR_ON');
  }

  /**
   * Convenience Command: STOP MOTOR
   */
  public stopMotor() {
    if (this.state.bluetoothStatus !== 'CONNECTED') {
      this.triggerAlert({
        id: `err-${Date.now()}`,
        type: 'ERROR',
        title: 'Connection Required',
        message: 'Connect to HC-05 first.',
        timestamp: Date.now(),
      });
      return;
    }
    this.state.motorPending = 'STOPPING';
    this.notify();
    this.sendCommand('MOTOR_OFF');
  }

  /**
   * Convenience Command: Set Target (1% - 95%)
   */
  public setTarget(targetPercent: number) {
    const bounded = Math.max(1, Math.min(HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT, Math.round(targetPercent)));
    this.sendCommand(`TARGET:${bounded}`);
  }

  /**
   * Convenience Command: PING
   */
  public sendPing() {
    this.lastPingSentTimestamp = performance.now();
    this.sendCommand('PING');
  }

  /**
   * Convenience Command: STATUS
   */
  public sendStatusCommand() {
    this.sendCommand('STATUS');
  }

  /**
   * Sensor Calibration: CAL_EMPTY
   * Sends CAL_EMPTY command to Arduino Mega 2560
   */
  public async calibrateEmpty(): Promise<{ success: boolean; error?: string }> {
    if (this.state.bluetoothStatus !== 'CONNECTED') {
      return { success: false, error: 'Bluetooth disconnected. Please reconnect to HydroSense.' };
    }
    this.state.calibrationPending = 'EMPTY';
    this.notify();
    await this.sendCommand('CAL_EMPTY');
    return { success: true };
  }

  /**
   * Sensor Calibration: CAL_FULL
   * Sends CAL_FULL command to Arduino Mega 2560
   */
  public async calibrateFull(): Promise<{ success: boolean; error?: string }> {
    if (this.state.bluetoothStatus !== 'CONNECTED') {
      return { success: false, error: 'Bluetooth disconnected. Please reconnect to HydroSense.' };
    }
    this.state.calibrationPending = 'FULL';
    this.notify();
    await this.sendCommand('CAL_FULL');
    return { success: true };
  }

  /**
   * Ingest a single raw line from Arduino
   */
  public handleIncomingLine(rawLine: string) {
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    const parsed: ParsedSerialMessage = ArduinoSerialParser.parseLine(trimmed);

    // Update stale tracking & timestamp
    const now = Date.now();
    this.state.lastUpdateTimestamp = now;
    this.state.isStale = false;
    this.state.controllerStatus = 'ONLINE';

    switch (parsed.type) {
      case 'LIVE_DATA': {
        this.addLog('RX', trimmed, 'LIVE_DATA');
        this.state.hasReceivedData = true;
        if (parsed.distanceCm !== undefined) {
          this.state.distanceCm = parsed.distanceCm;
        }
        this.state.levelPercent = parsed.levelPercent;
        this.state.targetPercent = parsed.targetPercent;

        // Authoritative motor state from Arduino
        const prevRunning = this.state.motorRunning;
        this.state.motorRunning = parsed.motorRunning;

        if (!prevRunning && parsed.motorRunning) {
          WaterAnalyticsService.getInstance().recordMotorStart(parsed.levelPercent);
        } else if (prevRunning && !parsed.motorRunning) {
          WaterAnalyticsService.getInstance().recordMotorStop(parsed.levelPercent, 1000, 'MANUAL_STOP');
        }

        if (this.state.motorPending === 'STARTING' && parsed.motorRunning) {
          this.state.motorPending = null;
        } else if (this.state.motorPending === 'STOPPING' && !parsed.motorRunning) {
          this.state.motorPending = null;
        }

        // Determine buzzer status according to level
        this.updateBuzzerState(parsed.levelPercent);
        this.notify();
        break;
      }

      case 'ACK': {
        this.addLog('RX', trimmed, 'ACK');
        if (parsed.command === 'MOTOR_ON') {
          if (parsed.success) {
            if (!this.state.motorRunning) {
              WaterAnalyticsService.getInstance().recordMotorStart(this.state.levelPercent ?? 0);
            }
            this.state.motorRunning = true;
            this.state.motorPending = null;
          } else {
            this.state.motorPending = null;
            this.triggerAlert({
              id: `alert-${now}`,
              type: 'ERROR',
              title: 'Motor Start Rejected',
              message: 'Motor could not be started. Check water level or sensor status.',
              timestamp: now,
            });
          }
        } else if (parsed.command === 'MOTOR_OFF') {
          if (parsed.success) {
            if (this.state.motorRunning) {
              WaterAnalyticsService.getInstance().recordMotorStop(this.state.levelPercent ?? 0, 1000, 'MANUAL_STOP');
            }
            this.state.motorRunning = false;
            this.state.motorPending = null;
          }
        } else if (parsed.command === 'TARGET') {
          // ACK:TARGET:OK or ERROR
          if (!parsed.success) {
            this.triggerAlert({
              id: `alert-${now}`,
              type: 'ERROR',
              title: 'Target Rejected',
              message: 'Arduino rejected target setting. Target must be between 1% and 95%.',
              timestamp: now,
            });
          }
        } else if (parsed.command === 'CAL_EMPTY') {
          this.state.calibrationPending = null;
          if (parsed.success) {
            this.notifyCalibrationResult('EMPTY', true, 'Empty point calibrated');
            this.sendStatusCommand();
          } else {
            this.notifyCalibrationResult('EMPTY', false, 'Empty calibration failed. Please try again.');
          }
        } else if (parsed.command === 'CAL_FULL') {
          this.state.calibrationPending = null;
          if (parsed.success) {
            this.notifyCalibrationResult('FULL', true, 'Full point calibrated');
            this.sendStatusCommand();
          } else {
            this.notifyCalibrationResult('FULL', false, 'Full calibration failed. Please try again.');
          }
        }
        this.notify();
        break;
      }

      case 'MOTOR_OFF_EVENT': {
        this.addLog('RX', trimmed, 'ALERT');
        WaterAnalyticsService.getInstance().recordMotorStop(this.state.levelPercent ?? 0, 1000, parsed.reason);
        this.state.motorRunning = false;
        this.state.motorPending = null;

        if (parsed.reason === 'TARGET_REACHED') {
          this.triggerAlert({
            id: `alert-${now}`,
            type: 'TARGET_REACHED',
            title: 'Target Reached',
            message: `Target ${this.state.targetPercent}% reached. Motor automatically stopped.`,
            timestamp: now,
            levelPercent: this.state.levelPercent ?? undefined,
          });
        } else if (parsed.reason === 'SAFETY_LIMIT') {
          this.triggerAlert({
            id: `alert-${now}`,
            type: 'SAFETY_LIMIT',
            title: 'Safety Limit Reached',
            message: `Water level reached the ${HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT}% safety limit. Motor automatically stopped.`,
            timestamp: now,
            levelPercent: this.state.levelPercent ?? undefined,
          });
        } else if (parsed.reason === 'SENSOR_TIMEOUT') {
          this.state.sensorStatus = 'TIMEOUT';
          this.triggerAlert({
            id: `alert-${now}`,
            type: 'SENSOR_TIMEOUT',
            title: 'Sensor Safety Stop',
            message: 'The ultrasonic sensor stopped providing valid readings. Motor was stopped for safety.',
            timestamp: now,
          });
        }
        this.notify();
        break;
      }

      case 'PONG': {
        this.addLog('RX', trimmed, 'PING');
        if (this.lastPingSentTimestamp) {
          const latency = Math.round(performance.now() - this.lastPingSentTimestamp);
          this.state.pingLatencyMs = latency;
        } else {
          this.state.pingLatencyMs = 12;
        }
        this.notify();
        break;
      }

      case 'STATUS': {
        this.addLog('RX', trimmed, 'STATUS');
        if (parsed.emptyDistanceCm !== undefined) {
          this.state.emptyDistanceCm = parsed.emptyDistanceCm;
        }
        if (parsed.fullDistanceCm !== undefined) {
          this.state.fullDistanceCm = parsed.fullDistanceCm;
        }
        if (parsed.levelPercent !== undefined) {
          this.state.levelPercent = parsed.levelPercent;
          this.updateBuzzerState(parsed.levelPercent);
        }
        if (parsed.targetPercent !== undefined) {
          this.state.targetPercent = parsed.targetPercent;
        }
        if (parsed.motorRunning !== undefined) {
          this.state.motorRunning = parsed.motorRunning;
        }
        this.notify();
        break;
      }

      case 'UNKNOWN':
      default:
        // Ignore safely, never crash
        this.addLog('RX', trimmed);
        break;
    }
  }

  private updateBuzzerState(level: number) {
    if (level >= HARDWARE_DEFAULTS.CRITICAL_LEVEL_PERCENT) {
      this.state.buzzerStatus = 'CRITICAL';
    } else if (level >= HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT) {
      this.state.buzzerStatus = 'WARNING';
    } else if (level >= HARDWARE_DEFAULTS.WARNING_LEVEL_PERCENT) {
      this.state.buzzerStatus = 'HIGH_LEVEL';
    } else {
      this.state.buzzerStatus = 'NORMAL';
    }
  }

  private triggerAlert(alert: SafetyAlert) {
    this.state.lastAlert = alert;
    this.notify();
  }

  public dismissLastAlert() {
    if (this.state.lastAlert) {
      this.state.lastAlert = null;
      this.notify();
    }
  }

  /**
   * Watchdog: Stale data check (~5 seconds)
   */
  private startStaleDataWatchdog() {
    if (this.staleCheckTimer) clearInterval(this.staleCheckTimer);

    this.staleCheckTimer = window.setInterval(() => {
      if (this.state.bluetoothStatus === 'CONNECTED') {
        const elapsed = this.state.lastUpdateTimestamp ? Date.now() - this.state.lastUpdateTimestamp : 99999;
        const nowStale = elapsed > HARDWARE_DEFAULTS.STALE_DATA_TIMEOUT_MS;

        if (nowStale !== this.state.isStale) {
          this.state.isStale = nowStale;
          if (nowStale) {
            this.state.controllerStatus = 'INTERRUPTED';
            // Important: app does NOT automatically claim motor is OFF
            // last known motor state is retained and flagged
          } else {
            this.state.controllerStatus = 'ONLINE';
          }
          this.notify();
        }
      }
    }, 1000);
  }

  /**
   * Automatic Reconnection Logic
   */
  private scheduleReconnect() {
    if (!this.isAutoReconnectEnabled) return;
    this.clearReconnectTimer();

    // Exponential backoff: 1s, 2s, 4s, max 8s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;
    this.addLog('SYS', `Auto-reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimer = window.setTimeout(async () => {
      if (this.state.bluetoothStatus !== 'CONNECTED') {
        const ok = await this.connect(this.state.connectedDeviceName);
        if (!ok) {
          this.scheduleReconnect();
        }
      }
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleConnectionLost() {
    this.state.bluetoothStatus = 'DISCONNECTED';
    this.state.controllerStatus = 'OFFLINE';
    this.state.isStale = true;
    this.state.hasReceivedData = false;
    this.state.distanceCm = null;
    this.state.levelPercent = null;
    this.state.calibrationPending = null;
    this.notify();
    this.addLog('SYS', 'Connection Lost. Disconnected from HC-05.', 'ERROR');
    this.scheduleReconnect();
  }

  public setAutoReconnect(enabled: boolean) {
    this.isAutoReconnectEnabled = enabled;
    if (!enabled) {
      this.clearReconnectTimer();
    }
  }

  /**
   * Hardware Read Loop (Web Serial)
   */
  private async startHardwareReadLoop() {
    if (!this.serialReader) return;

    try {
      while (true) {
        const { value, done } = await this.serialReader.read();
        if (done) {
          break;
        }
        if (value) {
          this.incomingBuffer += value;
          const lines = this.incomingBuffer.split('\n');
          // keep remainder in buffer
          this.incomingBuffer = lines.pop() || '';

          for (const line of lines) {
            this.handleIncomingLine(line);
          }
        }
      }
    } catch {
      this.handleConnectionLost();
    }
  }

  // ==========================================
  // HARDWARE EMULATOR (Arduino Mega 2560)
  // ==========================================

  private startSimulatedBroadcast() {
    this.stopSimulatedBroadcast();

    this.simInterval = window.setInterval(() => {
      if (this.state.bluetoothStatus !== 'CONNECTED') return;

      if (this.simSensorFault) {
        // Sensor failure test simulation
        if (this.simMotor) {
          this.simMotor = false;
          this.handleIncomingLine('MOTOR_OFF:SENSOR_TIMEOUT');
        }
        return;
      }

      // Physics calculation for water level
      if (this.simMotor) {
        // Water is pumping in: increases ~0.7% to 1.1% per second
        this.simLevel = Math.min(100, +(this.simLevel + 0.8 + (Math.random() * 0.2 - 0.1)).toFixed(1));

        // Ultrasonic distance: EMPTY = 14.0cm, FULL = 2.42cm
        // distance = EMPTY - (level/100) * (EMPTY - FULL)
        const range = HARDWARE_DEFAULTS.EMPTY_DISTANCE_CM - HARDWARE_DEFAULTS.FULL_DISTANCE_CM;
        this.simDistance = +(HARDWARE_DEFAULTS.EMPTY_DISTANCE_CM - (this.simLevel / 100) * range + (Math.random() * 0.04 - 0.02)).toFixed(2);

        // 1. Check TARGET cutoff
        if (this.simLevel >= this.simTarget) {
          this.simMotor = false;
          this.handleIncomingLine('MOTOR_OFF:TARGET_REACHED');
        }
        // 2. Check 95% SAFETY cutoff
        else if (this.simLevel >= HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT) {
          this.simMotor = false;
          this.handleIncomingLine('MOTOR_OFF:SAFETY_LIMIT');
        }
      } else {
        // Motor is OFF: natural small level fluctuation / tiny water usage
        if (this.simLevel > 2.0 && Math.random() < 0.15) {
          this.simLevel = +(this.simLevel - 0.1).toFixed(1);
        }
        const range = HARDWARE_DEFAULTS.EMPTY_DISTANCE_CM - HARDWARE_DEFAULTS.FULL_DISTANCE_CM;
        this.simDistance = +(HARDWARE_DEFAULTS.EMPTY_DISTANCE_CM - (this.simLevel / 100) * range + (Math.random() * 0.02 - 0.01)).toFixed(2);
      }

      // Live packet transmission: DISTANCE:13.38,LEVEL:5.3,MOTOR:ON,TARGET:30.0
      const motorStr = this.simMotor ? 'ON' : 'OFF';
      const line = `DISTANCE:${this.simDistance.toFixed(2)},LEVEL:${this.simLevel.toFixed(1)},MOTOR:${motorStr},TARGET:${this.simTarget.toFixed(1)}`;
      this.handleIncomingLine(line);
    }, 1000);
  }

  private stopSimulatedBroadcast() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
  }

  private processSimulatedCommand(cmd: string) {
    setTimeout(() => {
      if (cmd === 'PING') {
        this.handleIncomingLine('PONG');
      } else if (cmd === 'STATUS') {
        const motorStr = this.simMotor ? 'ON' : 'OFF';
        const line = `STATUS:EMPTY:${this.simEmptyDistance.toFixed(2)},FULL:${this.simFullDistance.toFixed(2)},LEVEL:${this.simLevel.toFixed(1)},TARGET:${this.simTarget.toFixed(1)},MOTOR:${motorStr}`;
        this.handleIncomingLine(line);
      } else if (cmd === 'CAL_EMPTY') {
        setTimeout(() => {
          this.simEmptyDistance = this.simDistance;
          this.handleIncomingLine('ACK:CAL_EMPTY:OK');
        }, 350);
      } else if (cmd === 'CAL_FULL') {
        setTimeout(() => {
          this.simFullDistance = this.simDistance;
          this.handleIncomingLine('ACK:CAL_FULL:OK');
        }, 350);
      } else if (cmd === 'MOTOR_ON') {
        if (this.simSensorFault) {
          this.handleIncomingLine('ACK:MOTOR_ON:ERROR');
        } else if (this.simLevel >= HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT) {
          this.handleIncomingLine('ACK:MOTOR_ON:ERROR');
        } else {
          this.simMotor = true;
          this.handleIncomingLine('ACK:MOTOR_ON:OK');
        }
      } else if (cmd === 'MOTOR_OFF') {
        this.simMotor = false;
        this.handleIncomingLine('ACK:MOTOR_OFF:OK');
      } else if (cmd.startsWith('TARGET:')) {
        const val = parseFloat(cmd.substring('TARGET:'.length));
        if (!isNaN(val) && val >= 1 && val <= HARDWARE_DEFAULTS.SAFETY_LIMIT_PERCENT) {
          this.simTarget = val;
          this.handleIncomingLine('ACK:TARGET:OK');
        } else {
          this.handleIncomingLine('ACK:TARGET:ERROR');
        }
      }
    }, 80);
  }

  // Developer simulation triggers for test suite verification
  public simulateSetLevel(level: number) {
    this.simLevel = Math.max(0, Math.min(100, level));
    const range = HARDWARE_DEFAULTS.EMPTY_DISTANCE_CM - HARDWARE_DEFAULTS.FULL_DISTANCE_CM;
    this.simDistance = +(HARDWARE_DEFAULTS.EMPTY_DISTANCE_CM - (this.simLevel / 100) * range).toFixed(2);
    if (this.state.bluetoothStatus === 'CONNECTED') {
      const motorStr = this.simMotor ? 'ON' : 'OFF';
      this.handleIncomingLine(`DISTANCE:${this.simDistance.toFixed(2)},LEVEL:${this.simLevel.toFixed(1)},MOTOR:${motorStr},TARGET:${this.simTarget.toFixed(1)}`);
    }
  }

  public simulateSensorTimeout() {
    this.simSensorFault = !this.simSensorFault;
    if (this.simSensorFault) {
      this.state.sensorStatus = 'TIMEOUT';
      if (this.simMotor) {
        this.simMotor = false;
        this.handleIncomingLine('MOTOR_OFF:SENSOR_TIMEOUT');
      }
    } else {
      this.state.sensorStatus = 'OK';
      this.notify();
    }
  }

  public simulate95SafetyLimit() {
    this.simLevel = 95.0;
    this.simMotor = true; // force motor to hit safety check
    this.addLog('SYS', 'Simulation: Fast-forwarded water level to 95.0% Safety Limit');
  }

  public simulateTargetReached() {
    this.simLevel = this.simTarget;
    this.simMotor = true; // force motor to hit target check
    this.addLog('SYS', `Simulation: Fast-forwarded water level to Target ${this.simTarget}%`);
  }

  public simulateDisconnect() {
    this.disconnect();
  }
}
