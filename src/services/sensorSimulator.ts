import { WorkerProfile, SensorData, Thresholds, ScenarioType, MotionType, WorkerStatus } from '../types/sensors';

export const DEFAULT_THRESHOLDS: Thresholds = {
  tempWarning: 38,
  tempDanger: 45,
  humidityWarning: 80,
  gasWarning: 50,
  gasDanger: 100,
  hrLowWarning: 50,
  hrHighWarning: 120,
  hrDanger: 150,
  spo2Warning: 94,
  spo2Danger: 90,
};

export const SAMPLE_WORKERS: WorkerProfile[] = [
  {
    id: 'w1',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    workerId: 'WK-8041',
    department: 'Chemical Refining',
    site: 'Sector 4 - Hydrocarbon Processing',
    shift: '08:00 - 16:00 (Day Shift)',
    jacketId: 'SJ-9021-Pro',
    batteryLevel: 94,
    signalStrength: -64,
    emergencyContact: '+1 (555) 439-0192 (Safety Ops)',
    bloodType: 'O+'
  },
  {
    id: 'w2',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    workerId: 'WK-8042',
    department: 'Blast Furnace Operations',
    site: 'Sector 2 - Thermal Smelting Hall',
    shift: '06:00 - 14:00 (Morning Shift)',
    jacketId: 'SJ-9022-Pro',
    batteryLevel: 88,
    signalStrength: -72,
    emergencyContact: '+1 (555) 231-9844 (Site Command)',
    bloodType: 'A+'
  },
  {
    id: 'w3',
    name: 'Liam Gallagher',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    workerId: 'WK-8043',
    department: 'Subterranean Logistics',
    site: 'Underground Tunnel Extraction B',
    shift: '14:00 - 22:00 (Evening Shift)',
    jacketId: 'SJ-9023-Pro',
    batteryLevel: 79,
    signalStrength: -81,
    emergencyContact: '+1 (555) 887-2190 (Dispatch)',
    bloodType: 'B+'
  },
  {
    id: 'w4',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    workerId: 'WK-8044',
    department: 'Pipeline Integrity & Gas Storage',
    site: 'Sector 7 - High-Pressure Cryo Vault',
    shift: '08:00 - 16:00 (Day Shift)',
    jacketId: 'SJ-9024-Pro',
    batteryLevel: 91,
    signalStrength: -59,
    emergencyContact: '+1 (555) 912-3401 (HazMat Desk)',
    bloodType: 'AB+'
  },
  {
    id: 'w5',
    name: 'David Kim',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    workerId: 'WK-8045',
    department: 'Structural High-Rigging',
    site: 'Tower Cranes & Outer Rigging 09',
    shift: '07:00 - 15:00 (Early Shift)',
    jacketId: 'SJ-9025-Pro',
    batteryLevel: 82,
    signalStrength: -68,
    emergencyContact: '+1 (555) 604-7128 (Rigging Super)',
    bloodType: 'O-'
  }
];

// Reference base coordinates for the industrial site (coordinates around a real industrial refinery complex)
const SITE_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  w1: { lat: 37.7785, lng: -122.4150 }, // Sector 4
  w2: { lat: 37.7812, lng: -122.4115 }, // Sector 2
  w3: { lat: 37.7740, lng: -122.4200 }, // Underground B
  w4: { lat: 37.7762, lng: -122.4105 }, // Gas storage
  w5: { lat: 37.7830, lng: -122.4180 }  // High rigging
};

/**
 * AI-Style Rule Engine to evaluate sensor safety metrics
 */
