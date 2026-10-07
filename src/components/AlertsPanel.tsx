import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  Check, 
  X, 
  PhoneCall, 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCheck, 
  Clock, 
  Trash2 
} from 'lucide-react';
import { AlertItem } from '../types/sensors';
import { soundEngine } from '../services/sensorSimulator';

interface AlertsPanelProps {
  alerts: AlertItem[];
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onCallEmergency: (alert?: AlertItem) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAcknowledge,
  onDismiss,
  onClearAll,
  onCallEmergency,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alert.workerName.toLowerCase().includes(q) ||
        alert.sensor.toLowerCase().includes(q) ||
        alert.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.dismissed).length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' && !a.dismissed).length;

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-['Chakra_Petch',sans-serif] flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Real-Time Incident & Alert Center
            </h3>
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold uppercase bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse">
                {criticalCount} Critical
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Real-time sensor breach logging, biometric alarms, and triage dispatch
          </p>
        </div>

        {/* Action button to trigger emergency response */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCallEmergency()}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 shadow-md shadow-red-950/40 transition-all active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Emergency</span>
          </button>

          {alerts.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Clear all alerts"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterSeverity === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilterSeverity('critical')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterSeverity === 'critical'
                ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40'
                : 'text-red-400/80 hover:text-red-300'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilterSeverity('warning')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterSeverity === 'warning'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            Warning ({warningCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search alerts or worker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
            <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
            <p className="text-sm font-semibold text-slate-300">No active incidents</p>
            <p className="text-xs text-slate-500">
              All worker safety telemetry remains inside certified operating thresholds.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all text-xs ${
                  isCritical
                    ? 'bg-red-500/10 border-red-500/60 shadow-lg shadow-red-950/30'
                    : isWarning
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-950/20'
                    : 'bg-slate-950/70 border-slate-800'
                } ${alert.acknowledged ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {isCritical ? (
                      <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}

                    <span className="font-bold text-white font-['Chakra_Petch',sans-serif]">
                      {alert.workerName}
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-slate-300 font-mono font-semibold">
                      {alert.sensor} ({alert.value})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{alert.timestamp}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${
                        isCritical
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </div>

                {/* Message & Contextual Action */}
                <div className="pt-2 pb-2 space-y-1">
                  <p className="text-slate-200 font-medium">{alert.message}</p>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">Action Protocol:</span>
                    {alert.recommendation}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-mono">
                  <div className="text-[11px] text-slate-500">
                    {alert.acknowledged ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Acknowledged by Command
                      </span>
                    ) : (
                      <span className="text-amber-400">Pending Operator Ack</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => {
                          onAcknowledge(alert.id);
                          soundEngine.playWarningChirp();
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-1 text-[11px]"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    <button
                      onClick={() => onCallEmergency(alert)}
                      className="px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white font-bold transition-all flex items-center gap-1 text-[11px]"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Dispatch</span>
                    </button>

                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                      title="Dismiss alert"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
