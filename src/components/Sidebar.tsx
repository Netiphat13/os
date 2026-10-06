import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  HardDrive, 
  AlertTriangle, 
  Activity, 
  Settings,
  Shield,
  Zap
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/processes', label: 'Processes', icon: Cpu },
  { path: '/resources', label: 'Resources', icon: HardDrive },
  { path: '/deadlock', label: 'Deadlock Analyzer', icon: AlertTriangle },
  { path: '/performance', label: 'Performance', icon: Activity },
  { path: '/alerts', label: 'Alerts', icon: Zap },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-screen flex flex-col border-r border-[#2a3a5c] bg-[#111827]">
      {/* Logo */}
      <div className="p-5 border-b border-[#2a3a5c]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">OS Guardian</h1>
            <p className="text-xs text-[#64748b]">System Monitor v1.0</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-3 border-b border-[#2a3a5c]">
        <div className="flex items-center gap-2">
          <div className="pulse-dot bg-emerald-500"></div>
          <span className="text-sm text-emerald-400 font-medium">MONITORING</span>
        </div>
        <p className="text-xs text-[#64748b] mt-1">Real-time active</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <div
              key={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#2a3a5c]">
        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <Settings size={14} />
          <span>Linux x86_64</span>
        </div>
        <p className="text-xs text-[#475569] mt-1">Refresh: 1s interval</p>
      </div>
    </aside>
  );
}
