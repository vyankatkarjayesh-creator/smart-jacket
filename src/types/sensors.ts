export type WorkerStatus = 'SAFE' | 'WARNING' | 'DANGER' | 'OFFLINE';

export type MotionType = 'Walking' | 'Running' | 'Idle' | 'Fall Detected';

export interface WorkerProfile {
  id: string;
  name: string;
  avatar: string;
  workerId: string;
  department: string;
  site: string;
  shift: string;
  jacketId: string;
  batteryLevel: number;
  signalStrength: number; // dBm
  emergencyContact: string;
  bloodType: string;
}

export interface SensorData {
  latitude: number;
  longitude: number;
  humidity: number; // %
  temperature: number; // °C
  gasLevel: number; // ppm (CO / Methane)
  heartRate: number; // bpm
  spO2: number; // %
  motion: MotionType;
  faultStatus: {
    hasFault: boolean;
    sensorOk: boolean;
    batteryOk: boolean;
    connectionOk: boolean;
    message: string;
  };
  timestamp: number;
  safetyScore: number;
  status: WorkerStatus;
}

export interface Thresholds {
  tempWarning: number; // 38
  tempDanger: number; // 45
  humidityWarning: number; // 80
  gasWarning: number; // 50
  gasDanger: number; // 100
  hrLowWarning: number; // 50
  hrHighWarning: number; // 120
  hrDanger: number; // 150
  spo2Warning: number; // 94
  spo2Danger: number; // 90
}

export interface AlertItem {
  id: string;
  workerId: string;
  workerName: string;
  timestamp: string;
  sensor: string;
  value: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
  acknowledged: boolean;
  dismissed: boolean;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  temperature: number;
  humidity: number;
  gasLevel: number;
  heartRate: number;
  spO2: number;
  motion: MotionType;
  safetyScore: number;
  status: WorkerStatus;
  triggeredAlert?: string;
  latitude: number;
  longitude: number;
}

export type ScenarioType = 'normal' | 'gas_leak' | 'fall_detected' | 'high_temperature' | 'low_spo2';
