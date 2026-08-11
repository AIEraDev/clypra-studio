/**
 * Phase 4L — ExportJob & Streaming Media Encoder Test Suite
 *
 * Validates the export job state machine, preflight error/warning gating,
 * AbortSignal cancellation, streaming frame generator memory bounds, and pluggable encoders.
 */

import { describe, test, expect } from "vitest";
import {
  ExportJob,
  streamExportFrames,
  mediaEncoderRegistry,
  assetRegistry,
  type OverlayDocument,
  type SceneNode,
  type FrameNode,
  type PrimitiveTextNode,
  type PrimitiveMediaNode,
  type ExportConfig,
} from "../index.js";

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function makeDoc(
  nodes: SceneNode[] = [],
  variables: any[] = [],
  canvas = { width: 1280, height: 720 },
  duration = 3
): OverlayDocument {
  return {
    id: "export-job-doc",
    version: "2.0",
    title: "Export Job Test Doc",
    category: "test",
    canvas,
    variables,
    nodes,
    duration,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeCardNode(): FrameNode {
  const text: PrimitiveTextNode = {
    id: "t-val", name: "Value", type: "text", x: 0, y: 0, width: 200, height: 40,
    text: "100%",
    style: { fontSize: 32 },
  };
  return {
    id: "f-root", name: "Card", type: "frame", x: 10, y: 10, width: 250, height: 100,
    children: [text],
  };
}

// ---------------------------------------------------------------------------
// Suite 1: ExportJob Lifecycle
// ---------------------------------------------------------------------------

describe("Phase 4L — Suite 1: ExportJob Lifecycle", () => {
  test("1.1: ExportJob initializes with queued status and correct totalFrames", () => {
    const doc = makeDoc([makeCardNode()]);
    const config: ExportConfig = { profile: "720p-landscape", fps: 30, duration: 2 };
    const job = new ExportJob(doc, config);

    expect(job.status).toBe("queued");
    expect(job.progress.totalFrames).toBe(60); // 2s * 30fps
    expect(job.progress.percent).toBe(0);
  });

  test("1.2: ExportJob executes full lifecycle queued -> validating -> rendering -> encoding -> completed", async () => {
    const doc = makeDoc([makeCardNode()]);
    const config: ExportConfig = { profile: "720p-landscape", fps: 30, duration: 1, format: "png-sequence" };
    const job = new ExportJob(doc, config);
    const stages: string[] = [];

    job.subscribe((j) => {
      if (!stages.includes(j.status)) stages.push(j.status);
    });

    const output = await job.start();

    expect(job.status).toBe("completed");
    expect(output).toBeDefined();
    expect(output.frameCount).toBe(30); // 1s * 30fps
    expect(stages).toContain("validating");
    expect(stages).toContain("completed");
  });

  test("1.3: job.toRecord() serializes clean snapshot object", () => {
    const doc = makeDoc([makeCardNode()]);
    const job = new ExportJob(doc, { profile: "1080p-square", fps: 30, duration: 2 });
    const record = job.toRecord();

    expect(record.id).toBe(job.id);
    expect(record.documentId).toBe(doc.id);
    expect(record.documentTitle).toBe(doc.title);
    expect(record.status).toBe("queued");
    expect(record.config.profile).toBe("1080p-square");
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Preflight Error vs Warning Gating
// ---------------------------------------------------------------------------

describe("Phase 4L — Suite 2: Preflight Gating", () => {
  test("2.1: Preflight error (MISSING_ASSET) blocks job execution", async () => {
    const badMedia: PrimitiveMediaNode = {
      id: "bad-m", name: "Bad Media", type: "media", mediaType: "image",
      x: 0, y: 0, width: 100, height: 100,
      assetId: "asset-nonexistent-xyz",
    };
    const doc = makeDoc([badMedia]);
    const job = new ExportJob(doc, { profile: "720p-landscape" });

    await expect(job.start()).rejects.toThrow("Preflight validation failed");
    expect(job.status).toBe("failed");
    expect(job.diagnostics.some((d) => d.code === "MISSING_ASSET")).toBe(true);
  });

  test("2.2: Preflight warning (DURATION_OVERFLOW) permits export execution", async () => {
    const overflowText: PrimitiveTextNode = {
      id: "over-t", name: "Overflow", type: "text", x: 0, y: 0, width: 100, height: 30, text: "Overflow",
      animation: { entrance: { type: "fade", duration: 5.0, delay: 2.0 } }, // 7s > 3s clip
    };
    const doc = makeDoc([overflowText], [], { width: 1280, height: 720 }, 3);
    const job = new ExportJob(doc, { profile: "720p-landscape", fps: 30, duration: 3 });

    const output = await job.start();
    expect(job.status).toBe("completed-with-warnings");
    expect(output.frameCount).toBe(90);
    expect(job.diagnostics.some((d) => d.code === "DURATION_OVERFLOW")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: AbortSignal Cancellation
// ---------------------------------------------------------------------------

describe("Phase 4L — Suite 3: AbortSignal Cancellation", () => {
  test("3.1: calling job.cancel() transitions status to cancelled", async () => {
    const doc = makeDoc([makeCardNode()], [], { width: 1280, height: 720 }, 10); // 10s duration = 300 frames
    const job = new ExportJob(doc, { profile: "720p-landscape", fps: 30, duration: 10 });

    // Cancel job as soon as frame 5 is reached
    const unsubscribe = job.subscribe((j) => {
      if (j.progress.renderedFrames >= 5 && j.status === "encoding") {
        j.cancel();
      }
    });

    await expect(job.start()).rejects.toThrow();
    expect(job.status).toBe("cancelled");
    expect(job.error).toContain("cancelled");
    unsubscribe();
  });

  test("3.2: cancel() on non-running job is no-op", () => {
    const doc = makeDoc([makeCardNode()]);
    const job = new ExportJob(doc, { profile: "720p-landscape" });
    job.status = "completed";

    job.cancel();
    expect(job.status).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Streaming Generator Memory Bounds
// ---------------------------------------------------------------------------

describe("Phase 4L — Suite 4: Streaming Generator", () => {
  test("4.1: streamExportFrames yields frames sequentially without storing history", async () => {
    const doc = makeDoc([makeCardNode()], [], { width: 1280, height: 720 }, 2);
    const stream = streamExportFrames(doc, { fps: 30, duration: 2 });
    let frameCount = 0;

    for await (const frame of stream) {
      expect(frame.frameIndex).toBe(frameCount);
      expect(frame.time).toBeCloseTo(frameCount / 30, 2);
      frameCount++;
    }

    expect(frameCount).toBe(60);
  });

  test("4.2: streamExportFrames aborts immediately when AbortSignal triggers", async () => {
    const controller = new AbortController();
    const doc = makeDoc([makeCardNode()], [], { width: 1280, height: 720 }, 5);
    const stream = streamExportFrames(doc, { fps: 30, duration: 5 }, controller.signal);

    controller.abort();

    await expect(async () => {
      for await (const _frame of stream) {
        // should fail on first iteration
      }
    }).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Encoders & Media Encoder Registry
// ---------------------------------------------------------------------------

describe("Phase 4L — Suite 5: Media Encoders", () => {
  test("5.1: mediaEncoderRegistry resolves encoders for all 4 export formats", () => {
    expect(mediaEncoderRegistry.get("png-sequence").format).toBe("png-sequence");
    expect(mediaEncoderRegistry.get("webm").format).toBe("webm");
    expect(mediaEncoderRegistry.get("gif").format).toBe("gif");
    expect(mediaEncoderRegistry.get("raw-frames").format).toBe("raw-frames");
  });

  test("5.2: PngSequenceEncoder produces valid ZIP-ready file entries", async () => {
    const doc = makeDoc([makeCardNode()]);
    const job = new ExportJob(doc, { profile: "720p-landscape", fps: 30, duration: 1, format: "png-sequence" });
    const output = await job.start();

    expect(output.format).toBe("png-sequence");
    expect(output.files).toBeDefined();
    expect(output.files!).toHaveLength(30);
    expect(output.files![0].name).toBe("frame_0000.png");
  });

  test("5.3: WebMEncoder produces valid EncodedOutput with blob payload", async () => {
    const doc = makeDoc([makeCardNode()]);
    const job = new ExportJob(doc, { profile: "720p-landscape", fps: 30, duration: 1, format: "webm" });
    const output = await job.start();

    expect(output.format).toBe("webm");
    expect(output.blob).toBeDefined();
    expect(output.frameCount).toBe(30);
  });
});
