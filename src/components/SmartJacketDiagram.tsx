import React, { useState } from 'react';
import { 
  Shield, 
  Flame, 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets, 
  Footprints, 
  Compass, 
  Battery, 
  Layers, 
  Info,
  Maximize2
} from 'lucide-react';
import { SensorData, Thresholds } from '../types/sensors';

interface SmartJacketDiagramProps {
  sensorData: SensorData;
  thresholds: Thresholds;
  onSelectSensor?: (sensorId: string) => void;
}

interface JacketNode {
  id: string;
  name: string;
  shortLabel: string;
  x: number;
  y: number;
  side: 'front' | 'back' | 'both';
  icon: React.ComponentType<{ className?: string }>;
  getValue: (data: SensorData) => string;
  isWarning: (data: SensorData, thresholds: Thresholds) => boolean;
  isDanger: (data: SensorData, thresholds: Thresholds) => boolean;
  desc: string;
}

const JACKET_NODES: JacketNode[] = [
  {
    id: 'gasLevel',
    name: 'Toxic Gas Sniffer Node',
    shortLabel: 'GAS',
    x: 150,
    y: 85,
    side: 'front',
    icon: Flame,
    getValue: (d) => `${d.gasLevel.toFixed(1)} ppm`,
    isWarning: (d, t) => d.gasLevel >= t.gasWarning,
    isDanger: (d, t) => d.gasLevel >= t.gasDanger,
    desc: 'MEMS gas spectrometer detecting CO, Methane & Volatiles in breathing zone',
  },
  {
    id: 'heartRate',
    name: 'Biometric ECG / PPG Chest Sensor',
    shortLabel: 'HR/SpO2',
    x: 130,
    y: 135,
    side: 'front',
    icon: Heart,
    getValue: (d) => `${d.heartRate} bpm · ${d.spO2}% SpO2`,
    isWarning: (d, t) => d.heartRate > t.hrHighWarning || d.heartRate < t.hrLowWarning || d.spO2 < t.spo2Warning,
    isDanger: (d, t) => d.heartRate >= t.hrDanger || d.spO2 < t.spo2Danger,
    desc: 'Dual-lead textile electrode band tracking heart rhythm and arterial oxygen',
  },
  {
    id: 'temperature',
    name: 'Core Microclimate Temp & Humidity',
    shortLabel: 'TEMP',
    x: 170,
    y: 180,
    side: 'front',
    icon: Thermometer,
    getValue: (d) => `${d.temperature.toFixed(1)}°C · ${Math.round(d.humidity)}%`,
    isWarning: (d, t) => d.temperature >= t.tempWarning || d.humidity > t.humidityWarning,
    isDanger: (d, t) => d.temperature >= t.tempDanger,
    desc: 'Internal jacket lining sensor array measuring thermodynamic heat index',
  },
  {
    id: 'motion',
    name: 'Lumbar IMU Fall & Deceleration Node',
    shortLabel: 'IMU',
    x: 150,
    y: 245,
    side: 'front',
    icon: Footprints,
    getValue: (d) => d.motion,
    isWarning: (d) => d.motion === 'Running',
    isDanger: (d) => d.motion === 'Fall Detected',
    desc: '9-axis motion sensor detecting freefall, impact spikes & posture dormancy',
  },
  {
    id: 'gps',
    name: 'Shoulder RTK GNSS & LoRa Antenna',
    shortLabel: 'GPS',
    x: 95,
    y: 90,
    side: 'front',
    icon: Compass,
    getValue: (d) => `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`,
    isWarning: () => false,
    isDanger: () => false,
    desc: 'Sub-meter RTK dual-band positioning module with 868MHz mesh transponder',
  },
  {
    id: 'power',
    name: 'Smart LiFePO4 Power Controller',
    shortLabel: 'PWR',
    x: 205,
    y: 220,
    side: 'front',
    icon: Battery,
    getValue: () => '94% · 18h rem',
    isWarning: (d) => d.faultStatus.hasFault,
    isDanger: () => false,
    desc: 'Intrinsically safe ATEX-rated battery pack with dynamic thermal regulation',
  },
];

