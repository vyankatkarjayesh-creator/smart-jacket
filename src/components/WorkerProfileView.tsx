import React from 'react';
import { 
  UserCheck, 
  MapPin, 
  Clock, 
  Battery, 
  Wifi, 
  ShieldCheck, 
  Award, 
  FileText, 
  Phone, 
  Calendar, 
  Heart, 
  Thermometer, 
  Activity, 
  HardHat, 
  AlertTriangle 
} from 'lucide-react';
import { WorkerProfile, SensorData, Thresholds } from '../types/sensors';

interface WorkerProfileViewProps {
  worker: WorkerProfile;
  sensorData: SensorData;
  thresholds: Thresholds;
  onCallEmergency: () => void;
}

export const WorkerProfileView: React.FC<WorkerProfileViewProps> = ({
  worker,
  sensorData,
  thresholds,
  onCallEmergency,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 lg:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={worker.avatar}
              alt={worker.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/80 shadow-xl"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white font-['Chakra_Petch',sans-serif]">
                  {worker.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-mono text-xs">
                  {worker.workerId}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                    sensorData.status === 'DANGER'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                      : sensorData.status === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {sensorData.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {worker.department} &bull; {worker.site}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {worker.shift}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-xs">
                <span className="text-slate-400">
                  Assigned Jacket: <strong className="text-emerald-400">{worker.jacketId}</strong>
                </span>
                <span className="text-slate-400">
                  Blood Group: <strong className="text-rose-400">{worker.bloodType}</strong>
                </span>
                <span className="text-slate-400">
                  Signal: <strong className="text-cyan-400">{worker.signalStrength} dBm</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onCallEmergency}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all active:scale-95 shrink-0"
          >
            <Phone className="w-4 h-4" />
            <span>Emergency Broadcast</span>
          </button>
        </div>
      </div>

      {/* Grid of Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Equipment Assigned */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider font-mono pb-2 border-b border-slate-800">
            <HardHat className="w-4 h-4 text-emerald-400" />
            <span>Equipped PPE & Hardware</span>
          </div>

          <div className="space-y-2.5 font-mono text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Smart Safety Jacket Pro</span>
                <span className="text-slate-500">SN: {worker.jacketId}</span>
              </div>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Industrial Hard Hat w/ Beacon</span>
                <span className="text-slate-500">Impact Class E & G</span>
              </div>
              <span className="text-emerald-400 font-bold">Verified</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">3M Versaflo SCBA Respirator</span>
                <span className="text-slate-500">HEPA + Organic Vapor Cartridge</span>
              </div>
              <span className="text-emerald-400 font-bold">Fitted</span>
            </div>
          </div>
        </div>

        {/* Card 2: Current Vitals vs Baseline */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider font-mono pb-2 border-b border-slate-800">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Physiological Baseline</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-slate-400">Heart Rate</span>
              <span className="text-white font-bold">
                {sensorData.heartRate} bpm <span className="text-slate-500">(Resting: 68 bpm)</span>
              </span>
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-slate-400">SpO2 Oxygen</span>
              <span className="text-white font-bold">
                {sensorData.spO2}% <span className="text-slate-500">(Normal: 98%)</span>
              </span>
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-slate-400">Microclimate Temp</span>
              <span className="text-white font-bold">
                {sensorData.temperature.toFixed(1)}°C <span className="text-slate-500">(Baseline: 32°C)</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Safety Score</span>
              <span className="text-emerald-400 font-bold">
                {sensorData.safetyScore} / 100
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Safety Certifications & Contact */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider font-mono pb-2 border-b border-slate-800">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Training & Emergency Contact</span>
          </div>

          <div className="space-y-2.5 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">EMERGENCY DISPATCH</span>
              <span className="text-white font-bold block">{worker.emergencyContact}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase">CERTIFICATIONS</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                  OSHA 30 Confined Space
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                  HazMat Level II
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400">
                  First Aid / CPR Certified
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-slate-500 block text-[10px] uppercase">LAST MEDICAL SCREENING</span>
              <span className="text-slate-300">September 14, 2026 (Fit for Duty)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
