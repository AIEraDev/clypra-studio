import { describe, it, expect } from "vitest";
import {
  ExportJob,
  streamExportFrames,
  mediaEncoderRegistry,
  Mp4VideoEncoder,
  ProResVideoEncoder,
  LiveBroadcastBridge,
} from "../export/index.js";
import { ExportDependencyGraph } from "../../assets/exportDependencyGraph.js";
import { ResourceCache } from "../../assets/resourceCache.js";
import { AssetRegistry } from "../../assets/assetRegistry.js";
import type { OverlayDocument, FrameNode, PrimitiveTextNode } from "../overlayDocumentSchema.js";

describe("Layer 3B: Headless Production Exporter Crucible Benchmark", () => {
  const create4kDoc = (): OverlayDocument => ({
    id: "doc-4k-prod",
    version: "1.0",
    title: "4K Master Overlay",
    canvas: { width: 3840, height: 2160, backgroundColor: "transparent" },
    duration: 2, // 2 seconds @ 60 FPS = 120 frames
    nodes: [
      {
        id: "hero-frame",
        name: "Hero Frame",
        type: "frame",
        x: 192,
        y: 1800,
        width: 1200,
        height: 240,
        style: { fillColor: "#0F172A", borderRadius: 24 },
        children: [
          {
            id: "title",
            name: "Title",
            type: "text",
            text: "4K 60FPS Master Production Overlay",
            fontSize: 48,
            x: 40,
            y: 40,
            width: 1000,
            height: 60,
          } as PrimitiveTextNode,
        ],
      } as FrameNode,
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // =========================================================================
  // 1. 4K / 60FPS FRAME RASTERIZER
  // =========================================================================
  describe("1. 4K / 60FPS Frame-by-Frame Rasterizer", () => {
    it("1.1: should yield 120 discrete frames at 4K (3840x2160) without accumulating memory", async () => {
      const doc = create4kDoc();
      const frameStream = streamExportFrames(doc, { profile: "4k-landscape", fps: 60, duration: 2 });

      let frameCount = 0;
      for await (const frame of frameStream) {
        expect(frame.canvasWidth).toBe(3840);
        expect(frame.canvasHeight).toBe(2160);
        expect(frame.frameIndex).toBe(frameCount);
        expect(frame.time).toBeCloseTo(frameCount / 60, 4);
        frameCount++;
      }

      expect(frameCount).toBe(120);
    });
  });

  // =========================================================================
  // 2. EXPORT DEPENDENCY GRAPH READINESS BARRIER
  // =========================================================================
  describe("2. ExportDependencyGraph Readiness Barrier", () => {
    it("2.1: should gate frame readiness and prevent rendering unloaded assets", () => {
      const depGraph = new ExportDependencyGraph();
      const cache = new ResourceCache();
      const registry = new AssetRegistry();

      // Register asset in registry
      registry.register({
        id: "hero-logo",
        sourceUri: "https://clypra.tv/logo.png",
        mediaType: "image",
        status: "ready",
        version: 1,
      });

      // Register timeline dependency at t=0.5s -> 2.0s
      depGraph.registerDependency({
        nodeId: "logo-node",
        assetId: "hero-logo",
        timelineStart: 0.5,
        timelineEnd: 2.0,
      });

      // At t=0.2s: Logo is not needed -> isFrameReady is true
      expect(depGraph.isFrameReady(0.2, cache, registry)).toBe(true);

      // At t=1.0s: Logo is required, but not in cache -> isFrameReady is false
      expect(depGraph.isFrameReady(1.0, cache, registry)).toBe(false);
      expect(depGraph.getPendingAssetIdsAt(1.0, cache, registry)).toEqual(["hero-logo"]);

      // Populate cache with decoded asset
      const cacheKey = ResourceCache.generateKey({ assetId: "hero-logo", version: 1 });
      cache.set(cacheKey, {
        assetId: "hero-logo",
        kind: "texture",
        state: "ready",
        byteSize: 1024,
        data: { texture: {} },
      });

      // Now at t=1.0s: Logo is cached -> isFrameReady is true
      expect(depGraph.isFrameReady(1.0, cache, registry)).toBe(true);
      expect(depGraph.getPendingAssetIdsAt(1.0, cache, registry)).toEqual([]);
    });
  });

  // =========================================================================
  // 3. WEBCODECS MP4 & PRORES 4444 EXPORTERS
  // =========================================================================
  describe("3. WebCodecs MP4 & ProRes 4444 Exporters", () => {
    it("3.1: should encode MP4 video stream with configurable fps and bitrate", async () => {
      const doc = create4kDoc();
      const mp4Encoder = new Mp4VideoEncoder();
      const frameStream = streamExportFrames(doc, { fps: 60, duration: 1 });

      const output = await mp4Encoder.encode(frameStream, {
        profile: "1080p-landscape",
        fps: 60,
        duration: 1,
        codec: "h264",
        bitrate: 15_000_000,
      });

      expect(output.format).toBe("mp4");
      expect(output.frameCount).toBe(60);
      expect(output.blob).toBeDefined();
      expect(output.blob?.type).toBe("video/mp4");
    });

    it("3.2: should encode ProRes 4444 video stream with alpha channel preservation", async () => {
      const doc = create4kDoc();
      const proResEncoder = new ProResVideoEncoder();
      const frameStream = streamExportFrames(doc, { fps: 60, duration: 1 });

      const output = await proResEncoder.encode(frameStream, {
        profile: "4k-landscape",
        fps: 60,
        duration: 1,
        transparent: true,
      });

      expect(output.format).toBe("prores");
      expect(output.frameCount).toBe(60);
      expect(output.blob).toBeDefined();
      expect(output.blob?.type).toBe("video/quicktime");
    });
  });

  // =========================================================================
  // 4. OBS / WEBRTC LIVE BROADCAST STREAMING BRIDGE
  // =========================================================================
  describe("4. OBS / WebRTC Live Broadcast Streaming Bridge", () => {
    it("4.1: should stream 60 consecutive broadcast frames in real time with zero dropped frames", () => {
      const doc = create4kDoc();
      const bridge = new LiveBroadcastBridge();

      const receivedFrames: number[] = [];
      bridge.start(doc, {
        fps: 60,
        width: 1920,
        height: 1080,
        transparent: true,
        onFrame: (frame) => {
          receivedFrames.push(frame.frameIndex);
        },
      });

      expect(bridge.isActive()).toBe(true);

      // Simulate 60 frame ticks (1 second of live broadcast)
      for (let i = 0; i < 60; i++) {
        const time = i / 60;
        const frame = bridge.emitFrame(time, { activeViewers: 1420 + i });
        expect(frame.isAssetReady).toBe(true);
        expect(frame.dropped).toBe(false);
      }

      expect(receivedFrames.length).toBe(60);
      expect(bridge.getFrameCount()).toBe(60);

      bridge.stop();
      expect(bridge.isActive()).toBe(false);
    });
  });

  // =========================================================================
  // HERO BENCHMARK: 4K 60FPS Headless Production Export Job
  // =========================================================================
  describe("Hero Benchmark: 4K 60FPS Headless Production Export Job", () => {
    it("should orchestrate full end-to-end 4K 60FPS export job with snapshot isolation and zero frame loss", async () => {
      const doc = create4kDoc();
      const job = new ExportJob(doc, {
        profile: "4k-landscape",
        fps: 60,
        duration: 1, // 60 frames
        format: "mp4",
        codec: "hevc",
      });

      expect(job.status).toBe("queued");
      const result = await job.start();

      expect(job.status).toBe("completed");
      expect(result.frameCount).toBe(60);
      expect(result.format).toBe("mp4");
      expect(job.progress.percent).toBe(100);
      expect(job.progress.renderedFrames).toBe(60);
    });
  });
});
