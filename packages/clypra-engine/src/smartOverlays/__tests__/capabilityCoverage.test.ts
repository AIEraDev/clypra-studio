/**
 * Phase 4R.8 — Capability Coverage Test & Complex Authoring Benchmark
 *
 * Verifies full pipeline capability coverage (Schema -> Default Factory -> Runtime Evaluation -> Pixi Projection -> Serialization)
 * and executes the End-to-End Revenue Growth Multi-Quarter Infographic Benchmark.
 */

import { describe, it, expect } from "vitest";
import { primitiveRegistry } from "../primitiveRegistry.js";
import { visualizationRegistry } from "../visualizationRegistry.js";
import { visualizationRendererRegistry } from "../visualizationProjection.js";
import { animationRuntime } from "../animationRuntime.js";
import { PixiSceneProjection } from "../pixiSceneProjection.js";
import { serializeTemplate, deserializeTemplate } from "../migrations/serializeTemplate.js";
import type { OverlayDocument, ChartNode, AnnotationNode, GaugeNode, TimelineNode } from "../overlayDocumentSchema.js";

const projection = new PixiSceneProjection();

describe("Phase 4R.8 — Capability Coverage Matrix", () => {
  const primitiveTypes = [
    "frame", "text", "shape", "media", "rich-text", "gradient",
    "icon", "divider", "metric", "progress", "chart", "table",
    "container", "callout", "avatar", "annotation", "connector",
    "gauge", "timeline"
  ] as const;

  it("has primitive registry factories for all 19 primitive node types", () => {
    primitiveTypes.forEach((type) => {
      expect(primitiveRegistry.get(type as any)).toBeDefined();
      const node = primitiveRegistry.createDefaultNode(type as any);
      expect(node).toBeDefined();
      expect(node.type).toBe(type);
    });
  });

  it("evaluates and projects all visualization node types through PixiSceneProjection", () => {
    const doc: OverlayDocument = {
      id: "coverage-doc",
      version: "2.0",
      title: "Coverage Test Document",
      category: "test",
      canvas: { width: 1280, height: 720, backgroundColor: "#0F172A" },
      variables: [],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        primitiveRegistry.createDefaultNode("chart"),
        primitiveRegistry.createDefaultNode("gauge"),
        primitiveRegistry.createDefaultNode("timeline"),
        primitiveRegistry.createDefaultNode("annotation"),
        primitiveRegistry.createDefaultNode("connector"),
      ],
    };

    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 2.5 });
    expect(sceneState.nodes).toBeDefined();
    expect(Object.keys(sceneState.nodes).length).toBe(5);

    const pixiContainer = projection.project(doc, 2.5);
    expect(pixiContainer).toBeDefined();
    expect(pixiContainer.children.length).toBeGreaterThan(0);
  });
});

describe("Phase 4R.8 — Complex Authoring Benchmark", () => {
  it("constructs, animates, evaluates, serializes, and projects a multi-quarter revenue infographic", () => {
    // 1. Construct multi-quarter revenue chart with highlights
    const chartNode: ChartNode = {
      id: "revenue-chart",
      name: "Revenue Growth Chart",
      type: "chart",
      x: 100, y: 150,
      width: 800, height: 400,
      chartType: "bar",
      orientation: "vertical",
      xLabels: ["Q1", "Q2", "Q3", "Q4"],
      series: [
        { id: "revenue", name: "Revenue", color: "#45FF72", data: [120, 210, 340, 480] },
        { id: "target",  name: "Target",  color: "#3B82F6", data: [100, 200, 300, 400] },
      ],
      highlights: [
        { seriesId: "revenue", dataIndexRange: [2, 3], color: "#FFE66D", opacity: 0.18, label: "H2 Surge" }
      ],
      axis: { min: 0, max: 500, tickCount: 5, showGrid: true, showLabels: true },
      chartAnimation: { mode: "grow", duration: 2.0, stagger: 0.1, countUpLabels: true },
      showLegend: true,
      legendPosition: "bottom",
      style: { fillColor: "#111827" },
    };

    // 2. Add anchored annotation pointing to Q4 peak
    const annotationNode: AnnotationNode = {
      id: "q4-callout",
      name: "Q4 Peak Callout",
      type: "annotation",
      x: 700, y: 120,
      width: 160, height: 40,
      text: "Record $480K Peak",
      anchor: { nodeId: "revenue-chart", seriesId: "revenue", dataIndex: 3, element: "bar-top" },
      offsetX: 20, offsetY: -40,
      showLeader: true,
      leaderColor: "#A78BFA",
      pointerStyle: "dot",
    };

    // 3. Add Gauge for overall goal completion
    const gaugeNode: GaugeNode = {
      id: "kpi-gauge",
      name: "Goal Completion Gauge",
      type: "gauge",
      x: 950, y: 150,
      width: 220, height: 180,
      value: 120, min: 0, max: 100,
      gaugeStyle: "semicircle",
      label: "120% Target Achieved",
      fillColor: "#45FF72",
      showValue: true,
      showLabel: true,
      chartAnimation: { mode: "grow", duration: 1.5 },
    };

    // 4. Assemble complete document
    const doc: OverlayDocument = {
      id: "infographic-benchmark-doc",
      version: "2.0",
      title: "Executive Revenue Growth Infographic",
      category: "infographic",
      canvas: { width: 1280, height: 720, backgroundColor: "#0B0F19" },
      variables: [],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [chartNode, annotationNode, gaugeNode],
    };

    // 5. Evaluate scene at t=0, t=1.0, t=2.0
    const stateStart = animationRuntime.evaluateScene(doc, { currentTime: 0 });
    const stateMid = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });
    const stateFull = animationRuntime.evaluateScene(doc, { currentTime: 2.5 });

    expect(stateStart.nodes["revenue-chart"]).toBeDefined();
    expect(stateFull.nodes["revenue-chart"]).toBeDefined();

    // 6. Project onto PixiJS display tree at t=2.5s
    const container = projection.project(doc, 2.5);
    expect(container).toBeDefined();
    expect(container.children.length).toBeGreaterThan(0);

    // 7. Serialization roundtrip benchmark
    const manifest = serializeTemplate(doc, { id: doc.id, name: doc.title, category: doc.category, tags: [] });
    expect(manifest.kind).toBe("smart-overlay-template");
    const restoredDoc = deserializeTemplate(manifest);
    expect(restoredDoc.id).toBe(doc.id);
    expect(restoredDoc.nodes.length).toBe(doc.nodes.length);

    // Re-project deserialized document
    const restoredContainer = projection.project(restoredDoc, 2.5);
    expect(restoredContainer).toBeDefined();
  });
});
