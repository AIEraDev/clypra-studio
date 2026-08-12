/**
 * Phase 4R.2 — GeometryAnchor & HighlightRegion tests
 */

import { describe, it, expect } from "vitest";
import { VisualizationEngine } from "../visualizationEngine.js";
import type { ChartNode } from "../overlayDocumentSchema.js";

const engine = new VisualizationEngine();

function makeChartWithHighlights(): ChartNode {
  return {
    id: "chart-1",
    name: "Revenue Chart",
    type: "chart",
    x: 0, y: 0,
    width: 500, height: 300,
    chartType: "bar",
    xLabels: ["Q1", "Q2", "Q3", "Q4"],
    series: [
      { id: "rev", name: "Revenue", color: "#45FF72", data: [100, 200, 300, 400] }
    ],
    highlights: [
      { seriesId: "rev", dataIndexRange: [1, 2], color: "#FFE66D", opacity: 0.2, label: "Peak Quarter" }
    ],
    chartAnimation: { mode: "none" },
  };
}

describe("VisualizationEngine — AnchorMap & HighlightRegion", () => {
  it("populates bar anchors with x/y/w/h bounding box", () => {
    const node = makeChartWithHighlights();
    const geo = engine.evaluate(node, 500, 300, 1);

    expect(geo.anchors).toBeDefined();
    expect(geo.anchors.bars["rev"]).toBeDefined();
    expect(geo.anchors.bars["rev"][0]).toBeDefined();

    const anchorQ1 = geo.anchors.bars["rev"][0];
    const barQ1 = geo.bars[0];

    expect(anchorQ1.x).toBe(barQ1.x + barQ1.w / 2);
    expect(anchorQ1.y).toBe(barQ1.y);
    expect(anchorQ1.w).toBe(barQ1.w);
    expect(anchorQ1.h).toBe(barQ1.h);
  });

  it("populates line point anchors for line charts", () => {
    const node: ChartNode = {
      id: "line-1",
      name: "Line",
      type: "chart",
      x: 0, y: 0,
      width: 500, height: 300,
      chartType: "line",
      xLabels: ["A", "B", "C"],
      series: [
        { id: "s1", name: "S1", color: "#3B82F6", data: [10, 20, 30] }
      ],
      chartAnimation: { mode: "none" },
    };

    const geo = engine.evaluate(node, 500, 300, 1);
    expect(geo.anchors.points["s1"]).toBeDefined();
    expect(geo.anchors.points["s1"][1].x).toBe(geo.linePoints[1].x);
    expect(geo.anchors.points["s1"][1].y).toBe(geo.linePoints[1].y);
  });

  it("evaluates HighlightRegionGeometry bounding box across category range", () => {
    const node = makeChartWithHighlights();
    const geo = engine.evaluate(node, 500, 300, 1);

    expect(geo.highlights).toHaveLength(1);
    const hl = geo.highlights[0];
    expect(hl.color).toBe("#FFE66D");
    expect(hl.opacity).toBe(0.2);
    expect(hl.label).toBe("Peak Quarter");
    expect(hl.w).toBeGreaterThan(0);
    expect(hl.h).toBe(geo.plotArea.h);
  });
});
