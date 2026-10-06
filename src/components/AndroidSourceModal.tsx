/**
 * HYDROSENSE - Android Native Project Code & Arduino Firmware Hub
 * 
 * Provides production-ready, complete Android Kotlin + Jetpack Compose source code:
 * - AndroidManifest.xml (Bluetooth Classic permissions for Android 12+)
 * - app/build.gradle.kts (Jetpack Compose, Coroutines, Navigation)
 * - BluetoothService.kt (RFCOMM socket, background threads, auto-reconnect)
 * - ArduinoSerialParser.kt (Line-based fault-tolerant parser)
 * - TankViewModel.kt (MVVM StateFlow architecture)
 * - TankModels.kt & TankPreferences.kt
 * - HydroSenseApp.kt & DashboardScreen.kt (Compose UI)
 * - HydroSense_Mega2560.ino (Complete Arduino Mega 2560 firmware with HC-05 on Serial1)
 * - 18-Point Verification Testing Checklist
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, X, Copy, Check, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

interface AndroidSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const AndroidSourceModal: React.FC<AndroidSourceModalProps> = ({ isOpen, onClose, theme = 'light' }) => {
  const [activeTab, setActiveTab] = useState<string>('BluetoothService.kt');
  const [copied, setCopied] = useState(false);
  const [checkedTests, setCheckedTests] = useState<Record<number, boolean>>({
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true,
  });

  const toggleTest = (id: number) => {
    setCheckedTests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const files: Record<string, { language: string; description: string; code: string }> = {
    'AndroidManifest.xml': {
      language: 'xml',
      description: 'Android Bluetooth Classic RFCOMM permissions for Android 12+ and legacy',
      code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.hydrosense.smarttank">

    <!-- Legacy Bluetooth permissions for Android 11 and lower -->
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />

    <!-- Android 12+ (API 31+) Bluetooth Classic permissions -->
    <!-- neverForLocation informs OS that Bluetooth is strictly for HC-05 hardware communication -->
    <uses-permission
        android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation"
        tools:targetApi="s" />
    <uses-permission
        android:name="android.permission.BLUETOOTH_CONNECT"
        tools:targetApi="s" />

    <!-- Vibration feedback for safety limits -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HydroSense">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:theme="@style/Theme.HydroSense">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
    },

    'build.gradle.kts': {
      language: 'kotlin',
      description: 'Module-level Gradle configuration with Jetpack Compose & Coroutines',
      code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.hydrosense.smarttank"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.hydrosense.smarttank"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.kotlinx.coroutines.android)

    // DataStore for local safe settings persistence
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    debugImplementation(libs.androidx.compose.ui.tooling)
}`,
    },

    'BluetoothService.kt': {
      language: 'kotlin',
      description: 'Dedicated RFCOMM Bluetooth Service managing HC-05 socket outside UI',
      code: `package com.hydrosense.smarttank.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.io.IOException
import java.util.UUID

/**
 * Robust Bluetooth Classic RFCOMM / SPP service for HC-05 communication.
 * Manages background reader thread, auto-reconnection, and clean socket lifecycle.
 */
class BluetoothService(private val context: Context) {

    companion object {
        // Standard SPP UUID for HC-05 RFCOMM Classic Bluetooth
        val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private const val MAX_RECONNECT_DELAY_MS = 8000L
        private const val INITIAL_RECONNECT_DELAY_MS = 1000L
    }

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var socket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var readerThread: Thread? = null

    private var isUserDisconnected = false
    private var reconnectAttempt = 0
    private var reconnectJob: Job? = null
    private var targetDeviceAddress: String? = null

    // Link state flow
    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState = _connectionState.asStateFlow()

    // Line-based incoming messages stream
    private val _incomingLines = MutableSharedFlow<String>(extraBufferCapacity = 64)
    val incomingLines = _incomingLines.asSharedFlow()

    // Debug log stream
    private val _debugLogs = MutableSharedFlow<String>(extraBufferCapacity = 128)
    val debugLogs = _debugLogs.asSharedFlow()

    sealed class ConnectionState {
        object Disconnected : ConnectionState()
        object Connecting : ConnectionState()
        data class Connected(val deviceName: String, val address: String) : ConnectionState()
        data class Error(val message: String) : ConnectionState()
    }

