import { describe, test, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";

describe("Phase 3: Spatial Anchoring & Elastic Vector Connectors", () => {
  test("Spatial Anchor Pinning (Node B pinned to Node A)", () => {
    const doc: OverlayDocument = {
      id: "doc-anchor",
      version: "1.0",
      title: "Anchor Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "nodeA",
          name: "Speaker Pin",
          type: "shape",
          shapeType: "circle",
          x: 100,
          y: 200,
          width: 50,
          height: 50,
        },
        {
          id: "nodeB",
          name: "Callout Card",
          type: "shape",
          shapeType: "rectangle",
          x: 0,
          y: 0,
          width: 200,
          height: 80,
          anchor: {
            targetId: "nodeA",
            targetSide: "right",
            anchorSide: "left",
            offsetX: 24,
            offsetY: 0,
          },
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const layout = layoutEngine.computeLayout(doc);
    const boundsA = layout.nodes["nodeA"];
    const boundsB = layout.nodes["nodeB"];

    // Node B X should equal Node A X + Node A Width (100 + 50 = 150) + offsetX (24) = 174
    expect(boundsB.x).toEqual(174);
  });

  test("Elastic Vector Line Node Dynamic Endpoint Connection", () => {
    const doc: OverlayDocument = {
      id: "doc-line",
      version: "1.0",
      title: "Line Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "card1",
          name: "Source Card",
          type: "shape",
          shapeType: "rectangle",
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
        {
          id: "card2",
          name: "Target Card",
          type: "shape",
          shapeType: "rectangle",
          x: 400,
          y: 300,
          width: 100,
          height: 100,
        },
        {
          id: "connectorLine",
          name: "Connector",
          type: "line",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          startNodeId: "card1",
          endNodeId: "card2",
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const layout = layoutEngine.computeLayout(doc);
    const lineBounds = layout.nodes["connectorLine"];

    // Center A = (150, 150), Center B = (450, 350)
    // Line bounding box minX = 150, minY = 150, width = 300, height = 200
    expect(lineBounds.x).toEqual(150);
    expect(lineBounds.y).toEqual(150);
    expect(lineBounds.width).toEqual(300);
    expect(lineBounds.height).toEqual(200);
  });
});
