// OS Guardian Type Definitions

export interface ProcessInfo {
  pid: number;
  ppid: number;
  name: string;
  command: string;
  state: ProcessState;
  cpu: number;
  memory: number; // in MB
  threads: number;
  startTime: number;
  runtime: number;
}

export type ProcessState = 'R' | 'S' | 'D' | 'Z' | 'T' | 't' | 'X';

export interface SystemResources {
  cpu: number;
  memory: number;
  processCount: number;
  threadCount: number;
  diskUsage: number;
  networkRx: number;
  networkTx: number;
  openFiles: number;
}

export interface Resource {
  id: string;
  name: string;
  type: 'mutex' | 'semaphore' | 'file' | 'network' | 'memory';
  totalInstances: number;
  availableInstances: number;
  allocatedInstances: number;
  requestedInstances: number;
}

export interface ResourceAllocation {
  processId: string;
  processName: string;
  resourceId: string;
  resourceName: string;
  type: 'holds' | 'requests';
}

export interface DeadlockResult {
  status: 'SAFE' | 'DEADLOCK';
  cycle: string[];
  affectedProcesses: string[];
  affectedResources: string[];
  timestamp: number;
  message: string;
}

export interface Alert {
  id: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  message: string;
  details: string;
  timestamp: number;
  resolved: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'process' | 'resource';
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'holds' | 'requests';
}

export interface PerformanceResult {
  processCount: number;
  detectionTime: number;
  cpuUsage: number;
  memoryUsage: number;
  timestamp: number;
}

export interface HistoryPoint {
  time: number;
  value: number;
}
