/**
 * @clypra/runtime — Snapshot System
 *
 * Separate concerns:
 * - Graph (definition)
 * - Execution (what happened)
 * - Resources (allocation)
 * - Performance (timing)
 * - Diagnostics (errors/warnings)
 */

/**
 * Top-level snapshot
 *
 * Each subsystem is independently serializable.
 */
export interface RuntimeSnapshot {
  snapshotVersion: string;
  plannerVersion: string;
  rendererVersion: string;
  graphHash: string;
  projectHash: string;

  frame: number;
  timestamp: number;

  graph: GraphSnapshot;
  execution: ExecutionSnapshot;
  resources: ResourceSnapshot;
  performance: PerformanceSnapshot;
  diagnostics: DiagnosticSnapshot;
}

/**
 * Graph Snapshot (Immutable Definition)
 *
 * What was planned to execute.
 */
export interface GraphSnapshot {
  nodeCount: number;
  effectCount: number;
  sourceCount: number;
  passCount: number;

  // Pass dependency graph
  dependencies: PassDependencyGraph;

  // Planner optimizations applied
  optimizations: Optimization[];
}

export interface PassDependencyGraph {
  nodes: PassNode[];
  edges: PassEdge[];
}

export interface PassNode {
  id: string;
  name: string;
  shader: string;
  type: "source" | "effect" | "composite" | "output";
}

export interface PassEdge {
  from: string;
  to: string;
  resource: string; // Logical resource name
}

export interface Optimization {
  type: "merge" | "alias" | "eliminate" | "reorder";
  description: string;
  before?: string;
  after?: string;
}

/**
 * Execution Snapshot (What Happened)
 *
 * The result of executing the graph.
 */
export interface ExecutionSnapshot {
  status: "idle" | "executing" | "completed" | "failed";
  duration: number;

  // Execution order (what actually ran)
  executionOrder: string[];

  // Per-pass results
  passResults: PassResult[];

  // Scheduling state
  scheduling: SchedulingState;

  // Backend info
  backend: BackendInfo;
}

export interface PassResult {
  id: string;
  name: string;
  shader: string;
  stage: "ready" | "queued" | "executing" | "completed" | "failed";
  startedAt: number;
  finishedAt: number;
  duration: number;

  inputs: ResourceBinding[];
  outputs: ResourceBinding[];
  uniforms: Record<string, unknown>;

  drawCalls: number;
  textureBinds: number;
  shaderSwitches: number;
}

export interface ResourceBinding {
  logicalId: string; // blur-horizontal
  physicalId: string; // Texture#14
  binding: number;
  usage: "read" | "write" | "read-write";
}

export interface SchedulingState {
  readyQueue: string[];
  passQueue: string[];
  waitingQueue: string[];
  completedQueue: string[];
}

export interface BackendInfo {
  name: string; // "WebGL2", "wgpu", "null"
  api: string; // "OpenGL ES 3.0", "WebGPU", "none"
  shaderLanguage: string; // "GLSL ES 3.0", "WGSL", "none"
  featureLevel: string; // "tier1", "tier2", "tier3"
  version: string;
}

/**
 * Resource Snapshot (Allocation State)
 *
 * Logical resources and physical allocations.
 */
export interface ResourceSnapshot {
  logical: LogicalResource[];
  physical: PhysicalAllocation[];
  aliasing: AliasingInfo[];

  totalAllocated: number;
  totalReleased: number;
  totalReused: number;
  peakMemory: number;
}

export interface LogicalResource {
  id: string; // "blur-horizontal"
  type: "texture" | "buffer" | "framebuffer";
  width: number;
  height: number;
  format: string;

  // Lifetime
  createdFrame: number;
  firstUsedFrame: number;
  lastUsedFrame: number;
  releasedFrame: number | null;

  persistent: boolean;
  transient: boolean;

  // Physical mapping
  physicalId: string | null; // "Texture#14"
}

export interface PhysicalAllocation {
  id: string; // "Texture#14"
  type: "texture" | "buffer" | "framebuffer";
  width: number;
  height: number;
  format: string;
  sizeBytes: number;

  // What logical resources use this
  logicalResources: string[];

  // Lifetime
  allocatedAt: number;
  releasedAt: number | null;
  reuseCount: number;
}

export interface AliasingInfo {
  physicalId: string; // "Texture#14"
  aliases: AliasMappingentry[];
}

export interface AliasMappingentry {
  frame: number;
  logicalId: string;
  passName: string;
}

/**
 * Performance Snapshot (Timing & Memory)
 */
export interface PerformanceSnapshot {
  // Current frame timing
  frameTime: number;
  fps: number;

  // Pipeline breakdown
  compile: number;
  plan: number;
  schedule: number;
  execute: number;
  render: number;
  present: number;

  // GPU vs CPU
  gpuTime: number;
  cpuTime: number;
  uploadTime: number;
  downloadTime: number;

  // Memory
  textureMemory: number;
  bufferMemory: number;
  totalMemory: number;
  peakMemory: number;

  // Averages (rolling window)
  avgFrameTime: number;
  avgFps: number;
  avgGpuTime: number;
  avgCpuTime: number;

  // Cache performance
  cache: CachePerformance;
}

export interface CachePerformance {
  texturePool: {
    size: number;
    available: number;
    hitRate: number;
  };
  shaderCache: {
    size: number;
    hits: number;
    misses: number;
  };
  resourceCache: {
    hits: number;
    misses: number;
    evictions: number;
  };
}

/**
 * Diagnostic Snapshot (Errors & Warnings)
 */
export interface DiagnosticSnapshot {
  errors: DiagnosticMessage[];
  warnings: DiagnosticMessage[];
  info: DiagnosticMessage[];
}

export interface DiagnosticMessage {
  timestamp: number;
  subsystem: "compiler" | "planner" | "executor" | "renderer" | "cache";
  severity: "error" | "warning" | "info";
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * Frame History
 *
 * Maintains snapshots across multiple frames.
 */
export interface FrameHistory {
  frames: RuntimeSnapshot[];
  maxHistory: number;

  current(): RuntimeSnapshot | null;
  previous(n?: number): RuntimeSnapshot | null;
  range(start: number, end: number): RuntimeSnapshot[];
  clear(): void;
}

/**
 * Resource Lifetime Visualization
 *
 * Timeline showing when resources exist.
 */
export interface ResourceLifetimeTimeline {
  startFrame: number;
  endFrame: number;
  resources: ResourceLifetimeBar[];
}

export interface ResourceLifetimeBar {
  logicalId: string;
  physicalId: string | null;
  start: number;
  end: number;
  persistent: boolean;
  color: string;
}

/**
 * Execution Timeline
 *
 * Chrome DevTools-style visualization.
 */
export interface ExecutionTimeline {
  total: number;
  stages: TimelineStage[];
}

export interface TimelineStage {
  name: string;
  start: number;
  duration: number;
  color: string;
  children?: TimelineStage[];
}
