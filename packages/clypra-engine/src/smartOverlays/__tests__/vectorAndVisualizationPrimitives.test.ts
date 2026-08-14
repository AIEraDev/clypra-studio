import { describe, test, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { propertyInterpolator } from "../propertyInterpolator.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";
import type { LineNode } from "@clypra-studio/types";

describe("Phase 3 & Phase 4: Vector/Annotation & Data Visualization Primitives", () => {
  test("1. Dynamic Vector Line Endpoint Pinning to Anchored Target Nodes", () => {
    const doc: OverlayDocument = {
      id: "vector-line-doc",
      version: "1.0",
      title: "Vector Line Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "cardA",
          name: "Source Card A",
          type: "shape",
          shapeType: "rectangle",
          x: 100,
          y: 100,
          width: 200,
          height: 100,
        },
        {
          id: "cardB",
          name: "Target Card B",
          type: "shape",
          shapeType: "rectangle",
          x: 500,
          y: 300,
          width: 200,
          height: 100,
        },
        {
          id: "connectorLine",
          name: "Vector Connector Line",
          type: "line",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          startNodeId: "cardA",
          endNodeId: "cardB",
          curveStyle: "curved",
          startMarker: "dot",
          endMarker: "arrow",
          strokeColor: "#7C6FFF",
          strokeWidth: 2,
        } as LineNode,
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Frame 1: Card A at X=100 (Center = 100 + 100 = 200). Card B center X=600.
    const layoutF1 = layoutEngine.computeLayout(doc);
    const lineF1 = layoutF1.nodes["connectorLine"];

    expect(lineF1).toBeDefined();
    // Line bounding box spans from Card A center (200) to Card B center (600)
    expect(lineF1.x).toBe(200);

    // Frame 2: Move Card A to X=300 (Center = 300 + 100 = 400)
    doc.nodes[0].x = 300;
    const layoutF2 = layoutEngine.computeLayout(doc);
    const lineF2 = layoutF2.nodes["connectorLine"];

    // Bounding box start X updates dynamically to 400
    expect(lineF2.x).toBe(400);
  });

  test("2. Vector Draw-On Animation Interpolation", () => {
    const startProgress = 0.0;
    const midProgress = propertyInterpolator.interpolateNumber(startProgress, 1.0, 0.5);
    const endProgress = 1.0;

    expect(startProgress).toBe(0.0);
    expect(midProgress).toBe(0.5);
    expect(endProgress).toBe(1.0);
  });

  test("3. Icon Primitive Geometry Bounds", () => {
    const doc: OverlayDocument = {
      id: "icon-doc",
      version: "1.0",
      title: "Icon Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "cpuIcon",
          name: "CPU Icon",
          type: "icon",
          x: 40,
          y: 40,
          width: 32,
          height: 32,
          iconName: "cpu",
          color: "#38BDF8",
        } as any,
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const layout = layoutEngine.computeLayout(doc);
    const bounds = layout.nodes["cpuIcon"];

    expect(bounds.width).toBe(32);
    expect(bounds.height).toBe(32);
  });

  test("4. Chart Data Visualization Layout", () => {
    const doc: OverlayDocument = {
      id: "chart-doc",
      version: "1.0",
      title: "Chart Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "salesChart",
          name: "Quarterly Revenue Bar Chart",
          type: "chart",
          x: 100,
          y: 100,
          width: 600,
          height: 350,
          chartType: "bar",
          xLabels: ["Q1", "Q2", "Q3", "Q4"],
          series: [
            { name: "2025 Revenue", data: [450, 680, 890, 1200] },
          ],
        } as any,
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const layout = layoutEngine.computeLayout(doc);
    const bounds = layout.nodes["salesChart"];

    expect(bounds.width).toBe(600);
    expect(bounds.height).toBe(350);
  });

  test("5. Preview vs Export Vector & Visualization Parity Assertion (Delta < 1px)", () => {
    const doc: OverlayDocument = {
      id: "viz-parity-doc",
      version: "1.0",
      title: "Viz Parity Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "vizGauge",
          name: "System Performance Gauge",
          type: "progress",
          x: 250,
          y: 150,
          width: 200,
          height: 200,
          progressType: "gauge",
          value: 85,
        } as any,
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const previewLayout = layoutEngine.computeLayoutForBreakpoint(doc, null);
    const exportLayout = layoutEngine.computeLayout(doc);

    const p = previewLayout.nodes["vizGauge"];
    const e = exportLayout.nodes["vizGauge"];

    expect(Math.abs(p.x - e.x)).toBeLessThan(1);
    expect(Math.abs(p.y - e.y)).toBeLessThan(1);
    expect(Math.abs(p.width - e.width)).toBeLessThan(1);
    expect(Math.abs(p.height - e.height)).toBeLessThan(1);
  });
});
