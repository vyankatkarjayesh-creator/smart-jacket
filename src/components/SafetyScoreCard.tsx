import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  BrainCircuit, 
  ArrowUpRight 
} from 'lucide-react';
import { SensorData, Thresholds } from '../types/sensors';

interface SafetyScoreCardProps {
  sensorData: SensorData;
  thresholds: Thresholds;
  insightMessage: string;
  predictiveWarning: string | null;
}

export const SafetyScoreCard: React.FC<SafetyScoreCardProps> = ({
  sensorData,
  thresholds,
  insightMessage,
  predictiveWarning,
}) => {
  const score = sensorData.safetyScore;

  // Circular gauge calculations (circumference for radius = 42)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let gaugeColor = '#10b981'; // Green
  let gradeText = 'OPTIMAL';
  let badgeBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';

  if (score < 60) {
    gaugeColor = '#ef4444'; // Red
    gradeText = 'CRITICAL RISK';
    badgeBg = 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse';
  } else if (score < 85) {
    gaugeColor = '#f59e0b'; // Amber
    gradeText = 'ELEVATED RISK';
    badgeBg = 'bg-amber-500/20 border-amber-500/50 text-amber-300';
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-['Chakra_Petch',sans-serif]">
              AI Safety Engine
            </h3>
            <p className="text-xs text-slate-400">Multi-modal biosensor risk fusion</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${badgeBg}`}>
          {gradeText}
        </span>
      </div>

      {/* Circular Progress Gauge & Score Details */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
        {/* Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-28 h-28 transform -rotate-90">
            {/* Background circle track */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="#1e293b"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress animated arc */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke={gaugeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-white tracking-tight font-['Chakra_Petch',sans-serif]">
              {score}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              / 100 Score
            </span>
          </div>
        </div>

        {/* Quick Biosafety Breakdown */}
        <div className="w-full space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-slate-400">Respiratory Index (SpO2)</span>
            <span className={sensorData.spO2 < thresholds.spo2Warning ? 'text-amber-400' : 'text-emerald-400'}>
              {sensorData.spO2}% {sensorData.spO2 >= 95 ? '✓ Nominal' : '⚠ Deficit'}
            </span>
          </div>
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-slate-400">Atmosphere Exposure</span>
            <span className={sensorData.gasLevel >= thresholds.gasWarning ? 'text-amber-400' : 'text-emerald-400'}>
              {sensorData.gasLevel.toFixed(1)} ppm {sensorData.gasLevel < 50 ? '✓ Safe' : '⚠ Hazardous'}
            </span>
          </div>
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-slate-400">Thermal Gradient</span>
            <span className={sensorData.temperature >= thresholds.tempWarning ? 'text-amber-400' : 'text-emerald-400'}>
              {sensorData.temperature.toFixed(1)}°C {sensorData.temperature < 38 ? '✓ Stable' : '⚠ High'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Kinetic Status</span>
            <span className={sensorData.motion === 'Fall Detected' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {sensorData.motion}
            </span>
          </div>
        </div>
      </div>

      {/* AI Insight Diagnostic Box */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold font-mono text-[11px] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Intelligent Diagnostic Insight</span>
        </div>
        <p className="text-slate-200 leading-relaxed font-sans text-xs">
          {insightMessage}
        </p>
      </div>

      {/* Predictive Warning Trend (Trend-based prediction) */}
      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs flex items-start gap-2.5">
        <div className="p-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-semibold block">
            Predictive Horizon Analysis
          </span>
          <p className="text-slate-300 text-xs mt-0.5">
            {predictiveWarning ||
              'Telemetry trajectory indicates steady biological and thermal equilibrium for the next 45 minutes.'}
          </p>
        </div>
      </div>
    </div>
  );
};
