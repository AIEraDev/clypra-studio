/**
 * @deprecated This file has been moved to @clypra/runtime/project
 *
 * Import from @clypra/runtime instead:
 * ```typescript
 * import type { ProjectManifestV2 } from '@clypra/runtime/project';
 * ```
 *
 * This file will be removed in v3.0.0
 */

/**
 * @clypra-studio/engine — Pipeline V2: Project Model
 *
 * Defines immutable project manifests, clips, tracks, and asset handles.
 */

export type AssetKind = "video" | "audio" | "image" | "font" | "lut" | "model";

export interface AssetHandle {
  readonly id: string;
  readonly kind: AssetKind;
  readonly sourceUri: string; // Internal, localhost, or cloud storage locator
  readonly hash: string; // Content checksum for invalidation
  readonly durationMs: number;
}

export interface ClipSegment {
  readonly id: string;
  readonly assetId: string; // Reference to AssetHandle
  readonly timelineStartMs: number;
  readonly timelineEndMs: number;
  readonly sourceStartMs: number;
  readonly speed: number;
  readonly enabled: boolean;
}

export interface EffectInstance {
  readonly id: string;
  readonly type: string; // Node registry identifier (e.g. 'GaussianBlur')
  readonly params: Readonly<Record<string, any>>;
}

export interface TrackDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: "video" | "audio";
  readonly enabled: boolean;
  readonly clips: readonly ClipSegment[];
  readonly effectStack: readonly EffectInstance[]; // Pre-compiled into sequential nodes
}

export interface ProjectManifestV2 {
  readonly id: string;
  readonly version: number; // Monotonically increasing version counter
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly assets: readonly AssetHandle[];
  readonly tracks: readonly TrackDefinition[];
}

// Helpers for immutable modifications
export class ProjectHelper {
  static createEmpty(id: string, name: string): ProjectManifestV2 {
    return {
      id,
      version: 1,
      name,
      width: 1920,
      height: 1080,
      fps: 30,
      assets: [],
      tracks: [],
    };
  }

  static withAsset(manifest: ProjectManifestV2, asset: AssetHandle): ProjectManifestV2 {
    return {
      ...manifest,
      version: manifest.version + 1,
      assets: [...manifest.assets.filter((a) => a.id !== asset.id), asset],
    };
  }

  static withTrack(manifest: ProjectManifestV2, track: TrackDefinition): ProjectManifestV2 {
    return {
      ...manifest,
      version: manifest.version + 1,
      tracks: [...manifest.tracks.filter((t) => t.id !== track.id), track],
    };
  }
}
