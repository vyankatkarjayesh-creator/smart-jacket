import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  PhoneCall, 
  Radio, 
  ShieldAlert, 
  MapPin, 
  Heart, 
  Clock, 
  CheckCircle2, 
  X,
  Volume2
} from 'lucide-react';
import { WorkerProfile, SensorData, AlertItem } from '../types/sensors';
import { soundEngine } from '../services/sensorSimulator';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  sensorData: SensorData;
  alert?: AlertItem;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  worker,
  sensorData,
  alert,
}) => {
  const [etaSeconds, setEtaSeconds] = useState<number>(148);
  const [radioActive, setRadioActive] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    soundEngine.playCriticalAlarm();
    setTimeout(() => soundEngine.playRadioSquawk(), 800);

    const timer = setInterval(() => {
      setEtaSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(etaSeconds / 60);
  const seconds = etaSeconds % 60;
  const etaFormatted = `0${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Blinking Top Hazard Bar */}
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between font-bold uppercase tracking-wider font-['Chakra_Petch',sans-serif]">
          <div className="flex items-center gap-2 text-sm">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <span>CRITICAL CODE RED &bull; EMERGENCY DISPATCH</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-red-700/80 hover:bg-red-800 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Dispatch Status Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-red-500/40 space-y-2">
            <div className="flex items-center justify-between text-red-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Radio className="w-4 h-4 animate-pulse" />
                <span>FIRST RESPONDERS DISPATCHED</span>
              </span>
              <span className="text-emerald-400">STATUS: EN ROUTE</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px]">ASSIGNED UNIT</span>
                <span className="font-bold text-white">HazMat Trauma Squad 02</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ESTIMATED ARRIVAL</span>
                <span className="font-bold text-amber-400 text-sm">{etaFormatted} min</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">RADIO LINK</span>
                <span className="text-cyan-400 font-bold">462.5625 MHz (CH 01)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">INCIDENT COMMAND</span>
                <span className="text-slate-200">Sector Control Dispatch</span>
              </div>
            </div>
          </div>

          {/* Worker Telemetry Snapshot */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-slate-300 font-bold font-sans flex items-center justify-between pb-1 border-b border-slate-800">
              <span>Patient Telemetry Packet</span>
              <span className="text-red-400 font-mono text-xs">{worker.bloodType} Blood</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">WORKER</span>
                <span className="font-bold">{worker.name} ({worker.workerId})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">LOCATION</span>
                <span className="text-cyan-400 truncate block">{worker.site}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">HEART RATE / SPO2</span>
                <span className="text-rose-400 font-bold">
                  {sensorData.heartRate} bpm &bull; {sensorData.spO2}% SpO2
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">GAS LEVEL / TEMP</span>
                <span className="text-amber-400 font-bold">
                  {sensorData.gasLevel.toFixed(1)} ppm &bull; {sensorData.temperature.toFixed(1)}°C
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">GPS RTK COORDINATES</span>
                <span className="text-emerald-400">
                  {sensorData.latitude.toFixed(6)}° N, {sensorData.longitude.toFixed(6)}° W
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                soundEngine.playRadioSquawk();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all text-xs"
            >
              Stand Down / False Alarm
            </button>
            <button
              onClick={() => {
                soundEngine.playRadioSquawk();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Broadcast Evac Horn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
