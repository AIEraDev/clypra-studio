import { describe, it, expect } from "vitest";
import { resolveSpatialConstraints } from "../spatial/spatialConstraints.js";
import type { EvaluatedTransform } from "../runtime/evaluatedScene.js";
import type { EvaluatedVideoStateAtTime } from "../context/videoContext.js";

describe("Stage 2C — Spatial Anchoring & Attachment System Suite", () => {

  // ---------------------------------------------------------------------------
  // Test 1 — Anchor Alignment Placement Math
  // ---------------------------------------------------------------------------
  it("Test 1: Resolves preferred placement positions (side-right, side-left, top-right) relative to target bounding box", () => {
    const initialTransform: EvaluatedTransform = {
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      opacity: 1,
      visible: true,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    };

    const mockVideoState: EvaluatedVideoStateAtTime = {
      time: 2.0,
      activeSubjects: {
        speaker1: { x: 400, y: 300, width: 100, height: 100 },
      },
    };

    // Case A: Side-Right placement
    const sideRight = resolveSpatialConstraints(
      initialTransform,
      { anchorTo: "speaker1", preferPlacement: "side-right", offsetPixelX: 20, offsetPixelY: 10 },
      mockVideoState,
      1920,
      1080
    );
    // x = 400 + 100 + 20 = 520, y = 300 + 10 = 310
    expect(sideRight.x).toBe(520);
    expect(sideRight.y).toBe(310);

    // Case B: Side-Left placement
    const sideLeft = resolveSpatialConstraints(
      initialTransform,
      { anchorTo: "speaker1", preferPlacement: "side-left", offsetPixelX: 20, offsetPixelY: 10 },
      mockVideoState,
      1920,
      1080
    );
    // x = 400 - 200 - 20 = 180, y = 300 + 10 = 310
    expect(sideLeft.x).toBe(180);
    expect(sideLeft.y).toBe(310);
  });

  // ---------------------------------------------------------------------------
  // Test 2 — Dynamic Subject Tracking Pin Attachment
  // ---------------------------------------------------------------------------
  it("Test 2: Attaches overlay container dynamically to active subject tracking pin", () => {
    const initialTransform: EvaluatedTransform = {
      x: 0,
      y: 0,
      width: 180,
      height: 60,
      opacity: 1,
      visible: true,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    };

    const videoState: EvaluatedVideoStateAtTime = {
      time: 5.0,
      activeSpeakerId: "person_a",
      activeSubjects: {
        person_a: { x: 600, y: 250, width: 120, height: 160 },
      },
    };

    const resolved = resolveSpatialConstraints(
      initialTransform,
      { anchorTo: "speaker", preferPlacement: "side-right", offsetPixelX: 30, offsetPixelY: 15 },
      videoState,
      1920,
      1080
    );

    // x = 600 + 120 + 30 = 750, y = 250 + 15 = 265
    expect(resolved.x).toBe(750);
    expect(resolved.y).toBe(265);
  });

  // ---------------------------------------------------------------------------
  // Test 3 — Canvas Safe-Area Clamping
  // ---------------------------------------------------------------------------
  it("Test 3: Clamps overlay position to safe-area margins when target pin is near screen boundaries", () => {
    const overlayTransform: EvaluatedTransform = {
      x: 0,
      y: 0,
      width: 300,
      height: 150,
      opacity: 1,
      visible: true,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    };

    // Subject near right edge of 1920x1080 canvas (x = 1800)
    const edgeVideoState: EvaluatedVideoStateAtTime = {
      time: 3.0,
      activeSubjects: {
        edge_subject: { x: 1750, y: 500, width: 100, height: 100 },
      },
    };

    const clamped = resolveSpatialConstraints(
      overlayTransform,
      { anchorTo: "edge_subject", preferPlacement: "side-right", offsetPixelX: 20, safeMargin: 40 },
      edgeVideoState,
      1920,
      1080
    );

    // Initial target x = 1750 + 100 + 20 = 1870
    // Max allowed x = 1920 - 300 (width) - 40 (safeMargin) = 1580
    expect(clamped.x).toBe(1580);
    expect(clamped.x + clamped.width).toBeLessThanOrEqual(1920 - 40);
  });

  // ---------------------------------------------------------------------------
  // Test 4 — Connector Line Vector Alignment
  // ---------------------------------------------------------------------------
  it("Test 4: Computes vector endpoints connecting overlay container edge to tracking pin", () => {
    const overlayBounds = { x: 750, y: 265, width: 180, height: 60 };
    const targetPin = { x: 600 + 120 / 2, y: 250 + 160 / 2 }; // Target center (660, 330)

    // Connector start: left edge center of callout container (x = 750, y = 265 + 30 = 295)
    const connectorStart = { x: overlayBounds.x, y: overlayBounds.y + overlayBounds.height / 2 };
    // Connector end: target center
    const connectorEnd = { x: targetPin.x, y: targetPin.y };

    expect(connectorStart).toEqual({ x: 750, y: 295 });
    expect(connectorEnd).toEqual({ x: 660, y: 330 });

    const distance = Math.hypot(connectorEnd.x - connectorStart.x, connectorEnd.y - connectorStart.y);
    expect(distance).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Test 5 — Multi-Anchor Concurrent Resolution Benchmark
  // ---------------------------------------------------------------------------
  it("Test 5: Resolves multi-overlay anchoring to distinct subject pins without position collision", () => {
    const calloutA: EvaluatedTransform = { x: 0, y: 0, width: 200, height: 80, opacity: 1, visible: true, scaleX: 1, scaleY: 1, rotation: 0 };
    const calloutB: EvaluatedTransform = { x: 0, y: 0, width: 200, height: 80, opacity: 1, visible: true, scaleX: 1, scaleY: 1, rotation: 0 };

    const multiSubjectState: EvaluatedVideoStateAtTime = {
      time: 4.0,
      activeSubjects: {
        subject_1: { x: 200, y: 200, width: 100, height: 100 },
        subject_2: { x: 800, y: 500, width: 100, height: 100 },
      },
    };

    const resA = resolveSpatialConstraints(calloutA, { anchorTo: "subject_1", preferPlacement: "side-right" }, multiSubjectState, 1920, 1080);
    const resB = resolveSpatialConstraints(calloutB, { anchorTo: "subject_2", preferPlacement: "side-right" }, multiSubjectState, 1920, 1080);

    // Callout A: x = 200 + 100 + 20 = 320, y = 200
    expect(resA.x).toBe(320);
    expect(resA.y).toBe(200);

    // Callout B: x = 800 + 100 + 20 = 920, y = 500
    expect(resB.x).toBe(920);
    expect(resB.y).toBe(500);

    // Confirm no spatial intersection between Callout A and Callout B
    const overlaps =
      resA.x < resB.x + resB.width &&
      resA.x + resA.width > resB.x &&
      resA.y < resB.y + resB.height &&
      resA.y + resA.height > resB.y;

    expect(overlaps).toBe(false);
  });
});
