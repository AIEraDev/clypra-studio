import type { ResolvedResource, CacheKeyOptions, ResourceKind, ResourceState } from "./types.js";

/**
 * Universal Resource Cache
 *
 * Provides thread-safe, deduplicated memory management for decoded
 * images, textures, audio buffers, and parsed vectors with LRU eviction.
 */
export class ResourceCache {
  private resources = new Map<string, ResolvedResource>();
  private pendingPromises = new Map<string, Promise<ResolvedResource>>();
  private maxByteSize: number;
  private currentByteSize = 0;

  constructor(maxByteSize = 128 * 1024 * 1024) { // Default 128MB
    this.maxByteSize = maxByteSize;
  }

  /**
   * Deterministically generate a composite cache key.
   */
  public static generateKey(options: CacheKeyOptions): string {
    const { assetId, version = "1", targetWidth = 0, targetHeight = 0, fitMode = "none", focalPoint } = options;
    const fpStr = focalPoint ? `_fp${focalPoint.x.toFixed(2)},${focalPoint.y.toFixed(2)}` : "";
    return `${assetId}@v${version}_${targetWidth}x${targetHeight}_${fitMode}${fpStr}`;
  }

  /**
   * Retrieve a cached resource synchronously if available.
   */
  public get<T = any>(key: string): ResolvedResource<T> | undefined {
    const res = this.resources.get(key);
    if (res) {
      res.lastAccessTime = Date.now();
    }
    return res as ResolvedResource<T> | undefined;
  }

  /**
   * Check if a resource key is currently ready in cache.
   */
  public isReady(key: string): boolean {
    const res = this.resources.get(key);
    return res !== undefined && res.state === "ready" && res.data !== null;
  }

  /**
   * Acquire a resource (increments reference count).
   */
  public acquire<T = any>(key: string): ResolvedResource<T> | undefined {
    const res = this.get<T>(key);
    if (res) {
      res.refCount += 1;
    }
    return res;
  }

  /**
   * Release a resource (decrements reference count).
   */
  public release(key: string): void {
    const res = this.resources.get(key);
    if (res) {
      res.refCount = Math.max(0, res.refCount - 1);
    }
  }

  /**
   * Store or update a resolved resource in cache.
   */
  public set<T = any>(
    key: string,
    resource: Omit<ResolvedResource<T>, "handle" | "lastAccessTime" | "refCount">
  ): ResolvedResource<T> {
    const existing = this.resources.get(key);
    if (existing) {
      this.currentByteSize -= existing.byteSize;
    }

    const fullResource: ResolvedResource<T> = {
      ...resource,
      handle: key,
      lastAccessTime: Date.now(),
      refCount: existing ? existing.refCount : 1,
    };

    this.currentByteSize += fullResource.byteSize;
    this.resources.set(key, fullResource);

    // Evict if memory limit exceeded
    this.evictIfNeeded();

    return fullResource;
  }

  /**
   * Load or retrieve an asset resource asynchronously with deduplicated in-flight requests.
   */
  public async loadResource<T = any>(
    key: string,
    loader: () => Promise<{ data: T; width: number; height: number; byteSize?: number; kind: ResourceKind }>,
    assetId: string
  ): Promise<ResolvedResource<T>> {
    // 1. Return immediately if ready
    const existing = this.get<T>(key);
    if (existing && existing.state === "ready") {
      return existing;
    }

    // 2. Deduplicate in-flight promises
    if (this.pendingPromises.has(key)) {
      return this.pendingPromises.get(key)! as Promise<ResolvedResource<T>>;
    }

    // 3. Mark as loading
    this.set(key, {
      assetId,
      kind: "placeholder",
      data: null,
      width: 0,
      height: 0,
      byteSize: 0,
      state: "loading",
    });

    const promise = (async () => {
      try {
        const loaded = await loader();
        const byteSize = loaded.byteSize ?? (loaded.width * loaded.height * 4); // Estimate 4 bytes/pixel
        return this.set<T>(key, {
          assetId,
          kind: loaded.kind,
          data: loaded.data,
          width: loaded.width,
          height: loaded.height,
          byteSize,
          state: "ready",
        });
      } catch (err: any) {
        const errorRes = this.set<T>(key, {
          assetId,
          kind: "placeholder",
          data: null,
          width: 0,
          height: 0,
          byteSize: 0,
          state: "error",
          error: err?.message || String(err),
        });
        return errorRes;
      } finally {
        this.pendingPromises.delete(key);
      }
    })();

    this.pendingPromises.set(key, promise);
    return promise;
  }

  /**
   * Evict least-recently-used unreferenced resources when memory threshold is reached.
   */
  private evictIfNeeded(): void {
    if (this.currentByteSize <= this.maxByteSize) return;

    // Collect candidates with refCount === 0 sorted by lastAccessTime
    const candidates = Array.from(this.resources.entries())
      .filter(([_, res]) => res.refCount === 0)
      .sort((a, b) => a[1].lastAccessTime - b[1].lastAccessTime);

    for (const [key, res] of candidates) {
      if (this.currentByteSize <= this.maxByteSize * 0.8) break; // Evict down to 80% watermark
      this.currentByteSize -= res.byteSize;
      this.resources.delete(key);
    }
  }

  /**
   * Get current resource cache size and memory stats.
   */
  public getStats() {
    return {
      resourceCount: this.resources.size,
      pendingCount: this.pendingPromises.size,
      currentByteSize: this.currentByteSize,
      maxByteSize: this.maxByteSize,
    };
  }

  /**
   * Clear all cached resources.
   */
  public clear(): void {
    this.resources.clear();
    this.pendingPromises.clear();
    this.currentByteSize = 0;
  }
}

export const resourceCache = new ResourceCache();
