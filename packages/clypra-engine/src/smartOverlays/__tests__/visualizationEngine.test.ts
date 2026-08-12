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

// ---------------------------------------------------------------------------
// Phase 4Q — Line chart geometry
// ---------------------------------------------------------------------------

function makeLineChart(overrides: Partial<ChartNode> = {}): ChartNode {
  return {
    id: "line-test",
    name: "Line Chart",
    type: "chart",
    x: 0, y: 0,
    width: 560, height: 340,
    chartType: "line",
    xLabels: ["Jan", "Feb", "Mar", "Apr", "May"],
    series: [
      { id: "revenue", name: "Revenue", color: "#45FF72", data: [100, 180, 140, 220, 300] },
      { id: "cost",    name: "Cost",    color: "#FF4141", data: [60,  90,  80,  110, 150] },
    ],
    axis: { min: 0, tickCount: 5 },
    chartAnimation: { mode: "grow", stagger: 0.06, easing: "linear" },
    showLegend: true,
    ...overrides,
  } as ChartNode;
}

describe("VisualizationEngine — line chart geometry", () => {
  it("produces catCount × seriesCount line points", () => {
    const node = makeLineChart(); // 5 categories × 2 series
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.linePoints).toHaveLength(10);
  });

  it("bar arrays are empty for line chartType", () => {
    const geo = engine.evaluate(makeLineChart(), 560, 340, 1);
    expect(geo.bars).toHaveLength(0);
  });

  it("arc arrays are empty for line chartType", () => {
    const geo = engine.evaluate(makeLineChart(), 560, 340, 1);
    expect(geo.arcs).toHaveLength(0);
  });

  it("all points are at baseY at t=0 (animate from baseline)", () => {
    const node = makeLineChart({ chartAnimation: { mode: "grow", stagger: 0, easing: "linear" } });
    const geo = engine.evaluate(node, 560, 340, 0);
    geo.linePoints.forEach((p) => {
      expect(Math.abs(p.y - p.baseY)).toBeLessThan(0.01);
    });
  });

  it("points approach fullY at t=1", () => {
    const node = makeLineChart({ chartAnimation: { mode: "grow", stagger: 0, easing: "linear" } });
    const geo = engine.evaluate(node, 560, 340, 1);
    geo.linePoints.forEach((p) => {
      expect(Math.abs(p.y - p.fullY)).toBeLessThan(0.01);
    });
  });

  it("higher values produce smaller y (closer to top in screen coords)", () => {
    const node = makeLineChart({
      series: [{ id: "rev", name: "Rev", color: "#45FF72", data: [100, 200, 300, 400, 500] }],
      chartAnimation: { mode: "none" },
    });
    const geo = engine.evaluate(node, 560, 340, 1);
    const ys = geo.linePoints.map((p) => p.y);
    // Each subsequent value is higher → y should decrease
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeLessThan(ys[i - 1]);
    }
  });

  it("x positions increase left to right with categoryIndex", () => {
    const node = makeLineChart({
      series: [{ id: "rev", name: "Rev", color: "#45FF72", data: [100, 150, 200, 250, 300] }],
    });
    const geo = engine.evaluate(node, 560, 340, 1);
    const xs = geo.linePoints.map((p) => p.x);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
  });

  it("animatedValue scales with t (linear easing, no stagger)", () => {
    const node = makeLineChart({
      series: [{ id: "rev", name: "Rev", color: "#45FF72", data: [200, 200, 200, 200, 200] }],
      chartAnimation: { mode: "grow", stagger: 0, easing: "linear" },
    });
    const geo50 = engine.evaluate(node, 560, 340, 0.5);
    geo50.linePoints.forEach((p) => {
      expect(p.animatedValue).toBeCloseTo(100, 0); // 200 * 0.5
    });
  });

  it("gridLines are produced (shared with bar)", () => {
    const geo = engine.evaluate(makeLineChart(), 560, 340, 1);
    expect(geo.gridLines.length).toBeGreaterThan(0);
  });

  it("xAxisLabels count matches category count", () => {
    const geo = engine.evaluate(makeLineChart(), 560, 340, 1);
    expect(geo.xAxisLabels).toHaveLength(5);
  });
});

