// System Monitoring Service
// Simulates realistic Linux process monitoring
// In a real Tauri/C++ backend, this would read from /proc filesystem

import { ProcessInfo, SystemResources, Resource, ResourceAllocation, Alert, HistoryPoint } from '../types';
import { deadlockDetector } from './deadlockDetector';

// Real process names from typical Linux systems
const LINUX_PROCESSES = [
  { name: 'systemd', command: '/usr/lib/systemd/systemd', baseCpu: 0.1, baseMem: 12 },
  { name: 'kthreadd', command: '[kthreadd]', baseCpu: 0.0, baseMem: 0 },
  { name: 'kworker/0:0', command: '[kworker/0:0]', baseCpu: 0.3, baseMem: 0 },
  { name: 'Xorg', command: '/usr/lib/Xorg', baseCpu: 4.2, baseMem: 180 },
  { name: 'gnome-shell', command: '/usr/bin/gnome-shell', baseCpu: 3.8, baseMem: 320 },
  { name: 'firefox', command: '/usr/lib/firefox/firefox', baseCpu: 8.5, baseMem: 680 },
  { name: 'chrome', command: '/usr/bin/google-chrome', baseCpu: 12.4, baseMem: 512 },
  { name: 'code', command: '/usr/share/code/code', baseCpu: 6.1, baseMem: 420 },
  { name: 'node', command: '/usr/bin/node', baseCpu: 3.2, baseMem: 180 },
  { name: 'python3', command: '/usr/bin/python3', baseCpu: 2.1, baseMem: 95 },
  { name: 'docker', command: '/usr/bin/dockerd', baseCpu: 1.8, baseMem: 240 },
  { name: 'containerd', command: '/usr/bin/containerd', baseCpu: 0.9, baseMem: 85 },
  { name: 'pulseaudio', command: '/usr/bin/pulseaudio', baseCpu: 0.4, baseMem: 28 },
  { name: 'dbus-daemon', command: '/usr/bin/dbus-daemon', baseCpu: 0.2, baseMem: 12 },
  { name: 'NetworkManager', command: '/usr/sbin/NetworkManager', baseCpu: 0.3, baseMem: 32 },
  { name: 'sshd', command: '/usr/sbin/sshd', baseCpu: 0.1, baseMem: 8 },
  { name: 'cron', command: '/usr/sbin/cron', baseCpu: 0.0, baseMem: 4 },
  { name: 'rsyslogd', command: '/usr/sbin/rsyslogd', baseCpu: 0.1, baseMem: 16 },
  { name: 'irqbalance', command: '/usr/sbin/irqbalance', baseCpu: 0.0, baseMem: 4 },
  { name: 'thermald', command: '/usr/sbin/thermald', baseCpu: 0.1, baseMem: 12 },
  { name: 'bluetoothd', command: '/usr/lib/bluetooth/bluetoothd', baseCpu: 0.1, baseMem: 8 },
  { name: 'upowerd', command: '/usr/lib/upower/upowerd', baseCpu: 0.0, baseMem: 8 },
  { name: 'polkitd', command: '/usr/lib/polkit-1/polkitd', baseCpu: 0.1, baseMem: 24 },
  { name: 'accounts-daemon', command: '/usr/lib/accountsservice/accounts-daemon', baseCpu: 0.0, baseMem: 12 },
  { name: 'rtkit-daemon', command: '/usr/lib/rtkit/rtkit-daemon', baseCpu: 0.0, baseMem: 4 },
  { name: 'colord', command: '/usr/lib/colord/colord', baseCpu: 0.0, baseMem: 28 },
  { name: 'gvfsd', command: '/usr/lib/gvfs/gvfsd', baseCpu: 0.1, baseMem: 12 },
  { name: 'pipewire', command: '/usr/bin/pipewire', baseCpu: 0.5, baseMem: 24 },
  { name: 'wireplumber', command: '/usr/bin/wireplumber', baseCpu: 0.2, baseMem: 16 },
  { name: 'gdm3', command: '/usr/sbin/gdm3', baseCpu: 0.3, baseMem: 20 },
];

const PROCESS_STATES: ('R' | 'S' | 'D' | 'Z' | 'T')[] = ['R', 'S', 'S', 'S', 'S', 'S', 'S', 'R', 'S', 'S'];

let processes: ProcessInfo[] = [];
let systemResources: SystemResources = {
  cpu: 0,
  memory: 0,
  processCount: 0,
  threadCount: 0,
  diskUsage: 42,
  networkRx: 0,
  networkTx: 0,
  openFiles: 0
};

let alerts: Alert[] = [];
let cpuHistory: HistoryPoint[] = [];
let memHistory: HistoryPoint[] = [];
let processHistory: HistoryPoint[] = [];
let threadHistory: HistoryPoint[] = [];

const MAX_HISTORY = 60;

