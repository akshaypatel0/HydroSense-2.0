/**
 * HYDROSENSE - Localization Service
 * Supporting English (EN) and Gujarati (ગુજરાતી)
 */

export const STRINGS = {
  en: {
    // Brand
    appName: 'HYDROSENSE',
    appSubtitle: 'Smart Water Tank',
    tankTitle: 'Water Level',
    awaitingData: 'Awaiting Arduino Telemetry...',
    notConnected: 'Disconnected',
    connectToView: 'Connect to Bluetooth to view live water level',

    // Calibration
    sensorCalibration: 'Sensor Calibration',
    sensorCalibrationDesc: 'Ultrasonic benchmark points for 0% and 100% tank scaling',
    currentDistance: 'Current Distance',
    emptyPoint: 'EMPTY POINT',
    fullPoint: 'FULL POINT',
    setEmpty: 'SET EMPTY',
    setFull: 'SET FULL',
    calibrated: '✓ Calibrated',
    notCalibrated: 'Not calibrated',
    calibrating: 'Calibrating...',
    pleaseWait: 'Please wait for Arduino confirmation',
    emptyCalibrated: '✓ Empty point calibrated',
    fullCalibrated: '✓ Full point calibrated',
    confirmEmptyTitle: 'Calibrate Empty Tank?',
    confirmEmptyMsg: 'Make sure the tank is completely empty before continuing.',
    confirmFullTitle: 'Calibrate Full Tank?',
    confirmFullMsg: 'Fill the tank to the desired 100% level before continuing.',
    cancel: 'Cancel',
    emptyFailed: 'Empty calibration failed. Please try again.',
    fullFailed: 'Full calibration failed. Please try again.',
    btDisconnected: 'Bluetooth disconnected. Please reconnect to HydroSense.',
    calibrationStatus: 'Calibration Status',
    howItWorks: 'How Calibration Works',
    howItWorksDesc: 'The ultrasonic sensor measures the physical distance from sensor head to water surface. Calibrating Empty and Full points establishes the precise 0% to 100% physical scaling in the Arduino Mega EEPROM/firmware.',
    back: 'Back to Settings',
    refreshStatus: 'Refresh Status',

    // Themes & Settings
    theme: 'Theme',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    language: 'Language',
    english: 'English',
    gujarati: 'ગુજરાતી',
  },
  gu: {
    // Brand
    appName: 'હાઈડ્રોસેન્સ',
    appSubtitle: 'સ્માર્ટ વોટર ટેન્ક',
    tankTitle: 'પાણીનું સ્તર',
    awaitingData: 'આર્ડ્યુનો ડેટાની રાહ જોઈ રહ્યા છીએ...',
    notConnected: 'ડિસ્કનેક્ટ થયેલ',
    connectToView: 'લાઇવ પાણીનું સ્તર જોવા બ્લૂટૂથ કનેક્ટ કરો',

    // Calibration
    sensorCalibration: 'સેન્સર કેલિબ્રેશન',
    sensorCalibrationDesc: '૦% અને ૧૦૦% ટાંકી સ્કેલિંગ માટે અલ્ટ્રાસોનિક બેન્ચમાર્ક',
    currentDistance: 'હાલનું અંતર',
    emptyPoint: 'ખાલી સ્તર (EMPTY)',
    fullPoint: 'ભરેલું સ્તર (FULL)',
    setEmpty: 'ખાલી સ્તર સેટ કરો',
    setFull: 'ભરેલું સ્તર સેટ કરો',
    calibrated: '✓ કેલિબ્રેટ થયેલ છે',
    notCalibrated: 'કેલિબ્રેટ થયેલ નથી',
    calibrating: 'કેલિબ્રેટ થઈ રહ્યું છે...',
    pleaseWait: 'કૃપા કરીને આર્ડ્યુનો પુષ્ટિની રાહ જુઓ',
    emptyCalibrated: '✓ ખાલી સ્તર કેલિબ્રેટ થયું',
    fullCalibrated: '✓ ભરેલું સ્તર કેલિબ્રેટ થયું',
    confirmEmptyTitle: 'ખાલી ટાંકી કેલિબ્રેટ કરવી છે?',
    confirmEmptyMsg: 'આગળ વધતા પહેલા ખાતરી કરો કે ટાંકી સંપૂર્ણપણે ખાલી છે.',
    confirmFullTitle: 'ભરેલી ટાંકી કેલિબ્રેટ કરવી છે?',
    confirmFullMsg: 'આગળ વધતા પહેલા ટાંકીને ઇચ્છિત 100% સ્તર સુધી ભરો.',
    cancel: 'રદ કરો',
    emptyFailed: 'ખાલી સ્તર કેલિબ્રેશન નિષ્ફળ થયું. ફરી પ્રયાસ કરો.',
    fullFailed: 'ભરેલું સ્તર કેલિબ્રેશન નિષ્ફળ થયું. ફરી પ્રયાસ કરો.',
    btDisconnected: 'બ્લૂટૂથ ડિસ્કનેક્ટ થયું છે. હાઈડ્રોસેન્સ સાથે ફરી કનેક્ટ કરો.',
    calibrationStatus: 'કેલિબ્રેશન સ્થિતિ',
    howItWorks: 'કેલિબ્રેશન કેવી રીતે કાર્ય કરે છે',
    howItWorksDesc: 'અલ્ટ્રાસોનિક સેન્સર સેન્સરથી પાણીની સપાટી વચ્ચેનું ભૌતિક અંતર માપે છે. ખાલી અને ભરેલા પોઈન્ટ સેટ કરવાથી આર્ડ્યુનો મેગામાં 0% થી 100% ની ચોક્કસ ગણતરી થાય છે.',
    back: 'સેટિંગ્સ પર પાછા',
    refreshStatus: 'સ્થિતિ તાજી કરો',

    // Themes & Settings
    theme: 'થીમ',
    lightTheme: 'લાઇટ થીમ',
    darkTheme: 'ડાર્ક થીમ',
    language: 'ભાષા',
    english: 'English',
    gujarati: 'ગુજરાતી',
  },
};
