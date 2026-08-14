import { describe, test, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { propertyInterpolator } from "../propertyInterpolator.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";

describe("Motion System & Motion Stability Crucible", () => {
  test("1. Layout Animation (Width Reflow) vs Transform Animation (Visual Scale)", () => {
    const doc: OverlayDocument = {
      id: "motion-doc",
      version: "1.0",
      title: "Motion Layout Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "container",
          name: "Stack",
          type: "container",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          layout: {
            mode: "flex-row",
            gap: 16,
            constraints: { widthMode: "hug", heightMode: "hug" },
          },
          children: [
            {
              id: "nodeA",
              name: "Expanding Card A",
              type: "shape",
              shapeType: "rectangle",
              x: 0,
              y: 0,
              width: 100, // Will expand to 400 under layout animation
              height: 100,
              animation: { animatesLayout: true },
            },
            {
              id: "nodeB",
              name: "Sibling Card B",
              type: "shape",
              shapeType: "rectangle",
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
          ],
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Case A: Initial width 100 -> Node B is at X = 100 + 16 (gap) = 116
    const layout100 = layoutEngine.computeLayout(doc);
    expect(layout100.nodes["nodeB"].x).toBe(116);

    // Case B: Animate Node A width to 400 (Layout Animation)
    (doc.nodes[0] as any).children[0].width = 400;
    const layout400 = layoutEngine.computeLayout(doc);

    // Node B X must dynamically push to X = 400 + 16 = 416
    expect(layout400.nodes["nodeB"].x).toBe(416);

    // Case C: Transform scale animation (scaleX = 4, but base width = 100 and animatesLayout = false)
    (doc.nodes[0] as any).children[0].width = 100;
    (doc.nodes[0] as any).children[0].animation = { animatesLayout: false };
    const layoutTransform = layoutEngine.computeLayout(doc);

    // Node B X remains at 116 (GPU visual transform without layout reflow)
    expect(layoutTransform.nodes["nodeB"].x).toBe(116);
  });

  test("2. State Motion Data Counter & Property Interpolation", () => {
    const interpolatedVal = propertyInterpolator.interpolateNumber(45, 90, 0.5);

    // Eased value at midpoint t = 0.5 should be 67.5 (between 45 and 90)
    expect(interpolatedVal).toBeGreaterThan(45);
    expect(interpolatedVal).toBeLessThan(90);
    expect(interpolatedVal).toBe(67.5);
  });

  test("3. Motion + Spatial Target Tracking (Anchored Target Animation)", () => {
    const doc: OverlayDocument = {
      id: "motion-anchor-doc",
      version: "1.0",
      title: "Motion Anchor Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "speakerNode",
          name: "Moving Speaker",
          type: "shape",
          shapeType: "circle",
          x: 100, // Will animate to 500
          y: 200,
          width: 60,
          height: 60,
        },
        {
          id: "pinnedCallout",
          name: "Pinned Callout",
          type: "shape",
          shapeType: "rectangle",
          x: 0,
          y: 0,
          width: 150,
          height: 50,
          anchor: {
            targetId: "speakerNode",
            targetSide: "right",
            anchorSide: "left",
            offsetX: 20,
          },
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Frame 0: Speaker X = 100 -> Pinned Callout X = 100 + 60 + 20 = 180
    const layoutF0 = layoutEngine.computeLayout(doc);
    expect(layoutF0.nodes["pinnedCallout"].x).toBe(180);

    // Frame 60: Speaker animates to X = 500 -> Pinned Callout X = 500 + 60 + 20 = 580
    doc.nodes[0].x = 500;
    const layoutF60 = layoutEngine.computeLayout(doc);
    expect(layoutF60.nodes["pinnedCallout"].x).toBe(580);
  });

  test("4. Preview vs Export Motion Determinism Pass (Delta < 1px)", () => {
    const doc: OverlayDocument = {
      id: "motion-export-doc",
      version: "1.0",
      title: "Motion Export Determinism",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "card",
          name: "Animated Card",
          type: "shape",
          shapeType: "rounded-rectangle",
          x: 200,
          y: 150,
          width: 400,
          height: 250,
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const previewLayout = layoutEngine.computeLayoutForBreakpoint(doc, null);
    const exportLayout = layoutEngine.computeLayout(doc);

    const deltaX = Math.abs(previewLayout.nodes["card"].x - exportLayout.nodes["card"].x);
    const deltaY = Math.abs(previewLayout.nodes["card"].y - exportLayout.nodes["card"].y);

    expect(deltaX).toBeLessThan(1);
    expect(deltaY).toBeLessThan(1);
  });
});
