import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Info, Trash2, Bell, BellOff } from 'lucide-react';
import { monitoringService } from '../services/monitoringService';
import { Alert } from '../types';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(monitoringService.getAlerts());

  useEffect(() => {
    const interval = setInterval(() => {
      monitoringService.update();
      setAlerts(monitoringService.getAlerts());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'CRITICAL': return <AlertTriangle size={16} className="text-red-400" />;
      case 'WARNING': return <Zap size={16} className="text-yellow-400" />;
      case 'INFO': return <Info size={16} className="text-blue-400" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'CRITICAL': return 'border-red-500/30 bg-red-500/5';
      case 'WARNING': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'INFO': return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  const clearAlerts = () => {
    monitoringService.clearAlerts();
    setAlerts([]);
  };

  return (
    <div className="p-6 space-y-6 h-screen overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alert History</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            System alerts for CPU, memory, and deadlock events
          </p>
        </div>
        <button
          onClick={clearAlerts}
          className="flex items-center gap-2 px-3 py-2 bg-[#1a2235] border border-[#2a3a5c] rounded-lg text-sm text-[#94a3b8] hover:text-white hover:border-red-500/50 transition-colors"
        >
          <Trash2 size={14} />
          Clear All
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-[#64748b] mb-1">Total Alerts</p>
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[#64748b] mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-400">
            {alerts.filter(a => a.type === 'CRITICAL').length}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[#64748b] mb-1">Warnings</p>
          <p className="text-2xl font-bold text-yellow-400">
            {alerts.filter(a => a.type === 'WARNING').length}
          </p>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="card text-center py-12">
            <BellOff size={40} className="text-[#2a3a5c] mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">No alerts yet</p>
            <p className="text-xs text-[#475569] mt-1">Alerts will appear when thresholds are exceeded</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`card border ${getAlertColor(alert.type)}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${
                      alert.type === 'CRITICAL' ? 'badge-danger' :
                      alert.type === 'WARNING' ? 'badge-warning' : 'badge-safe'
                    }`}>
                      {alert.type}
                    </span>
                    <span className="text-sm font-medium text-white">{alert.message}</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] whitespace-pre-line">{alert.details}</p>
                </div>
                <span className="text-xs text-[#64748b] font-mono">{formatTime(alert.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Threshold Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">Alert Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-[#0a0e1a] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={12} className="text-yellow-400" />
              <span className="text-xs text-[#64748b]">High CPU</span>
            </div>
            <p className="text-sm text-white">CPU &gt; 80%</p>
          </div>
          <div className="p-3 bg-[#0a0e1a] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={12} className="text-yellow-400" />
              <span className="text-xs text-[#64748b]">High Memory</span>
            </div>
            <p className="text-sm text-white">Memory &gt; 80%</p>
          </div>
          <div className="p-3 bg-[#0a0e1a] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={12} className="text-red-400" />
              <span className="text-xs text-[#64748b]">Deadlock</span>
            </div>
            <p className="text-sm text-white">Any cycle detected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
