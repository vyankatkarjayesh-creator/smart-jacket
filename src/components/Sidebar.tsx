import React from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  MapPin, 
  Bell, 
  ShieldCheck, 
  History, 
  Cpu, 
  BatteryCharging, 
  RadioTower, 
  SlidersHorizontal 
} from 'lucide-react';

export type NavTab = 'dashboard' | 'profile' | 'map' | 'alerts' | 'rules' | 'history';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadAlertCount: number;
  criticalAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadAlertCount,
  criticalAlertCount,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile' as NavTab, label: 'Worker Profile', icon: UserCheck },
    { id: 'map' as NavTab, label: 'Live Map', icon: MapPin },
    { 
      id: 'alerts' as NavTab, 
      label: 'Alerts', 
      icon: Bell, 
      badge: unreadAlertCount, 
      criticalBadge: criticalAlertCount 
    },
    { id: 'rules' as NavTab, label: 'Safety Rules', icon: ShieldCheck },
    { id: 'history' as NavTab, label: 'History', icon: History },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 transition-colors">
      <div className="p-3 lg:p-4 space-y-4">
        {/* Navigation list */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2 font-mono">
            Command Center
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                        item.criticalBadge && item.criticalBadge > 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick System Telemetry Status Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2.5 font-mono">
          <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-300 font-sans font-semibold">
              <RadioTower className="w-3.5 h-3.5 text-cyan-400" /> Mesh Gateway
            </span>
            <span className="text-emerald-400 text-[11px]">Synced</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div>
              <span className="text-slate-400 block text-[10px]">PROTOCOL</span>
              <span className="text-slate-200 font-medium">LoRa 868MHz</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">FREQ CH</span>
              <span className="text-slate-200 font-medium">Ch 04 (Dual)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">CYCLE RATE</span>
              <span className="text-cyan-400 font-medium">2.0 sec</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ACTIVE JACKETS</span>
              <span className="text-emerald-400 font-medium">5 / 5 online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Firmware & Hardware Version Footer */}
      <div className="p-3 lg:p-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>FW: v3.2.1-SmartOS</span>
        </div>
        <span className="text-emerald-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          Ready
        </span>
      </div>
    </aside>
  );
};
