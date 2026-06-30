/**
 * @clypra/feature-providers — Type Definitions
 *
 * Core types for extensible feature providers used in Body Effect Lab.
 */

/**
 * Types of feature maps that providers can produce
 */
export enum FeatureMapType {
  // Segmentation
  Mask = "mask",
  MultiMask = "multi-mask",

  // Spatial
  Pose = "pose",
  FaceMesh = "face-mesh",
  Skeleton = "skeleton",
  Hands = "hands",

  // Depth
  Depth = "depth",
  Normal = "normal",

  // Motion
  OpticalFlow = "optical-flow",
  Motion = "motion",

  // Semantic
  Hair = "hair",
  Eyes = "eyes",
  Skin = "skin",

  // Identity
  PersonID = "person-id",
}

/**
 * Base feature map interface
 */
export interface FeatureMap {
  type: FeatureMapType;
  data: FeatureMapData;
  metadata?: Record<string, any>;
}

/**
 * Union of all feature map data types
 */
export type FeatureMapData = MaskData | MultiMaskData | PoseData | DepthData | FlowData | MeshData;

/**
 * Mask data (binary or alpha mask)
 */
export interface MaskData {
  type: "mask";
  texture: HTMLCanvasElement | ImageBitmap | HTMLVideoElement;
  isBinary: boolean;
  inverted?: boolean;
}

/**
 * Multiple masks with IDs (for multi-person scenarios)
 */
export interface MultiMaskData {
  type: "multi-mask";
  masks: Array<{
    id: string;
    texture: HTMLCanvasElement | ImageBitmap;
    confidence: number;
  }>;
}

/**
 * 2D keypoints (pose, hands, face)
 */
export interface PoseData {
  type: "pose";
  keypoints: Array<{
    name: string;
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    confidence: number;
    visible: boolean;
  }>;
  skeleton?: Array<[string, string]>; // Connections between keypoints
}

/**
 * Depth map data
 */
export interface DepthData {
  type: "depth";
  texture: HTMLCanvasElement | ImageBitmap;
  minDepth: number;
  maxDepth: number;
  confidence?: HTMLCanvasElement | ImageBitmap;
}

/**
 * Optical flow data
 */
export interface FlowData {
  type: "optical-flow";
  texture: HTMLCanvasElement | ImageBitmap; // RG = motion vectors
  maxMagnitude: number;
}

/**
 * 3D mesh data (face mesh, etc.)
 */
export interface MeshData {
  type: "face-mesh";
  vertices: Array<{ x: number; y: number; z: number }>;
  indices: number[];
  uvs?: Array<{ u: number; v: number }>;
}

/**
 * Configuration value types
 */
export type ConfigValue = { type: "number"; min: number; max: number; default: number; label?: string } | { type: "boolean"; default: boolean; label?: string } | { type: "select"; options: string[]; default: string; label?: string } | { type: "color"; default: string; label?: string };

/**
 * Provider configuration schema
 */
export interface ProviderConfig {
  [key: string]: ConfigValue;
}

/**
 * Video frame input (can be HTMLVideoElement, canvas, or bitmap)
 */
export type VideoFrame = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

/**
 * Feature Provider interface
 *
 * All feature providers must implement this interface.
 * Providers produce feature maps that body effects consume.
 */
export interface FeatureProvider {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Feature maps this provider produces */
  outputs: FeatureMapType[];

  /** Configuration schema */
  config?: ProviderConfig;

  /** Initialize the provider (load models, allocate resources) */
  initialize(): Promise<void>;

  /** Process a video frame and produce feature maps */
  process(frame: VideoFrame): Promise<FeatureMap[]>;

  /** Clean up resources */
  dispose(): void;

  /** Update configuration */
  updateConfig?(config: Record<string, any>): void;
}

/**
 * Feature provider manager
 */
export interface IFeatureProviderManager {
  /** Register a provider */
  register(provider: FeatureProvider): void;

  /** Activate a provider (initialize and make ready) */
  activate(providerId: string): Promise<void>;

  /** Deactivate a provider */
  deactivate(providerId: string): void;

  /** Process frame with active providers */
  process(frame: VideoFrame): Promise<Map<FeatureMapType, FeatureMap>>;

  /** Get providers that can produce a specific feature type */
  getProvidersForFeature(featureType: FeatureMapType): FeatureProvider[];

  /** Get all registered providers */
  getAllProviders(): FeatureProvider[];

  /** Get active providers */
  getActiveProviders(): FeatureProvider[];

  /** Dispose all providers */
  dispose(): void;
}
