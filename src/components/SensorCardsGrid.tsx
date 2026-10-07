import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Compass, 
  Droplets, 
  Thermometer, 
  Flame, 
  Heart, 
  Activity, 
  Footprints, 
  AlertTriangle, 
  GripVertical, 
  RotateCcw, 
  CheckCircle, 
  Info,
  Maximize2
} from 'lucide-react';
import { SensorData, Thresholds, WorkerStatus } from '../types/sensors';

interface SensorCardsGridProps {
  sensorData: SensorData;
  historyData: SensorData[];
  thresholds: Thresholds;
  onCardClick?: (sensorId: string) => void;
}

export interface SensorCardConfig {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
  description: string;
  safeRange: string;
}

const DEFAULT_CARDS: SensorCardConfig[] = [
  {
    id: 'heartRate',
    title: 'Heart Rate',
    icon: Heart,
    unit: 'bpm',
    description: 'ECG Optical Pulse Sensor',
    safeRange: '60 – 100 bpm',
  },
  {
    id: 'spO2',
    title: 'SpO2 Oxygen',
    icon: Activity,
    unit: '%',
    description: 'Arterial Blood Saturation',
    safeRange: '≥ 95 %',
  },
  {
    id: 'gasLevel',
    title: 'Hazardous Gas',
    icon: Flame,
    unit: 'ppm',
    description: 'CO & Methane Sniffer',
    safeRange: '< 50 ppm',
  },
  {
    id: 'temperature',
    title: 'Body / Microclimate Temp',
    icon: Thermometer,
    unit: '°C',
    description: 'Jacket Core Thermal Sensor',
    safeRange: '< 38.0 °C',
  },
  {
    id: 'humidity',
    title: 'Relative Humidity',
    icon: Droplets,
    unit: '%',
    description: 'Internal Jacket Microclimate',
    safeRange: '< 80 %',
  },
  {
    id: 'motion',
    title: 'Kinetic Motion State',
    icon: Footprints,
    unit: '',
    description: '9-Axis IMU Deceleration',
    safeRange: 'Walking / Idle',
  },
  {
    id: 'faultDetection',
    title: 'System Fault Diagnostics',
    icon: AlertTriangle,
    unit: '',
    description: 'Bus, Battery & Hardware Check',
    safeRange: 'All Nodes Nominal',
  },
  {
    id: 'latitude',
    title: 'GPS Latitude',
    icon: MapPin,
    unit: '° N',
    description: 'GNSS RTK Geo-Positioning',
    safeRange: 'Within Site Bounds',
  },
  {
    id: 'longitude',
    title: 'GPS Longitude',
    icon: Compass,
    unit: '° W',
    description: 'GNSS RTK Geo-Positioning',
    safeRange: 'Within Site Bounds',
  },
];

const STORAGE_KEY = 'smartguard_sensor_cards_order_v1';

