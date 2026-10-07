import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  ArrowUpDown, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { HistoryRecord, WorkerProfile, SensorData } from '../types/sensors';

interface HistoryViewProps {
  records: HistoryRecord[];
  workers: WorkerProfile[];
  currentSensorData: SensorData;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  workers,
  currentSensorData,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Filter records
  const filtered = records.filter((rec) => {
    if (workerFilter !== 'all' && rec.workerId !== workerFilter) return false;
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rec.workerName.toLowerCase().includes(q) ||
        rec.motion.toLowerCase().includes(q) ||
        (rec.triggeredAlert && rec.triggeredAlert.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Compute summary stats
  const totalLogs = records.length;
  const peakGas = records.reduce((max, r) => Math.max(max, r.gasLevel), 0);
  const maxTemp = records.reduce((max, r) => Math.max(max, r.temperature), 0);
  const avgSafetyScore = records.length > 0
    ? Math.round(records.reduce((acc, r) => acc + r.safetyScore, 0) / records.length)
    : 100;

  // CSV Export functionality
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      'Record ID',
      'Timestamp',
      'Worker Name',
      'Worker ID',
      'Status',
      'Safety Score',
      'Temperature (°C)',
      'Humidity (%)',
      'Gas Level (ppm)',
      'Heart Rate (bpm)',
      'SpO2 (%)',
      'Motion State',
      'Latitude',
      'Longitude',
      'Triggered Alert',
    ];

    const rows = records.map((r) => [
      r.id,
      `"${r.timestamp}"`,
      `"${r.workerName}"`,
      r.workerId,
      r.status,
      r.safetyScore,
      r.temperature.toFixed(1),
      Math.round(r.humidity),
      r.gasLevel.toFixed(1),
      r.heartRate,
      r.spO2,
      `"${r.motion}"`,
      r.latitude.toFixed(5),
      r.longitude.toFixed(5),
      `"${r.triggeredAlert || 'Nominal'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartguard_telemetry_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-['Chakra_Petch',sans-serif] flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Historical Telemetry Logs & Compliance Audit
          </h3>
          <p className="text-xs text-slate-400">
            Time-series sensor telemetry, breach occurrences, and worker audit trails
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset history logs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards & Current vs Historical Comparison */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400 text-[10px] uppercase block">TOTAL LOGS</span>
          <span className="text-xl font-bold text-white font-['Chakra_Petch',sans-serif]">
            {totalLogs}
          </span>
          <span className="text-slate-400 text-[10px] block mt-0.5">Continuous buffer</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400 text-[10px] uppercase block">AVG SAFETY SCORE</span>
          <span className="text-xl font-bold text-emerald-400 font-['Chakra_Petch',sans-serif]">
            {avgSafetyScore}/100
          </span>
          <span className="text-slate-400 text-[10px] block mt-0.5">Current: {currentSensorData.safetyScore}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400 text-[10px] uppercase block">PEAK GAS (CO/CH4)</span>
          <span className="text-xl font-bold text-amber-400 font-['Chakra_Petch',sans-serif]">
            {peakGas.toFixed(1)} ppm
          </span>
          <span className="text-slate-400 text-[10px] block mt-0.5">Now: {currentSensorData.gasLevel.toFixed(1)} ppm</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400 text-[10px] uppercase block">MAX CORE TEMP</span>
          <span className="text-xl font-bold text-rose-400 font-['Chakra_Petch',sans-serif]">
            {maxTemp.toFixed(1)}°C
          </span>
          <span className="text-slate-400 text-[10px] block mt-0.5">Now: {currentSensorData.temperature.toFixed(1)}°C</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Worker filter */}
          <select
            value={workerFilter}
            onChange={(e) => {
              setWorkerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
          >
            <option value="all">All Workers</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="SAFE">SAFE Only</option>
            <option value="WARNING">WARNING Only</option>
            <option value="DANGER">DANGER Only</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* History Records Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Worker</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Score</th>
              <th className="py-2.5 px-3">Temp</th>
              <th className="py-2.5 px-3">Hum</th>
              <th className="py-2.5 px-3">Gas (ppm)</th>
              <th className="py-2.5 px-3">HR</th>
              <th className="py-2.5 px-3">SpO2</th>
              <th className="py-2.5 px-3">Motion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  No historical records matching criteria.
                </td>
              </tr>
            ) : (
              paginated.map((rec) => {
                const isDanger = rec.status === 'DANGER';
                const isWarning = rec.status === 'WARNING';

                return (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isDanger ? 'bg-red-500/5' : isWarning ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {rec.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap font-sans">
                      {rec.workerName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isDanger
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">
                      {rec.safetyScore}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400">
                      {rec.temperature.toFixed(1)}°C
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {Math.round(rec.humidity)}%
                    </td>
                    <td className="py-2.5 px-3 text-orange-400 font-bold">
                      {rec.gasLevel.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-rose-400">
                      {rec.heartRate} bpm
                    </td>
                    <td className="py-2.5 px-3 text-cyan-400">
                      {rec.spO2}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      {rec.motion}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
        <span>
          Showing page {currentPage} of {totalPages} ({filtered.length} total entries)
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