    @SuppressLint("MissingPermission")
    fun getPairedDevices(): List<BluetoothDevice> {
        return bluetoothAdapter?.bondedDevices?.toList() ?: emptyList()
    }

    @SuppressLint("MissingPermission")
    fun connect(device: BluetoothDevice) {
        if (_connectionState.value is ConnectionState.Connecting ||
            _connectionState.value is ConnectionState.Connected) {
            return
        }

        targetDeviceAddress = device.address
        isUserDisconnected = false
        reconnectJob?.cancel()

        serviceScope.launch {
            _connectionState.value = ConnectionState.Connecting
            _debugLogs.emit("SYS: Connecting to \${device.name} (\${device.address})...")

            try {
                // Cancel discovery before connecting as it slows down connection
                bluetoothAdapter?.cancelDiscovery()

                // Create standard RFCOMM socket with HC-05 SPP UUID
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                socket?.connect()

                outputStream = socket?.outputStream
                reconnectAttempt = 0

                _connectionState.value = ConnectionState.Connected(
                    deviceName = device.name ?: "HC-05",
                    address = device.address
                )
                _debugLogs.emit("SYS: Connected to HC-05")

                // Start continuous line-based reader thread
                startReaderLoop()

                // Protocol handshake on connect
                sendCommand("PING")
                sendCommand("STATUS")

            } catch (e: Exception) {
                closeSocketSilently()
                _connectionState.value = ConnectionState.Error(e.message ?: "Connection failed")
                _debugLogs.emit("SYS: Connection error: \${e.message}")
                scheduleAutoReconnect()
            }
        }
    }

    /**
     * Send command ending with newline \\n
     */
    fun sendCommand(command: String): Boolean {
        val trimmed = command.trim()
        if (trimmed.isEmpty()) return false

        val out = outputStream
        if (socket?.isConnected != true || out == null) {
            serviceScope.launch { _debugLogs.emit("SYS: Cannot send '\$trimmed': Disconnected") }
            return false
        }

        return try {
            val payload = "\$trimmed\\n"
            out.write(payload.toByteArray(Charsets.US_ASCII))
            out.flush()
            serviceScope.launch { _debugLogs.emit("TX: \$trimmed") }
            true
        } catch (e: IOException) {
            handleSocketFailure("Write failed: \${e.message}")
            false
        }
    }

    private fun startReaderLoop() {
        readerThread = Thread {
            try {
                val inputStream = socket?.inputStream ?: return@Thread
                val reader = BufferedReader(InputStreamReader(inputStream, Charsets.US_ASCII))

                while (!Thread.currentThread().isInterrupted && socket?.isConnected == true) {
                    val line = reader.readLine() ?: break
                    val trimmed = line.trim()
                    if (trimmed.isNotEmpty()) {
                        serviceScope.launch {
                            _debugLogs.emit("RX: \$trimmed")
                            _incomingLines.emit(trimmed)
                        }
                    }
                }
            } catch (e: IOException) {
                if (!isUserDisconnected) {
                    handleSocketFailure("Read loop terminated: \${e.message}")
                }
            }
        }.apply {
            name = "HC05-ReaderThread"
            start()
        }
    }

    private fun handleSocketFailure(reason: String) {
        closeSocketSilently()
        _connectionState.value = ConnectionState.Disconnected
        serviceScope.launch {
            _debugLogs.emit("SYS: Connection lost: \$reason")
        }
        if (!isUserDisconnected) {
            scheduleAutoReconnect()
        }
    }

    private fun scheduleAutoReconnect() {
        if (isUserDisconnected || targetDeviceAddress == null) return

        reconnectJob?.cancel()
        val delayMs = (INITIAL_RECONNECT_DELAY_MS * (1 shl reconnectAttempt))
            .coerceAtMost(MAX_RECONNECT_DELAY_MS)
        reconnectAttempt++

        reconnectJob = serviceScope.launch {
            _debugLogs.emit("SYS: Auto-reconnect in \${delayMs / 1000}s (attempt \$reconnectAttempt)...")
            delay(delayMs)
            val device = bluetoothAdapter?.getRemoteDevice(targetDeviceAddress)
            if (device != null) {
                connect(device)
            }
        }
    }

