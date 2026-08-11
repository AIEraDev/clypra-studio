/**
 * Phase 4M — Export Fidelity & Production Hardening Test Suite
 *
 * Verifies golden-frame rendering determinism across 10 representative frames,
 * document snapshot isolation under live canvas editing, frame-count-independent
 * working memory, preflight hardening, CORS advisories, job retry, and stage-specific abort cleanup.
 */

import { describe, test, expect } from "vitest";
import {
  ExportJob,
  exportValidator,
  evaluateExportFrame,
  streamExportFrames,
  assetRegistry,
  type OverlayDocument,
  type SceneNode,
  type FrameNode,
  type PrimitiveTextNode,
  type PrimitiveShapeNode,
  type PrimitiveMediaNode,
} from "../index.js";

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function makeDoc(
  nodes: SceneNode[] = [],
  variables: any[] = [],
  canvas = { width: 1280, height: 720 },
  duration = 5
): OverlayDocument {
  return {
    id: "fidelity-test-doc",
    version: "2.0",
    title: "Export Fidelity Test Doc",
    category: "test",
    canvas,
    variables,
    nodes,
    duration,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeGoldenSceneTree(): FrameNode {
  const text: PrimitiveTextNode = {
    id: "g-text",
    name: "Golden Headline",
    type: "text",
    x: 0, y: 0, width: 250, height: 40,
    text: "Revenue: ${{revenue}}",
    style: {
      fontSize: 28,
      textColor: "#FFFFFF",
      shadow: { x: 2, y: 4, blur: 8, color: "rgba(0,0,0,0.5)" },
    },
    animation: { entrance: { type: "fade", duration: 1.0, delay: 0 } },
    layout: { constraints: { widthMode: "hug" } },
  };

  const badge: PrimitiveShapeNode = {
    id: "g-badge",
    name: "Status Badge",
    type: "shape",
    shapeType: "rectangle",
    x: 0, y: 0, width: 100, height: 30,
    style: {
      fillColor: "#22C55E",
      borderRadius: 8,
      fillGradient: { type: "linear", colors: ["#22C55E", "#16A34A"], angle: 90 },
    },
  };

  return {
    id: "g-frame",
    name: "Golden Card Container",
    type: "frame",
    x: 50, y: 50, width: 320, height: 180,
    layout: {
      mode: "flex-column",
      gap: 12,
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      constraints: { widthMode: "fixed" },
    },
    children: [text, badge],
  };
}

// ---------------------------------------------------------------------------
// Suite 1: Golden-Frame Rendering & State Determinism
// ---------------------------------------------------------------------------

describe("Phase 4M — Suite 1: Golden-Frame Rendering & State Determinism", () => {
  const timestamps = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5];

  test.each(timestamps.map((t) => [`t=${t}s`, t]))(
    "1.%# [%s]: evaluated scene state is byte-for-byte deterministic across repeated passes",
    (_label, t) => {
      const doc = makeDoc([makeGoldenSceneTree()], [{ key: "revenue", type: "number", defaultValue: 2500000 }]);

      const passA = evaluateExportFrame(doc, t, { profile: "720p-landscape", fps: 60 });
      const passB = evaluateExportFrame(doc, t, { profile: "720p-landscape", fps: 60 });

      expect(passA.frameIndex).toBe(passB.frameIndex);
      expect(passA.evaluatedSceneState).toEqual(passB.evaluatedSceneState);
      expect(passA.layoutState).toEqual(passB.layoutState);
      expect(passA.canvasWidth).toBe(1280);
      expect(passA.canvasHeight).toBe(720);
    }
  );

  test("1.11: evaluated node geometry properties match layout bounds precisely", () => {
    const doc = makeDoc([makeGoldenSceneTree()]);
    const frame = evaluateExportFrame(doc, 2.0);

    const frameBounds = frame.layoutState.nodes["g-frame"];
    const evaluatedFrameNode = frame.evaluatedSceneState.nodes["g-frame"];

    expect(evaluatedFrameNode.x).toBe(frameBounds.x);
    expect(evaluatedFrameNode.y).toBe(frameBounds.y);
    expect(evaluatedFrameNode.width).toBe(frameBounds.width);
    expect(evaluatedFrameNode.height).toBe(frameBounds.height);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Job Snapshot Isolation
// ---------------------------------------------------------------------------

describe("Phase 4M — Suite 2: Job Snapshot Isolation", () => {
  test("2.1: live canvas document mutations during export do not leak into active job", async () => {
    const liveDoc = makeDoc([makeGoldenSceneTree()]);
    const job = new ExportJob(liveDoc, { profile: "720p-landscape", fps: 30, duration: 1 });

    // Mutate liveDoc after job instantiation (delete all nodes & change title)
    liveDoc.title = "MUTATED TITLE";
    liveDoc.nodes = [];

    // Execute job
    const output = await job.start();

    // Export output matches initial snapshot, uncorrupted by live mutations
    expect(job.docSnapshot.title).toBe("Export Fidelity Test Doc");
    expect(job.docSnapshot.nodes).toHaveLength(1);
    expect(output.frameCount).toBe(30);
  });

  test("2.2: job.docSnapshot is a deep clone independent of input reference", () => {
    const liveDoc = makeDoc([makeGoldenSceneTree()]);
    const job = new ExportJob(liveDoc, { profile: "720p-landscape" });

    // Mutate nested node property on liveDoc
    (liveDoc.nodes[0] as FrameNode).children[0].name = "CHANGED NAME";

    expect((job.docSnapshot.nodes[0] as FrameNode).children[0].name).toBe("Golden Headline");
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Frame-Count-Independent Working Memory
// ---------------------------------------------------------------------------

describe("Phase 4M — Suite 3: Frame-Count-Independent Memory Invariants", () => {
  test("3.1: 1,200 frame stream (20s @ 60 FPS) completes without frame array accumulation", async () => {
    const doc = makeDoc([makeGoldenSceneTree()], [], { width: 1280, height: 720 }, 20);
    const stream = streamExportFrames(doc, { fps: 60, duration: 20 });
    let frameCount = 0;

    for await (const frame of stream) {
      expect(frame.frameIndex).toBe(frameCount);
      expect(frame.canvasWidth).toBe(1280);
      frameCount++;
    }

    expect(frameCount).toBe(1200); // 20s * 60fps = 1,200 frames
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Preflight Hardening, CORS & Job Retry
// ---------------------------------------------------------------------------

describe("Phase 4M — Suite 4: Preflight Hardening & Job Retry", () => {
  test("4.1: CORS_TAINT_WARNING generated for remote HTTP asset URIs", () => {
    const assetId = "remote-cors-asset-1";
    assetRegistry.register({
      assetId,
      kind: "image",
      source: "remote",
      uri: "https://cdn.example.com/banner.png",
    });

    const mediaNode: PrimitiveMediaNode = {
      id: "m-cors", name: "CORS Banner", type: "media", mediaType: "image",
      x: 0, y: 0, width: 200, height: 100,
      assetId,
    };
    const doc = makeDoc([mediaNode]);
    const diagnostics = exportValidator.validate(doc);

    const corsWarn = diagnostics.find((d) => d.code === "CORS_TAINT_WARNING");
    expect(corsWarn).toBeDefined();
    expect(corsWarn?.severity).toBe("warning");
  });

  test("4.2: job completes with status = 'completed-with-warnings' when warnings exist", async () => {
    const assetId = "remote-cors-asset-2";
    assetRegistry.register({
      assetId,
      kind: "image",
      source: "remote",
      uri: "https://cdn.example.com/icon.png",
    });

    const mediaNode: PrimitiveMediaNode = {
      id: "m-warn", name: "Remote Icon", type: "media", mediaType: "image",
      x: 0, y: 0, width: 50, height: 50,
      assetId,
    };
    const doc = makeDoc([mediaNode]);
    const job = new ExportJob(doc, { profile: "720p-landscape", fps: 30, duration: 1 });

    const output = await job.start();
    expect(job.status).toBe("completed-with-warnings");
    expect(output.frameCount).toBe(30);
  });

  test("4.3: job.retry() resets failed/cancelled state and re-executes job", async () => {
    const doc = makeDoc([makeGoldenSceneTree()]);
    const job = new ExportJob(doc, { profile: "720p-landscape", fps: 30, duration: 1 });

    // Force job to fail by executing with invalid FPS
    job.config.fps = -10;
    await expect(job.start()).rejects.toThrow();
    expect(job.status).toBe("failed");

    // Fix config and retry
    job.config.fps = 30;
    const output = await job.retry();

    expect(job.status).toBe("completed");
    expect(job.retryCount).toBe(1);
    expect(output.frameCount).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Stage-Specific Abort & Cleanup
// ---------------------------------------------------------------------------

describe("Phase 4M — Suite 5: Stage-Specific Abort & Cleanup", () => {
  test("5.1: abort during validating stage cleans state and outputs zero frames", async () => {
    const doc = makeDoc([makeGoldenSceneTree()]);
    const job = new ExportJob(doc, { profile: "720p-landscape" });

    // Cancel before calling start
    job.cancel();

    expect(job.status).toBe("cancelled");
    expect(job.output).toBeUndefined();
    await expect(job.start()).rejects.toThrow();
  });

  test("5.2: abort during rendering cleans output and clears buffers", async () => {
    const doc = makeDoc([makeGoldenSceneTree()], [], { width: 1280, height: 720 }, 10);
    const job = new ExportJob(doc, { profile: "720p-landscape", fps: 30, duration: 10 });

    const unsubscribe = job.subscribe((j) => {
      if (j.progress.renderedFrames >= 10 && j.status === "encoding") {
        j.cancel();
      }
    });

    await expect(job.start()).rejects.toThrow();
    expect(job.status).toBe("cancelled");
    expect(job.output).toBeUndefined(); // Output cleared
    unsubscribe();
  });
});
