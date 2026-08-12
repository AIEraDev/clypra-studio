/**
 * Phase 4P — VisualizationEngine tests
 *
 * Tests the pure geometry evaluation pipeline:
 * (ChartNode, width, height, t) → EvaluatedChartGeometry
 *
 * No Pixi, no DOM — all geometry is deterministic and testable in isolation.
 */

import { describe, it, expect } from "vitest";
import { VisualizationEngine } from "../visualizationEngine.js";
import type { ChartNode } from "../overlayDocumentSchema.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBarChart(overrides: Partial<ChartNode> = {}): ChartNode {
  return {
    id: "chart-test",
    name: "Test Chart",
    type: "chart",
    x: 0, y: 0,
    width: 560, height: 340,
    chartType: "bar",
    orientation: "vertical",
    xLabels: ["Alpha", "Beta", "Gamma"],
    series: [
      { id: "revenue", name: "Revenue", color: "#45FF72", data: [100, 200, 300] },
      { id: "cost",    name: "Cost",    color: "#FF4141", data: [50,  80,  120] },
    ],
    axis: { min: 0, tickCount: 5, showGrid: true, showLabels: true },
    barStyle: { rounded: 4, groupGap: 6 },
    chartAnimation: { mode: "none" },
    showLegend: true,
    legendPosition: "bottom",
    ...overrides,
  } as ChartNode;
}

const engine = new VisualizationEngine();

// ---------------------------------------------------------------------------
// 1. Domain auto-detection
// ---------------------------------------------------------------------------

