import React, { useState } from 'react';
import { Activity, Play, BarChart3, Clock, Cpu, MemoryStick } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { monitoringService } from '../services/monitoringService';
import { PerformanceResult } from '../types';

export default function Performance() {
  const [results, setResults] = useState<PerformanceResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testCounts = [10, 50, 100, 200, 500];

  const runBenchmark = () => {
    setIsRunning(true);
    setResults([]);

    // Run benchmarks sequentially with small delays for UI updates
    const runSequential = async () => {
      const allResults: PerformanceResult[] = [];
      
      for (const count of testCounts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const benchmarkResults = monitoringService.runBenchmark([count]);
        allResults.push(...benchmarkResults);
        setResults([...allResults]);
      }
      
      setIsRunning(false);
    };

    runSequential();
  };

  return (
    <div className="p-6 space-y-6 h-screen overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Testing</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Deadlock detection performance evaluation with controlled scenarios
          </p>
        </div>
        <button
          onClick={runBenchmark}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isRunning
              ? 'bg-[#1a2235] text-[#64748b] border border-[#2a3a5c] cursor-not-allowed'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
          }`}
        >
          <Play size={14} />
          {isRunning ? 'Running...' : 'Run Benchmark'}
        </button>
      </div>

      {/* Test Configuration */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">Test Scenarios</h3>
        <div className="grid grid-cols-5 gap-3">
          {testCounts.map(count => (
            <div key={count} className="p-3 bg-[#0a0e1a] rounded-lg text-center">
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-[#64748b]">processes</p>
              <p className="text-xs text-[#475569] mt-1">{Math.floor(count * 0.6)} resources</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-4 flex items-center gap-2">
            <BarChart3 size={14} /> Benchmark Results
          </h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#64748b] text-xs uppercase border-b border-[#2a3a5c]">
                  <th className="pb-3 pr-4">Processes</th>
                  <th className="pb-3 pr-4">Detection Time</th>
                  <th className="pb-3 pr-4">CPU Usage</th>
                  <th className="pb-3 pr-4">Memory Usage</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr key={idx} className="table-row border-t border-[#2a3a5c]/50">
                    <td className="py-3 pr-4">
                      <span className="text-white font-bold">{result.processCount}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-blue-400" />
                        <span className="text-blue-400 font-mono">{result.detectionTime.toFixed(3)} ms</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Cpu size={12} className="text-emerald-400" />
                        <span className="text-emerald-400 font-mono">{result.cpuUsage.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <MemoryStick size={12} className="text-purple-400" />
                        <span className="text-purple-400 font-mono">{result.memoryUsage.toFixed(2)} MB</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="badge badge-safe">PASS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">
              Processes vs Detection Time
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" />
                <XAxis
                  dataKey="processCount"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a3a5c' }}
                  label={{ value: 'Processes', position: 'bottom', fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a3a5c' }}
                  label={{ value: 'Time (ms)', angle: -90, position: 'left', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5c', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="detectionTime"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Detection Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">
              Processes vs CPU Usage
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" />
                <XAxis
                  dataKey="processCount"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a3a5c' }}
                  label={{ value: 'Processes', position: 'bottom', fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a3a5c' }}
                  label={{ value: 'CPU %', angle: -90, position: 'left', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5c', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="cpuUsage" fill="#10b981" radius={[4, 4, 0, 0]} name="CPU Usage (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Algorithm Description */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">Algorithm Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0a0e1a] rounded-lg">
            <p className="text-xs text-[#64748b] mb-2">Time Complexity</p>
            <p className="text-lg font-mono text-blue-400">O(V + E)</p>
            <p className="text-xs text-[#94a3b8] mt-1">DFS traversal visits each vertex and edge once</p>
          </div>
          <div className="p-4 bg-[#0a0e1a] rounded-lg">
            <p className="text-xs text-[#64748b] mb-2">Space Complexity</p>
            <p className="text-lg font-mono text-purple-400">O(V)</p>
            <p className="text-xs text-[#94a3b8] mt-1">Recursion stack and visited set proportional to vertices</p>
          </div>
          <div className="p-4 bg-[#0a0e1a] rounded-lg">
            <p className="text-xs text-[#64748b] mb-2">Graph Conversion</p>
            <p className="text-lg font-mono text-emerald-400">O(P × R)</p>
            <p className="text-xs text-[#94a3b8] mt-1">RAG → Wait-for Graph conversion</p>
          </div>
        </div>
      </div>

      {/* Initial state message */}
      {results.length === 0 && !isRunning && (
        <div className="card text-center py-12">
          <Activity size={40} className="text-[#2a3a5c] mx-auto mb-3" />
          <p className="text-sm text-[#64748b]">Click "Run Benchmark" to start performance testing</p>
          <p className="text-xs text-[#475569] mt-1">Tests deadlock detection with 10, 50, 100, 200, and 500 processes</p>
        </div>
      )}
    </div>
  );
}