export function evaluateWorkerSafety(
  sensors: Omit<SensorData, 'safetyScore' | 'status'>,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): { safetyScore: number; status: WorkerStatus; insight: string; predictiveWarning: string | null } {
  let penalty = 0;
  let isDanger = false;
  let isWarning = false;
  const issues: string[] = [];

  // 1. Motion & Fall Detection (Instant Danger)
  if (sensors.motion === 'Fall Detected') {
    penalty += 60;
    isDanger = true;
    issues.push('Sudden deceleration fall impact confirmed by IMU sensors');
  }

  // 2. Gas Levels (CO / Methane)
  if (sensors.gasLevel >= thresholds.gasDanger) {
    penalty += 45;
    isDanger = true;
    issues.push(`Critical gas concentration (${Math.round(sensors.gasLevel)} ppm) exceeds toxic threshold`);
  } else if (sensors.gasLevel >= thresholds.gasWarning) {
    penalty += 20;
    isWarning = true;
    issues.push(`Elevated gas detection (${Math.round(sensors.gasLevel)} ppm)`);
  }

  // 3. Temperature
  if (sensors.temperature >= thresholds.tempDanger) {
    penalty += 40;
    isDanger = true;
    issues.push(`Extreme ambient thermal stress (${sensors.temperature.toFixed(1)}°C)`);
  } else if (sensors.temperature >= thresholds.tempWarning) {
    penalty += 15;
    isWarning = true;
    issues.push(`Elevated thermal exposure (${sensors.temperature.toFixed(1)}°C)`);
  }

  // 4. Heart Rate
  if (sensors.heartRate >= thresholds.hrDanger) {
    penalty += 35;
    isDanger = true;
    issues.push(`Critical tachycardia (${sensors.heartRate} bpm)`);
  } else if (sensors.heartRate >= thresholds.hrHighWarning || sensors.heartRate <= thresholds.hrLowWarning) {
    penalty += 15;
    isWarning = true;
    issues.push(`Abnormal cardiac rate (${sensors.heartRate} bpm)`);
  }

  // 5. SpO2 Oxygen Saturation
  if (sensors.spO2 < thresholds.spo2Danger) {
    penalty += 40;
    isDanger = true;
    issues.push(`Critical arterial hypoxia (${sensors.spO2}%)`);
  } else if (sensors.spO2 < thresholds.spo2Warning) {
    penalty += 15;
    isWarning = true;
    issues.push(`Borderline oxygen saturation (${sensors.spO2}%)`);
  }

  // 6. Humidity
  if (sensors.humidity > thresholds.humidityWarning) {
    penalty += 10;
    isWarning = true;
    issues.push(`Excessive humidity (${Math.round(sensors.humidity)}%) accelerating heat index`);
  }

  // 7. Fault Detection
  if (sensors.faultStatus.hasFault) {
    penalty += 15;
    isWarning = true;
    issues.push(sensors.faultStatus.message);
  }

  const safetyScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  let status: WorkerStatus = 'SAFE';

  if (isDanger || safetyScore < 60) {
    status = 'DANGER';
  } else if (isWarning || safetyScore < 85) {
    status = 'WARNING';
  }

  // Generate plain-language AI diagnostic synthesis
  let insight = '';
  if (isDanger) {
    if (sensors.motion === 'Fall Detected') {
      insight = 'MAN DOWN: Triaxial accelerometer triggered impact threshold. Worker is motionless. Immediate emergency response protocol initiated.';
    } else if (sensors.gasLevel >= thresholds.gasDanger && sensors.heartRate > 110) {
      insight = `COMPOUND HAZARD: Toxic vapor exposure (${Math.round(sensors.gasLevel)} ppm) correlating with acute cardiovascular distress (${sensors.heartRate} bpm). Evacuate immediately!`;
    } else if (sensors.temperature >= thresholds.tempDanger) {
      insight = `HEAT STROKE HAZARD: Ambient microclimate reached ${sensors.temperature.toFixed(1)}°C. Core thermal equilibrium compromised. Mandatory relief required.`;
    } else if (sensors.spO2 < thresholds.spo2Danger) {
      insight = `HYPOXIA WARNING: Peripheral SpO2 dropped to ${sensors.spO2}%. Oxygen insufficiency detected. Provide immediate assisted air supply.`;
    } else {
      insight = `CRITICAL ALERT: Multiple safety criteria breached: ${issues.join('; ')}. Safety operations dispatched.`;
    }
  } else if (isWarning) {
    if (sensors.gasLevel >= thresholds.gasWarning) {
      insight = `PREVENTATIVE ADVISORY: Trace hydrocarbon/gas detected (${Math.round(sensors.gasLevel)} ppm). Verify SCBA mask seal and maintain safe corridor.`;
    } else if (sensors.temperature >= thresholds.tempWarning) {
      insight = `THERMAL STRAIN: Microclimate at ${sensors.temperature.toFixed(1)}°C with ${Math.round(sensors.humidity)}% RH. Recommend 10-minute hydration break at cooling station.`;
    } else if (sensors.heartRate > 115) {
      insight = `ELEVATED EXERTION: Sustained cardiac output of ${sensors.heartRate} bpm. Worker approaching physiological fatigue threshold.`;
    } else {
      insight = `MONITORING: Minor threshold deviation observed: ${issues[0] || 'Vitals fluctuate within cautionary range'}.`;
    }
  } else {
    insight = `NOMINAL STATUS: All vitals and environmental metrics remain securely within OSHA and NFPA safety margins. Telemetry stream optimal.`;
  }

  // Predictive trend warning
  let predictiveWarning: string | null = null;
  if (sensors.temperature > 36.5 && sensors.temperature < thresholds.tempWarning) {
    predictiveWarning = `Temperature rate of rise indicates 38°C warning threshold in approx. 12 minutes if exposure persists.`;
  } else if (sensors.heartRate > 105 && sensors.heartRate < thresholds.hrHighWarning) {
    predictiveWarning = `Cardiac upward trend (+8 bpm/5min) projects elevated cardiovascular strain under current thermal load.`;
  } else if (sensors.gasLevel > 35 && sensors.gasLevel < thresholds.gasWarning) {
    predictiveWarning = `Vapor dispersion drift detected (+3.2 ppm/min). Recommend windward posture.`;
  }

  return { safetyScore, status, insight, predictiveWarning };
}