describe("VisualizationEngine — domain", () => {
  it("auto-detects max from all series when axis.max is undefined", () => {
    const node = makeBarChart();
    const geo = engine.evaluate(node, 560, 340, 1);
    // Max raw value is 300 — domain max should be at least 300
    const maxGridValue = Math.max(...geo.gridLines.map((g) => g.value));
    expect(maxGridValue).toBeGreaterThanOrEqual(300);
  });

  it("respects explicit axis.max", () => {
    const node = makeBarChart({ axis: { min: 0, max: 400, tickCount: 4 } });
    const geo = engine.evaluate(node, 560, 340, 1);
    const maxGridValue = Math.max(...geo.gridLines.map((g) => g.value));
    expect(maxGridValue).toBe(400);
  });

  it("respects explicit axis.min", () => {
    const node = makeBarChart({ axis: { min: 50, tickCount: 5 } });
    const geo = engine.evaluate(node, 560, 340, 1);
    const minGridValue = Math.min(...geo.gridLines.map((g) => g.value));
    expect(minGridValue).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// 2. Grid lines
// ---------------------------------------------------------------------------

describe("VisualizationEngine — grid lines", () => {
  it("produces tickCount+1 grid lines (inclusive top and bottom)", () => {
    const node = makeBarChart({ axis: { tickCount: 5 } });
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.gridLines).toHaveLength(6); // 0,1,2,3,4,5 => 6 entries
  });

  it("grid lines have ascending y from bottom to top", () => {
    const node = makeBarChart();
    const geo = engine.evaluate(node, 560, 340, 1);
    // Higher values → smaller y (closer to top in screen coords)
    const values = geo.gridLines.map((g) => g.value);
    const ys = geo.gridLines.map((g) => g.y);
    // As value increases, y should decrease
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) {
        expect(ys[i]).toBeLessThan(ys[i - 1]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Bar geometry — count and positioning
// ---------------------------------------------------------------------------

describe("VisualizationEngine — bar geometry", () => {
  it("produces catCount × seriesCount bars", () => {
    const node = makeBarChart(); // 3 categories × 2 series
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.bars).toHaveLength(6);
  });

  it("bars at t=1 have fullH > 0 for non-zero values", () => {
    const node = makeBarChart({ chartAnimation: { mode: "none" } });
    const geo = engine.evaluate(node, 560, 340, 1);
    const nonZeroBars = geo.bars.filter((b) => b.rawValue > 0);
    expect(nonZeroBars.every((b) => b.h > 0)).toBe(true);
  });

  it("bar x positions increase with category index (left to right)", () => {
    const node = makeBarChart({
      series: [{ id: "rev", name: "Revenue", color: "#45FF72", data: [100, 200, 300] }],
    });
    const geo = engine.evaluate(node, 560, 340, 1);
    const xs = geo.bars.map((b) => b.x);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
  });

  it("two series bars within the same category do not overlap", () => {
    const node = makeBarChart(); // 2 series
    const geo = engine.evaluate(node, 560, 340, 1);
    // For category 0: series 0 bar and series 1 bar
    const cat0bars = geo.bars.filter((b) => b.categoryIndex === 0);
    expect(cat0bars).toHaveLength(2);
    const [b0, b1] = cat0bars.sort((a, b) => a.x - b.x);
    // b0 right edge must be ≤ b1 left edge
    expect(b0.x + b0.w).toBeLessThanOrEqual(b1.x + 1); // +1 for rounding
  });

  it("higher values produce taller bars (larger h)", () => {
    const node = makeBarChart({
      series: [{ id: "rev", name: "Rev", color: "#45FF72", data: [100, 200, 300] }],
    });
    const geo = engine.evaluate(node, 560, 340, 1);
    const [b0, b1, b2] = geo.bars;
    expect(b0.h).toBeLessThan(b1.h);
    expect(b1.h).toBeLessThan(b2.h);
  });
});

// ---------------------------------------------------------------------------
// 4. Animation interpolation
// ---------------------------------------------------------------------------

describe("VisualizationEngine — animation", () => {
  it("bars have h=0 at t=0 with grow mode", () => {
    const node = makeBarChart({
      chartAnimation: { mode: "grow", duration: 1.2, stagger: 0, easing: "linear" },
    });
    const geo = engine.evaluate(node, 560, 340, 0);
    // With stagger=0, all bars start immediately — at t=0, easedT=0
    expect(geo.bars.every((b) => b.h === 0)).toBe(true);
  });

  it("bars approach fullH at t=1", () => {
    const node = makeBarChart({
      chartAnimation: { mode: "grow", duration: 1.2, stagger: 0, easing: "linear" },
    });
    const geoFull = engine.evaluate(node, 560, 340, 1);
    geoFull.bars.forEach((bar) => {
      expect(Math.abs(bar.h - bar.fullH)).toBeLessThan(0.01);
    });
  });

  it("animated bar height is monotonically increasing in t (no stagger)", () => {
    const node = makeBarChart({
      series: [{ id: "rev", name: "R", color: "#45FF72", data: [200] }],
      xLabels: ["A"],
      chartAnimation: { mode: "grow", stagger: 0, easing: "linear" },
    });
    const ts = [0, 0.25, 0.5, 0.75, 1];
    const heights = ts.map((t) => engine.evaluate(node, 560, 340, t).bars[0].h);
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]).toBeGreaterThanOrEqual(heights[i - 1]);
    }
  });

  it("animatedValue scales with t (count-up)", () => {
    const node = makeBarChart({
      series: [{ id: "rev", name: "R", color: "#45FF72", data: [100] }],
      xLabels: ["A"],
      chartAnimation: { mode: "grow", stagger: 0, easing: "linear" },
    });
    const geo50 = engine.evaluate(node, 560, 340, 0.5);
    // With linear easing and stagger=0: animatedValue ≈ 100 * 0.5 = 50
    expect(geo50.bars[0].animatedValue).toBeCloseTo(50, 0);
  });

  it("mode=none always returns full height regardless of t", () => {
    const node = makeBarChart({ chartAnimation: { mode: "none" } });
    const geo0 = engine.evaluate(node, 560, 340, 0);
    const geo1 = engine.evaluate(node, 560, 340, 1);
    geo0.bars.forEach((bar, i) => {
      expect(bar.h).toBeCloseTo(geo1.bars[i].h, 1);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. X-axis labels
// ---------------------------------------------------------------------------

describe("VisualizationEngine — x-axis labels", () => {
  it("produces one x-axis label per category", () => {
    const node = makeBarChart(); // 3 categories
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.xAxisLabels).toHaveLength(3);
  });

  it("x-axis label text matches xLabels", () => {
    const node = makeBarChart({ xLabels: ["Alpha", "Beta", "Gamma"] });
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.xAxisLabels.map((l) => l.text)).toEqual(["Alpha", "Beta", "Gamma"]);
  });
});

// ---------------------------------------------------------------------------
// 6. Legend
// ---------------------------------------------------------------------------

describe("VisualizationEngine — legend", () => {
  it("produces one entry per series when showLegend=true", () => {
    const node = makeBarChart({ showLegend: true });
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.legendEntries).toHaveLength(2);
  });

  it("produces no legend entries when showLegend=false", () => {
    const node = makeBarChart({ showLegend: false });
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.legendEntries).toHaveLength(0);
  });

  it("legend entry colors match series colors", () => {
    const node = makeBarChart({ showLegend: true });
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.legendEntries[0].color).toBe("#45FF72");
    expect(geo.legendEntries[1].color).toBe("#FF4141");
  });
});

// ---------------------------------------------------------------------------
// 7. Plot area boundaries
// ---------------------------------------------------------------------------

describe("VisualizationEngine — plot area", () => {
  it("plot area fits within chart bounds", () => {
    const geo = engine.evaluate(makeBarChart(), 560, 340, 1);
    expect(geo.plotArea.x).toBeGreaterThan(0);
    expect(geo.plotArea.y).toBeGreaterThan(0);
    expect(geo.plotArea.x + geo.plotArea.w).toBeLessThanOrEqual(560);
    expect(geo.plotArea.y + geo.plotArea.h).toBeLessThanOrEqual(340);
  });

  it("bars fall within plot area horizontally", () => {
    const geo = engine.evaluate(makeBarChart(), 560, 340, 1);
    for (const bar of geo.bars) {
      expect(bar.x).toBeGreaterThanOrEqual(geo.plotArea.x - 1);
      expect(bar.x + bar.w).toBeLessThanOrEqual(geo.plotArea.x + geo.plotArea.w + 1);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Empty / edge cases
// ---------------------------------------------------------------------------

describe("VisualizationEngine — edge cases", () => {
  it("returns empty geometry when series is empty", () => {
    const node = makeBarChart({ series: [] });
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.bars).toHaveLength(0);
    expect(geo.gridLines).toHaveLength(0);
  });

  it("handles zero-value bars gracefully", () => {
    const node = makeBarChart({
      series: [{ id: "rev", name: "R", color: "#45FF72", data: [0, 0, 0] }],
    });
    const geo = engine.evaluate(node, 560, 340, 1);
    geo.bars.forEach((b) => {
      expect(b.h).toBe(0);
      expect(b.animatedValue).toBe(0);
    });
  });

  it("handles single series single category", () => {
    const node = makeBarChart({
      series: [{ id: "v", name: "V", color: "#4ECDC4", data: [42] }],
      xLabels: ["Only"],
    });
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.bars).toHaveLength(1);
    expect(geo.bars[0].rawValue).toBe(42);
  });

  it("evaluates consistently for same inputs (deterministic)", () => {
    const node = makeBarChart();
    const geoA = engine.evaluate(node, 560, 340, 0.7);
    const geoB = engine.evaluate(node, 560, 340, 0.7);
    expect(geoA.bars.map((b) => b.h)).toEqual(geoB.bars.map((b) => b.h));
  });
});
