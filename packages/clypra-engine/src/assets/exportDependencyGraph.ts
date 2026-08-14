import type { FrameAssetDependency } from "./types.js";
import { ResourceCache, resourceCache } from "./resourceCache.js";
import { AssetRegistry, assetRegistry } from "./assetRegistry.js";

/**
 * Export Dependency Graph & Frame Readiness Barrier
 *
 * Ensures deterministic, zero-frame-drop rendering in headless export pipelines
 * by verifying all active asset dependencies at timestamp `t` are decoded and ready.
 */
export class ExportDependencyGraph {
  private dependencies: FrameAssetDependency[] = [];

  /**
   * Register a node's asset dependency across a timeline interval.
   */
  public registerDependency(dep: FrameAssetDependency): void {
    this.dependencies.push(dep);
  }

  /**
   * Clear all registered timeline dependencies.
   */
  public clear(): void {
    this.dependencies = [];
  }

  /**
   * Find all asset IDs required at the given timeline timestamp.
   */
  public getRequiredAssetIdsAt(timelineTime: number): string[] {
    const assetIds = new Set<string>();
    for (const dep of this.dependencies) {
      if (timelineTime >= dep.timelineStart && timelineTime <= dep.timelineEnd) {
        assetIds.add(dep.assetId);
      }
    }
    return Array.from(assetIds);
  }

  /**
   * Check if all required assets for the given timeline timestamp are ready in the resource cache.
   */
  public isFrameReady(
    timelineTime: number,
    cache: ResourceCache = resourceCache,
    registry: AssetRegistry = assetRegistry
  ): boolean {
    const requiredAssetIds = this.getRequiredAssetIdsAt(timelineTime);
    if (requiredAssetIds.length === 0) return true;

    for (const assetId of requiredAssetIds) {
      const descriptor = registry.get(assetId);
      const version = descriptor?.version ?? 1;
      // Check base asset key in cache
      const key = ResourceCache.generateKey({ assetId, version });
      const ready = cache.isReady(key);
      if (!ready) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the list of asset IDs that are still pending or missing for the given timestamp.
   */
  public getPendingAssetIdsAt(
    timelineTime: number,
    cache: ResourceCache = resourceCache,
    registry: AssetRegistry = assetRegistry
  ): string[] {
    const requiredAssetIds = this.getRequiredAssetIdsAt(timelineTime);
    const pending: string[] = [];

    for (const assetId of requiredAssetIds) {
      const descriptor = registry.get(assetId);
      const version = descriptor?.version ?? 1;
      const key = ResourceCache.generateKey({ assetId, version });
      if (!cache.isReady(key)) {
        pending.push(assetId);
      }
    }

    return pending;
  }
}

export const exportDependencyGraph = new ExportDependencyGraph();
