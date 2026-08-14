/**
 * Clypra Asset Runtime Core Types
 *
 * Universal contracts for asset identity, protocol resolution,
 * resource caching, and frame-level export determinism.
 */

export type AssetProtocol =
  | "asset"     // Internal project bundle (asset://avatars/sarah.png)
  | "https"     // Remote secure HTTP (https://cdn.example.com/asset.jpg)
  | "http"      // Remote HTTP
  | "file"      // Local filesystem path (file:///Users/dev/...)
  | "blob"      // In-memory binary blob (blob:uuid-1234)
  | "binding"   // Runtime data expression (binding://speaker.avatar or {{speaker.avatar}})
  | "font";     // Font face descriptor (font://Inter)

export interface FocalPoint {
  x: number; // Normalized horizontal focal center [0.0..1.0] (0.5 = center)
  y: number; // Normalized vertical focal center [0.0..1.0] (0.5 = center)
}

export interface IntrinsicMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  mimeType?: string;
  duration?: number; // In seconds, for temporal assets (video, audio)
}

export interface AssetDescriptor {
  id: string;                                // Canonical stable asset UUID or key
  protocol: AssetProtocol;                  // Protocol identifier
  source: string;                            // Source path, URL, or binding expression
  version?: string | number;                 // Monotonic version or hash for cache invalidation
  focalPoint?: FocalPoint;                   // Default focal point for smart cropping
  intrinsicMeta?: IntrinsicMetadata;         // Pre-calculated or cached intrinsic dimensions
  tags?: string[];                           // Optional categorization tags
}

export type ResourceKind =
  | "image-bitmap"
  | "gpu-texture"
  | "video-frame"
  | "audio-buffer"
  | "svg-vector"
  | "font-face"
  | "lottie-tree"
  | "placeholder";

export type ResourceState = "idle" | "loading" | "decoded" | "ready" | "error";

export interface ResolvedResource<T = any> {
  handle: string;                            // Unique handle in resource cache
  assetId: string;                           // Referenced Asset UUID
  kind: ResourceKind;                        // Type of binary/GPU resource
  data: T | null;                            // Concrete resource data (ImageBitmap, HTMLVideoElement, Texture, etc.)
  width: number;                             // Bounding width (pixels)
  height: number;                            // Bounding height (pixels)
  byteSize: number;                          // Estimated memory footprint
  state: ResourceState;                      // Current lifecycle state
  error?: string;                            // Error message if state === "error"
  refCount: number;                          // Active references in current scene tree
  lastAccessTime: number;                    // Timestamp for LRU cache eviction
}

export interface CacheKeyOptions {
  assetId: string;
  version?: string | number;
  targetWidth?: number;
  targetHeight?: number;
  fitMode?: string;
  focalPoint?: FocalPoint;
}

export interface FrameAssetDependency {
  nodeId: string;
  assetId: string;
  timelineStart: number;
  timelineEnd: number;
}