// Initialize processes
function initializeProcesses() {
  const now = Date.now();
  processes = LINUX_PROCESSES.map((proc, idx) => ({
    pid: 100 + idx * 7 + Math.floor(Math.random() * 5),
    ppid: idx === 0 ? 0 : 1,
    name: proc.name,
    command: proc.command,
    state: PROCESS_STATES[Math.floor(Math.random() * PROCESS_STATES.length)],
    cpu: proc.baseCpu + (Math.random() - 0.5) * proc.baseCpu * 0.3,
    memory: proc.baseMem + (Math.random() - 0.5) * proc.baseMem * 0.1,
    threads: Math.max(1, Math.floor(proc.baseMem / 30) + Math.floor(Math.random() * 4)),
    startTime: now - Math.floor(Math.random() * 86400000),
    runtime: Math.floor(Math.random() * 86400000)
  }));
}

// Update processes with realistic fluctuations
function updateProcesses() {
  processes = processes.map(proc => {
    const baseProc = LINUX_PROCESSES.find(p => p.name === proc.name);
    if (!baseProc) return proc;

    const cpuFluctuation = (Math.random() - 0.5) * baseProc.baseCpu * 0.4;
    const memFluctuation = (Math.random() - 0.5) * baseProc.baseMem * 0.05;

    return {
      ...proc,
      cpu: Math.max(0, baseProc.baseCpu + cpuFluctuation),
      memory: Math.max(0, baseProc.baseMem + memFluctuation),
      threads: Math.max(1, proc.threads + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
      state: Math.random() > 0.95 
        ? PROCESS_STATES[Math.floor(Math.random() * PROCESS_STATES.length)]
        : proc.state,
      runtime: proc.runtime + 1000
    };
  });
}

// Update system resources
function updateSystemResources() {
  const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0);
  const totalMem = processes.reduce((sum, p) => sum + p.memory, 0);
  const totalThreads = processes.reduce((sum, p) => sum + p.threads, 0);

  systemResources = {
    cpu: Math.min(100, totalCpu / 4 + Math.random() * 10), // Normalize to realistic %
    memory: Math.min(100, (totalMem / 16384) * 100 + Math.random() * 5), // Assume 16GB total
    processCount: processes.length + Math.floor(Math.random() * 20) + 80,
    threadCount: totalThreads + Math.floor(Math.random() * 50) + 200,
    diskUsage: 42 + Math.random() * 2,
    networkRx: Math.floor(Math.random() * 5000) + 500,
    networkTx: Math.floor(Math.random() * 2000) + 200,
    openFiles: Math.floor(Math.random() * 5000) + 8000
  };
}

// Update history
function updateHistory() {
  const now = Date.now();
  cpuHistory.push({ time: now, value: systemResources.cpu });
  memHistory.push({ time: now, value: systemResources.memory });
  processHistory.push({ time: now, value: systemResources.processCount });
  threadHistory.push({ time: now, value: systemResources.threadCount });

  if (cpuHistory.length > MAX_HISTORY) cpuHistory.shift();
  if (memHistory.length > MAX_HISTORY) memHistory.shift();
  if (processHistory.length > MAX_HISTORY) processHistory.shift();
  if (threadHistory.length > MAX_HISTORY) threadHistory.shift();
}

// Check for alerts
function checkAlerts() {
  if (systemResources.cpu > 80) {
    const highCpuProcess = processes.reduce((max, p) => p.cpu > max.cpu ? p : max, processes[0]);
    addAlert('WARNING', 'High CPU Usage', `Process: ${highCpuProcess.name} (PID: ${highCpuProcess.pid})\nCPU: ${highCpuProcess.cpu.toFixed(1)}%`);
  }
  if (systemResources.memory > 80) {
    addAlert('WARNING', 'High Memory Usage', `System memory usage: ${systemResources.memory.toFixed(1)}%`);
  }
}

function addAlert(type: Alert['type'], message: string, details: string) {
  // Don't add duplicate alerts within 10 seconds
  const recent = alerts.find(a => a.message === message && (Date.now() - a.timestamp) < 10000);
  if (recent) return;

  alerts.unshift({
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    details,
    timestamp: Date.now(),
    resolved: false
  });

  if (alerts.length > 100) alerts.pop();
}