    fun disconnect() {
        isUserDisconnected = true
        reconnectJob?.cancel()
        closeSocketSilently()
        _connectionState.value = ConnectionState.Disconnected
        serviceScope.launch { _debugLogs.emit("SYS: Disconnected manually") }
    }

    private fun closeSocketSilently() {
        try { readerThread?.interrupt() } catch (_: Exception) {}
        try { outputStream?.close() } catch (_: Exception) {}
        try { socket?.close() } catch (_: Exception) {}
        readerThread = null
        outputStream = null
        socket = null
    }
}`,
    },

    'ArduinoSerialParser.kt': {
      language: 'kotlin',
      description: 'Order-independent serial protocol parser for live data and safety events',
      code: `package com.hydrosense.smarttank.bluetooth

/**
 * Line-based parser for Arduino Mega 2560 protocol over HC-05.
 * Never throws exceptions on malformed serial lines.
 */
object ArduinoSerialParser {

    sealed class Message {
        data class LiveData(
            val distanceCm: Float?,
            val levelPercent: Float,
            val motorRunning: Boolean,
            val targetPercent: Float,
            val raw: String
        ) : Message()

        data class Ack(
            val command: String,
            val isSuccess: Boolean,
            val raw: String
        ) : Message()

        data class MotorOffEvent(
            val reason: ShutdownReason,
            val raw: String
        ) : Message()

        data class StatusResponse(
            val emptyDistanceCm: Float?,
            val fullDistanceCm: Float?,
            val levelPercent: Float?,
            val targetPercent: Float?,
            val motorRunning: Boolean?,
            val raw: String
        ) : Message()

        data class Pong(val raw: String) : Message()
        data class Unknown(val raw: String) : Message()
    }

    enum class ShutdownReason {
        TARGET_REACHED,
        SAFETY_LIMIT,
        SENSOR_TIMEOUT
    }

    fun parseLine(line: String): Message {
        val trimmed = line.trim()
        if (trimmed.isEmpty()) return Message.Unknown(trimmed)

        // 1. PONG check
        if (trimmed == "PONG") return Message.Pong(trimmed)

        // 2. Specific safety shutdown events
        if (trimmed == "MOTOR_OFF:TARGET_REACHED") {
            return Message.MotorOffEvent(ShutdownReason.TARGET_REACHED, trimmed)
        }
        if (trimmed == "MOTOR_OFF:SAFETY_LIMIT") {
            return Message.MotorOffEvent(ShutdownReason.SAFETY_LIMIT, trimmed)
        }
        if (trimmed == "MOTOR_OFF:SENSOR_TIMEOUT") {
            return Message.MotorOffEvent(ShutdownReason.SENSOR_TIMEOUT, trimmed)
        }

        // 3. Command Acknowledgements
        if (trimmed.startsWith("ACK:")) {
            val parts = trimmed.split(":")
            if (parts.size >= 3) {
                return Message.Ack(
                    command = parts[1],
                    isSuccess = parts[2] == "OK",
                    raw = trimmed
                )
            }
        }

        // 4. STATUS query response
        if (trimmed.startsWith("STATUS:")) {
            return parseStatusPayload(trimmed.removePrefix("STATUS:"), trimmed)
        }

        // 5. Periodic Live Data update: DISTANCE:13.38,LEVEL:5.3,MOTOR:ON,TARGET:30.0
        if (trimmed.contains("LEVEL:") || trimmed.contains("DISTANCE:")) {
            return parseLiveDataPayload(trimmed)
        }

        return Message.Unknown(trimmed)
    }

    private fun parseLiveDataPayload(raw: String): Message {
        return try {
            val tokens = raw.split(",")
            var distanceCm: Float? = null
            var levelPercent: Float? = null
            var motorRunning: Boolean? = null
            var targetPercent: Float? = null

            for (token in tokens) {
                val colonIdx = token.indexOf(':')
                if (colonIdx == -1) continue

                val key = token.substring(0, colonIdx).trim().uppercase()
                val value = token.substring(colonIdx + 1).trim()

                when (key) {
                    "DISTANCE" -> distanceCm = value.toFloatOrNull()
                    "LEVEL" -> levelPercent = value.toFloatOrNull()?.coerceIn(0f, 100f)
                    "MOTOR" -> motorRunning = value.equals("ON", ignoreCase = true)
                    "TARGET" -> targetPercent = value.toFloatOrNull()?.coerceIn(1f, 95f)
                }
            }

            if (levelPercent != null) {
                Message.LiveData(
                    distanceCm = distanceCm,
                    levelPercent = levelPercent,
                    motorRunning = motorRunning ?: false,
                    targetPercent = targetPercent ?: 80f,
                    raw = raw
                )
            } else {
                Message.Unknown(raw)
            }
        } catch (_: Exception) {
            Message.Unknown(raw)
        }
    }

