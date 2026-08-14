import { describe, it, expect, beforeEach, vi } from "vitest";
import { ResourceCache } from "../resourceCache.js";

describe("ResourceCache", () => {
  let cache: ResourceCache;

  beforeEach(() => {
    cache = new ResourceCache(1024 * 1024); // 1MB capacity for test
  });

  it("should generate deterministic composite cache keys", () => {
    const key1 = ResourceCache.generateKey({
      assetId: "avatar-1",
      version: 2,
      targetWidth: 120,
      targetHeight: 120,
      fitMode: "cover",
      focalPoint: { x: 0.5, y: 0.3 },
    });

    const key2 = ResourceCache.generateKey({
      assetId: "avatar-1",
      version: 2,
      targetWidth: 120,
      targetHeight: 120,
      fitMode: "cover",
      focalPoint: { x: 0.5, y: 0.3 },
    });

    expect(key1).toBe("avatar-1@v2_120x120_cover_fp0.50,0.30");
    expect(key1).toBe(key2);
  });

  it("should store, acquire, and release resources with ref-counting", () => {
    const key = "test-resource";
    cache.set(key, {
      assetId: "asset-1",
      kind: "image-bitmap",
      data: { mockBitmap: true },
      width: 100,
      height: 100,
      byteSize: 40000,
      state: "ready",
    });

    expect(cache.isReady(key)).toBe(true);

    const acquired = cache.acquire(key);
    expect(acquired?.refCount).toBe(2);

    cache.release(key);
    expect(cache.get(key)?.refCount).toBe(1);
  });

  it("should deduplicate in-flight loading promises for the same cache key", async () => {
    const key = "async-image-key";
    let loaderCallCount = 0;

    const mockLoader = vi.fn().mockImplementation(async () => {
      loaderCallCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return {
        data: { image: true },
        width: 200,
        height: 200,
        byteSize: 160000,
        kind: "image-bitmap",
      };
    });

    // Fire 3 concurrent loads for the same key
    const [res1, res2, res3] = await Promise.all([
      cache.loadResource(key, mockLoader, "asset-1"),
      cache.loadResource(key, mockLoader, "asset-1"),
      cache.loadResource(key, mockLoader, "asset-1"),
    ]);

    expect(loaderCallCount).toBe(1);
    expect(res1.state).toBe("ready");
    expect(res2.state).toBe("ready");
    expect(res3.state).toBe("ready");
    expect(res1.data).toBe(res2.data);
  });

  it("should evict unreferenced resources when memory threshold is exceeded", () => {
    // Fill cache with unreferenced resources (refCount = 0)
    for (let i = 0; i < 5; i++) {
      const key = `res-${i}`;
      cache.set(key, {
        assetId: `asset-${i}`,
        kind: "image-bitmap",
        data: { idx: i },
        width: 200,
        height: 200,
        byteSize: 300 * 1024, // 300KB each -> 5 items = 1.5MB (exceeds 1MB limit)
        state: "ready",
      });
      // Release reference so refCount becomes 0
      cache.release(key);
    }

    const stats = cache.getStats();
    expect(stats.currentByteSize).toBeLessThanOrEqual(1024 * 1024);
  });
});
