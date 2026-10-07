import React, { useState } from 'react';
import { 
  ShieldCheck, 
  HardHat, 
  Flame, 
  Thermometer, 
  AlertTriangle, 
  Compass, 
  Heart, 
  CheckCircle2, 
  AlertOctagon, 
  Sparkles, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SensorData, Thresholds } from '../types/sensors';

interface SafetyRulesSectionProps {
  currentSensorData: SensorData;
  thresholds: Thresholds;
}

interface SafetyRule {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  oshaStandard: string;
  isTriggered: (data: SensorData, thresholds: Thresholds) => boolean;
  emergencyAction: string;
}

const SAFETY_RULES: SafetyRule[] = [
  {
    id: 'rule-gas',
    category: 'ATMOSPHERIC HAZARDS',
    title: 'Avoid Unventilated Gas Pockets & Follow Windward Exit',
    description: 'Mandatory SCBA respirators required when approaching Sector 4 & 7. Never enter hydrocarbon pits alone.',
    icon: Flame,
    oshaStandard: 'OSHA 1910.146 Confined Spaces',
    isTriggered: (d, t) => d.gasLevel >= t.gasWarning,
    emergencyAction: '🚨 EMERGENCY PROTOCOL ACTIVE: Gas concentration breached safe limit! Evacuate IMMEDIATELY upwind toward Muster Point Alpha. Do NOT operate uncertified electronics.',
  },
  {
    id: 'rule-fall',
    category: 'FALL PROTECTION & DECELERATION',
    title: 'Mandatory Harness Tie-Off & Impact Deceleration Watch',
    description: 'All elevated riggers must maintain double-lanyard 100% tie-off. Smart jacket IMU monitors g-force deceleration.',
    icon: HardHat,
    oshaStandard: 'OSHA 1926.502 Fall Protection',
    isTriggered: (d) => d.motion === 'Fall Detected',
    emergencyAction: '🚨 CRITICAL MAN-DOWN PROTOCOL ACTIVE: Fall shockwave detected! Alert Site Paramedic Unit 1. Do not move spine/neck unless imminent fire/gas danger.',
  },
  {
    id: 'rule-heat',
    category: 'HEAT ILLNESS & THERMAL RECOVERY',
    title: 'Mandatory Hydration & Cooling Breaks Above 38°C',
    description: 'When jacket internal microclimate exceeds 38°C, worker must rotate into misted cooling shelters every 45 minutes.',
    icon: Thermometer,
    oshaStandard: 'OSHA Heat Injury Prevention Standard',
    isTriggered: (d, t) => d.temperature >= t.tempWarning,
    emergencyAction: '⚠️ HEAT STRAIN ACTIVE: Temperature threshold breached. Cease high-exertion tasks. Consume electrolyte hydration and transition to air-cooled refuge.',
  },
  {
    id: 'rule-vitals',
    category: 'PHYSIOLOGICAL EXERTION',
    title: 'Monitor Cardiac Strain & Arterial Oxygen Depletion',
    description: 'Sustained heart rate above 120 bpm or SpO2 dropping below 94% indicates acute fatigue or toxic atmospheric displacement.',
    icon: Heart,
    oshaStandard: 'ACGIH Physical Agents & Strain Guide',
    isTriggered: (d, t) => d.heartRate > t.hrHighWarning || d.spO2 < t.spo2Warning,
    emergencyAction: '⚠️ BIO-DEFICIT ACTIVE: Elevated heart rate / low oxygen detected. Sit down in upright position and practice deep cyclic breathing.',
  },
  {
    id: 'rule-jacket',
    category: 'PPE INTEGRITY & CALIBRATION',
    title: 'Fasten Smart Jacket Latches & Verify LoRa Connection',
    description: 'All 3 chest and torso clips must remain locked. Check green status LED on shoulder epaulette before entering perimeter.',
    icon: ShieldCheck,
    oshaStandard: 'ANSI/ISEA 107 High-Visibility Safety Apparel',
    isTriggered: (d) => d.faultStatus.hasFault,
    emergencyAction: '⚠️ HARDWARE ALERT: Sensor bus or battery deviation flagged. Contact Tooling Room #4 for rapid module swap.',
  },
  {
    id: 'rule-evac',
    category: 'EVACUATION & MUSTER',
    title: 'Facility Emergency Evacuation Route Guidelines',
    description: 'In event of site-wide horn or flashing beacon, proceed strictly along illuminated green emergency egress lines to Assembly Alpha.',
    icon: Compass,
    oshaStandard: 'NFPA 101 Life Safety Code',
    isTriggered: () => false,
    emergencyAction: 'Proceed in orderly group formation. Announce worker badge at RFID muster reader.',
  },
];

export const SafetyRulesSection: React.FC<SafetyRulesSectionProps> = ({
  currentSensorData,
  thresholds,
}) => {
  const [checkedRules, setCheckedRules] = useState<Record<string, boolean>>({
    'rule-jacket': true,
    'rule-fall': true,
  });

  const toggleCheck = (id: string) => {
    setCheckedRules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Find any active contextual emergency rule
  const activeTriggeredRules = SAFETY_RULES.filter((rule) =>
    rule.isTriggered(currentSensorData, thresholds)
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-['Chakra_Petch',sans-serif] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Industrial Safety Compliance & Operational Standard Operating Procedures
          </h3>
          <p className="text-xs text-slate-400">
            OSHA, NFPA & ANSI certified safety protocols with automated dynamic context injection
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
          OSHA 1910/1926 Compliant
        </span>
      </div>

      {/* DYNAMIC CONTEXTUAL ALERT BANNER (Triggers automatically when sensor alert occurs) */}
      {activeTriggeredRules.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/15 border-2 border-red-500/80 shadow-2xl shadow-red-950/50 space-y-2 animate-pulse">
          <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            <span>DYNAMIC CONTEXTUAL SAFETY PROTOCOL TRIGGERED</span>
          </div>
          {activeTriggeredRules.map((rule) => (
            <div key={rule.id} className="text-sm font-semibold text-white space-y-1">
              <p>{rule.emergencyAction}</p>
              <div className="text-xs font-mono text-slate-300">
                Standard: <span className="text-emerald-400">{rule.oshaStandard}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {SAFETY_RULES.map((rule) => {
          const Icon = rule.icon;
          const isTriggered = rule.isTriggered(currentSensorData, thresholds);
          const isChecked = !!checkedRules[rule.id];

          return (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                isTriggered
                  ? 'bg-red-500/10 border-red-500/80 shadow-md ring-1 ring-red-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isTriggered
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-900 border border-slate-800 text-emerald-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                        {rule.category}
                      </span>
                      <h4 className="font-bold text-slate-100 text-xs font-['Chakra_Petch',sans-serif]">
                        {rule.title}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleCheck(rule.id)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isChecked
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                    }`}
                    title="Mark verified"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">{rule.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 font-mono text-[11px]">
                <span className="text-slate-500">{rule.oshaStandard}</span>
                <span className={isChecked ? 'text-emerald-400' : 'text-slate-500'}>
                  {isChecked ? '✓ Verified' : '○ Pending Check'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
