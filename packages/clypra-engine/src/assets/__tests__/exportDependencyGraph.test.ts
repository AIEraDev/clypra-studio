import { describe, it, expect, beforeEach } from "vitest";
import { ExportDependencyGraph } from "../exportDependencyGraph.js";
import { ResourceCache } from "../resourceCache.js";
import { AssetRegistry } from "../assetRegistry.js";

describe("ExportDependencyGraph", () => {
  let graph: ExportDependencyGraph;
  let cache: ResourceCache;
  let registry: AssetRegistry;

  beforeEach(() => {
    graph = new ExportDependencyGraph();
    cache = new ResourceCache();
    registry = new AssetRegistry();
  });

  it("should return true when no assets are required at the timestamp", () => {
    expect(graph.isFrameReady(1.5, cache, registry)).toBe(true);
  });

  it("should block frame readiness when required asset is not in cache", () => {
    registry.registerFromSource("avatar-1", "https://example.com/avatar.jpg");

    graph.registerDependency({
      nodeId: "avatar-node",
      assetId: "avatar-1",
      timelineStart: 1.0,
      timelineEnd: 5.0,
    });

    // Outside time interval -> ready
    expect(graph.isFrameReady(0.5, cache, registry)).toBe(true);

    // Inside time interval -> NOT ready (asset not in cache)
    expect(graph.isFrameReady(2.5, cache, registry)).toBe(false);
    expect(graph.getPendingAssetIdsAt(2.5, cache, registry)).toEqual(["avatar-1"]);
  });

  it("should unblock frame readiness once required asset is ready in cache", () => {
    registry.registerFromSource("speaker-img", "asset://speaker.png");

    graph.registerDependency({
      nodeId: "speaker-card",
      assetId: "speaker-img",
      timelineStart: 0.0,
      timelineEnd: 3.0,
    });

    expect(graph.isFrameReady(1.5, cache, registry)).toBe(false);

    // Put decoded resource into cache with base key
    const baseKey = ResourceCache.generateKey({ assetId: "speaker-img", version: 1 });
    cache.set(baseKey, {
      assetId: "speaker-img",
      kind: "image-bitmap",
      data: {},
      width: 500,
      height: 500,
      byteSize: 1000000,
      state: "ready",
    });

    expect(graph.isFrameReady(1.5, cache, registry)).toBe(true);
    expect(graph.getPendingAssetIdsAt(1.5, cache, registry)).toEqual([]);
  });
});