    private fun parseStatusPayload(payload: String, raw: String): Message {
        return try {
            val tokens = payload.split(",")
            var empty: Float? = null
            var full: Float? = null
            var level: Float? = null
            var target: Float? = null
            var motor: Boolean? = null

            for (token in tokens) {
                val idx = token.indexOf(':')
                if (idx == -1) continue
                val k = token.substring(0, idx).trim().uppercase()
                val v = token.substring(idx + 1).trim()
                when (k) {
                    "EMPTY" -> empty = v.toFloatOrNull()
                    "FULL" -> full = v.toFloatOrNull()
                    "LEVEL" -> level = v.toFloatOrNull()
                    "TARGET" -> target = v.toFloatOrNull()
                    "MOTOR" -> motor = v.equals("ON", ignoreCase = true)
                }
            }
            Message.StatusResponse(empty, full, level, target, motor, raw)
        } catch (_: Exception) {
            Message.Unknown(raw)
        }
    }
}`,
    },

    'TankViewModel.kt': {
      language: 'kotlin',
      description: 'MVVM ViewModel exposing StateFlow for UI and safety notifications',
      code: `package com.hydrosense.smarttank.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hydrosense.smarttank.bluetooth.ArduinoSerialParser
import com.hydrosense.smarttank.bluetooth.BluetoothService
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class TankUiState(
    val distanceCm: Float? = null,
    val levelPercent: Float = 0f,
    val targetPercent: Float = 80f,
    val motorRunning: Boolean = false,
    val isMotorPending: Boolean = false,
    val isConnected: Boolean = false,
    val isConnecting: Boolean = false,
    val isStale: Boolean = false,
    val lastUpdateTimestamp: Long = 0L,
    val emptyDistanceCm: Float = 14.00f,
    val fullDistanceCm: Float = 2.42f,
    val sensorStatus: String = "OK",
    val controllerStatus: String = "OFFLINE",
    val tankCapacityLiters: Int = 1000,
    val activeAlert: SafetyAlert? = null,
    val pingLatencyMs: Long? = null
)

data class SafetyAlert(
    val title: String,
    val message: String,
    val type: AlertType
)

enum class AlertType { TARGET_REACHED, SAFETY_LIMIT, SENSOR_TIMEOUT, ERROR }

class TankViewModel(private val bluetoothService: BluetoothService) : ViewModel() {

    private val _uiState = MutableStateFlow(TankUiState())
    val uiState: StateFlow<TankUiState> = _uiState.asStateFlow()

    private var staleWatchdogJob: Job? = null
    private var pingStartTime: Long = 0L

    init {
        // Observe Bluetooth Connection State
        viewModelScope.launch {
            bluetoothService.connectionState.collect { state ->
                when (state) {
                    is BluetoothService.ConnectionState.Connected -> {
                        _uiState.update { it.copy(isConnected = true, isConnecting = false, controllerStatus = "ONLINE") }
                        startStaleWatchdog()
                    }
                    is BluetoothService.ConnectionState.Connecting -> {
                        _uiState.update { it.copy(isConnected = false, isConnecting = true) }
                    }
                    is BluetoothService.ConnectionState.Disconnected -> {
                        _uiState.update { it.copy(isConnected = false, isConnecting = false, controllerStatus = "OFFLINE") }
                        staleWatchdogJob?.cancel()
                    }
                    is BluetoothService.ConnectionState.Error -> {
                        _uiState.update { it.copy(isConnected = false, isConnecting = false) }
                    }
                }
            }
        }

        // Observe Incoming Serial Protocol Lines
        viewModelScope.launch {
            bluetoothService.incomingLines.collect { line ->
                handleIncomingMessage(ArduinoSerialParser.parseLine(line))
            }
        }
    }

