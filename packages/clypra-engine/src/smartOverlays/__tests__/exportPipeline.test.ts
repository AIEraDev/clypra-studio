/**
 * Phase 4K — Production Export & Rendering Pipeline Test Suite
 *
 * Comprehensive cross-system acceptance tests verifying pre-export safety validation,
 * deterministic frame pipeline evaluation, export profiles & resolution scaling,
 * transparent rendering, and end-to-end frame sequence execution.
 */

import { describe, test, expect } from "vitest";
import {
  exportValidator,
  evaluateExportFrame,
  resolveExportCanvasDimensions,
  renderEngine,
  assetRegistry,
  fontRegistry,
  type OverlayDocument,
  type SceneNode,
  type FrameNode,
  type PrimitiveMediaNode,
  type PrimitiveTextNode,
  type ExportConfig,
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
    id: "export-test-doc",
    version: "2.0",
    title: "Export Pipeline Test Doc",
    category: "test",
    canvas,
    variables,
    nodes,
    duration,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeStatCardTree(): FrameNode {
  const title: PrimitiveTextNode = {
    id: "stat-title",
    name: "Title",
    type: "text",
    x: 0, y: 0, width: 200, height: 30,
    text: "Total Revenue",
    style: { fontSize: 20, textColor: "#FFFFFF" },
    layout: { constraints: { widthMode: "hug" } },
  };

  const value: PrimitiveTextNode = {
    id: "stat-val",
    name: "Value",
    type: "text",
    x: 0, y: 0, width: 200, height: 50,
    text: "${{revenue}}",
    style: { fontSize: 40, textColor: "#7C6FFF" },
    animation: { entrance: { type: "fade", duration: 0.5, delay: 0 } },
    layout: { constraints: { widthMode: "hug" } },
  };

  return {
    id: "stat-frame",
    name: "StatCard",
    type: "frame",
    x: 40, y: 40, width: 300, height: 160,
    layout: {
      mode: "flex-column",
      gap: 8,
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      constraints: { widthMode: "hug" },
    },
    children: [title, value],
  };
}

// ---------------------------------------------------------------------------
// Suite 1: Pre-Export Safety Validator
// ---------------------------------------------------------------------------

describe("Phase 4K — Suite 1: Pre-Export Safety Validator", () => {
  test("1.1: clean document returns zero error diagnostics", () => {
    const doc = makeDoc([makeStatCardTree()]);
    const diagnostics = exportValidator.validate(doc);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });

  test("1.2: detects MISSING_ASSET for unmanifested assetId", () => {
    const mediaNode: PrimitiveMediaNode = {
      id: "m1", name: "Logo", type: "media", mediaType: "image",
      x: 0, y: 0, width: 100, height: 100,
      assetId: "asset-nonexistent-999",
    };
    const doc = makeDoc([mediaNode]);
    const diagnostics = exportValidator.validate(doc);

    const assetErr = diagnostics.find((d) => d.code === "MISSING_ASSET");
    expect(assetErr).toBeDefined();
    expect(assetErr?.severity).toBe("error");
    expect(assetErr?.nodeId).toBe("m1");
  });

  test("1.3: passes asset check when registered in AssetRegistry", () => {
    const assetId = "asset-registered-123";
    assetRegistry.register({
      assetId,
      kind: "image",
      source: "remote",
      uri: "https://example.com/logo.png",
    });

    const mediaNode: PrimitiveMediaNode = {
      id: "m2", name: "Registered Image", type: "media", mediaType: "image",
      x: 0, y: 0, width: 100, height: 100,
      assetId,
    };
    const doc = makeDoc([mediaNode]);
    const diagnostics = exportValidator.validate(doc);
    const assetErrors = diagnostics.filter((d) => d.code === "MISSING_ASSET");
    expect(assetErrors).toHaveLength(0);
  });

  test("1.4: detects INVALID_BINDING syntax error in visibilityExpression", () => {
    const node: SceneNode = {
      id: "b1", name: "Bad Binding Node", type: "shape", shapeType: "rectangle",
      x: 0, y: 0, width: 100, height: 100,
      visibilityExpression: "{{ score > ", // unclosed syntax
    } as any;
    const doc = makeDoc([node]);
    const diagnostics = exportValidator.validate(doc);

    const bindingErr = diagnostics.find((d) => d.code === "INVALID_BINDING");
    expect(bindingErr).toBeDefined();
    expect(bindingErr?.severity).toBe("error");
  });

  test("1.5: detects DURATION_OVERFLOW when entrance animation extends past clip duration", () => {
    const textNode: PrimitiveTextNode = {
      id: "t1", name: "Overflow Text", type: "text", x: 0, y: 0, width: 100, height: 30, text: "Hi",
      animation: { entrance: { type: "fade", duration: 4.0, delay: 3.0 } }, // 7s total > 5s clip
    };
    const doc = makeDoc([textNode], [], { width: 1280, height: 720 }, 5);
    const diagnostics = exportValidator.validate(doc);

    const overflowWarn = diagnostics.find((d) => d.code === "DURATION_OVERFLOW");
    expect(overflowWarn).toBeDefined();
    expect(overflowWarn?.severity).toBe("warning");
  });

  test("1.6: detects UNRESOLVED_CONSTRAINTS when minWidth > maxWidth", () => {
    const node: SceneNode = {
      id: "c1", name: "Bad Bounds Node", type: "shape", shapeType: "rectangle",
      x: 0, y: 0, width: 100, height: 100,
      layout: { constraints: { minWidth: 500, maxWidth: 200 } },
    } as any;
    const doc = makeDoc([node]);
    const diagnostics = exportValidator.validate(doc);

    const constraintErr = diagnostics.find((d) => d.code === "UNRESOLVED_CONSTRAINTS");
    expect(constraintErr).toBeDefined();
    expect(constraintErr?.severity).toBe("error");
  });

  test("1.7: detects NON_STANDARD_FPS for invalid FPS configurations", () => {
    const doc = makeDoc([makeStatCardTree()]);
    const diagnostics = exportValidator.validate(doc, { fps: -5 });
    const fpsErr = diagnostics.find((d) => d.code === "NON_STANDARD_FPS");
    expect(fpsErr).toBeDefined();
    expect(fpsErr?.severity).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Deterministic Frame Pipeline
// ---------------------------------------------------------------------------

describe("Phase 4K — Suite 2: Deterministic Frame Pipeline", () => {
  test("2.1: evaluateExportFrame returns correct time, frameIndex, and evaluated states", () => {
    const doc = makeDoc([makeStatCardTree()], [{ key: "revenue", type: "number", defaultValue: 1000000 }]);
    const frame = evaluateExportFrame(doc, 1.5, { fps: 30 });

    expect(frame.time).toBe(1.5);
    expect(frame.frameIndex).toBe(45); // 1.5 * 30 = 45
    expect(frame.layoutState.nodes["stat-frame"]).toBeDefined();
    expect(frame.evaluatedSceneState.nodes["stat-val"]).toBeDefined();
    expect(frame.evaluatedSceneState.nodes["stat-val"].opacity).toBe(1); // entrance fade completed
  });

  test("2.2: byte-for-byte deterministic reproducibility for identical inputs", () => {
    const doc = makeDoc([makeStatCardTree()]);
    const frameA = evaluateExportFrame(doc, 2.0, { fps: 60 });
    const frameB = evaluateExportFrame(doc, 2.0, { fps: 60 });

    expect(frameA.frameIndex).toBe(frameB.frameIndex);
    expect(frameA.evaluatedSceneState).toEqual(frameB.evaluatedSceneState);
    expect(frameA.layoutState).toEqual(frameB.layoutState);
  });

  test("2.3: time stepping monotonically advances evaluated node animations", () => {
    const textNode: PrimitiveTextNode = {
      id: "fading-text", name: "Fading", type: "text", x: 0, y: 0, width: 100, height: 30, text: "Fade",
      animation: { entrance: { type: "fade", duration: 1.0, delay: 0 } },
    };
    const doc = makeDoc([textNode]);

    const frame0 = evaluateExportFrame(doc, 0.0);
    const frameMid = evaluateExportFrame(doc, 0.5);
    const frameEnd = evaluateExportFrame(doc, 1.0);

    expect(frame0.evaluatedSceneState.nodes["fading-text"].opacity).toBeLessThan(frameMid.evaluatedSceneState.nodes["fading-text"].opacity);
    expect(frameMid.evaluatedSceneState.nodes["fading-text"].opacity).toBeLessThanOrEqual(frameEnd.evaluatedSceneState.nodes["fading-text"].opacity);
    expect(frameEnd.evaluatedSceneState.nodes["fading-text"].opacity).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Export Profiles & Resolution Scaling
// ---------------------------------------------------------------------------

describe("Phase 4K — Suite 3: Export Profiles & Scaling", () => {
  test("3.1: resolveExportCanvasDimensions handles 1080p landscape preset", () => {
    const doc = makeDoc([]);
    const dims = resolveExportCanvasDimensions(doc, { profile: "1080p-landscape" });
    expect(dims.width).toBe(1920);
    expect(dims.height).toBe(1080);
  });

  test("3.2: resolveExportCanvasDimensions handles 1080p portrait preset", () => {
    const doc = makeDoc([]);
    const dims = resolveExportCanvasDimensions(doc, { profile: "1080p-portrait" });
    expect(dims.width).toBe(1080);
    expect(dims.height).toBe(1920);
  });

  test("3.3: resolveExportCanvasDimensions handles 1080p square preset", () => {
    const doc = makeDoc([]);
    const dims = resolveExportCanvasDimensions(doc, { profile: "1080p-square" });
    expect(dims.width).toBe(1080);
    expect(dims.height).toBe(1080);
  });

  test("3.4: resolution multiplier scale=2.0 super-samples target dimensions", () => {
    const doc = makeDoc([]);
    const dims = resolveExportCanvasDimensions(doc, { profile: "720p-landscape", scale: 2.0 });
    expect(dims.width).toBe(2560); // 1280 * 2
    expect(dims.height).toBe(1440); // 720 * 2
  });

  test("3.5: custom profile uses customWidth & customHeight", () => {
    const doc = makeDoc([]);
    const dims = resolveExportCanvasDimensions(doc, { profile: "custom", customWidth: 3840, customHeight: 2160 });
    expect(dims.width).toBe(3840);
    expect(dims.height).toBe(2160);
  });

  test("3.6: evaluateExportFrame applies active breakpoint resolution during export", () => {
    const statCard = makeStatCardTree();
    statCard.responsive = {
      "bp-mobile": { width: 400, layout: { gap: 20, constraints: { widthMode: "fixed" } } },
    };

    const doc: OverlayDocument = {
      ...makeDoc([statCard]),
      breakpoints: {
        activeId: "bp-mobile",
        breakpoints: [
          { id: "bp-mobile", label: "Mobile", canvas: { width: 1080, height: 1920 } },
        ],
      },
    };

    const frame = evaluateExportFrame(doc, 0, { breakpointId: "bp-mobile" });
    expect(frame.resolvedDoc.canvas.width).toBe(1080);
    expect(frame.resolvedDoc.canvas.height).toBe(1920);
    expect(frame.layoutState.nodes["stat-frame"].width).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Transparency & Offscreen Rendering
// ---------------------------------------------------------------------------

describe("Phase 4K — Suite 4: Transparency & Offscreen Rendering", () => {
  test("4.1: renderFrameToCanvas returns valid frame descriptor", () => {
    const doc = makeDoc([makeStatCardTree()]);
    const descriptor = renderEngine.renderFrameToCanvas(doc, 0.5, { profile: "720p-landscape" });

    expect(descriptor.frameIndex).toBe(15); // 0.5 * 30
    expect(descriptor.width).toBe(1280);
    expect(descriptor.height).toBe(720);
  });

  test("4.2: renderFrameToCanvas accepts mock Canvas2D and handles transparent toggle", () => {
    const doc = makeDoc([makeStatCardTree()]);
    let fillRectCalled = false;
    let clearRectCalled = false;

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        fillRect: () => { fillRectCalled = true; },
        clearRect: () => { clearRectCalled = true; },
        fillStyle: "",
      }),
      toDataURL: () => "data:image/png;base64,mockImageData",
    };

    // Render transparent
    renderEngine.renderFrameToCanvas(doc, 0, { transparent: true }, mockCanvas);
    expect(clearRectCalled).toBe(true);

    // Render opaque background fill
    renderEngine.renderFrameToCanvas(doc, 0, { transparent: false }, mockCanvas);
    expect(fillRectCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 5: End-to-End Export Sequence Lifecycle
// ---------------------------------------------------------------------------

describe("Phase 4K — Suite 5: E2E Export Sequence Lifecycle", () => {
  test("5.1: renderFrameSequence steps frame-by-frame across duration", async () => {
    const doc = makeDoc([makeStatCardTree()], [], { width: 1280, height: 720 }, 2); // 2s duration
    const progressLog: number[] = [];

    const sequence = await renderEngine.renderFrameSequence(
      doc,
      { fps: 30, duration: 2 },
      (prog) => {
        progressLog.push(prog.percent);
      }
    );

    // 2 seconds @ 30 FPS = 60 total frames
    expect(sequence).toHaveLength(60);
    expect(sequence[0].frameIndex).toBe(0);
    expect(sequence[59].frameIndex).toBe(59);

    // Progress percentage monotonic growth
    expect(progressLog).toHaveLength(60);
    expect(progressLog[0]).toBe(2);   // 1 / 60 ≈ 1.6% -> 2%
    expect(progressLog[59]).toBe(100); // 60 / 60 = 100%
  });

  test("5.2: End-to-End Author -> Validate -> Resolve -> Frame Step -> Verify Invariants", async () => {
    // A. Authoring Document
    const card = makeStatCardTree();
    const doc = makeDoc([card], [{ key: "revenue", type: "number", defaultValue: 5000000 }], { width: 1280, height: 720 }, 3);

    // B. Pre-export Validation
    const diagnostics = exportValidator.validate(doc, { fps: 60, duration: 3 });
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);

    // C. Frame Sequence Generation at 60 FPS
    const sequence = await renderEngine.renderFrameSequence(doc, { fps: 60, duration: 3 });
    expect(sequence).toHaveLength(180); // 3 * 60

    // D. Verify Frame Invariants
    for (const frameDesc of sequence) {
      expect(frameDesc.width).toBe(1280);
      expect(frameDesc.height).toBe(720);
      expect(frameDesc.time).toBeLessThanOrEqual(3.0);
    }
  });
});
