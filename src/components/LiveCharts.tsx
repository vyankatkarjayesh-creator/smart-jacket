import React, { useState } from 'react';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Flame, 
  Heart, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Gauge 
} from 'lucide-react';
import { SensorData, Thresholds } from '../types/sensors';

interface LiveChartsProps {
  historyData: SensorData[];
  currentData: SensorData;
  thresholds: Thresholds;
}

export const LiveCharts: React.FC<LiveChartsProps> = ({
  historyData,
  currentData,
  thresholds,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'vitals' | 'thermal' | 'gas' | 'gauges' | 'motion' | 'predictive'>('predictive');
  const [predictiveView, setPredictiveView] = useState<'both' | 'temp' | 'hr'>('both');

  const dataPoints = historyData.length > 0 ? historyData.slice(-20) : [currentData];

  // Helper to build SVG path
  const buildSvgPath = (
    values: number[],
    minVal: number,
    maxVal: number,
    width: number,
    height: number
  ) => {
    if (values.length < 2) return '';
    const range = maxVal - minVal || 1;
    return values
      .map((val, idx) => {
        const x = (idx / (values.length - 1)) * width;
        const clamped = Math.max(minVal, Math.min(maxVal, val));
        const y = height - ((clamped - minVal) / range) * (height - 20) - 10;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Helper to build SVG area path
  const buildSvgAreaPath = (
    values: number[],
    minVal: number,
    maxVal: number,
    width: number,
    height: number
  ) => {
    if (values.length < 2) return '';
    const linePath = buildSvgPath(values, minVal, maxVal, width, height);
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  // -------------------------------------------------------------
  // PREDICTIVE WARNING CALCULATIONS (15-Minute Forward Horizon)
  // -------------------------------------------------------------
  // Calculate slope (rate of change per minute) based on recent history
  const recentWindow = dataPoints.slice(-10);
  const sampleSpanSec = Math.max(2, (recentWindow.length - 1) * 2);

  // Raw delta over recent window
  const rawDeltaTemp = recentWindow[recentWindow.length - 1].temperature - recentWindow[0].temperature;
  const rawDeltaHr = recentWindow[recentWindow.length - 1].heartRate - recentWindow[0].heartRate;

  // Slope in units per minute
  let tempSlopePerMin = (rawDeltaTemp / sampleSpanSec) * 60;
  let hrSlopePerMin = (rawDeltaHr / sampleSpanSec) * 60;

  // Add realistic baseline drift if worker is in elevated condition
  if (currentData.temperature > 37 && tempSlopePerMin <= 0.05) {
    tempSlopePerMin = 0.35; // Ambient thermal accumulation
  } else if (currentData.temperature > 40 && tempSlopePerMin <= 0.1) {
    tempSlopePerMin = 0.55;
  }

  if (currentData.heartRate > 105 && hrSlopePerMin <= 0.5) {
    hrSlopePerMin = 2.4; // Exertion cardiac climb
  }

  // Smooth / clamp slopes to plausible physical limits
  tempSlopePerMin = Math.max(-1.5, Math.min(1.8, tempSlopePerMin));
  hrSlopePerMin = Math.max(-6, Math.min(8, hrSlopePerMin));

  // Current values at t = 0
  const curTemp = currentData.temperature;
  const curHr = currentData.heartRate;

  // 15-minute time steps: t = 0 (now), 3, 6, 9, 12, 15 min
  const forecastTimes = [0, 3, 6, 9, 12, 15];
  const predictedTempSeries = forecastTimes.map((t) =>
    Math.round((curTemp + tempSlopePerMin * t) * 10) / 10
  );
  const predictedHrSeries = forecastTimes.map((t) =>
    Math.round(curHr + hrSlopePerMin * t)
  );

  // Time to reach warning/danger thresholds
  let tempTimeToWarn: number | null = null;
  if (tempSlopePerMin > 0.02 && curTemp < thresholds.tempWarning) {
    const t = (thresholds.tempWarning - curTemp) / tempSlopePerMin;
    if (t > 0 && t <= 30) tempTimeToWarn = Math.round(t * 10) / 10;
  }

  let hrTimeToWarn: number | null = null;
  if (hrSlopePerMin > 0.2 && curHr < thresholds.hrHighWarning) {
    const t = (thresholds.hrHighWarning - curHr) / hrSlopePerMin;
    if (t > 0 && t <= 30) hrTimeToWarn = Math.round(t * 10) / 10;
  }

  // Final 15-min forecast values
  const finalTemp15 = predictedTempSeries[predictedTempSeries.length - 1];
  const finalHr15 = predictedHrSeries[predictedHrSeries.length - 1];


  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Header with Chart Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-['Chakra_Petch',sans-serif] flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Real-Time Bio & Environmental Telemetry Charts
          </h3>
          <p className="text-xs text-slate-400">
            Streaming 2-second sliding window &bull; Real-time physiological trends
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveChartTab('vitals')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'vitals'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Vitals (HR/SpO2)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('thermal')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'thermal'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Temp & Humidity</span>
          </button>

          <button
            onClick={() => setActiveChartTab('gas')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'gas'
                ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Gas Sniffer (ppm)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('gauges')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'gauges'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Radial Gauges</span>
          </button>

          <button
            onClick={() => setActiveChartTab('motion')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'motion'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kinetic Activity</span>
          </button>

          <button
            onClick={() => setActiveChartTab('predictive')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'predictive'
                ? 'bg-purple-500/25 text-purple-200 font-bold border border-purple-500/50 shadow-sm'
                : 'text-purple-400/90 hover:text-purple-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>15-Min Forecast</span>
          </button>
        </div>
      </div>

      {/* Main Chart Viewer Body */}
      <div className="relative min-h-[260px] flex items-center justify-center">
        {/* TAB 1: VITALS (Heart Rate & SpO2 Line Chart) */}
        {activeChartTab === 'vitals' && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Heart Rate: {currentData.heartRate} bpm
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  SpO2: {currentData.spO2}%
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">Threshold: HR &gt; 120 bpm (Warn) / SpO2 &lt; 90% (Danger)</span>
            </div>

            {/* SVG Chart Frame */}
            <div className="relative w-full h-52 bg-slate-950/80 rounded-xl border border-slate-800 p-2 overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-rows-4 pointer-events-none opacity-20">
                <div className="border-b border-slate-700"></div>
                <div className="border-b border-slate-700"></div>
                <div className="border-b border-slate-700"></div>
              </div>

              {/* Danger Line for Heart Rate (>120 bpm) */}
              <div className="absolute top-[28%] left-0 right-0 border-b border-dashed border-red-500/50 pointer-events-none flex justify-end pr-2">
                <span className="text-[10px] font-mono text-red-400 bg-slate-950/90 px-1 rounded">120 bpm Critical</span>
              </div>

              <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Heart Rate Area & Line */}
                <path
                  d={buildSvgAreaPath(
                    dataPoints.map((d) => d.heartRate),
                    45,
                    160,
                    600,
                    180
                  )}
                  fill="url(#hrGrad)"
                />
                <path
                  d={buildSvgPath(
                    dataPoints.map((d) => d.heartRate),
                    45,
                    160,
                    600,
                    180
                  )}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* SpO2 Line */}
                <path
                  d={buildSvgPath(
                    dataPoints.map((d) => d.spO2),
                    80,
                    100,
                    600,
                    180
                  )}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: THERMAL (Temperature & Humidity) */}
        {activeChartTab === 'thermal' && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  Temperature: {currentData.temperature.toFixed(1)}°C
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  Humidity: {Math.round(currentData.humidity)}%
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">Warning: &gt;38°C &bull; Danger: &gt;45°C</span>
            </div>

            <div className="relative w-full h-52 bg-slate-950/80 rounded-xl border border-slate-800 p-2 overflow-hidden">
              {/* Danger Line (45°C) */}
              <div className="absolute top-[20%] left-0 right-0 border-b border-dashed border-red-500/60 pointer-events-none flex justify-end pr-2">
                <span className="text-[10px] font-mono text-red-400 bg-slate-950/90 px-1 rounded">45°C Danger</span>
              </div>
              {/* Warning Line (38°C) */}
              <div className="absolute top-[48%] left-0 right-0 border-b border-dashed border-amber-500/60 pointer-events-none flex justify-end pr-2">
                <span className="text-[10px] font-mono text-amber-300 bg-slate-950/90 px-1 rounded">38°C Warning</span>
              </div>

              <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Temperature Line */}
                <path
                  d={buildSvgPath(
                    dataPoints.map((d) => d.temperature),
                    25,
                    50,
                    600,
                    180
                  )}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Humidity Line */}
                <path
                  d={buildSvgPath(
                    dataPoints.map((d) => d.humidity),
                    20,
                    100,
                    600,
                    180
                  )}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* TAB 3: GAS LEVEL (Area Chart) */}
        {activeChartTab === 'gas' && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  CO & Methane Level: {currentData.gasLevel.toFixed(1)} ppm
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">50 ppm (OSHA PEL Alert) &bull; 100 ppm (Lethal IDLH)</span>
            </div>

            <div className="relative w-full h-52 bg-slate-950/80 rounded-xl border border-slate-800 p-2 overflow-hidden">
              {/* Danger 100 ppm */}
              <div className="absolute top-[18%] left-0 right-0 border-b border-dashed border-red-500/80 pointer-events-none flex justify-end pr-2">
                <span className="text-[10px] font-mono text-red-400 bg-slate-950/90 px-1 rounded">100 ppm Lethal</span>
              </div>
              {/* Warning 50 ppm */}
              <div className="absolute top-[52%] left-0 right-0 border-b border-dashed border-amber-500/80 pointer-events-none flex justify-end pr-2">
                <span className="text-[10px] font-mono text-amber-400 bg-slate-950/90 px-1 rounded">50 ppm Warning</span>
              </div>

              <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gasAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                <path
                  d={buildSvgAreaPath(
                    dataPoints.map((d) => d.gasLevel),
                    0,
                    120,
                    600,
                    180
                  )}
                  fill="url(#gasAreaGrad)"
                />
                <path
                  d={buildSvgPath(
                    dataPoints.map((d) => d.gasLevel),
                    0,
                    120,
                    600,
                    180
                  )}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* TAB 4: RADIAL GAUGES (Temperature & SpO2) */}
        {activeChartTab === 'gauges' && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
            {/* Temperature Gauge */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                Temperature Dial
              </span>
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="54" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="72"
                    cy="72"
                    r="54"
                    stroke={currentData.temperature > 40 ? '#ef4444' : currentData.temperature > 37 ? '#f59e0b' : '#10b981'}
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 - (Math.min(50, Math.max(20, currentData.temperature)) / 50) * 2 * Math.PI * 54}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold font-['Chakra_Petch',sans-serif] text-white">
                    {currentData.temperature.toFixed(1)}°
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Scale: 20-50°C</span>
                </div>
              </div>
            </div>

            {/* SpO2 Radial Gauge */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                SpO2 Arterial Saturation
              </span>
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="54" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="72"
                    cy="72"
                    r="54"
                    stroke={currentData.spO2 < 90 ? '#ef4444' : currentData.spO2 < 94 ? '#f59e0b' : '#06b6d4'}
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 - (currentData.spO2 / 100) * 2 * Math.PI * 54}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold font-['Chakra_Petch',sans-serif] text-white">
                    {currentData.spO2}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Target &gt;95%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MOTION BAR DISTRIBUTION */}
        {activeChartTab === 'motion' && (
          <div className="w-full space-y-4 py-2">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Shift Kinetic Activity Distribution</span>
              <span className="text-emerald-400 font-bold">Current: {currentData.motion}</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Walking (Steady Patrol)</span>
                  <span className="text-slate-400">68%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Stationary / Idle Work</span>
                  <span className="text-slate-400">22%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '22%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Running / Rapid Transit</span>
                  <span className="text-slate-400">9%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '9%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Fall Deceleration Events</span>
                  <span className="text-rose-400 font-bold">
                    {currentData.motion === 'Fall Detected' ? '1 ACTIVE CRITICAL' : '0 Events'}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all"
                    style={{ width: currentData.motion === 'Fall Detected' ? '100%' : '1%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PREDICTIVE WARNING HORIZON (15-Minute Forward Projection) */}
        {activeChartTab === 'predictive' && (
          <div className="w-full space-y-3.5 py-1">
            {/* Top Bar: Sub-views & Status Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
              {/* Sub-selector for Temperature vs Heart Rate vs Both */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setPredictiveView('both')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    predictiveView === 'both'
                      ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dual View (Temp + HR)
                </button>
                <button
                  onClick={() => setPredictiveView('temp')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    predictiveView === 'temp'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Temperature Horizon
                </button>
                <button
                  onClick={() => setPredictiveView('hr')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    predictiveView === 'hr'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cardiac HR Horizon
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex items-center gap-2">
                {tempTimeToWarn ? (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    Temp Breach in ~{tempTimeToWarn}m
                  </span>
                ) : hrTimeToWarn ? (
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                    HR Breach in ~{hrTimeToWarn}m
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Safe Corridor &gt; 15 mins
                  </span>
                )}
              </div>
            </div>

            {/* SVG Forecast Chart Frame */}
            <div className="relative w-full h-56 bg-slate-950/90 rounded-xl border border-slate-800 p-2 overflow-hidden shadow-inner">
              {/* Vertical Demarcation Line at t = 0 (NOW) */}
              <div className="absolute top-0 bottom-6 left-[16.66%] w-px bg-cyan-400/50 pointer-events-none z-10 border-l border-dashed border-cyan-400">
                <span className="absolute -top-0 -left-6 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                  NOW
                </span>
              </div>

              {/* Shaded Future Forecast Zone */}
              <div className="absolute top-0 bottom-6 left-[16.66%] right-0 bg-purple-950/10 pointer-events-none z-0">
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-purple-400/80 bg-slate-950/80 px-2 py-0.5 rounded border border-purple-500/20">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  <span>15-Minute Predictive Horizon</span>
                </div>
              </div>

              {/* Threshold Guide Lines */}
              {(predictiveView === 'both' || predictiveView === 'temp') && (
                <div className="absolute top-[48%] left-0 right-0 border-b border-dashed border-amber-500/50 pointer-events-none z-10 flex justify-end pr-2">
                  <span className="text-[9px] font-mono text-amber-300 bg-slate-950/90 px-1 rounded border border-amber-500/30">
                    38°C Warning Threshold
                  </span>
                </div>
              )}

              {(predictiveView === 'both' || predictiveView === 'hr') && (
                <div className="absolute top-[38%] left-0 right-0 border-b border-dashed border-rose-500/50 pointer-events-none z-10 flex justify-end pr-2">
                  <span className="text-[9px] font-mono text-rose-300 bg-slate-950/90 px-1 rounded border border-rose-500/30">
                    120 bpm Warning Threshold
                  </span>
                </div>
              )}

              {/* SVG Curve Plot */}
              <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="w-full h-full overflow-visible relative z-20">
                <defs>
                  <linearGradient id="tempEnvelope" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="hrEnvelope" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Grid Horizontals */}
                <line x1="0" y1="45" x2="600" y2="45" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="95" x2="600" y2="95" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="145" x2="600" y2="145" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

                {/* 1. TEMPERATURE FORECAST CURVES */}
                {(predictiveView === 'both' || predictiveView === 'temp') && (() => {
                  const getTempY = (v: number) => 200 - ((Math.min(50, Math.max(25, v)) - 25) / 25) * 170 - 15;

                  // Past line: from recent history data
                  const pastPoints = recentWindow.slice(-6);
                  const pastCoords = pastPoints.map((pt, idx) => {
                    const x = (idx / (pastPoints.length - 1)) * 100;
                    const y = getTempY(pt.temperature);
                    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }).join(' ');

                  // Future points at 0, 3, 6, 9, 12, 15 min
                  const futureCoords = forecastTimes.map((t, idx) => {
                    const x = 100 + (idx / (forecastTimes.length - 1)) * 500;
                    const y = getTempY(predictedTempSeries[idx]);
                    return { x, y, val: predictedTempSeries[idx], t };
                  });

                  // Upper & Lower Confidence Bounds for shaded envelope
                  const upperCoords = forecastTimes.map((t, idx) => {
                    const x = 100 + (idx / (forecastTimes.length - 1)) * 500;
                    const valUpper = predictedTempSeries[idx] + (t * 0.12);
                    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${getTempY(valUpper).toFixed(1)}`;
                  });

                  const lowerCoords = forecastTimes.slice().reverse().map((t, idx) => {
                    const revIdx = forecastTimes.length - 1 - idx;
                    const x = 100 + (revIdx / (forecastTimes.length - 1)) * 500;
                    const valLower = predictedTempSeries[revIdx] - (t * 0.12);
                    return `L ${x.toFixed(1)} ${getTempY(valLower).toFixed(1)}`;
                  });

                  const envelopePath = `${upperCoords.join(' ')} ${lowerCoords.join(' ')} Z`;
                  const futureLinePath = futureCoords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');

                  return (
                    <g key="temp-forecast">
                      {/* Uncertainty cone */}
                      <path d={envelopePath} fill="url(#tempEnvelope)" />

                      {/* Past Actual Line */}
                      <path d={pastCoords} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

                      {/* Future Predicted Dashed Trendline */}
                      <path
                        d={futureLinePath}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.8"
                        strokeDasharray="6 4"
                      />

                      {/* Checkpoint Dots */}
                      {futureCoords.map((pt, i) => (
                        <g key={i}>
                          <circle cx={pt.x} cy={pt.y} r={i === 0 ? 4 : 3.5} fill="#f59e0b" />
                          <circle cx={pt.x} cy={pt.y} r={i === 0 ? 7 : 5} fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
                          {i > 0 && i % 2 === 1 && (
                            <text
                              x={pt.x}
                              y={pt.y - 8}
                              textAnchor="middle"
                              fill="#fde68a"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {pt.val.toFixed(1)}°
                            </text>
                          )}
                        </g>
                      ))}
                    </g>
                  );
                })()}

                {/* 2. HEART RATE FORECAST CURVES */}
                {(predictiveView === 'both' || predictiveView === 'hr') && (() => {
                  const getHrY = (v: number) => 200 - ((Math.min(160, Math.max(50, v)) - 50) / 110) * 170 - 15;

                  const pastPoints = recentWindow.slice(-6);
                  const pastCoords = pastPoints.map((pt, idx) => {
                    const x = (idx / (pastPoints.length - 1)) * 100;
                    const y = getHrY(pt.heartRate);
                    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }).join(' ');

                  const futureCoords = forecastTimes.map((t, idx) => {
                    const x = 100 + (idx / (forecastTimes.length - 1)) * 500;
                    const y = getHrY(predictedHrSeries[idx]);
                    return { x, y, val: predictedHrSeries[idx], t };
                  });

                  const futureLinePath = futureCoords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');

                  return (
                    <g key="hr-forecast">
                      <path d={pastCoords} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                      <path
                        d={futureLinePath}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.8"
                        strokeDasharray="6 4"
                      />
                      {futureCoords.map((pt, i) => (
                        <g key={i}>
                          <circle cx={pt.x} cy={pt.y} r={i === 0 ? 4 : 3.5} fill="#f43f5e" />
                          {i > 0 && i % 2 === 1 && (
                            <text
                              x={pt.x}
                              y={pt.y + 12}
                              textAnchor="middle"
                              fill="#fda4af"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {pt.val} bpm
                            </text>
                          )}
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>

              {/* Bottom Time Axis Labels */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1">
                <span>-2m (Past)</span>
                <span className="text-cyan-400 font-bold ml-12">0m (Now)</span>
                <span>+3 min</span>
                <span>+6 min</span>
                <span>+9 min</span>
                <span>+12 min</span>
                <span className="text-purple-300 font-bold">+15 min Horizon</span>
              </div>
            </div>

            {/* Bottom 3 Insight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              {/* Card 1: Rate of Change */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Slope Rate (dy/dt)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Temp Drift:</span>
                  <span className={`font-bold ${tempSlopePerMin > 0.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {tempSlopePerMin >= 0 ? '+' : ''}{tempSlopePerMin.toFixed(2)} °C/min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">HR Drift:</span>
                  <span className={`font-bold ${hrSlopePerMin > 1.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {hrSlopePerMin >= 0 ? '+' : ''}{hrSlopePerMin.toFixed(1)} bpm/min
                  </span>
                </div>
              </div>

              {/* Card 2: 15-Minute Projected Endpoint */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Projected at +15 Min
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Forecast Temp:</span>
                  <span className={`font-bold ${finalTemp15 >= thresholds.tempWarning ? 'text-red-400' : 'text-amber-300'}`}>
                    {finalTemp15.toFixed(1)}°C <span className="text-[10px] text-slate-500">({curTemp.toFixed(1)}°C now)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Forecast HR:</span>
                  <span className={`font-bold ${finalHr15 >= thresholds.hrHighWarning ? 'text-red-400' : 'text-rose-300'}`}>
                    {finalHr15} bpm <span className="text-[10px] text-slate-500">({curHr} now)</span>
                  </span>
                </div>
              </div>

              {/* Card 3: Actionable Preventive Recommendation */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  Preventive Protocol
                </span>
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  {tempTimeToWarn
                    ? `Warning threshold (38°C) reachable in ~${tempTimeToWarn} min. Advise worker to initiate hydration break before minute +8.`
                    : hrTimeToWarn
                    ? `Cardiac strain trend suggests rate breach in ~${hrTimeToWarn} min. Advise easing pace or adjusting gear.`
                    : `Thermal and cardiovascular trajectory stable. Vitals projected to remain securely inside OSHA certified margins.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
