import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { Cpu, MemoryStick, Users, GitBranch, Activity, AlertTriangle, Shield, ShieldCheck } from 'lucide-react';
import ResourceCard from '../components/ResourceCard';
import { monitoringService } from '../services/monitoringService';
import { ProcessInfo, SystemResources, HistoryPoint, DeadlockResult } from '../types';

export default function Dashboard() {
  const [resources, setResources] = useState<SystemResources>(monitoringService.getSystemResources());
  const [processes, setProcesses] = useState<ProcessInfo[]>(monitoringService.getProcesses());
  const [cpuHistory, setCpuHistory] = useState<HistoryPoint[]>([]);
  const [memHistory, setMemHistory] = useState<HistoryPoint[]>([]);
  const [deadlockStatus, setDeadlockStatus] = useState<DeadlockResult>(monitoringService.getDeadlockStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      monitoringService.update();
      setResources(monitoringService.getSystemResources());
      setProcesses(monitoringService.getProcesses());
      setCpuHistory(monitoringService.getCpuHistory());
      setMemHistory(monitoringService.getMemHistory());
      setDeadlockStatus(monitoringService.getDeadlockStatus());
    }, 1000);

    // Initial data
    setCpuHistory(monitoringService.getCpuHistory());
    setMemHistory(monitoringService.getMemHistory());

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMinutes()}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'R': return 'text-emerald-400';
      case 'S': return 'text-blue-400';
      case 'D': return 'text-yellow-400';
      case 'Z': return 'text-red-400';
      case 'T': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'R': return 'Running';
      case 'S': return 'Sleeping';
      case 'D': return 'Disk Wait';
      case 'Z': return 'Zombie';
      case 'T': return 'Stopped';
      default: return 'Unknown';
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-auto h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Overview</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Real-time Linux process and resource monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`badge ${deadlockStatus.status === 'DEADLOCK' ? 'badge-danger' : 'badge-safe'}`}>
            {deadlockStatus.status === 'DEADLOCK' ? (
              <><AlertTriangle size={12} className="mr-1" /> DEADLOCK</>
            ) : (
              <><ShieldCheck size={12} className="mr-1" /> SAFE</>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <div className="pulse-dot bg-emerald-500"></div>
            Live
          </div>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceCard
          title="CPU Usage"
          value={resources.cpu}
          unit="%"
          percentage={resources.cpu}
          color={resources.cpu > 80 ? '#ef4444' : resources.cpu > 60 ? '#f59e0b' : '#3b82f6'}
          icon={<Cpu size={18} />}
        />
        <ResourceCard
          title="Memory Usage"
          value={resources.memory}
          unit="%"
          percentage={resources.memory}
          color={resources.memory > 80 ? '#ef4444' : resources.memory > 60 ? '#f59e0b' : '#8b5cf6'}
          icon={<MemoryStick size={18} />}
        />
        <ResourceCard
          title="Processes"
          value={resources.processCount}
          icon={<Users size={18} />}
        />
        <ResourceCard
          title="Threads"
          value={resources.threadCount}
          icon={<GitBranch size={18} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 flex items-center gap-2">
            <Activity size={14} /> CPU History (60s)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={cpuHistory.map(p => ({ time: formatTime(p.time), value: p.value }))}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5c', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#cpuGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 flex items-center gap-2">
            <MemoryStick size={14} /> Memory History (60s)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={memHistory.map(p => ({ time: formatTime(p.time), value: p.value }))}>
              <defs>
                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5c', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#memGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Process Table + Deadlock Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Process Table */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-4 flex items-center gap-2">
            <Cpu size={14} /> Process Monitor
          </h3>
          <div className="overflow-auto max-h-[340px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1a2235]">
                <tr className="text-left text-[#64748b] text-xs uppercase">
                  <th className="pb-2 pr-4">PID</th>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">State</th>
                  <th className="pb-2 pr-4">CPU</th>
                  <th className="pb-2 pr-4">Memory</th>
                  <th className="pb-2">Threads</th>
                </tr>
              </thead>
              <tbody>
                {processes.slice(0, 15).map(proc => (
                  <tr key={proc.pid} className="table-row border-t border-[#2a3a5c]/50">
                    <td className="py-2 pr-4 text-[#94a3b8] font-mono text-xs">{proc.pid}</td>
                    <td className="py-2 pr-4 text-white font-medium">{proc.name}</td>
                    <td className="py-2 pr-4">
                      <span className={`${getStateColor(proc.state)} text-xs font-mono`}>
                        {proc.state} <span className="text-[#64748b] hidden sm:inline">({getStateLabel(proc.state)})</span>
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#0a0e1a] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, proc.cpu * 5)}%`,
                              background: proc.cpu > 10 ? '#ef4444' : proc.cpu > 5 ? '#f59e0b' : '#3b82f6'
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#94a3b8]">{proc.cpu.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-[#94a3b8] text-xs">{proc.memory.toFixed(0)} MB</td>
                    <td className="py-2 text-[#94a3b8] text-xs">{proc.threads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deadlock Status Panel */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-4 flex items-center gap-2">
            <Shield size={14} /> Deadlock Status
          </h3>
          
          <div className={`p-4 rounded-lg mb-4 ${
            deadlockStatus.status === 'DEADLOCK' 
              ? 'bg-red-500/10 border border-red-500/30' 
              : 'bg-emerald-500/10 border border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {deadlockStatus.status === 'DEADLOCK' ? (
                <AlertTriangle size={20} className="text-red-400" />
              ) : (
                <ShieldCheck size={20} className="text-emerald-400" />
              )}
              <span className={`font-bold ${
                deadlockStatus.status === 'DEADLOCK' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {deadlockStatus.status === 'DEADLOCK' ? 'DEADLOCK DETECTED' : 'NO DEADLOCK'}
              </span>
            </div>
            {deadlockStatus.status === 'DEADLOCK' && (
              <div className="mt-2">
                <p className="text-xs text-[#94a3b8] mb-1">Cycle:</p>
                <p className="text-xs text-red-300 font-mono">{deadlockStatus.cycle.join(' → ')}</p>
                <p className="text-xs text-[#64748b] mt-2">
                  Processes: {deadlockStatus.affectedProcesses.join(', ')}
                </p>
                <p className="text-xs text-[#64748b]">
                  Resources: {deadlockStatus.affectedResources.join(', ')}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Detection Time</span>
              <span className="text-white font-mono text-xs">{deadlockStatus.message.match(/\(([^)]+)\)/)?.[1] || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Monitored Resources</span>
              <span className="text-white font-mono text-xs">{monitoringService.getResources().length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Active Allocations</span>
              <span className="text-white font-mono text-xs">{monitoringService.getDeadlockGraph().edges.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Algorithm</span>
              <span className="text-white font-mono text-xs">DFS Cycle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
