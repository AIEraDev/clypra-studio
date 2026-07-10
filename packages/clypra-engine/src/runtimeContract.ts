/**
 * @clypra-studio/engine — NLE Runtime & Pipeline Contract v2 (LEGACY DRAFT)
 *
 * @deprecated Prefer `v2/project`, `v2/graph`, `v2/planner`, and `v2/runtime`.
 * Exported via `@clypra/engine/contract` for Rust/wgpu alignment only.
 */

// ============================================================================
// 1. Asset Management Layer
// ============================================================================

export type AssetType = "video" | "audio" | "image" | "font" | "lut" | "model" | "generated";

export interface AssetDescriptor {
  id: string;
  name: string;
  type: AssetType;
  uri: string; // Absolute path, localhost server URL, or R2 URI
  checksum: string; // For cache invalidation and integrity
  sizeBytes: number;
  metadata: {
    durationMs?: number;
    width?: number;
    height?: number;
    fps?: number;
    codec?: string;
    sampleRate?: number; // For audio
    channels?: number; // For audio
  };
}

export interface MediaResolver {
  resolveAsset(assetId: string): Promise<AssetDescriptor>;
  getThumbnailUri(assetId: string, frameNumber: number): string;
  getWaveformUri(assetId: string): string;
  prewarmAsset(assetId: string): Promise<void>;
  releaseAsset(assetId: string): void;
}

// ============================================================================
// 2. Data Graph & Node System
// ============================================================================

export type GraphDataType =
  | "Texture" // GPU / Canvas color texture
  | "Depth" // Depth map
  | "MotionField" // Motion vectors / optical flow
  | "BoundingBoxes" // Object coordinates (JSON)
  | "Mask" // Binary or Alpha mask
  | "Mesh" // 3D geometry mesh data
  | "Particles" // Particle simulation state
  | "AudioSpectrum" // Audio spectrum array
  | "Text" // Caption / subtitle strings
  | "Markers"; // Scene changes

export interface GraphValue<T = any> {
  type: GraphDataType;
  payload: T;
}

export interface EffectCapabilities {
  temporal: boolean;
  requiresFrameHistory: number; // Number of previous frames needed
  requiresLookAhead: number; // Number of future frames needed
  stateful: boolean; // Simulation-state dependent (e.g. particles)
  spatial: boolean; // Samples neighboring pixels (e.g. blurs)
  geometry: boolean; // Modifies UV coordinates (e.g. warp)
  inputsCount: number; // Number of input pins (0 for source, 2 for transitions)
  gpuOnly: boolean;
  requiresAnalysis: boolean; // Execution yields metadata instead of frames
}

export interface EffectProfile {
  gpuCost: number; // Estimated shader complexity (1-10 scale)
  memoryCost: number; // VRAM usage index
  temporalRadius: number; // Temporal frame requirements
  recommendedResolutionScale: number; // Downscaling factor safe for draft modes
}

export interface PinConnection {
  nodeId: string;
  pinId: string;
}

export interface GraphNode {
  id: string;
  type: string; // Matches built-in registry key or transition ID
  version: number; // Current dependency version for dirty propagation
  params: Record<string, any>;
  inputs: Record<string, PinConnection | null>;
  outputs: Record<string, PinConnection[]>;
  capabilities: EffectCapabilities;
  profile: EffectProfile;
}

// ============================================================================
// 3. Execution & Planning
// ============================================================================

export type ExecutionQuality = "draft" | "preview" | "export";
export type PlaybackMode = "play" | "seek";
export type PlaybackDirection = "forward" | "reverse";

export interface ExecutionPolicy {
  quality: ExecutionQuality;
  playbackMode: PlaybackMode;
  direction: PlaybackDirection;
  targetFps: number;
}

export type RenderIntent = "thumbnail" | "preview" | "export" | "still" | "analysis";

export interface ResourceRequest {
  id: string;
  type: "texture" | "buffer";
  width?: number;
  height?: number;
  format: "rgba8" | "rgba16f" | "rgba32f" | "r8";
  usage: "render_target" | "shader_read" | "compute_write";
}

/**
 * Single-frame resolved graph to run on the GPU queue.
 * Contains only nodes that are visible and active at timelineTime.
 */
export interface FrameGraph {
  frameNumber: number;
  timelineTime: number;
  intent: RenderIntent;
  nodes: GraphNode[];
  edges: Array<{
    fromNodeId: string;
    fromPinId: string;
    toNodeId: string;
    toPinId: string;
  }>;
  resourceRequests: ResourceRequest[];
}

export interface Command {
  op: "draw" | "compute" | "copy" | "clear" | "resolve";
  shaderId: string;
  inputs: string[]; // Resource IDs
  outputs: string[]; // Resource IDs
  uniforms: Record<string, any>;
}

export interface CommandBuffer {
  frameNumber: number;
  commands: Command[];
}

export interface RenderBackend {
  init(deviceInfo: any): Promise<void>;
  compileShader(shaderId: string, source: string): Promise<any>;
  submit(commandBuffer: CommandBuffer): Promise<void>;
  readPixels(resourceId: string): Promise<Uint8Array>;
  destroy(): void;
}

// ============================================================================
// 4. Caching & Versioning
// ============================================================================

export interface CacheKey {
  projectVersion: number;
  timelineTime: number;
  quality: ExecutionQuality;
  renderIntent: RenderIntent;
  nodeStateHashes: Record<string, string>; // nodeId -> parameter hash
}

export interface VersionTracker {
  nodeVersions: Record<string, number>; // nodeId -> version counter
  globalProjectVersion: number;
}

// ============================================================================
// 5. Project Manifest v2
// ============================================================================

export interface ClipSegment {
  id: string;
  assetId: string;
  timelineStartMs: number;
  timelineEndMs: number;
  sourceStartMs: number;
  speed: number;
  volume: number;
}

export interface TrackDefinition {
  id: string;
  name: string;
  type: "video" | "audio";
  enabled: boolean;
  clips: ClipSegment[];
  effectGraph: {
    nodes: GraphNode[];
  };
}

export interface ProjectManifestV2 {
  id: string;
  version: number; // Incremented on every change
  name: string;
  width: number;
  height: number;
  fps: number;
  assets: AssetDescriptor[];
  tracks: TrackDefinition[];
  compositeGraph: {
    nodes: GraphNode[];
  };
}
