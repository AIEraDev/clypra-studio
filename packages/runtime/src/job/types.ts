/**
 * @clypra/runtime — Render Job
 *
 * Immutable execution plan produced by the planner.
 * The executor consumes it. Never mutates it.
 *
 * Think: SQL Execution Plan
 */

/**
 * Render Job (Immutable)
 *
 * Everything needed to execute a frame.
 */
export interface RenderJob {
  // Identity
  jobId: string;
  frame: number;
  timestamp: number;

  // Execution order
  executionOrder: string[];

  // Passes to execute
  passes: PassDescriptor[];

  // Resources to allocate
  resources: ResourceDescriptor[];

  // Execution policy
  policy: ExecutionPolicy;

  // Dependencies
  dependencies: JobDependencyGraph;

  // Metadata
  metadata: JobMetadata;
}

/**
 * Pass Descriptor
 *
 * Describes a single pass to execute.
 */
export interface PassDescriptor {
  id: string;
  name: string;
  shader: string;

  // Inputs
  inputs: ResourceReference[];

  // Outputs
  outputs: ResourceReference[];

  // Uniforms
  uniforms: Record<string, unknown>;

  // Render state
  clearBeforeRender: boolean;
  blendMode?: BlendMode;

  // Dependencies
  dependsOn: string[];
}

export interface ResourceReference {
  logicalId: string;
  binding: number;
  usage: "read" | "write" | "read-write";
}

export interface BlendMode {
  src: string;
  dst: string;
  equation: string;
}

/**
 * Resource Descriptor
 *
 * Describes a resource to allocate.
 */
export interface ResourceDescriptor {
  logicalId: string;
  type: "texture" | "buffer" | "framebuffer";
  width: number;
  height: number;
  format: string;

  // Lifecycle
  persistent: boolean;
  transient: boolean;

  // Aliasing hint
  aliasable: boolean;
  aliasOf?: string;

  // Usage hint for allocation
  usage: ResourceUsage;
}

export interface ResourceUsage {
  read: boolean;
  write: boolean;
  upload: boolean;
  download: boolean;
}

/**
 * Execution Policy
 *
 * How to execute the job.
 */
export interface ExecutionPolicy {
  // Parallelization
  parallelPasses: boolean;
  maxConcurrency: number;

  // Resource management
  resourcePooling: boolean;
  aggressiveAliasing: boolean;
  lazyAllocation: boolean;

  // Optimization
  skipRedundantPasses: boolean;
  cacheShadersPrograms: boolean;

  // Validation
  validateBeforeExecution: boolean;
  assertionsEnabled: boolean;
}

/**
 * Job Dependency Graph
 *
 * Pass execution dependencies.
 */
export interface JobDependencyGraph {
  nodes: JobNode[];
  edges: JobEdge[];
}

export interface JobNode {
  id: string;
  passId: string;
  executionOrder: number;
}

export interface JobEdge {
  from: string;
  to: string;
  resource: string;
  barrier: "none" | "copy" | "render" | "compute";
}

/**
 * Job Metadata
 *
 * Additional context for debugging/replay.
 */
export interface JobMetadata {
  graphHash: string;
  projectHash: string;
  plannerVersion: string;
  optimizations: string[];
  warnings: string[];
}

/**
 * Execution Result (Immutable)
 *
 * What happened when the job executed.
 */
export interface ExecutionResult {
  jobId: string;
  frame: number;

  // Status
  success: boolean;
  duration: number;

  // Per-pass results
  passResults: PassExecutionResult[];

  // Resource usage
  resourceUsage: ResourceUsageResult;

  // Cache statistics
  cacheStats: CacheStatistics;

  // Output
  outputTexture: unknown; // Backend-specific type

  // Diagnostics
  errors: string[];
  warnings: string[];
}

export interface PassExecutionResult {
  passId: string;
  duration: number;
  drawCalls: number;
  textureBinds: number;
  uniformUpdates: number;
  success: boolean;
  error?: string;
}

export interface ResourceUsageResult {
  allocated: number;
  reused: number;
  released: number;
  peakMemory: number;

  details: ResourceUsageDetail[];
}

export interface ResourceUsageDetail {
  logicalId: string;
  physicalId: string;
  sizeBytes: number;
  wasReused: boolean;
}

export interface CacheStatistics {
  texturePoolHits: number;
  texturePoolMisses: number;
  shaderCacheHits: number;
  shaderCacheMisses: number;
}

/**
 * Replay Packet
 *
 * Everything needed to replay a frame deterministically.
 * No renderer or browser graphics dependency.
 * Can replay anywhere.
 */
export interface ReplayPacket {
  // Core execution
  renderJob: RenderJob;

  // Evaluation context
  evaluationContext: EvaluationContext;

  // Determinism
  randomSeed: number;

  // Source data
  sourceData?: SourceDataSnapshot;

  // Expected result (for validation)
  expectedResult?: ExecutionResult;
}

export interface EvaluationContext {
  projectId: string;
  timelinePosition: number;
  playbackSpeed: number;
  resolution: { width: number; height: number };
  effectParameters: Record<string, unknown>;
}

export interface SourceDataSnapshot {
  videos: VideoSnapshot[];
  images: ImageSnapshot[];
  audio: AudioSnapshot[];
}

export interface VideoSnapshot {
  id: string;
  frame: number;
  timestamp: number;
  dataUrl?: string; // For small test cases
  checksum?: string; // For validation
}

export interface ImageSnapshot {
  id: string;
  dataUrl?: string;
  checksum?: string;
}

export interface AudioSnapshot {
  id: string;
  timestamp: number;
  samples: Float32Array;
  sampleRate: number;
}
