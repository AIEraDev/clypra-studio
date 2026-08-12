/**
 * Phase 4R.1 / 4R.2 — VisualizationRegistry tests
 *
 * Tests the decoupled visualization registration, capabilities, and pure evaluation.
 */

import { describe, it, expect } from "vitest";
import { visualizationRegistry } from "../visualizationRegistry.js";
import { visualizationRendererRegistry } from "../visualizationProjection.js";
import { gaugeVisualization } from "../gaugeVisualization.js";
import { timelineVisualization } from "../timelineVisualization.js";
import { annotationVisualization, connectorVisualization } from "../annotationVisualization.js";
import type { GaugeNode, TimelineNode, AnnotationNode, ConnectorNode } from "../overlayDocumentSchema.js";

describe("VisualizationRegistry — registration & contract", () => {
  it("registers and retrieves gauge visualization definition", () => {
    expect(visualizationRegistry.has("gauge")).toBe(true);
    const def = visualizationRegistry.get("gauge");
    expect(def).toBeDefined();
    expect(def?.name).toBe("Gauge Display");
    expect(def?.supports.dataBinding).toBe(true);
  });

  it("registers and retrieves timeline visualization definition", () => {
    expect(visualizationRegistry.has("timeline")).toBe(true);
    const def = visualizationRegistry.get("timeline");
    expect(def).toBeDefined();
    expect(def?.name).toBe("Timeline Axis");
  });

  it("registers and retrieves annotation & connector definitions", () => {
    expect(visualizationRegistry.has("annotation")).toBe(true);
    expect(visualizationRegistry.has("connector")).toBe(true);
  });

  it("has corresponding renderers in visualizationRendererRegistry", () => {
    expect(visualizationRendererRegistry.has("gauge")).toBe(true);
    expect(visualizationRendererRegistry.has("timeline")).toBe(true);
    expect(visualizationRendererRegistry.has("annotation")).toBe(true);
    expect(visualizationRendererRegistry.has("connector")).toBe(true);
    expect(visualizationRendererRegistry.has("chart")).toBe(true);
  });
});

describe("VisualizationRegistry — pure geometry evaluation", () => {
  it("evaluates GaugeNode deterministically without DOM or Pixi", () => {
    const node: GaugeNode = {
      id: "gauge-1",
      name: "Test Gauge",
      type: "gauge",
      x: 0, y: 0,
      width: 200, height: 200,
      value: 75, min: 0, max: 100,
      gaugeStyle: "semicircle",
    };

    const geo1 = gaugeVisualization.evaluate(node, { width: 200, height: 200, t: 1 });
    const geo0 = gaugeVisualization.evaluate(node, { width: 200, height: 200, t: 0 });

    expect(geo1.cx).toBe(100);
    expect(geo1.animSweep).toBeGreaterThan(0);
    expect(geo0.animSweep).toBe(0);
    expect(geo1.formattedValue).toBe("75");
  });

  it("evaluates TimelineNode with sequential event active status", () => {
    const node: TimelineNode = {
      id: "timeline-1",
      name: "Test Timeline",
      type: "timeline",
      x: 0, y: 0,
      width: 400, height: 100,
      events: [
        { id: "e1", label: "Start", time: 0 },
        { id: "e2", label: "Mid", time: 50 },
        { id: "e3", label: "End", time: 100 },
      ],
    };

    const geo0 = timelineVisualization.evaluate(node, { width: 400, height: 100, t: 0 });
    const geoHalf = timelineVisualization.evaluate(node, { width: 400, height: 100, t: 0.5 });
    const geo1 = timelineVisualization.evaluate(node, { width: 400, height: 100, t: 1 });

    expect(geo0.events[0].active).toBe(false);
    expect(geoHalf.events[0].active).toBe(true);
    expect(geo1.events.every((e) => e.active)).toBe(true);
  });

  it("evaluates AnnotationNode with offset and pointer style", () => {
    const node: AnnotationNode = {
      id: "ann-1",
      name: "Callout",
      type: "annotation",
      x: 100, y: 100,
      width: 100, height: 30,
      text: "+40% Growth",
      offsetX: 10, offsetY: -20,
    };

    const geo = annotationVisualization.evaluate(node, { width: 100, height: 30, t: 1 });
    expect(geo.x).toBe(110);
    expect(geo.y).toBe(80);
    expect(geo.anchorX).toBe(100);
    expect(geo.anchorY).toBe(100);
  });

  it("evaluates ConnectorNode with coordinates", () => {
    const node: ConnectorNode = {
      id: "conn-1",
      name: "Arrow",
      type: "connector",
      x: 50, y: 50,
      width: 100, height: 50,
      fromNodeId: "n1", toNodeId: "n2",
    };

    const geo = connectorVisualization.evaluate(node, { width: 100, height: 50, t: 1 });
    expect(geo.fromX).toBe(50);
    expect(geo.fromY).toBe(50);
    expect(geo.toX).toBe(150);
    expect(geo.toY).toBe(100);
  });
});