// Initialize deadlock simulation resources
function initializeDeadlockResources() {
  const resources: Resource[] = [
    { id: 'R1', name: 'Mutex_A', type: 'mutex', totalInstances: 1, availableInstances: 0, allocatedInstances: 1, requestedInstances: 1 },
    { id: 'R2', name: 'Mutex_B', type: 'mutex', totalInstances: 1, availableInstances: 0, allocatedInstances: 1, requestedInstances: 1 },
    { id: 'R3', name: 'Semaphore_X', type: 'semaphore', totalInstances: 2, availableInstances: 0, allocatedInstances: 2, requestedInstances: 1 },
    { id: 'R4', name: 'File_Lock', type: 'file', totalInstances: 1, availableInstances: 0, allocatedInstances: 1, requestedInstances: 1 },
    { id: 'R5', name: 'Net_Socket', type: 'network', totalInstances: 3, availableInstances: 1, allocatedInstances: 2, requestedInstances: 0 },
    { id: 'R6', name: 'Shared_Mem', type: 'memory', totalInstances: 1, availableInstances: 0, allocatedInstances: 1, requestedInstances: 1 },
  ];

  // Deadlock scenario: P1 holds R1, waits R2; P2 holds R2, waits R1
  const allocations: ResourceAllocation[] = [
    { processId: 'P1', processName: 'firefox', resourceId: 'R1', resourceName: 'Mutex_A', type: 'holds' },
    { processId: 'P1', processName: 'firefox', resourceId: 'R2', resourceName: 'Mutex_B', type: 'requests' },
    { processId: 'P2', processName: 'chrome', resourceId: 'R2', resourceName: 'Mutex_B', type: 'holds' },
    { processId: 'P2', processName: 'chrome', resourceId: 'R1', resourceName: 'Mutex_A', type: 'requests' },
    { processId: 'P3', processName: 'code', resourceId: 'R3', resourceName: 'Semaphore_X', type: 'holds' },
    { processId: 'P3', processName: 'code', resourceId: 'R4', resourceName: 'File_Lock', type: 'requests' },
    { processId: 'P4', processName: 'node', resourceId: 'R4', resourceName: 'File_Lock', type: 'holds' },
    { processId: 'P4', processName: 'node', resourceId: 'R3', resourceName: 'Semaphore_X', type: 'requests' },
    { processId: 'P5', processName: 'python3', resourceId: 'R5', resourceName: 'Net_Socket', type: 'holds' },
    { processId: 'P5', processName: 'python3', resourceId: 'R6', resourceName: 'Shared_Mem', type: 'requests' },
    { processId: 'P6', processName: 'docker', resourceId: 'R6', resourceName: 'Shared_Mem', type: 'holds' },
    { processId: 'P6', processName: 'docker', resourceId: 'R5', resourceName: 'Net_Socket', type: 'requests' },
  ];

  deadlockDetector.setResources(resources);
  deadlockDetector.setAllocations(allocations);
}

// Public API
export const monitoringService = {
  init() {
    initializeProcesses();
    initializeDeadlockResources();
    updateSystemResources();
  },

  update() {
    updateProcesses();
    updateSystemResources();
    updateHistory();
    checkAlerts();
  },

  getProcesses(): ProcessInfo[] {
    return [...processes].sort((a, b) => b.cpu - a.cpu);
  },

  getProcess(pid: number): ProcessInfo | undefined {
    return processes.find(p => p.pid === pid);
  },

  getSystemResources(): SystemResources {
    return { ...systemResources };
  },

  getDeadlockStatus() {
    return deadlockDetector.detect();
  },

  getDeadlockGraph() {
    return deadlockDetector.getGraphData();
  },

  getResources(): Resource[] {
    return [...deadlockDetector.resources.values()];
  },

  getAlerts(): Alert[] {
    return [...alerts];
  },

  clearAlerts() {
    alerts = [];
  },

  getCpuHistory(): HistoryPoint[] {
    return [...cpuHistory];
  },

  getMemHistory(): HistoryPoint[] {
    return [...memHistory];
  },

  getProcessHistory(): HistoryPoint[] {
    return [...processHistory];
  },

  getThreadHistory(): HistoryPoint[] {
    return [...threadHistory];
  },

  runBenchmark(counts: number[]) {
    return counts.map(count => {
      const result = deadlockDetector.benchmark(count);
      return {
        processCount: count,
        detectionTime: result.detectionTime,
        cpuUsage: result.cpuUsage,
        memoryUsage: result.memoryUsage,
        timestamp: Date.now()
      };
    });
  },

  // Toggle deadlock scenario
  toggleDeadlock(enabled: boolean) {
    if (enabled) {
      initializeDeadlockResources();
    } else {
      // Create safe allocation (no cycles)
      const resources: Resource[] = [
        { id: 'R1', name: 'Mutex_A', type: 'mutex', totalInstances: 1, availableInstances: 0, allocatedInstances: 1, requestedInstances: 0 },
        { id: 'R2', name: 'Mutex_B', type: 'mutex', totalInstances: 1, availableInstances: 0, allocatedInstances: 1, requestedInstances: 0 },
        { id: 'R3', name: 'Semaphore_X', type: 'semaphore', totalInstances: 2, availableInstances: 1, allocatedInstances: 1, requestedInstances: 0 },
      ];
      const allocations: ResourceAllocation[] = [
        { processId: 'P1', processName: 'firefox', resourceId: 'R1', resourceName: 'Mutex_A', type: 'holds' },
        { processId: 'P2', processName: 'chrome', resourceId: 'R2', resourceName: 'Mutex_B', type: 'holds' },
        { processId: 'P3', processName: 'code', resourceId: 'R3', resourceName: 'Semaphore_X', type: 'holds' },
      ];
      deadlockDetector.setResources(resources);
      deadlockDetector.setAllocations(allocations);
    }
  }
};
