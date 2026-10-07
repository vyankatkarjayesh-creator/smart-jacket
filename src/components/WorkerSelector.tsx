import React from 'react';
import { 
  Users, 
  Battery, 
  Wifi, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  HardHat,
  ChevronDown
} from 'lucide-react';
import { WorkerProfile, WorkerStatus, SensorData } from '../types/sensors';

interface WorkerSelectorProps {
  workers: WorkerProfile[];
  selectedWorkerId: string;
  onSelectWorker: (workerId: string) => void;
  currentSensorData: SensorData;
  allWorkersData: Record<string, SensorData>;
}

export const WorkerSelector: React.FC<WorkerSelectorProps> = ({
  workers,
  selectedWorkerId,
  onSelectWorker,
  currentSensorData,
  allWorkersData,
}) => {
  const currentWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];

  const getStatusBadge = (status: WorkerStatus) => {
    switch (status) {
      case 'SAFE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold font-mono uppercase bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SAFE
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold font-mono uppercase bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            WARNING
          </span>
        );
      case 'DANGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold font-mono uppercase bg-red-500/25 border border-red-500/60 text-red-400 animate-danger-glow">
            <XCircle className="w-3.5 h-3.5" />
            DANGER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold font-mono uppercase bg-slate-800 border border-slate-700 text-slate-400">
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Worker Info Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Avatar with status indicator ring */}
          <div className="relative">
            <img
              src={currentWorker.avatar}
              alt={currentWorker.name}
              className={`w-16 h-16 rounded-2xl object-cover border-2 shadow-md ${
                currentSensorData.status === 'DANGER'
                  ? 'border-red-500 animate-danger-glow'
                  : currentSensorData.status === 'WARNING'
                  ? 'border-amber-500'
                  : 'border-emerald-500/60'
              }`}
            />
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                currentSensorData.status === 'DANGER'
                  ? 'bg-red-500'
                  : currentSensorData.status === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            >
              <HardHat className="w-3 h-3 text-slate-950" />
            </span>
          </div>

          {/* Details */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight font-['Chakra_Petch',sans-serif]">
                {currentWorker.name}
              </h2>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs">
                {currentWorker.workerId}
              </span>
              {getStatusBadge(currentSensorData.status)}
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {currentWorker.department} &bull; {currentWorker.site}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {currentWorker.shift}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
              <span className="text-slate-400">
                Jacket ID: <strong className="text-emerald-400 font-semibold">{currentWorker.jacketId}</strong>
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                {currentWorker.batteryLevel}% Battery
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                {currentWorker.signalStrength} dBm
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-400">
                Blood: <strong className="text-rose-400">{currentWorker.bloodType}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Worker Switcher Dropdown */}
        <div className="w-full lg:w-72 flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Switch Active Worker
            </span>
            <span className="text-[11px] text-slate-500">5 Available</span>
          </label>

          <div className="relative">
            <select
              value={selectedWorkerId}
              onChange={(e) => onSelectWorker(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500/80 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-200 outline-none transition-all cursor-pointer appearance-none shadow-inner"
            >
              {workers.map((worker) => {
                const wData = allWorkersData[worker.id];
                const statusSymbol =
                  wData?.status === 'DANGER' ? '🔴 DANGER' : wData?.status === 'WARNING' ? '🟡 WARN' : '🟢 SAFE';
                return (
                  <option key={worker.id} value={worker.id} className="bg-slate-900 text-slate-200 py-1">
                    {worker.name} ({worker.workerId}) — [{statusSymbol}]
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
