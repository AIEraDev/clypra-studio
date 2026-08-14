import type { AssetDescriptor, AssetProtocol, IntrinsicMetadata, FocalPoint } from "./types.js";

/**
 * Universal Asset Registry
 *
 * Serves as the single source of truth for project media assets,
 * managing asset identity, protocol extraction, metadata caching,
 * and project-level serialization.
 */
export class AssetRegistry {
  private assets = new Map<string, AssetDescriptor>();

  /**
   * Infer the AssetProtocol from a raw URI/string source.
   */
  public static inferProtocol(source: string): AssetProtocol {
    if (!source || typeof source !== "string") return "asset";
    const trimmed = source.trim();
    if (trimmed.startsWith("asset://")) return "asset";
    if (trimmed.startsWith("https://")) return "https";
    if (trimmed.startsWith("http://")) return "http";
    if (trimmed.startsWith("file://")) return "file";
    if (trimmed.startsWith("blob:")) return "blob";
    if (trimmed.startsWith("font://")) return "font";
    if (trimmed.startsWith("binding://") || (trimmed.startsWith("{{") && trimmed.endsWith("}}"))) {
      return "binding";
    }
    // Default fallback
    return "asset";
  }

  /**
   * Register a new asset or update an existing descriptor.
   */
  public register(descriptor: AssetDescriptor): AssetDescriptor {
    if (!descriptor.id) {
      throw new Error("AssetDescriptor must contain a unique 'id'");
    }

    const existing = this.assets.get(descriptor.id);
    const updated: AssetDescriptor = {
      ...existing,
      ...descriptor,
      protocol: descriptor.protocol || AssetRegistry.inferProtocol(descriptor.source),
      version: descriptor.version ?? existing?.version ?? 1,
    };

    this.assets.set(descriptor.id, updated);
    return updated;
  }

  /**
   * Convenience registration from raw URI.
   */
  public registerFromSource(
    id: string,
    source: string,
    options: {
      focalPoint?: FocalPoint;
      intrinsicMeta?: IntrinsicMetadata;
      version?: string | number;
      tags?: string[];
    } = {}
  ): AssetDescriptor {
    const protocol = AssetRegistry.inferProtocol(source);
    return this.register({
      id,
      protocol,
      source,
      ...options,
    });
  }

  /**
   * Retrieve asset descriptor by canonical ID.
   */
  public get(id: string): AssetDescriptor | undefined {
    return this.assets.get(id);
  }

  /**
   * Check if an asset ID is registered.
   */
  public has(id: string): boolean {
    return this.assets.has(id);
  }

  /**
   * Update intrinsic metadata for a registered asset (e.g. after decoding).
   */
  public updateIntrinsicMetadata(id: string, meta: IntrinsicMetadata): void {
    const asset = this.assets.get(id);
    if (asset) {
      asset.intrinsicMeta = { ...meta };
      if (!asset.intrinsicMeta.aspectRatio && meta.width && meta.height) {
        asset.intrinsicMeta.aspectRatio = meta.width / meta.height;
      }
    }
  }

  /**
   * Update default focal point for smart cropping.
   */
  public updateFocalPoint(id: string, focalPoint: FocalPoint): void {
    const asset = this.assets.get(id);
    if (asset) {
      asset.focalPoint = {
        x: Math.max(0, Math.min(1, focalPoint.x)),
        y: Math.max(0, Math.min(1, focalPoint.y)),
      };
    }
  }

  /**
   * List all registered asset descriptors.
   */
  public list(): AssetDescriptor[] {
    return Array.from(this.assets.values());
  }

  /**
   * Remove an asset by ID.
   */
  public unregister(id: string): boolean {
    return this.assets.delete(id);
  }

  /**
   * Clear all registered assets.
   */
  public clear(): void {
    this.assets.clear();
  }

  /**
   * Export asset manifest for project packaging.
   */
  public toJSON(): AssetDescriptor[] {
    return this.list();
  }

  /**
   * Import asset manifest from project package.
   */
  public fromJSON(manifest: AssetDescriptor[]): void {
    this.clear();
    for (const descriptor of manifest) {
      this.register(descriptor);
    }
  }
}

export const assetRegistry = new AssetRegistry();