/**
 * Generates realistic sensor telemetry updates.
 *
 * NOTE FOR PRODUCTION DEPLOYMENT:
 * To connect a real smart jacket (e.g. ESP32, STM32, Arduino, Raspberry Pi):
 * Replace this generator with:
 * 1. An MQTT WebSocket client connecting to your broker (e.g., wss://mqtt.yourfacility.com:8083/jacket/{jacketId})
 * 2. Or a Firebase Firestore onSnapshot() listener subscribed to doc(db, 'jackets', jacketId)
 * 3. Or a REST/WebSocket backend stream from an edge gateway.
 */
export function generateSensorData(
  workerId: string,
  prevData?: SensorData | null,
  scenario: ScenarioType = 'normal',
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): SensorData {
  const baseLoc = SITE_LOCATIONS[workerId] || { lat: 37.7749, lng: -122.4194 };

  // If scenario is active, override with high-stress hazard simulation
  if (scenario === 'gas_leak') {
    const gasVal = 78 + Math.random() * 25; // 78 - 103 ppm (Danger/Warning)
    const hrVal = Math.round(118 + Math.random() * 20); // 118 - 138 bpm
    const rawData = {
      latitude: prevData ? prevData.latitude : baseLoc.lat,
      longitude: prevData ? prevData.longitude : baseLoc.lng,
      humidity: 62 + Math.sin(Date.now() / 8000) * 4,
      temperature: 34.2 + Math.random() * 1.5,
      gasLevel: Math.round(gasVal * 10) / 10,
      heartRate: hrVal,
      spO2: Math.max(91, Math.round(95 - (gasVal / 40))),
      motion: 'Walking' as MotionType,
      faultStatus: {
        hasFault: false,
        sensorOk: true,
        batteryOk: true,
        connectionOk: true,
        message: 'Sensors operational'
      },
      timestamp: Date.now()
    };
    const evalResult = evaluateWorkerSafety(rawData, thresholds);
    return { ...rawData, ...evalResult };
  }

  if (scenario === 'fall_detected') {
    const rawData = {
      latitude: prevData ? prevData.latitude : baseLoc.lat,
      longitude: prevData ? prevData.longitude : baseLoc.lng,
      humidity: 58,
      temperature: 33.1,
      gasLevel: 12.4,
      heartRate: Math.round(132 + Math.random() * 14),
      spO2: 96,
      motion: 'Fall Detected' as MotionType,
      faultStatus: {
        hasFault: true,
        sensorOk: true,
        batteryOk: true,
        connectionOk: true,
        message: 'IMU Impact Deceleration Spike (>6.8G)'
      },
      timestamp: Date.now()
    };
    const evalResult = evaluateWorkerSafety(rawData, thresholds);
    return { ...rawData, ...evalResult };
  }

  if (scenario === 'high_temperature') {
    const rawData = {
      latitude: prevData ? prevData.latitude : baseLoc.lat,
      longitude: prevData ? prevData.longitude : baseLoc.lng,
      humidity: 84 + Math.random() * 5,
      temperature: 46.8 + Math.random() * 2, // Extreme danger
      gasLevel: 18.2,
      heartRate: Math.round(142 + Math.random() * 15),
      spO2: 93,
      motion: 'Running' as MotionType,
      faultStatus: {
        hasFault: false,
        sensorOk: true,
        batteryOk: true,
        connectionOk: true,
        message: 'Thermal overload warning'
      },
      timestamp: Date.now()
    };
    const evalResult = evaluateWorkerSafety(rawData, thresholds);
    return { ...rawData, ...evalResult };
  }

  if (scenario === 'low_spo2') {
    const rawData = {
      latitude: prevData ? prevData.latitude : baseLoc.lat,
      longitude: prevData ? prevData.longitude : baseLoc.lng,
      humidity: 54,
      temperature: 32.5,
      gasLevel: 42.1,
      heartRate: Math.round(108 + Math.random() * 12),
      spO2: Math.round(87 + Math.random() * 3), // Danger < 90%
      motion: 'Idle' as MotionType,
      faultStatus: {
        hasFault: false,
        sensorOk: true,
        batteryOk: true,
        connectionOk: true,
        message: 'Pulse oximetry signal weak'
      },
      timestamp: Date.now()
    };
    const evalResult = evaluateWorkerSafety(rawData, thresholds);
    return { ...rawData, ...evalResult };
  }

  // Normal stochastic evolution with natural jitter and smooth drift
  const now = Date.now();
  const timeFactor = now / 10000;

  // Worker-specific slight personality/baseline
  const baselineOffset = workerId.charCodeAt(1) % 4;

  const currentLat = prevData ? prevData.latitude + (Math.sin(timeFactor + baselineOffset) * 0.00004) : baseLoc.lat;
  const currentLng = prevData ? prevData.longitude + (Math.cos(timeFactor + baselineOffset) * 0.00005) : baseLoc.lng;

  const baseTemp = 31.5 + baselineOffset * 1.5;
  const temperature = Math.round((baseTemp + Math.sin(timeFactor * 0.5) * 1.8 + (Math.random() - 0.5) * 0.4) * 10) / 10;

  const baseHum = 52 + baselineOffset * 5;
  const humidity = Math.round((baseHum + Math.cos(timeFactor * 0.4) * 6 + (Math.random() - 0.5) * 1.2) * 10) / 10;

  const baseGas = 12 + baselineOffset * 4;
  const gasLevel = Math.round((baseGas + Math.sin(timeFactor * 0.8) * 5 + Math.random() * 3) * 10) / 10;

  const baseHr = 72 + baselineOffset * 5;
  const heartRate = Math.round(baseHr + Math.sin(timeFactor * 1.2) * 8 + (Math.random() - 0.5) * 4);

  const spO2 = Math.min(100, Math.max(95, Math.round(98 - (Math.random() > 0.85 ? 1 : 0))));

  const motions: MotionType[] = ['Walking', 'Walking', 'Walking', 'Idle', 'Running'];
  const motionIndex = Math.floor((Math.sin(timeFactor * 0.3) + 1) * 2) % motions.length;
  const motion = motions[motionIndex];

  // Minor occasional sensor glitch simulation (1% chance)
  const hasGlitch = Math.random() < 0.01;

  const rawData = {
    latitude: currentLat,
    longitude: currentLng,
    humidity,
    temperature,
    gasLevel,
    heartRate,
    spO2,
    motion,
    faultStatus: {
      hasFault: hasGlitch,
      sensorOk: !hasGlitch,
      batteryOk: true,
      connectionOk: true,
      message: hasGlitch ? 'Transitory optical reflection on SpO2 sensor' : 'All 9 jacket sensor nodes nominal'
    },
    timestamp: now
  };

  const evalResult = evaluateWorkerSafety(rawData, thresholds);
  return { ...rawData, ...evalResult };
}

/**
 * Industrial Web Audio Synthesizer for alerts and alarms
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playCriticalAlarm() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two-tone emergency siren
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.36);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playWarningChirp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.08); // G5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {}
  }

  public playRadioSquawk() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Radio transmission static beep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
