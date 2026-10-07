/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertOctagon, 
  X, 
  PhoneCall, 
  CheckCircle2, 
  Volume2, 
  Radio, 
  Flame, 
  AlertTriangle 
} from 'lucide-react';
import { 
  WorkerProfile, 
  SensorData, 
  Thresholds, 
  ScenarioType, 
  AlertItem, 
  HistoryRecord 
} from './types/sensors';
import { 
  SAMPLE_WORKERS, 
  DEFAULT_THRESHOLDS, 
  generateSensorData, 
  soundEngine 
} from './services/sensorSimulator';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { WorkerSelector } from './components/WorkerSelector';
import { SensorCardsGrid } from './components/SensorCardsGrid';
import { SafetyScoreCard } from './components/SafetyScoreCard';
import { SmartJacketDiagram } from './components/SmartJacketDiagram';
import { LiveCharts } from './components/LiveCharts';
import { LiveMap } from './components/LiveMap';
import { AlertsPanel } from './components/AlertsPanel';
import { SafetyRulesSection } from './components/SafetyRulesSection';
import { HistoryView } from './components/HistoryView';
import { WorkerProfileView } from './components/WorkerProfileView';
import { EmergencyModal } from './components/EmergencyModal';
import { HardwareConnectionModal } from './components/HardwareConnectionModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('w1');
  const [thresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('normal');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals state
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);
  const [emergencyAlertTarget, setEmergencyAlertTarget] = useState<AlertItem | undefined>(undefined);

  // Workers Data state
  const [allWorkersData, setAllWorkersData] = useState<Record<string, SensorData>>(() => {
    const initial: Record<string, SensorData> = {};
    SAMPLE_WORKERS.forEach((w) => {
      initial[w.id] = generateSensorData(w.id, null, 'normal', DEFAULT_THRESHOLDS);
    });
    return initial;
  });

  // History time-series buffers per worker
  const [historyBuffers, setHistoryBuffers] = useState<Record<string, SensorData[]>>(() => {
    const initial: Record<string, SensorData[]> = {};
    SAMPLE_WORKERS.forEach((w) => {
      const data = generateSensorData(w.id, null, 'normal', DEFAULT_THRESHOLDS);
      initial[w.id] = [data];
    });
    return initial;
  });

  // System Alerts state
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alt-init-1',
      workerId: 'w4',
      workerName: 'Priya Sharma',
      timestamp: new Date(Date.now() - 360000).toLocaleTimeString(),
      sensor: 'Gas Sensor',
      value: '42.1 ppm',
      severity: 'warning',
      message: 'Approaching volatile hydrocarbon vapor alert limit in Vault 7.',
      recommendation: 'Check cartridge seal on SCBA mask and remain upwind.',
      acknowledged: false,
      dismissed: false,
    },
  ]);

  // Toast notifications for new events
  const [activeToast, setActiveToast] = useState<AlertItem | null>(null);

  // Global historical audit records (for History table and CSV export)
  const [auditRecords, setAuditRecords] = useState<HistoryRecord[]>(() => {
    const initList: HistoryRecord[] = [];
    const now = Date.now();
    SAMPLE_WORKERS.forEach((w, idx) => {
      initList.push({
        id: `rec-seed-${idx}`,
        timestamp: new Date(now - (idx + 1) * 60000).toLocaleTimeString(),
        workerId: w.id,
        workerName: w.name,
        temperature: 33.2 + idx * 0.8,
        humidity: 55 + idx * 4,
        gasLevel: 14.5 + idx * 2,
        heartRate: 74 + idx * 3,
        spO2: 98,
        motion: 'Walking',
        safetyScore: 96,
        status: 'SAFE',
        latitude: 37.7785,
        longitude: -122.4150,
      });
    });
    return initList;
  });

  // Main 2-second Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAllWorkersData((prevWorkers) => {
        const nextWorkers: Record<string, SensorData> = {};

        SAMPLE_WORKERS.forEach((worker) => {
          const prev = prevWorkers[worker.id];
          // If this worker is selected, apply scenario; otherwise normal
          const scenarioToUse = worker.id === selectedWorkerId ? activeScenario : 'normal';
          const updated = generateSensorData(worker.id, prev, scenarioToUse, thresholds);
          nextWorkers[worker.id] = updated;

          // Check if new alert should be raised
          if (updated.status === 'DANGER' && (!prev || prev.status !== 'DANGER')) {
            soundEngine.playCriticalAlarm();

            let reason = 'Hazard Threshold Exceeded';
            let rec = 'Evacuate area immediately';
            let sensorName = 'Hazard Cluster';
            let sensorVal = `${updated.safetyScore}/100`;

            if (updated.motion === 'Fall Detected') {
              reason = 'Man-Down Impact Detected (IMU > 6G)';
              rec = 'Dispatch emergency trauma medical unit';
              sensorName = 'Kinetic IMU';
              sensorVal = 'Impact Deceleration';
            } else if (updated.gasLevel >= thresholds.gasDanger) {
              reason = `Critical Gas Exposure (${updated.gasLevel.toFixed(1)} ppm)`;
              rec = 'Evacuate upwind to Safe Muster Point Alpha';
              sensorName = 'Gas Sniffer';
              sensorVal = `${updated.gasLevel.toFixed(1)} ppm`;
            } else if (updated.temperature >= thresholds.tempDanger) {
              reason = `Thermal Overload Hazard (${updated.temperature.toFixed(1)}°C)`;
              rec = 'Cease operations; transition to mist cooling tent';
              sensorName = 'Temperature';
              sensorVal = `${updated.temperature.toFixed(1)}°C`;
            } else if (updated.spO2 < thresholds.spo2Danger) {
              reason = `Acute Hypoxia (${updated.spO2}% SpO2)`;
              rec = 'Administer pressurized oxygen immediately';
              sensorName = 'SpO2 Oximeter';
              sensorVal = `${updated.spO2}%`;
            }

            const newAlert: AlertItem = {
              id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              workerId: worker.id,
              workerName: worker.name,
              timestamp: new Date().toLocaleTimeString(),
              sensor: sensorName,
              value: sensorVal,
              severity: 'critical',
              message: reason,
              recommendation: rec,
              acknowledged: false,
              dismissed: false,
            };

            setAlerts((a) => [newAlert, ...a.slice(0, 49)]);
            setActiveToast(newAlert);
          } else if (updated.status === 'WARNING' && (!prev || prev.status === 'SAFE')) {
            soundEngine.playWarningChirp();

            const warnAlert: AlertItem = {
              id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              workerId: worker.id,
              workerName: worker.name,
              timestamp: new Date().toLocaleTimeString(),
              sensor: 'Warning Threshold',
              value: `${updated.safetyScore}/100`,
              severity: 'warning',
              message: `Cautionary elevation detected in ${worker.name}'s safety envelope.`,
              recommendation: 'Monitor vitals closely and verify ventilation.',
              acknowledged: false,
              dismissed: false,
            };

            setAlerts((a) => [warnAlert, ...a.slice(0, 49)]);
            setActiveToast(warnAlert);
          }
        });

        return nextWorkers;
      });

      // Update sliding history buffers & audit table
      setHistoryBuffers((prev) => {
        const next: Record<string, SensorData[]> = {};
        SAMPLE_WORKERS.forEach((w) => {
          const cur = allWorkersData[w.id];
          if (cur) {
            const list = prev[w.id] || [];
            next[w.id] = [...list.slice(-30), cur];
          }
        });
        return next;
      });

      // Append periodic entry to audit history
      const currentWorkerData = allWorkersData[selectedWorkerId];
      const curWorker = SAMPLE_WORKERS.find((w) => w.id === selectedWorkerId);
      if (currentWorkerData && curWorker) {
        setAuditRecords((prev) => [
          {
            id: `rec-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            workerId: curWorker.id,
            workerName: curWorker.name,
            temperature: currentWorkerData.temperature,
            humidity: currentWorkerData.humidity,
            gasLevel: currentWorkerData.gasLevel,
            heartRate: currentWorkerData.heartRate,
            spO2: currentWorkerData.spO2,
            motion: currentWorkerData.motion,
            safetyScore: currentWorkerData.safetyScore,
            status: currentWorkerData.status,
            latitude: currentWorkerData.latitude,
            longitude: currentWorkerData.longitude,
          },
          ...prev.slice(0, 199),
        ]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedWorkerId, activeScenario, thresholds, allWorkersData]);

  // Current active worker object & data
  const currentWorker = SAMPLE_WORKERS.find((w) => w.id === selectedWorkerId) || SAMPLE_WORKERS[0];
  const currentSensorData =
    allWorkersData[selectedWorkerId] ||
    generateSensorData(selectedWorkerId, null, 'normal', thresholds);
  const currentWorkerHistory = historyBuffers[selectedWorkerId] || [currentSensorData];

  // Danger banner condition: Any worker in DANGER status
  const dangerWorkers = SAMPLE_WORKERS.filter(
    (w) => allWorkersData[w.id]?.status === 'DANGER'
  );
  const hasGlobalDanger = dangerWorkers.length > 0;

  // Sound Engine Mute toggle
  const handleToggleSound = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    soundEngine.setMuted(next);
  };

  // SOS Emergency Trigger
  const handleEmergencySOS = () => {
    setActiveScenario('fall_detected');
    soundEngine.playCriticalAlarm();
    setIsEmergencyModalOpen(true);
  };

  const handleCallEmergency = (alert?: AlertItem) => {
    setEmergencyAlertTarget(alert);
    setIsEmergencyModalOpen(true);
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearAllAlerts = () => {
    setAlerts([]);
  };

  // Auto dismiss toast after 5s
  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => setActiveToast(null), 6000);
    return () => clearTimeout(t);
  }, [activeToast]);

  const unreadAlertCount = alerts.filter((a) => !a.acknowledged && !a.dismissed).length;
  const criticalAlertCount = alerts.filter((a) => a.severity === 'critical' && !a.dismissed).length;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'
    }`}>
      {/* Top Navbar */}
      <Navbar
        onTriggerScenario={setActiveScenario}
        activeScenario={activeScenario}
        onEmergencySOS={handleEmergencySOS}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        isSoundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* BLINKING RED CRITICAL DANGER BANNER (when any worker is in DANGER) */}
      {hasGlobalDanger && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between shadow-xl animate-danger-glow border-b border-red-400">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <span>
              CRITICAL HAZARD DETECTED: {dangerWorkers.map((w) => `${w.name} (${w.workerId})`).join(', ')} in Code Red Danger!
            </span>
          </div>
          <button
            onClick={() => handleCallEmergency()}
            className="px-3 py-1 rounded-md bg-white text-red-600 font-extrabold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency Action</span>
          </button>
        </div>
      )}

      {/* POP-UP TOAST NOTIFICATION */}
      {activeToast && (
        <div className="fixed top-16 right-4 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 ${
              activeToast.severity === 'critical'
                ? 'bg-red-950/90 border-red-500 text-red-100 ring-2 ring-red-500'
                : 'bg-amber-950/90 border-amber-500 text-amber-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertOctagon
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  activeToast.severity === 'critical' ? 'text-red-400 animate-pulse' : 'text-amber-400'
                }`}
              />
              <div className="text-xs">
                <div className="font-bold uppercase font-mono flex items-center gap-2">
                  <span>{activeToast.severity} Alert</span>
                  <span className="text-slate-400">&bull;</span>
                  <span>{activeToast.workerName}</span>
                </div>
                <p className="mt-1 font-medium">{activeToast.message}</p>
                <p className="mt-1 text-[11px] opacity-80">{activeToast.recommendation}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unreadAlertCount={unreadAlertCount}
          criticalAlertCount={criticalAlertCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 space-y-5 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {/* Worker Selector Bar (Visible across main views) */}
          <WorkerSelector
            workers={SAMPLE_WORKERS}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={setSelectedWorkerId}
            currentSensorData={currentSensorData}
            allWorkersData={allWorkersData}
          />

          {/* TAB 1: MAIN DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* Top Row: AI Safety Engine Score + Smart Jacket 3D Diagram */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5">
                  <SafetyScoreCard
                    sensorData={currentSensorData}
                    thresholds={thresholds}
                    insightMessage={
                      currentSensorData.status === 'DANGER'
                        ? 'CRITICAL ALERT: Biometric and gas thresholds breached. Protective protocols in effect.'
                        : currentSensorData.status === 'WARNING'
                        ? 'CAUTION: Microclimate thermal load or gas detection elevated. Hydrate and observe.'
                        : 'NOMINAL SAFETY SCORE: All sensor nodes operating inside safe certified limits.'
                    }
                    predictiveWarning={
                      currentSensorData.temperature > 37
                        ? `Thermal climb rate predicts ${thresholds.tempWarning}°C limit breach within 15 minutes.`
                        : null
                    }
                  />
                </div>

                <div className="lg:col-span-7">
                  <SmartJacketDiagram
                    sensorData={currentSensorData}
                    thresholds={thresholds}
                  />
                </div>
              </div>

              {/* Middle Row: 9 Sensor Cards Grid (Draggable & Rearrangeable) */}
              <SensorCardsGrid
                sensorData={currentSensorData}
                historyData={currentWorkerHistory}
                thresholds={thresholds}
              />

              {/* Bottom Row: Real-Time Charts + Mini Live Map */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7">
                  <LiveCharts
                    historyData={currentWorkerHistory}
                    currentData={currentSensorData}
                    thresholds={thresholds}
                  />
                </div>

                <div className="lg:col-span-5">
                  <LiveMap
                    currentWorker={currentWorker}
                    sensorData={currentSensorData}
                    historyData={currentWorkerHistory}
                    allWorkers={SAMPLE_WORKERS}
                    allWorkersData={allWorkersData}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKER PROFILE */}
          {activeTab === 'profile' && (
            <WorkerProfileView
              worker={currentWorker}
              sensorData={currentSensorData}
              thresholds={thresholds}
              onCallEmergency={() => handleCallEmergency()}
            />
          )}

          {/* TAB 3: LIVE MAP FULL */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <LiveMap
                currentWorker={currentWorker}
                sensorData={currentSensorData}
                historyData={currentWorkerHistory}
                allWorkers={SAMPLE_WORKERS}
                allWorkersData={allWorkersData}
              />
            </div>
          )}

          {/* TAB 4: ALERTS SYSTEM */}
          {activeTab === 'alerts' && (
            <AlertsPanel
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onDismiss={handleDismissAlert}
              onClearAll={handleClearAllAlerts}
              onCallEmergency={handleCallEmergency}
            />
          )}

          {/* TAB 5: SAFETY RULES */}
          {activeTab === 'rules' && (
            <SafetyRulesSection
              currentSensorData={currentSensorData}
              thresholds={thresholds}
            />
          )}

          {/* TAB 6: PREVIOUS DATA HISTORY */}
          {activeTab === 'history' && (
            <HistoryView
              records={auditRecords}
              workers={SAMPLE_WORKERS}
              currentSensorData={currentSensorData}
              onClearHistory={() => setAuditRecords([])}
            />
          )}
        </main>
      </div>

      {/* Emergency Dispatch Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        worker={currentWorker}
        sensorData={currentSensorData}
        alert={emergencyAlertTarget}
      />

      {/* Real Hardware Connection Guide Modal */}
      <HardwareConnectionModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />
    </div>
  );
}
