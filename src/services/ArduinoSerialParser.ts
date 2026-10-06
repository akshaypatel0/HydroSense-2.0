/**
 * HYDROSENSE - Arduino Serial Protocol Parser
 * 
 * Line-based parser for Arduino Mega 2560 communication over HC-05 (9600 baud).
 * Fault-tolerant, order-independent key-value parser that will never crash on malformed input.
 */

export interface ParsedLiveData {
  type: 'LIVE_DATA';
  distanceCm?: number;
  levelPercent: number;
  motorRunning: boolean;
  targetPercent: number;
  raw: string;
}

export interface ParsedAck {
  type: 'ACK';
  command: 'MOTOR_ON' | 'MOTOR_OFF' | 'TARGET' | 'CAL_EMPTY' | 'CAL_FULL';
  success: boolean;
  raw: string;
}

export interface ParsedMotorOffEvent {
  type: 'MOTOR_OFF_EVENT';
  reason: 'TARGET_REACHED' | 'SAFETY_LIMIT' | 'SENSOR_TIMEOUT';
  raw: string;
}

export interface ParsedPong {
  type: 'PONG';
  raw: string;
}

export interface ParsedStatus {
  type: 'STATUS';
  emptyDistanceCm?: number;
  fullDistanceCm?: number;
  levelPercent?: number;
  targetPercent?: number;
  motorRunning?: boolean;
  raw: string;
}

export interface ParsedUnknown {
  type: 'UNKNOWN';
  raw: string;
}

export type ParsedSerialMessage =
  | ParsedLiveData
  | ParsedAck
  | ParsedMotorOffEvent
  | ParsedPong
  | ParsedStatus
  | ParsedUnknown;

export class ArduinoSerialParser {
  /**
   * Parse a single trimmed line received from the Arduino Mega 2560.
   */
  public static parseLine(line: string): ParsedSerialMessage {
    const raw = line.trim();
    if (!raw) {
      return { type: 'UNKNOWN', raw };
    }

    // 1. Check for PONG
    if (raw === 'PONG') {
      return { type: 'PONG', raw };
    }

    // 2. Check for Specific Motor Safety Shutdown Events
    if (raw === 'MOTOR_OFF:TARGET_REACHED') {
      return { type: 'MOTOR_OFF_EVENT', reason: 'TARGET_REACHED', raw };
    }
    if (raw === 'MOTOR_OFF:SAFETY_LIMIT') {
      return { type: 'MOTOR_OFF_EVENT', reason: 'SAFETY_LIMIT', raw };
    }
    if (raw === 'MOTOR_OFF:SENSOR_TIMEOUT') {
      return { type: 'MOTOR_OFF_EVENT', reason: 'SENSOR_TIMEOUT', raw };
    }

    // 3. Check for ACKs
    // Examples: ACK:MOTOR_ON:OK, ACK:MOTOR_ON:ERROR, ACK:MOTOR_OFF:OK, ACK:TARGET:OK, ACK:TARGET:ERROR, ACK:CAL_EMPTY:OK, ACK:CAL_FULL:OK
    if (raw.startsWith('ACK:')) {
      const parts = raw.split(':');
      if (parts.length >= 3) {
        const cmd = parts[1] as 'MOTOR_ON' | 'MOTOR_OFF' | 'TARGET' | 'CAL_EMPTY' | 'CAL_FULL';
        const status = parts[2];
        if (cmd === 'MOTOR_ON' || cmd === 'MOTOR_OFF' || cmd === 'TARGET' || cmd === 'CAL_EMPTY' || cmd === 'CAL_FULL') {
          return {
            type: 'ACK',
            command: cmd,
            success: status === 'OK',
            raw,
          };
        }
      }
    }

    // 4. Check for STATUS response
    // Example: STATUS:EMPTY:14.00,FULL:2.42,LEVEL:5.3,TARGET:30.0,MOTOR:OFF
    if (raw.startsWith('STATUS:')) {
      const payload = raw.substring('STATUS:'.length);
      return this.parseStatusPayload(payload, raw);
    }

    // 5. Check for LIVE_DATA periodic update
    // Example: DISTANCE:13.38,LEVEL:5.3,MOTOR:ON,TARGET:30.0
    if (raw.includes('LEVEL:') || raw.includes('DISTANCE:')) {
      return this.parseLiveDataPayload(raw);
    }

    return { type: 'UNKNOWN', raw };
  }

  /**
   * Parse comma-separated key:value pairs for live data
   * Independent of field order.
   */
  private static parseLiveDataPayload(raw: string): ParsedLiveData | ParsedUnknown {
    try {
      const tokens = raw.split(',');
      let distanceCm: number | undefined = undefined;
      let levelPercent: number | undefined = undefined;
      let motorRunning: boolean | undefined = undefined;
      let targetPercent: number | undefined = undefined;

      for (const token of tokens) {
        const trimmedToken = token.trim();
        const colonIndex = trimmedToken.indexOf(':');
        if (colonIndex === -1) continue;

        const key = trimmedToken.substring(0, colonIndex).toUpperCase().trim();
        const value = trimmedToken.substring(colonIndex + 1).trim();

        if (key === 'DISTANCE') {
          const num = parseFloat(value);
          if (!isNaN(num) && num >= 0) {
            distanceCm = num;
          }
        } else if (key === 'LEVEL') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            levelPercent = Math.max(0, Math.min(100, num));
          }
        } else if (key === 'MOTOR') {
          motorRunning = value.toUpperCase() === 'ON';
        } else if (key === 'TARGET') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            targetPercent = Math.max(1, Math.min(95, num));
          }
        }
      }

      // Arduino LEVEL is mandatory for authoritative tank monitoring
      if (levelPercent !== undefined) {
        return {
          type: 'LIVE_DATA',
          distanceCm,
          levelPercent,
          motorRunning: motorRunning ?? false,
          targetPercent: targetPercent ?? 80.0,
          raw,
        };
      }
    } catch {
      // Safe fallback on unexpected string manipulation error
    }

    return { type: 'UNKNOWN', raw };
  }

  /**
   * Parse STATUS response payload
   */
  private static parseStatusPayload(payload: string, raw: string): ParsedStatus | ParsedUnknown {
    try {
      const tokens = payload.split(',');
      let emptyDistanceCm: number | undefined = undefined;
      let fullDistanceCm: number | undefined = undefined;
      let levelPercent: number | undefined = undefined;
      let targetPercent: number | undefined = undefined;
      let motorRunning: boolean | undefined = undefined;

      for (const token of tokens) {
        const trimmed = token.trim();
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) continue;

        const key = trimmed.substring(0, colonIdx).toUpperCase().trim();
        const val = trimmed.substring(colonIdx + 1).trim();

        if (key === 'EMPTY') {
          const num = parseFloat(val);
          if (!isNaN(num)) emptyDistanceCm = num;
        } else if (key === 'FULL') {
          const num = parseFloat(val);
          if (!isNaN(num)) fullDistanceCm = num;
        } else if (key === 'LEVEL') {
          const num = parseFloat(val);
          if (!isNaN(num)) levelPercent = num;
        } else if (key === 'TARGET') {
          const num = parseFloat(val);
          if (!isNaN(num)) targetPercent = num;
        } else if (key === 'MOTOR') {
          motorRunning = val.toUpperCase() === 'ON';
        }
      }

      return {
        type: 'STATUS',
        emptyDistanceCm,
        fullDistanceCm,
        levelPercent,
        targetPercent,
        motorRunning,
        raw,
      };
    } catch {
      return { type: 'UNKNOWN', raw };
    }
  }
}