export const SmartJacketDiagram: React.FC<SmartJacketDiagramProps> = ({
  sensorData,
  thresholds,
  onSelectSensor,
}) => {
  const [activeNodeId, setActiveNodeId] = useState<string>('heartRate');
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');

  const selectedNode = JACKET_NODES.find((n) => n.id === activeNodeId) || JACKET_NODES[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-md flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-['Chakra_Petch',sans-serif] flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Smart Safety Jacket Sensor Topology
          </h3>
          <p className="text-xs text-slate-400">
            Interactive IoT node mapping on SmartGuard Pro-Jacket
          </p>
        </div>

        {/* Front / Back Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewSide('front')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewSide === 'front' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setViewSide('back')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewSide === 'back' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div className="relative py-4 flex items-center justify-center min-h-[310px]">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* SVG Smart Jacket Blueprint */}
        <svg
          viewBox="0 0 300 320"
          className="w-full max-w-[270px] h-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)] select-none"
        >
          <defs>
            <linearGradient id="jacketFabric" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0b1322" />
            </linearGradient>

            <linearGradient id="neonStrip" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Jacket Body Outline (High-tech cut) */}
          <path
            d="M 115 45 
               C 135 60, 165 60, 185 45 
               L 225 65 
               L 265 125 
               L 240 145 
               L 220 115 
               L 220 270 
               C 220 280, 205 285, 150 285 
               C 95 285, 80 280, 80 270 
               L 80 115 
               L 60 145 
               L 35 125 
               L 75 65 Z"
            fill="url(#jacketFabric)"
            stroke="#334155"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* High-visibility Reflective Neon Strips (Industrial OSHA compliance) */}
          <path
            d="M 80 160 L 220 160"
            stroke="#10b981"
            strokeWidth="5"
            strokeOpacity="0.85"
            filter="url(#glowGreen)"
          />
          <path
            d="M 80 190 L 220 190"
            stroke="#e2e8f0"
            strokeWidth="4"
            strokeDasharray="8 4"
            strokeOpacity="0.6"
          />
          <path
            d="M 80 240 L 220 240"
            stroke="#10b981"
            strokeWidth="5"
            strokeOpacity="0.85"
            filter="url(#glowGreen)"
          />

          {/* Shoulder reflective braces */}
          <path
            d="M 110 55 L 105 160"
            stroke="#10b981"
            strokeWidth="4"
            strokeOpacity="0.75"
          />
          <path
            d="M 190 55 L 195 160"
            stroke="#10b981"
            strokeWidth="4"
            strokeOpacity="0.75"
          />

          {/* Front Center Zipper */}
          <line
            x1="150"
            y1="55"
            x2="150"
            y2="285"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="3 2"
          />

          {/* Collar styling */}
          <path
            d="M 115 45 C 135 62, 165 62, 185 45 L 180 32 C 160 38, 140 38, 120 32 Z"
            fill="#090e17"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Interactive Sensor Nodes on Jacket */}
          {JACKET_NODES.map((node) => {
            const isDanger = node.isDanger(sensorData, thresholds);
            const isWarning = !isDanger && node.isWarning(sensorData, thresholds);
            const isSelected = activeNodeId === node.id;

            let nodeColor = '#10b981'; // Green
            let ringColor = 'rgba(16, 185, 129, 0.4)';

            if (isDanger) {
              nodeColor = '#ef4444'; // Red
              ringColor = 'rgba(239, 68, 68, 0.8)';
            } else if (isWarning) {
              nodeColor = '#f59e0b'; // Amber
              ringColor = 'rgba(245, 158, 11, 0.7)';
            }

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => {
                  setActiveNodeId(node.id);
                  onSelectSensor?.(node.id);
                }}
              >
                {/* Pulsing Outer Radar Ring */}
                {(isDanger || isWarning || isSelected) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 16 : 13}
                    fill={ringColor}
                    className="animate-ping-slow"
                  />
                )}

                {/* Node Housing Ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 11 : 9}
                  fill="#090e17"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                />

                {/* Core LED Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 5.5 : 4}
                  fill={nodeColor}
                />

                {/* Label text */}
                <text
                  x={node.x}
                  y={node.y - 14}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow"
                >
                  {node.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Sensor Floating Inspector Card */}
        <div className="absolute bottom-2 right-2 max-w-[210px] bg-slate-950/90 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs font-mono">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-200 font-sans font-bold">
              <selectedNode.icon className="w-3.5 h-3.5 text-cyan-400" />
              {selectedNode.shortLabel}
            </span>
            <span className="text-emerald-400 font-bold">
              {selectedNode.isDanger(sensorData, thresholds)
                ? 'CRITICAL'
                : selectedNode.isWarning(sensorData, thresholds)
                ? 'WARN'
                : 'NORMAL'}
            </span>
          </div>
          <div className="text-slate-100 font-bold text-sm tracking-tight mb-1">
            {selectedNode.getValue(sensorData)}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {selectedNode.desc}
          </p>
        </div>
      </div>

      {/* Sensor Nodes Quick Carousel / Selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-3 border-t border-slate-800">
        {JACKET_NODES.map((node) => {
          const isDanger = node.isDanger(sensorData, thresholds);
          const isWarning = !isDanger && node.isWarning(sensorData, thresholds);
          const isSelected = activeNodeId === node.id;
          const Icon = node.icon;

          return (
            <button
              key={node.id}
              onClick={() => {
                setActiveNodeId(node.id);
                onSelectSensor?.(node.id);
              }}
              className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-white shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isDanger ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase">{node.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