describe("VisualizationEngine — area chart", () => {
  it("line points are populated for area chartType", () => {
    const node = makeLineChart({ chartType: "area" });
    const geo = engine.evaluate(node, 560, 340, 1);
    expect(geo.linePoints).toHaveLength(10);
    expect(geo.bars).toHaveLength(0);
    expect(geo.arcs).toHaveLength(0);
  });

  it("baseY equals plotArea bottom for area fill", () => {
    const node = makeLineChart({ chartType: "area", chartAnimation: { mode: "none" } });
    const geo = engine.evaluate(node, 560, 340, 1);
    const baseY = geo.plotArea.y + geo.plotArea.h;
    geo.linePoints.forEach((p) => {
      expect(Math.abs(p.baseY - baseY)).toBeLessThan(0.01);
    });
  });
});

// ---------------------------------------------------------------------------
// Phase 4Q — Donut / Pie geometry
// ---------------------------------------------------------------------------

function makeDonutChart(overrides: Partial<ChartNode> = {}): ChartNode {
  return {
    id: "donut-test",
    name: "Donut Chart",
    type: "chart",
    x: 0, y: 0,
    width: 400, height: 400,
    chartType: "donut",
    series: [
      { id: "retained", name: "Retained", color: "#45FF72", data: [62] },
      { id: "new",      name: "New",       color: "#FF4141", data: [25] },
      { id: "churned",  name: "Churned",   color: "#4ECDC4", data: [13] },
    ],
    showLegend: true,
    legendPosition: "bottom",
    chartAnimation: { mode: "grow", stagger: 0.1, easing: "linear" },
    ...overrides,
  } as ChartNode;
}