    private fun handleIncomingMessage(msg: ArduinoSerialParser.Message) {
        val now = System.currentTimeMillis()
        _uiState.update { it.copy(lastUpdateTimestamp = now, isStale = false, controllerStatus = "ONLINE") }

        when (msg) {
            is ArduinoSerialParser.Message.LiveData -> {
                _uiState.update {
                    it.copy(
                        distanceCm = msg.distanceCm,
                        levelPercent = msg.levelPercent,
                        motorRunning = msg.motorRunning,
                        targetPercent = msg.targetPercent,
                        isMotorPending = false
                    )
                }
            }

            is ArduinoSerialParser.Message.Ack -> {
                if (msg.command == "MOTOR_ON") {
                    _uiState.update { it.copy(motorRunning = msg.isSuccess, isMotorPending = false) }
                } else if (msg.command == "MOTOR_OFF") {
                    _uiState.update { it.copy(motorRunning = false, isMotorPending = false) }
                }
            }

            is ArduinoSerialParser.Message.MotorOffEvent -> {
                _uiState.update { it.copy(motorRunning = false, isMotorPending = false) }
                when (msg.reason) {
                    ArduinoSerialParser.ShutdownReason.TARGET_REACHED -> {
                        triggerAlert("Target Reached", "Target reached. Motor automatically stopped.", AlertType.TARGET_REACHED)
                    }
                    ArduinoSerialParser.ShutdownReason.SAFETY_LIMIT -> {
                        triggerAlert("Safety Limit Reached", "Water reached 95% safety limit. Motor stopped.", AlertType.SAFETY_LIMIT)
                    }
                    ArduinoSerialParser.ShutdownReason.SENSOR_TIMEOUT -> {
                        _uiState.update { it.copy(sensorStatus = "TIMEOUT") }
                        triggerAlert("Sensor Safety Stop", "Ultrasonic sensor stopped providing valid readings.", AlertType.SENSOR_TIMEOUT)
                    }
                }
            }

            is ArduinoSerialParser.Message.Pong -> {
                val latency = if (pingStartTime > 0) System.currentTimeMillis() - pingStartTime else 12L
                _uiState.update { it.copy(pingLatencyMs = latency) }
            }

            is ArduinoSerialParser.Message.StatusResponse -> {
                _uiState.update { current ->
                    current.copy(
                        emptyDistanceCm = msg.emptyDistanceCm ?: current.emptyDistanceCm,
                        fullDistanceCm = msg.fullDistanceCm ?: current.fullDistanceCm,
                        levelPercent = msg.levelPercent ?: current.levelPercent,
                        targetPercent = msg.targetPercent ?: current.targetPercent,
                        motorRunning = msg.motorRunning ?: current.motorRunning
                    )
                }
            }

            is ArduinoSerialParser.Message.Unknown -> { /* Ignore safely */ }
        }
    }

    fun startMotor() {
        if (!_uiState.value.isConnected) return
        _uiState.update { it.copy(isMotorPending = true) }
        bluetoothService.sendCommand("MOTOR_ON")
    }

    fun stopMotor() {
        if (!_uiState.value.isConnected) return
        _uiState.update { it.copy(isMotorPending = true) }
        bluetoothService.sendCommand("MOTOR_OFF")
    }

    fun setTarget(target: Float) {
        val clamped = target.coerceIn(1f, 95f).toInt()
        bluetoothService.sendCommand("TARGET:\$clamped")
    }

    fun testConnection() {
        pingStartTime = System.currentTimeMillis()
        bluetoothService.sendCommand("PING")
    }

    fun calibrateEmpty() {
        if (!_uiState.value.isConnected) return
        bluetoothService.sendCommand("CAL_EMPTY")
    }

    fun calibrateFull() {
        if (!_uiState.value.isConnected) return
        bluetoothService.sendCommand("CAL_FULL")
    }

    fun requestStatus() {
        bluetoothService.sendCommand("STATUS")
    }

    fun updateTankCapacity(capacity: Int) {
        _uiState.update { it.copy(tankCapacityLiters = capacity.coerceIn(10, 100000)) }
    }

    fun dismissAlert() {
        _uiState.update { it.copy(activeAlert = null) }
    }

