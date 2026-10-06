import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ShieldCheck, Play, Pause, RefreshCw, GitBranch } from 'lucide-react';
import { monitoringService } from '../services/monitoringService';
import { DeadlockResult, Resource } from '../types';

interface GraphNode {
  id: string;
  label: string;
  type: 'process' | 'resource';
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'holds' | 'requests';
}

export default function DeadlockAnalyzer() {
  const [deadlockStatus, setDeadlockStatus] = useState<DeadlockResult>(monitoringService.getDeadlockStatus());
  const [resources, setResources] = useState<Resource[]>(monitoringService.getResources());
  const [graphData, setGraphData] = useState(monitoringService.getDeadlockGraph());
  const [isRunning, setIsRunning] = useState(true);
  const [viewMode, setViewMode] = useState<'rag' | 'wfg'>('rag');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = 400;
        // Trigger re-render by updating state
        setGraphData(monitoringService.getDeadlockGraph());
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      monitoringService.update();
      setDeadlockStatus(monitoringService.getDeadlockStatus());
      setResources(monitoringService.getResources());
      setGraphData(monitoringService.getDeadlockGraph());
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Draw graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Handle responsive sizing
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = 400;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Layout nodes
    const nodes: GraphNode[] = [];
    const processes = graphData.processes;
    const resourceIds = graphData.resources;

    // Position processes on left side
    processes.forEach((p, i) => {
      nodes.push({
        id: p,
        label: p,
        type: 'process',
        x: viewMode === 'rag' ? 100 : 80 + (i % 3) * 200,
        y: viewMode === 'rag' ? 60 + i * 70 : 60 + Math.floor(i / 3) * 120
      });
    });

    // Position resources on right side (RAG) or mixed (WFG)
    if (viewMode === 'rag') {
      resourceIds.forEach((r, i) => {
        nodes.push({
          id: r,
          label: resources.find(res => res.id === r)?.name || r,
          type: 'resource',
          x: width - 150,
          y: 60 + i * 70
        });
      });
    } else {
      // Wait-for graph: only processes, arranged in circle
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.3;
      processes.forEach((p, i) => {
        const angle = (2 * Math.PI * i) / processes.length - Math.PI / 2;
        nodes.push({
          id: p,
          label: p,
          type: 'process',
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      });
    }

    // Draw edges
    const edges = viewMode === 'rag' ? graphData.edges : 
      Array.from(graphData.waitForGraph.entries()).flatMap(([from, targets]) =>
        targets.map(to => ({ from, to, type: 'requests' as const }))
      );

    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const isInCycle = deadlockStatus.cycle.includes(edge.from) && deadlockStatus.cycle.includes(edge.to);

      ctx.beginPath();
      ctx.strokeStyle = isInCycle ? '#ef4444' : (edge.type === 'holds' ? '#10b981' : '#f59e0b');
      ctx.lineWidth = isInCycle ? 2.5 : 1.5;
      ctx.setLineDash(edge.type === 'requests' ? [5, 5] : []);

      // Draw curved line
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const offsetX = -dy * 0.15;
      const offsetY = dx * 0.15;

      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.quadraticCurveTo(midX + offsetX, midY + offsetY, toNode.x, toNode.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow head
      const angle = Math.atan2(toNode.y - (midY + offsetY), toNode.x - (midX + offsetX));
      const arrowSize = 8;
      ctx.beginPath();
      ctx.fillStyle = isInCycle ? '#ef4444' : (edge.type === 'holds' ? '#10b981' : '#f59e0b');
      ctx.moveTo(toNode.x, toNode.y);
      ctx.lineTo(
        toNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
        toNode.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
        toNode.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    });

    // Draw nodes
    nodes.forEach(node => {
      const isInCycle = deadlockStatus.cycle.includes(node.id);
      const radius = node.type === 'process' ? 28 : 24;

      // Node circle
      ctx.beginPath();
      if (node.type === 'process') {
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isInCycle ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.15)';
        ctx.fill();
        ctx.strokeStyle = isInCycle ? '#ef4444' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Resource as rectangle
        ctx.fillStyle = isInCycle ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.15)';
        ctx.fillRect(node.x - radius, node.y - radius * 0.7, radius * 2, radius * 1.4);
        ctx.strokeStyle = isInCycle ? '#ef4444' : '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.strokeRect(node.x - radius, node.y - radius * 0.7, radius * 2, radius * 1.4);
      }

      // Node label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });

    // Legend
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    
    const legendY = height - 30;
    // Holds
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.moveTo(20, legendY);
    ctx.lineTo(50, legendY);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Holds', 55, legendY + 3);

    // Requests
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(110, legendY);
    ctx.lineTo(140, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Requests', 145, legendY + 3);

    // Cycle
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.moveTo(220, legendY);
    ctx.lineTo(250, legendY);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Deadlock Cycle', 255, legendY + 3);

  }, [graphData, deadlockStatus, viewMode, resources]);

  const toggleDeadlock = () => {
    const isDeadlocked = deadlockStatus.status === 'DEADLOCK';
    monitoringService.toggleDeadlock(!isDeadlocked);
    setDeadlockStatus(monitoringService.getDeadlockStatus());
    setGraphData(monitoringService.getDeadlockGraph());
    setResources(monitoringService.getResources());
  };

  return (
    <div className="p-6 space-y-6 h-screen overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deadlock Analyzer</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Resource Allocation Graph analysis with DFS cycle detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a2235] border border-[#2a3a5c] rounded-lg text-sm text-[#94a3b8] hover:text-white hover:border-blue-500/50 transition-colors"
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={toggleDeadlock}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              deadlockStatus.status === 'DEADLOCK'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            }`}
          >
            <RefreshCw size={14} />
            {deadlockStatus.status === 'DEADLOCK' ? 'Resolve Deadlock' : 'Create Deadlock'}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`card ${
        deadlockStatus.status === 'DEADLOCK' 
          ? 'border-red-500/50 bg-red-500/5' 
          : 'border-emerald-500/50 bg-emerald-500/5'
      }`}>
        <div className="flex items-center gap-4">
          {deadlockStatus.status === 'DEADLOCK' ? (
            <AlertTriangle size={32} className="text-red-400" />
          ) : (
            <ShieldCheck size={32} className="text-emerald-400" />
          )}
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${
              deadlockStatus.status === 'DEADLOCK' ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {deadlockStatus.status === 'DEADLOCK' ? '🔴 DEADLOCK DETECTED' : '🟢 SYSTEM SAFE'}
            </h2>
            <p className="text-sm text-[#94a3b8] mt-1">{deadlockStatus.message}</p>
            {deadlockStatus.status === 'DEADLOCK' && (
              <div className="flex gap-4 mt-2">
                <div>
                  <span className="text-xs text-[#64748b]">Cycle: </span>
                  <span className="text-xs text-red-300 font-mono">{deadlockStatus.cycle.join(' → ')}</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-[#64748b]">Detection Time</p>
            <p className="text-sm text-white font-mono">{deadlockStatus.message.match(/\(([^)]+)\)/)?.[1]}</p>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#94a3b8] flex items-center gap-2">
            <GitBranch size={14} />
            {viewMode === 'rag' ? 'Resource Allocation Graph (RAG)' : 'Wait-for Graph (WFG)'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('rag')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'rag' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-[#64748b] hover:text-white'
              }`}
            >
              Resource Allocation Graph
            </button>
            <button
              onClick={() => setViewMode('wfg')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'wfg' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-[#64748b] hover:text-white'
              }`}
            >
              Wait-for Graph
            </button>
          </div>
        </div>
        <div ref={containerRef} className="bg-[#0a0e1a] rounded-lg overflow-hidden border border-[#2a3a5c]">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full"
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Affected Processes */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">
            {deadlockStatus.status === 'DEADLOCK' ? '⚠ Affected Processes' : 'Monitored Processes'}
          </h3>
          <div className="space-y-2">
            {graphData.processes.map(p => (
              <div
                key={p}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  deadlockStatus.affectedProcesses.includes(p)
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-[#0a0e1a]'
                }`}
              >
                <span className="text-sm text-white font-mono">{p}</span>
                <span className="text-xs text-[#64748b]">
                  {graphData.edges.filter(e => e.from === p).length} allocations
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">
            {deadlockStatus.status === 'DEADLOCK' ? '⚠ Affected Resources' : 'System Resources'}
          </h3>
          <div className="space-y-2">
            {resources.map(r => (
              <div
                key={r.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  deadlockStatus.affectedResources.includes(r.id)
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-[#0a0e1a]'
                }`}
              >
                <div>
                  <span className="text-sm text-white">{r.name}</span>
                  <p className="text-xs text-[#64748b]">{r.type}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#94a3b8]">
                    {r.allocatedInstances}/{r.totalInstances}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">Detection Algorithm</h3>
          <div className="space-y-3">
            <div className="p-3 bg-[#0a0e1a] rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Method</p>
              <p className="text-sm text-white">DFS Cycle Detection</p>
            </div>
            <div className="p-3 bg-[#0a0e1a] rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Graph Type</p>
              <p className="text-sm text-white">{viewMode === 'rag' ? 'Resource Allocation Graph' : 'Wait-for Graph'}</p>
            </div>
            <div className="p-3 bg-[#0a0e1a] rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Complexity</p>
              <p className="text-sm text-white font-mono">O(V + E)</p>
            </div>
            <div className="p-3 bg-[#0a0e1a] rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Last Check</p>
              <p className="text-sm text-white font-mono">
                {new Date(deadlockStatus.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div className="p-3 bg-[#0a0e1a] rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Vertices</p>
              <p className="text-sm text-white font-mono">
                {graphData.processes.length + graphData.resources.length}
              </p>
            </div>
            <div className="p-3 bg-[#0a0e1a] rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Edges</p>
              <p className="text-sm text-white font-mono">{graphData.edges.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="card bg-blue-500/5 border-blue-500/30">
        <p className="text-xs text-[#94a3b8]">
          <strong className="text-blue-400">Note:</strong> This deadlock analysis uses a controlled resource allocation model. 
          Linux does not expose application-level mutex/semaphore ownership globally through /proc. 
          The system demonstrates real DFS cycle detection algorithms on modeled resource relationships, 
          clearly separated from real-time system monitoring.
        </p>
      </div>
    </div>
  );
}
