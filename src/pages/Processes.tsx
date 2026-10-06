import React, { useState, useEffect } from 'react';
import { Cpu, Search, ArrowUpDown, ChevronRight, X } from 'lucide-react';
import { monitoringService } from '../services/monitoringService';
import { ProcessInfo } from '../types';

export default function Processes() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof ProcessInfo>('cpu');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedProcess, setSelectedProcess] = useState<ProcessInfo | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      monitoringService.update();
      setProcesses(monitoringService.getProcesses());
      if (selectedProcess) {
        const updated = monitoringService.getProcess(selectedProcess.pid);
        if (updated) setSelectedProcess(updated);
      }
    }, 1000);
    setProcesses(monitoringService.getProcesses());
    return () => clearInterval(interval);
  }, [selectedProcess]);

  const filtered = processes
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.pid.toString().includes(search) ||
      p.command.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const handleSort = (key: keyof ProcessInfo) => {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'R': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'S': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'D': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Z': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'T': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'R': return 'Running';
      case 'S': return 'Sleeping';
      case 'D': return 'Disk Wait (Uninterruptible)';
      case 'Z': return 'Zombie';
      case 'T': return 'Stopped';
      default: return 'Unknown';
    }
  };

  const formatRuntime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="p-6 space-y-6 h-screen overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Process Monitor</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Real-time Linux process monitoring via /proc filesystem
          </p>
        </div>
        <div className="text-sm text-[#64748b]">
          {filtered.length} processes
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          placeholder="Search by PID, name, or command..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#1a2235] border border-[#2a3a5c] rounded-lg text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Process Table */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-260px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1a2235] z-10">
                <tr className="text-left text-[#64748b] text-xs uppercase">
                  {[
                    { key: 'pid', label: 'PID' },
                    { key: 'name', label: 'Name' },
                    { key: 'state', label: 'State' },
                    { key: 'cpu', label: 'CPU' },
                    { key: 'memory', label: 'Memory' },
                    { key: 'threads', label: 'Threads' },
                  ].map(col => (
                    <th
                      key={col.key}
                      className="pb-3 pr-4 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort(col.key as keyof ProcessInfo)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown size={10} />
                      </div>
                    </th>
                  ))}
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(proc => (
                  <tr
                    key={proc.pid}
                    className={`table-row border-t border-[#2a3a5c]/50 cursor-pointer ${
                      selectedProcess?.pid === proc.pid ? 'bg-blue-500/10' : ''
                    }`}
                    onClick={() => setSelectedProcess(proc)}
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-[#94a3b8]">{proc.pid}</td>
                    <td className="py-2.5 pr-4">
                      <div>
                        <span className="text-white font-medium">{proc.name}</span>
                        <p className="text-xs text-[#64748b] truncate max-w-[200px]">{proc.command}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge text-xs border ${getStateColor(proc.state)}`}>
                        {proc.state}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-[#0a0e1a] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, proc.cpu * 5)}%`,
                              background: proc.cpu > 10 ? '#ef4444' : proc.cpu > 5 ? '#f59e0b' : '#3b82f6'
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#94a3b8] w-12">{proc.cpu.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-[#94a3b8] text-xs">{proc.memory.toFixed(0)} MB</td>
                    <td className="py-2.5 pr-4 text-[#94a3b8] text-xs">{proc.threads}</td>
                    <td className="py-2.5">
                      <ChevronRight size={14} className="text-[#64748b]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Detail Panel */}
        <div className="card">
          {selectedProcess ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#94a3b8]">Process Details</h3>
                <button onClick={() => setSelectedProcess(null)} className="text-[#64748b] hover:text-white">
                  <X size={16} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-[#0a0e1a] rounded-lg">
                  <p className="text-xs text-[#64748b]">PID</p>
                  <p className="text-lg font-mono text-white">{selectedProcess.pid}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-[#0a0e1a] rounded-lg">
                    <p className="text-xs text-[#64748b]">Name</p>
                    <p className="text-sm text-white font-medium">{selectedProcess.name}</p>
                  </div>
                  <div className="p-2 bg-[#0a0e1a] rounded-lg">
                    <p className="text-xs text-[#64748b]">PPID</p>
                    <p className="text-sm text-white font-mono">{selectedProcess.ppid}</p>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0e1a] rounded-lg">
                  <p className="text-xs text-[#64748b]">State</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge border ${getStateColor(selectedProcess.state)}`}>
                      {selectedProcess.state}
                    </span>
                    <span className="text-xs text-[#94a3b8]">{getStateLabel(selectedProcess.state)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-[#0a0e1a] rounded-lg">
                    <p className="text-xs text-[#64748b]">CPU Usage</p>
                    <p className="text-sm text-blue-400 font-bold">{selectedProcess.cpu.toFixed(1)}%</p>
                  </div>
                  <div className="p-2 bg-[#0a0e1a] rounded-lg">
                    <p className="text-xs text-[#64748b]">Memory</p>
                    <p className="text-sm text-purple-400 font-bold">{selectedProcess.memory.toFixed(0)} MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-[#0a0e1a] rounded-lg">
                    <p className="text-xs text-[#64748b]">Threads</p>
                    <p className="text-sm text-white font-bold">{selectedProcess.threads}</p>
                  </div>
                  <div className="p-2 bg-[#0a0e1a] rounded-lg">
                    <p className="text-xs text-[#64748b]">Runtime</p>
                    <p className="text-sm text-white font-bold">{formatRuntime(selectedProcess.runtime)}</p>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0e1a] rounded-lg">
                  <p className="text-xs text-[#64748b]">Command</p>
                  <p className="text-xs text-white font-mono mt-1 break-all">{selectedProcess.command}</p>
                </div>

                <div className="p-3 bg-[#0a0e1a] rounded-lg">
                  <p className="text-xs text-[#64748b]">Start Time</p>
                  <p className="text-xs text-white font-mono mt-1">
                    {new Date(selectedProcess.startTime).toLocaleString()}
                  </p>
                </div>

                {/* Thread list */}
                <div className="p-3 bg-[#0a0e1a] rounded-lg">
                  <p className="text-xs text-[#64748b] mb-2">Threads (simulated)</p>
                  <div className="space-y-1 max-h-32 overflow-auto">
                    {Array.from({ length: Math.min(selectedProcess.threads, 8) }, (_, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-[#94a3b8] font-mono">TID: {selectedProcess.pid * 100 + i}</span>
                        <span className={`${i === 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {i === 0 ? 'main' : `worker-${i}`}
                        </span>
                      </div>
                    ))}
                    {selectedProcess.threads > 8 && (
                      <p className="text-xs text-[#64748b]">+{selectedProcess.threads - 8} more threads...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Cpu size={40} className="text-[#2a3a5c] mb-3" />
              <p className="text-sm text-[#64748b]">Select a process to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