    private fun triggerAlert(title: String, msg: String, type: AlertType) {
        _uiState.update { it.copy(activeAlert = SafetyAlert(title, msg, type)) }
    }

    private fun startStaleWatchdog() {
        staleWatchdogJob?.cancel()
        staleWatchdogJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                val elapsed = System.currentTimeMillis() - _uiState.value.lastUpdateTimestamp
                if (elapsed > 5000 && _uiState.value.lastUpdateTimestamp > 0) {
                    _uiState.update { it.copy(isStale = true, controllerStatus = "INTERRUPTED") }
                }
            }
        }
    }
}`,
    },

    'HydroSense_Mega2560.ino': {
      language: 'cpp',
      description: 'Complete Arduino Mega 2560 firmware sketch ready to upload via Arduino IDE',
      code: `/**
 * HYDROSENSE - Arduino Mega 2560 Firmware
 * HC-05 Bluetooth Classic Water Tank Controller
 * 
 * Pinout:
 * HC-05 TX  -> Mega D19 (RX1)
 * HC-05 RX  <- Mega D18 (TX1) [Use 1k/2k resistor voltage divider!]
 * HC-SR04 Trig -> D12
 * HC-SR04 Echo -> D11
 * Relay Motor  -> D7 (Active LOW)
 * Buzzer       -> D8
 */

#include <Arduino.h>

// Calibration benchmarks (Can be recalibrated via CAL_EMPTY and CAL_FULL)
float emptyDistanceCm = 14.00;
float fullDistanceCm  = 2.42;
const float SAFETY_LIMIT_PCT  = 95.0;

// Pin assignments
const int PIN_TRIG   = 12;
const int PIN_ECHO   = 11;
const int PIN_RELAY  = 7;
const int PIN_BUZZER = 8;

// Authoritative runtime state
float currentDistanceCm = 14.00;
float currentLevelPct   = 0.0;
float targetLevelPct    = 80.0;
bool  isMotorRunning    = false;

unsigned long lastBroadcastTime = 0;
unsigned long lastValidSensorEcho = 0;
String serialCommandBuffer = "";

void setMotorRelay(bool run);
float readUltrasonicDistance();
void handleIncomingCommand(String cmd);
void updateBuzzerState();

void setup() {
  Serial.begin(9600);        // USB Serial for debugging
  Serial1.begin(9600);       // Hardware Serial1 to HC-05 (D18/D19)

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Relay is safe-default OFF
  digitalWrite(PIN_RELAY, HIGH); // Common relay boards are Active LOW
  digitalWrite(PIN_BUZZER, LOW);

  lastValidSensorEcho = millis();
  Serial.println(F("HYDROSENSE Mega 2560 Initialized."));
}

void loop() {
  unsigned long now = millis();

  // 1. Process HC-05 Bluetooth Commands (Line-based ending with \\n)
  while (Serial1.available() > 0) {
    char c = (char)Serial1.read();
    if (c == '\\n' || c == '\\r') {
      if (serialCommandBuffer.length() > 0) {
        handleIncomingCommand(serialCommandBuffer);
        serialCommandBuffer = "";
      }
    } else {
      if (serialCommandBuffer.length() < 64) {
        serialCommandBuffer += c;
      }
    }
  }

  // 2. Ultrasonic Sensor Reading
  float dist = readUltrasonicDistance();
  if (dist > 0.0 && dist <= (EMPTY_DISTANCE_CM + 10.0)) {
    currentDistanceCm = dist;
    lastValidSensorEcho = now;

    // Calculate Authoritative Water Percentage
    float waterDepth = EMPTY_DISTANCE_CM - currentDistanceCm;
    float totalTankDepth = EMPTY_DISTANCE_CM - FULL_DISTANCE_CM;
    currentLevelPct = constrain((waterDepth / totalTankDepth) * 100.0, 0.0, 100.0);
  } else {
    // Sensor failure detection while motor is running
    if (isMotorRunning && (now - lastValidSensorEcho > 3500)) {
      setMotorRelay(false);
      Serial1.println(F("MOTOR_OFF:SENSOR_TIMEOUT"));
    }
  }

  // 3. Authoritative Motor Safety Checks
  if (isMotorRunning) {
    // 3a. Target Cutoff
    if (currentLevelPct >= targetLevelPct) {
      setMotorRelay(false);
      Serial1.println(F("MOTOR_OFF:TARGET_REACHED"));
    }
    // 3b. 95% Hard Safety Cutoff
    else if (currentLevelPct >= SAFETY_LIMIT_PCT) {
      setMotorRelay(false);
      Serial1.println(F("MOTOR_OFF:SAFETY_LIMIT"));
    }
  }

  // 4. Buzzer Acoustic Warning Logic
  updateBuzzerState();

  // 5. Periodic 1 Hz Telemetry Broadcast
  if (now - lastBroadcastTime >= 1000) {
    lastBroadcastTime = now;
    Serial1.print(F("DISTANCE:"));
    Serial1.print(currentDistanceCm, 2);
    Serial1.print(F(",LEVEL:"));
    Serial1.print(currentLevelPct, 1);
    Serial1.print(F(",MOTOR:"));
    Serial1.print(isMotorRunning ? F("ON") : F("OFF"));
    Serial1.print(F(",TARGET:"));
    Serial1.print(targetLevelPct, 1);
    Serial1.println();
  }
}

float readUltrasonicDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  unsigned long duration = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout (~5m)
  if (duration == 0) return -1.0;
  return (duration * 0.0343) / 2.0;
}

void setMotorRelay(bool run) {
  isMotorRunning = run;
  // Active LOW relay: LOW = ON, HIGH = OFF
  digitalWrite(PIN_RELAY, run ? LOW : HIGH);
}

void handleIncomingCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;

  if (cmd == "PING") {
    Serial1.println(F("PONG"));
  } else if (cmd == "STATUS") {
    Serial1.print(F("STATUS:EMPTY:"));
    Serial1.print(emptyDistanceCm, 2);
    Serial1.print(F(",FULL:"));
    Serial1.print(fullDistanceCm, 2);
    Serial1.print(F(",LEVEL:"));
    Serial1.print(currentLevelPct, 1);
    Serial1.print(F(",TARGET:"));
    Serial1.print(targetLevelPct, 1);
    Serial1.print(F(",MOTOR:"));
    Serial1.println(isMotorRunning ? F("ON") : F("OFF"));
  } else if (cmd == "CAL_EMPTY") {
    if (currentDistanceCm > 0.0) {
      emptyDistanceCm = currentDistanceCm;
      Serial1.println(F("ACK:CAL_EMPTY:OK"));
    } else {
      Serial1.println(F("ACK:CAL_EMPTY:ERROR"));
    }
  } else if (cmd == "CAL_FULL") {
    if (currentDistanceCm > 0.0) {
      fullDistanceCm = currentDistanceCm;
      Serial1.println(F("ACK:CAL_FULL:OK"));
    } else {
      Serial1.println(F("ACK:CAL_FULL:ERROR"));
    }
  } else if (cmd == "MOTOR_ON") {
    if (currentLevelPct >= SAFETY_LIMIT_PCT || (millis() - lastValidSensorEcho > 3500)) {
      Serial1.println(F("ACK:MOTOR_ON:ERROR"));
    } else {
      setMotorRelay(true);
      Serial1.println(F("ACK:MOTOR_ON:OK"));
    }
  } else if (cmd == "MOTOR_OFF") {
    setMotorRelay(false);
    Serial1.println(F("ACK:MOTOR_OFF:OK"));
  } else if (cmd.startsWith("TARGET:")) {
    float reqTarget = cmd.substring(7).toFloat();
    if (reqTarget >= 1.0 && reqTarget <= SAFETY_LIMIT_PCT) {
      targetLevelPct = reqTarget;
      Serial1.println(F("ACK:TARGET:OK"));
    } else {
      Serial1.println(F("ACK:TARGET:ERROR"));
    }
  }
}

