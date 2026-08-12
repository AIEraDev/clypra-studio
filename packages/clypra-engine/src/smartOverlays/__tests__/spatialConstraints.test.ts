import { describe, it, expect } from "vitest";
import { resolveSpatialConstraints } from "../spatial/spatialConstraints.js";
import { evaluateOverlayDocument } from "../runtime/evaluator.js";
import type { VideoContext } from "../context/videoContext.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";

describe("Ticket 5: Semantic Spatial Constraints", () => {
  const mockVideoState = {
    time: 2.0,
    activeSpeakerId: "speaker-1",
    activeSubjects: {
      "speaker-1": { id: "speaker-1", x: 200, y: 150, width: 300, height: 400 }
    },
    subtitleRegion: { x: 400, y: 600, width: 800, height: 100 },
    safeRegions: []
  };

  it("should position node relative to target speaker bounding box (anchorTo: 'speaker')", () => {
    const initialTransform = {
      x: 0,
      y: 0,
      width: 250,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
      anchorX: 0,
      anchorY: 0
    };

    const resolved = resolveSpatialConstraints(
      initialTransform,
      { anchorTo: "speaker", preferPlacement: "side-right", offsetPixelX: 24 },
      mockVideoState,
      1280,
      720
    );

    // Speaker x (200) + width (300) + offset (24) = 524
    expect(resolved.x).toBe(524);
    expect(resolved.y).toBe(150);
  });

  it("should resolve subtitle region avoidance by shifting overlay above subtitle area", () => {
    // Initial overlay overlaps subtitle region at y = 620
    const initialTransform = {
      x: 500,
      y: 620,
      width: 300,
      height: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
      anchorX: 0,
      anchorY: 0
    };

    const resolved = resolveSpatialConstraints(
      initialTransform,
      { avoidRegions: ["subtitle"] },
      mockVideoState,
      1280,
      720
    );

    // Subtitle y = 600, height = 100. Pushed above: 600 - 80 - 16 = 504
    expect(resolved.y).toBe(504);
  });

  it("should evaluate node layout.spatialConstraints inside evaluateOverlayDocument pipeline", () => {
    const doc: OverlayDocument = {
      id: "doc-spatial-test",
      version: "2.0",
      title: "Spatial Constraint Doc",
      category: "test",
      canvas: { width: 1280, height: 720 },
      duration: 5.0,
      createdAt: "2026-08-12T00:00:00Z",
      updatedAt: "2026-08-12T00:00:00Z",
      variables: [],
      nodes: [
        {
          id: "node-speaker-label",
          type: "text",
          x: 0,
          y: 0,
          width: 200,
          height: 60,
          text: "Dr. Aris Thorne",
          layout: {
            spatialConstraints: {
              anchorTo: "speaker",
              preferPlacement: "side-right",
              offsetPixelX: 20
            }
          } as any
        }
      ]
    };

    const videoCtx: VideoContext = {
      canvas: { width: 1280, height: 720 },
      duration: 5.0,
      subjects: [
        {
          id: "speaker",
          label: "Dr. Aris Thorne",
          type: "speaker",
          track: [
            { time: 0.0, region: { id: "s0", x: 100, y: 100, width: 250, height: 350 } }
          ]
        }
      ]
    };

    const scene = evaluateOverlayDocument(doc, { video: videoCtx }, 0.0);
    const labelNode = scene.nodeMap["node-speaker-label"];

    expect(labelNode).toBeDefined();
    // Speaker x (100) + width (250) + offset (20) = 370
    expect(labelNode.transform.x).toBe(370);
  });
});
