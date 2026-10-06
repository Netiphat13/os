import React, { useState, useEffect } from 'react';
import { HardDrive, Cpu, MemoryStick, Wifi, FileText, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { monitoringService } from '../services/monitoringService';
import { SystemResources, HistoryPoint, Resource } from '../types';
import ResourceCard from '../components/ResourceCard';

export default function Resources() {
  const [resources, setResources] = useState<SystemResources>(monitoringService.getSystemResources());
  const [sysResources, setSysResources] = useState<Resource[]>(monitoringService.getResources());
  const [cpuHistory, setCpuHistory] = useState<HistoryPoint[]>([]);
  const [memHistory, setMemHistory] = useState<HistoryPoint[]>([]);
  const [procHistory, setProcHistory] = useState<HistoryPoint[]>([]);
  const [threadHistory, setThreadHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      monitoringService.update();
      setResources(monitoringService.getSystemResources());
      setSysResources(monitoringService.getResources());
      setCpuHistory(monitoringService.getCpuHistory());
      setMemHistory(monitoringService.getMemHistory());
      setProcHistory(monitoringService.getProcessHistory());
      setThreadHistory(monitoringService.getThreadHistory());
    }, 1000);

    setCpuHistory(monitoringService.getCpuHistory());
    setMemHistory(monitoringService.getMemHistory());
    setProcHistory(monitoringService.getProcessHistory());
    setThreadHistory(monitoringService.getThreadHistory());

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMinutes()}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'mutex': return <FileText size={14} className="text-yellow-400" />;
      case 'semaphore': return <Database size={14} className="text-blue-400" />;
      case 'file': return <FileText size={14} className="text-green-400" />;
      case 'network': return <Wifi size={14} className="text-purple-400" />;
      case 'memory': return <MemoryStick size={14} className="text-red-400" />;
      default: return <HardDrive size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 h-screen overflow-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">System Resources</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Real-time system resource monitoring from /proc/stat, /proc/meminfo
        </p>
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
          title="Disk Usage"
          value={resources.diskUsage}
          unit="%"
          percentage={resources.diskUsage}
          color="#f59e0b"
          icon={<HardDrive size={18} />}
        />
        <ResourceCard
          title="Open Files"
          value={resources.openFiles}
          icon={<FileText size={18} />}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-[#64748b] mb-1">Processes</p>
          <p className="text-2xl font-bold text-white">{resources.processCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[#64748b] mb-1">Threads</p>
          <p className="text-2xl font-bold text-white">{resources.threadCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[#64748b] mb-1">Network RX</p>
          <p className="text-2xl font-bold text-emerald-400">{(resources.networkRx / 1024).toFixed(1)}<span className="text-xs text-[#64748b]"> KB/s</span></p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-[#64748b] mb-1">Network TX</p>
          <p className="text-2xl font-bold text-blue-400">{(resources.networkTx / 1024).toFixed(1)}<span className="text-xs text-[#64748b]"> KB/s</span></p>
        </div>
      </div>

      {/* History Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">CPU Usage History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={cpuHistory.map(p => ({ time: formatTime(p.time), value: p.value }))}>
              <defs>
                <linearGradient id="cpuGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5c', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#cpuGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">Memory Usage History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={memHistory.map(p => ({ time: formatTime(p.time), value: p.value }))}>
              <defs>
                <linearGradient id="memGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5c', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#memGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">Process Count History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={procHistory.map(p => ({ time: formatTime(p.time), value: p.value }))}>
              <defs>
                <linearGradient id="procGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5c', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#procGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">Thread Count History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={threadHistory.map(p => ({ time: formatTime(p.time), value: p.value }))}>
              <defs>
                <linearGradient id="threadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5c', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#threadGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Allocation Resources Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[#94a3b8] mb-4">Resource Allocation Model (Deadlock Analysis)</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#64748b] text-xs uppercase border-b border-[#2a3a5c]">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2 pr-4">Available</th>
                <th className="pb-2 pr-4">Allocated</th>
                <th className="pb-2">Requested</th>
              </tr>
            </thead>
            <tbody>
              {sysResources.map(r => (
                <tr key={r.id} className="table-row border-t border-[#2a3a5c]/50">
                  <td className="py-2.5 pr-4 font-mono text-xs text-[#94a3b8]">{r.id}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(r.type)}
                      <span className="text-white">{r.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="badge bg-[#0a0e1a] text-xs text-[#94a3b8] border border-[#2a3a5c]">{r.type}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-white font-mono">{r.totalInstances}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`font-mono ${r.availableInstances > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.availableInstances}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-white font-mono">{r.allocatedInstances}</td>
                  <td className="py-2.5">
                    <span className={`font-mono ${r.requestedInstances > 0 ? 'text-yellow-400' : 'text-[#64748b]'}`}>
                      {r.requestedInstances}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