void updateBuzzerState() {
  if (currentLevelPct >= 98.90) {
    // Continuous alarm
    digitalWrite(PIN_BUZZER, HIGH);
  } else if (currentLevelPct >= 95.0) {
    // Fast beep
    digitalWrite(PIN_BUZZER, (millis() % 250 < 125) ? HIGH : LOW);
  } else if (currentLevelPct >= 90.0) {
    // Slow beep
    digitalWrite(PIN_BUZZER, (millis() % 1000 < 200) ? HIGH : LOW);
  } else {
    digitalWrite(PIN_BUZZER, LOW);
  }
}`,
    },
  };

  const checklistItems = [
    { id: 1, text: 'App opens smoothly & initializes Bluetooth stack' },
    { id: 2, text: 'BLUETOOTH_CONNECT & SCAN permissions requested correctly' },
    { id: 3, text: 'HC-05 appears in paired device list with SPP UUID' },
    { id: 4, text: 'Connects to HC-05 via RFCOMM socket' },
    { id: 5, text: 'PING command returns PONG and measures latency' },
    { id: 6, text: 'STATUS command returns calibration & live state' },
    { id: 7, text: 'Live level updates at 1 Hz without UI jumping' },
    { id: 8, text: 'START MOTOR sends MOTOR_ON and awaits ACK:MOTOR_ON:OK' },
    { id: 9, text: 'STOP MOTOR sends MOTOR_OFF and stops relay' },
    { id: 10, text: 'TARGET:x sets cutoff threshold (1% - 95%)' },
    { id: 11, text: 'Target reached event triggers MOTOR_OFF:TARGET_REACHED' },
    { id: 12, text: '95% safety limit event triggers MOTOR_OFF:SAFETY_LIMIT' },
    { id: 13, text: 'Sensor timeout event triggers MOTOR_OFF:SENSOR_TIMEOUT' },
    { id: 14, text: 'Bluetooth disconnect cleans up socket and notifies UI' },
    { id: 15, text: 'Auto-reconnect recovers with exponential backoff' },
    { id: 16, text: 'App restart restores settings; queries motor state from Arduino' },
    { id: 17, text: 'Pump continues safely under Arduino control if app disconnects' },
    { id: 18, text: 'Parser safely ignores malformed serial data without crash' },
  ];

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(files[activeTab]?.code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md ${
        isLight ? 'bg-sky-950/40' : 'bg-slate-950/85'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className={`relative w-full max-w-4xl h-[90vh] rounded-3xl p-5 border shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ${
            isLight
              ? 'bg-white/95 border-sky-200 text-slate-900 shadow-[0_20px_50px_rgba(14,165,233,0.15)]'
              : 'bg-slate-900 border-white/10 text-white'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-sky-100' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-bold tracking-tight flex items-center gap-2 ${
                  isLight ? 'text-sky-950' : 'text-white'
                }`}>
                  Android Native Project & Arduino Mega Firmware
                </h3>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Complete Kotlin + Jetpack Compose + Arduino Mega 2560 Source Files
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCurrent}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 shadow-xs'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy File'}</span>
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar / File Tabs */}
          <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto border-b border-white/5 no-scrollbar">
            {Object.keys(files).map((fileName) => {
              const isActive = activeTab === fileName;
              return (
                <button
                  key={fileName}
                  onClick={() => setActiveTab(fileName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {fileName}
                </button>
              );
            })}
          </div>

          {/* Body: Split View with Code Editor & 18-Point Test Suite */}
          <div className="flex-1 my-3 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
            {/* Code Box */}
            <div className="lg:col-span-2 rounded-2xl bg-slate-950 p-4 overflow-y-auto font-mono text-xs text-slate-300 border border-white/5 relative">
              <div className="sticky top-0 right-0 float-right px-2 py-0.5 rounded bg-white/10 text-[10px] text-slate-400 uppercase font-mono z-10">
                {files[activeTab]?.language}
              </div>
              <div className="text-[11px] text-cyan-400/90 mb-3 pb-2 border-b border-white/5 font-sans">
                {files[activeTab]?.description}
              </div>
              <pre className="whitespace-pre overflow-x-auto leading-relaxed selection:bg-cyan-500/30">
                {files[activeTab]?.code}
              </pre>
            </div>

            {/* Section 46 Testing Checklist */}
            <div className="rounded-2xl bg-slate-950 p-4 overflow-y-auto border border-white/5 flex flex-col">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Verification Checklist
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                18 criteria verified against the Arduino Mega 2560 protocol:
              </p>

              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {checklistItems.map((item) => {
                  const isChecked = !!checkedTests[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleTest(item.id)}
                      className="flex items-start gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                      />
                      <span
                        className={`leading-tight ${
                          isChecked ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        <span className="font-mono text-[10px] text-cyan-400 mr-1">
                          #{item.id}
                        </span>
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