export const SensorCardsGrid: React.FC<SensorCardsGridProps> = ({
  sensorData,
  historyData,
  thresholds,
  onCardClick,
}) => {
  const [cardsOrder, setCardsOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_CARDS.length) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_CARDS.map((c) => c.id);
  });

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const saveOrder = (newOrder: string[]) => {
    setCardsOrder(newOrder);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  };

  const handleResetLayout = () => {
    const defaultOrder = DEFAULT_CARDS.map((c) => c.id);
    saveOrder(defaultOrder);
  };

  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetId) return;

    const sourceIndex = cardsOrder.indexOf(draggedCardId);
    const targetIndex = cardsOrder.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newOrder = [...cardsOrder];
    newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCardId);
    saveOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
  };

  // Sparkline generator helper
  const getSparklinePoints = (cardId: string): string => {
    if (!historyData || historyData.length < 2) {
      return '0,15 30,12 60,18 90,10 120,14';
    }

    const recent = historyData.slice(-15);
    const values = recent.map((item) => {
      switch (cardId) {
        case 'temperature':
          return item.temperature;
        case 'humidity':
          return item.humidity;
        case 'gasLevel':
          return item.gasLevel;
        case 'heartRate':
          return item.heartRate;
        case 'spO2':
          return item.spO2;
        case 'latitude':
          return item.latitude * 10000;
        case 'longitude':
          return item.longitude * 10000;
        default:
          return 50;
      }
    });

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 120;
    const height = 30;

    return values
      .map((val, idx) => {
        const x = Math.round((idx / (values.length - 1)) * width);
        const y = Math.round(height - ((val - min) / range) * (height - 6) - 3);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Determine status & styling for each sensor
  const getSensorStatus = (
    cardId: string
  ): { status: WorkerStatus; label: string; textClass: string; borderClass: string; bgClass: string; sparkColor: string } => {
    switch (cardId) {
      case 'temperature': {
        if (sensorData.temperature >= thresholds.tempDanger) {
          return { status: 'DANGER', label: 'CRITICAL HIGH', textClass: 'text-red-400', borderClass: 'border-red-500/80 shadow-red-950/40', bgClass: 'bg-red-500/10', sparkColor: '#ef4444' };
        }
        if (sensorData.temperature >= thresholds.tempWarning) {
          return { status: 'WARNING', label: 'WARNING', textClass: 'text-amber-400', borderClass: 'border-amber-500/60 shadow-amber-950/30', bgClass: 'bg-amber-500/10', sparkColor: '#f59e0b' };
        }
        return { status: 'SAFE', label: 'NORMAL', textClass: 'text-emerald-400', borderClass: 'border-slate-800 hover:border-emerald-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#10b981' };
      }

      case 'humidity': {
        if (sensorData.humidity > thresholds.humidityWarning) {
          return { status: 'WARNING', label: 'HIGH HUMIDITY', textClass: 'text-amber-400', borderClass: 'border-amber-500/60 shadow-amber-950/30', bgClass: 'bg-amber-500/10', sparkColor: '#f59e0b' };
        }
        return { status: 'SAFE', label: 'NORMAL', textClass: 'text-emerald-400', borderClass: 'border-slate-800 hover:border-emerald-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#10b981' };
      }

      case 'gasLevel': {
        if (sensorData.gasLevel >= thresholds.gasDanger) {
          return { status: 'DANGER', label: 'LETHAL TOXIC SPIKE', textClass: 'text-red-400', borderClass: 'border-red-500/80 shadow-red-950/40', bgClass: 'bg-red-500/15', sparkColor: '#ef4444' };
        }
        if (sensorData.gasLevel >= thresholds.gasWarning) {
          return { status: 'WARNING', label: 'ELEVATED GAS', textClass: 'text-amber-400', borderClass: 'border-amber-500/60 shadow-amber-950/30', bgClass: 'bg-amber-500/10', sparkColor: '#f59e0b' };
        }
        return { status: 'SAFE', label: 'SAFE CORRIDOR', textClass: 'text-emerald-400', borderClass: 'border-slate-800 hover:border-emerald-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#10b981' };
      }

      case 'heartRate': {
        if (sensorData.heartRate >= thresholds.hrDanger) {
          return { status: 'DANGER', label: 'TACHYCARDIA CRITICAL', textClass: 'text-red-400', borderClass: 'border-red-500/80 shadow-red-950/40', bgClass: 'bg-red-500/10', sparkColor: '#ef4444' };
        }
        if (sensorData.heartRate >= thresholds.hrHighWarning || sensorData.heartRate <= thresholds.hrLowWarning) {
          return { status: 'WARNING', label: 'CARDIAC STRAIN', textClass: 'text-amber-400', borderClass: 'border-amber-500/60 shadow-amber-950/30', bgClass: 'bg-amber-500/10', sparkColor: '#f59e0b' };
        }
        return { status: 'SAFE', label: 'RHYTHM NORMAL', textClass: 'text-emerald-400', borderClass: 'border-slate-800 hover:border-emerald-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#10b981' };
      }

      case 'spO2': {
        if (sensorData.spO2 < thresholds.spo2Danger) {
          return { status: 'DANGER', label: 'ACUTE HYPOXIA', textClass: 'text-red-400', borderClass: 'border-red-500/80 shadow-red-950/40', bgClass: 'bg-red-500/15', sparkColor: '#ef4444' };
        }
        if (sensorData.spO2 < thresholds.spo2Warning) {
          return { status: 'WARNING', label: 'BORDERLINE SATURATION', textClass: 'text-amber-400', borderClass: 'border-amber-500/60 shadow-amber-950/30', bgClass: 'bg-amber-500/10', sparkColor: '#f59e0b' };
        }
        return { status: 'SAFE', label: 'OPTIMAL OX', textClass: 'text-emerald-400', borderClass: 'border-slate-800 hover:border-emerald-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#10b981' };
      }

      case 'motion': {
        if (sensorData.motion === 'Fall Detected') {
          return { status: 'DANGER', label: 'FALL IMPACT CONFIRMED', textClass: 'text-red-400', borderClass: 'border-red-500/80 shadow-red-950/40', bgClass: 'bg-red-500/20', sparkColor: '#ef4444' };
        }
        if (sensorData.motion === 'Running') {
          return { status: 'WARNING', label: 'RUNNING / EXERTION', textClass: 'text-cyan-400', borderClass: 'border-slate-800 hover:border-cyan-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#06b6d4' };
        }
        return { status: 'SAFE', label: 'STEADY', textClass: 'text-emerald-400', borderClass: 'border-slate-800 hover:border-emerald-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#10b981' };
      }

      case 'faultDetection': {
        if (sensorData.faultStatus.hasFault) {
          return { status: 'WARNING', label: 'FAULT DETECTED', textClass: 'text-amber-400', borderClass: 'border-amber-500/60 shadow-amber-950/30', bgClass: 'bg-amber-500/10', sparkColor: '#f59e0b' };
        }
        return { status: 'SAFE', label: 'ALL SYSTEMS NOMINAL', textClass: 'text-emerald-400', borderClass: 'border-slate-800 hover:border-emerald-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#10b981' };
      }

      default:
        return { status: 'SAFE', label: 'LOCKED', textClass: 'text-cyan-400', borderClass: 'border-slate-800 hover:border-cyan-500/50', bgClass: 'bg-slate-900/80', sparkColor: '#06b6d4' };
    }
  };

  const renderValue = (cardId: string) => {
    switch (cardId) {
      case 'temperature':
        return sensorData.temperature.toFixed(1);
      case 'humidity':
        return Math.round(sensorData.humidity).toString();
      case 'gasLevel':
        return sensorData.gasLevel.toFixed(1);
      case 'heartRate':
        return sensorData.heartRate.toString();
      case 'spO2':
        return sensorData.spO2.toString();
      case 'motion':
        return sensorData.motion;
      case 'faultDetection':
        return sensorData.faultStatus.hasFault ? 'Fault Warning' : '100% OK';
      case 'latitude':
        return sensorData.latitude.toFixed(5);
      case 'longitude':
        return sensorData.longitude.toFixed(5);
      default:
        return '--';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header controls for drag/drop layout */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-slate-300">
            Telemetry Sensor Cluster
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-400 hidden sm:inline">
            Drag cards by handle to rearrange
          </span>
        </div>
        <button
          onClick={handleResetLayout}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset Layout</span>
        </button>
      </div>

      {/* Grid of 9 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {cardsOrder.map((cardId) => {
          const config = DEFAULT_CARDS.find((c) => c.id === cardId);
          if (!config) return null;

          const Icon = config.icon;
          const statusInfo = getSensorStatus(cardId);
          const isDragging = draggedCardId === cardId;
          const val = renderValue(cardId);
          const sparkPoints = getSparklinePoints(cardId);

          return (
            <div
              key={cardId}
              draggable
              onDragStart={() => handleDragStart(cardId)}
              onDragOver={(e) => handleDragOver(e, cardId)}
              onDragEnd={handleDragEnd}
              onClick={() => onCardClick?.(cardId)}
              className={`relative rounded-xl border p-4 transition-all duration-200 cursor-grab active:cursor-grabbing backdrop-blur-md shadow-lg ${
                statusInfo.bgClass
              } ${statusInfo.borderClass} ${
                isDragging ? 'opacity-40 scale-95 ring-2 ring-emerald-500' : 'hover:-translate-y-0.5'
              }`}
            >
              {/* Top row: Drag handle + Title + Icon */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="text-slate-500 hover:text-slate-300 transition-colors p-0.5">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
                    <Icon
                      className={`w-4 h-4 ${
                        cardId === 'heartRate'
                          ? 'animate-heart-pulse text-rose-500'
                          : cardId === 'gasLevel'
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                      }`}
                    />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 truncate font-['Chakra_Petch',sans-serif]">
                      {config.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate">{config.description}</p>
                  </div>
                </div>

                {/* Status pill */}
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                    statusInfo.status === 'DANGER'
                      ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                      : statusInfo.status === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {statusInfo.label}
                </span>
              </div>

              {/* Center row: Big value + Unit */}
              <div className="flex items-baseline justify-between mt-1 mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-bold tracking-tight font-['Chakra_Petch',sans-serif] ${
                      statusInfo.textClass
                    }`}
                  >
                    {val}
                  </span>
                  {config.unit && (
                    <span className="text-sm font-semibold text-slate-400 font-mono">
                      {config.unit}
                    </span>
                  )}
                </div>

                {/* Mini SVG Sparkline */}
                {cardId !== 'motion' && cardId !== 'faultDetection' && (
                  <div className="w-24 h-8 shrink-0">
                    <svg viewBox="0 0 120 30" className="w-full h-full overflow-visible">
                      <polyline
                        fill="none"
                        stroke={statusInfo.sparkColor}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={sparkPoints}
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Bottom row: Safe range threshold hint */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">Safe: {config.safeRange}</span>
                <span className="text-slate-400 text-[10px]">Active Node</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
