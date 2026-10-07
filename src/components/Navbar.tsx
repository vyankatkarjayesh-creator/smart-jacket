import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Radio, 
  Volume2, 
  VolumeX, 
  AlertOctagon, 
  Cpu, 
  Clock, 
  Wifi, 
  Sun, 
  Moon,
  Flame,
  UserX,
  Thermometer,
  Activity,
  RotateCcw
} from 'lucide-react';
import { ScenarioType } from '../types/sensors';
import { soundEngine } from '../services/sensorSimulator';

interface NavbarProps {
  onTriggerScenario: (scenario: ScenarioType) => void;
  activeScenario: ScenarioType;
  onEmergencySOS: () => void;
  onOpenHardwareModal: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onTriggerScenario,
  activeScenario,
  onEmergencySOS,
  onOpenHardwareModal,
  isSoundMuted,
  onToggleSound,
  theme,
  onToggleTheme,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [packetCount, setPacketCount] = useState<number>(1420);
  const [ping, setPing] = useState<number>(24);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const packetInterval = setInterval(() => {
      setPacketCount((prev) => prev + 1);
      setPing(Math.floor(18 + Math.random() * 12));
    }, 2000);
    return () => clearInterval(packetInterval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/40">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-emerald-500/50 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base lg:text-lg flex items-center gap-1.5 font-['Chakra_Petch',sans-serif]">
                SmartGuard <span className="text-emerald-400 font-semibold">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 hidden sm:inline-block">
                IoT Core v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Smart Safety Jacket Real-time Monitoring & Bio-Telemetry
            </p>
          </div>
        </div>

        {/* Center: Live Clock & Network Telemetry */}
        <div className="hidden xl:flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-100 font-semibold">{timeStr}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{dateStr}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-medium">Online (MQTT/Mesh)</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{ping}ms</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{packetCount} pkts</span>
          </div>
        </div>

        {/* Right: Simulation Controls, SOS & Tools */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Quick Scenario Simulator Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 font-medium hidden sm:inline">Scenario:</span>
              <button
                onClick={() => onTriggerScenario('normal')}
                title="Normal Safe Operation"
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                  activeScenario === 'normal'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden md:inline">Normal</span>
              </button>

              <button
                onClick={() => onTriggerScenario('gas_leak')}
                title="Simulate Gas Leak (CO/Methane spike)"
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                  activeScenario === 'gas_leak'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span className="hidden md:inline">Gas Leak</span>
              </button>

              <button
                onClick={() => onTriggerScenario('fall_detected')}
                title="Simulate Fall Impact"
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                  activeScenario === 'fall_detected'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                    : 'text-red-400/80 hover:text-red-300'
                }`}
              >
                <UserX className="w-3 h-3" />
                <span className="hidden md:inline">Fall</span>
              </button>

              <button
                onClick={() => onTriggerScenario('high_temperature')}
                title="Simulate Heat Stroke (46°C)"
                className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                  activeScenario === 'high_temperature'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <Thermometer className="w-3 h-3" />
                <span className="hidden lg:inline">Heat</span>
              </button>

              <button
                onClick={() => onTriggerScenario('low_spo2')}
                title="Simulate Hypoxia (Low SpO2)"
                className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                  activeScenario === 'low_spo2'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                    : 'text-cyan-400/80 hover:text-cyan-300'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span className="hidden lg:inline">SpO2</span>
              </button>
            </div>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              if (isSoundMuted) soundEngine.playWarningChirp();
            }}
            title={isSoundMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center justify-center ${
              isSoundMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Connect Real Hardware Modal Button */}
          <button
            onClick={onOpenHardwareModal}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 hover:text-cyan-300 transition-all text-xs flex items-center gap-1.5"
            title="Connect Real Hardware (ESP32 / MQTT / Firebase)"
          >
            <Cpu className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">Connect HW</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to High-Contrast Light' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Critical Emergency SOS Button */}
          <button
            onClick={onEmergencySOS}
            className="relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-950/60 border border-red-400/40 transition-all active:scale-95 animate-pulse"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span className="font-['Chakra_Petch',sans-serif]">SOS Alert</span>
          </button>
        </div>
      </div>
    </header>
  );
};