describe("VisualizationEngine — donut geometry", () => {
  it("produces one arc per series", () => {
    const geo = engine.evaluate(makeDonutChart(), 400, 400, 1);
    expect(geo.arcs).toHaveLength(3);
  });

  it("bars and linePoints are empty for donut", () => {
    const geo = engine.evaluate(makeDonutChart(), 400, 400, 1);
    expect(geo.bars).toHaveLength(0);
    expect(geo.linePoints).toHaveLength(0);
  });

  it("arc angles sum to 2π at t=1", () => {
    const node = makeDonutChart({ chartAnimation: { mode: "none" } });
    const geo = engine.evaluate(node, 400, 400, 1);
    const totalSweep = geo.arcs.reduce((sum, a) => sum + (a.endAngle - a.startAngle), 0);
    expect(totalSweep).toBeCloseTo(2 * Math.PI, 3);
  });

  it("arcs are collapsed at t=0 (endAngle === startAngle)", () => {
    const node = makeDonutChart({ chartAnimation: { mode: "grow", stagger: 0, easing: "linear" } });
    const geo = engine.evaluate(node, 400, 400, 0);
    geo.arcs.forEach((a) => {
      expect(a.endAngle).toBeCloseTo(a.startAngle, 5);
    });
  });

  it("innerRadius > 0 for donut", () => {
    const geo = engine.evaluate(makeDonutChart(), 400, 400, 1);
    geo.arcs.forEach((a) => expect(a.innerRadius).toBeGreaterThan(0));
  });

  it("percentages sum to ≈ 100%", () => {
    const node = makeDonutChart({ chartAnimation: { mode: "none" } });
    const geo = engine.evaluate(node, 400, 400, 1);
    const total = geo.arcs.reduce((sum, a) => sum + a.percentage, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  it("arc colors match series colors", () => {
    const node = makeDonutChart({ chartAnimation: { mode: "none" } });
    const geo = engine.evaluate(node, 400, 400, 1);
    expect(geo.arcs[0].color).toBe("#45FF72");
    expect(geo.arcs[1].color).toBe("#FF4141");
    expect(geo.arcs[2].color).toBe("#4ECDC4");
  });

  it("arc startAngles are cumulative (each arc begins where previous ended)", () => {
    const node = makeDonutChart({ chartAnimation: { mode: "none" } });
    const geo = engine.evaluate(node, 400, 400, 1);
    for (let i = 1; i < geo.arcs.length; i++) {
      expect(geo.arcs[i].startAngle).toBeCloseTo(geo.arcs[i - 1].fullEndAngle, 5);
    }
  });

  it("label positions are within chart bounds", () => {
    const node = makeDonutChart({ chartAnimation: { mode: "none" } });
    const geo = engine.evaluate(node, 400, 400, 1);
    geo.arcs.forEach((a) => {
      expect(a.labelX).toBeGreaterThan(0);
      expect(a.labelX).toBeLessThan(400);
      expect(a.labelY).toBeGreaterThan(0);
      expect(a.labelY).toBeLessThan(400);
    });
  });

  it("animatedValue scales with t for arc sweep", () => {
    const node = makeDonutChart({
      series: [{ id: "v", name: "V", color: "#45FF72", data: [100] }],
      chartAnimation: { mode: "grow", stagger: 0, easing: "linear" },
    });
    const geo50 = engine.evaluate(node, 400, 400, 0.5);
    expect(geo50.arcs[0].animatedValue).toBeCloseTo(50, 0);
  });

  it("deterministic for same t", () => {
    const node = makeDonutChart();
    const geoA = engine.evaluate(node, 400, 400, 0.6);
    const geoB = engine.evaluate(node, 400, 400, 0.6);
    expect(geoA.arcs.map((a) => a.endAngle)).toEqual(geoB.arcs.map((a) => a.endAngle));
  });
});

describe("VisualizationEngine — pie geometry", () => {
  it("innerRadius === 0 for pie", () => {
    const node = makeDonutChart({ chartType: "pie" });
    const geo = engine.evaluate(node, 400, 400, 1);
    geo.arcs.forEach((a) => expect(a.innerRadius).toBe(0));
  });

  it("pie angles still sum to 2π at t=1", () => {
    const node = makeDonutChart({ chartType: "pie", chartAnimation: { mode: "none" } });
    const geo = engine.evaluate(node, 400, 400, 1);
    const totalSweep = geo.arcs.reduce((sum, a) => sum + (a.endAngle - a.startAngle), 0);
    expect(totalSweep).toBeCloseTo(2 * Math.PI, 3);
  });
});

// ---------------------------------------------------------------------------
// Phase 4Q — Cross-type contracts
// ---------------------------------------------------------------------------

describe("VisualizationEngine — cross-type output contracts", () => {
  const chartTypes: Array<ChartNode["chartType"]> = ["bar", "line", "area", "pie", "donut"];

  chartTypes.forEach((ct) => {
    it(`evaluate() always returns plotArea for chartType="${ct}"`, () => {
      const base: Partial<ChartNode> = {
        chartType: ct,
        series: [{ id: "v", name: "V", color: "#45FF72", data: [ct === "pie" || ct === "donut" ? 100 : 100, 200] }],
        xLabels: ct === "pie" || ct === "donut" ? undefined : ["A", "B"],
      };
      const node = ct === "bar" ? makeBarChart(base) : makeLineChart(base as any);
      const geo = engine.evaluate(node, 560, 400, 1);
      expect(geo.plotArea).toBeDefined();
      expect(geo.t).toBe(1);
    });

    it(`no NaN values in geometry for chartType="${ct}"`, () => {
      const base: Partial<ChartNode> = {
        chartType: ct,
        series: [{ id: "v", name: "V", color: "#45FF72", data: [ct === "pie" || ct === "donut" ? 50 : 50, 75] }],
        xLabels: ct === "pie" || ct === "donut" ? undefined : ["A", "B"],
        chartAnimation: { mode: "grow", stagger: 0, easing: "linear" },
      };
      const node = ct === "bar" ? makeBarChart(base) : makeLineChart(base as any);
      const geo = engine.evaluate(node, 560, 400, 0.5);
      const allNums = [
        ...geo.bars.flatMap((b) => [b.x, b.y, b.w, b.h, b.rawValue, b.animatedValue]),
        ...geo.linePoints.flatMap((p) => [p.x, p.y, p.rawValue, p.animatedValue]),
        ...geo.arcs.flatMap((a) => [a.startAngle, a.endAngle, a.percentage, a.rawValue]),
      ];
      allNums.forEach((n) => expect(Number.isFinite(n)).toBe(true));
    });
  });
});
