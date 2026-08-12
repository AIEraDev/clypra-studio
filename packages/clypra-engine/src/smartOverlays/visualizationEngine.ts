/**
 * Phase 4Q — VisualizationEngine (refactored)
 *
 * Pure geometry generator registry: (ChartNode, width, height, t) → EvaluatedChartGeometry.
 *
 * Architecture:
 *   evaluate() — shared infrastructure + dispatcher
 *     ├── computeBars()       → "bar"
 *     ├── computeLinePaths()  → "line" | "area"
 *     └── computeArcs()       → "pie" | "donut"
 *
 * No Pixi, no DOM, no async. Deterministic and fully testable.
 */

import type {
  ChartNode,
  ChartSeries,
  AxisConfig,
  ChartBarStyle,
  ChartAnimationConfig,
} from "./overlayDocumentSchema.js";

// ---------------------------------------------------------------------------
// Geometry output types
// ---------------------------------------------------------------------------

export interface BarGeometry {
  seriesId: string;
  categoryIndex: number;
  x: number;
  y: number;
  w: number;
  /** Animated bar height at current t */
  h: number;
  /** Full bar height at t=1 */
  fullH: number;
  color: string;
  rawValue: number;
  animatedValue: number;
  labelText: string;
  active: boolean;
}

export interface LinePoint {
  seriesId: string;
  categoryIndex: number;
  /** Pixel x for this category */
  x: number;
  /** Animated pixel y (baseline at t=0, data position at t=1) */
  y: number;
  /** Full pixel y at t=1 */
  fullY: number;
  /** Bottom of plot (baseline y — used for area fill) */
  baseY: number;
  color: string;
  rawValue: number;
  animatedValue: number;
  labelText: string;
  active: boolean;
}

export interface ArcGeometry {
  seriesId: string;
  /** Animated start angle (radians) */
  startAngle: number;
  /** Animated end angle (radians) — equals startAngle at t=0 */
  endAngle: number;
  /** Final end angle at t=1 */
  fullEndAngle: number;
  /** 0 for pie, >0 for donut */
  innerRadius: number;
  outerRadius: number;
  color: string;
  rawValue: number;
  animatedValue: number;
  percentage: number;
  labelText: string;
  /** Midpoint of arc — for label placement */
  labelX: number;
  labelY: number;
}

export interface GridLineGeometry {
  y: number;
  label: string;
  value: number;
}

export interface AxisLabel {
  x: number;
  y: number;
  text: string;
  anchor: "start" | "middle" | "end";
}

export interface LegendEntry {
  x: number;
  y: number;
  color: string;
  label: string;
}

export interface PlotArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GeometryAnchor {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface AnchorMap {
  /** bar[seriesId][categoryIndex] → bounding box of top of bar */
  bars: Record<string, Record<number, GeometryAnchor>>;
  /** point[seriesId][categoryIndex] → point center coordinate */
  points: Record<string, Record<number, GeometryAnchor>>;
  /** arc[seriesId] → midpoint coordinate of arc */
  arcs: Record<string, GeometryAnchor>;
}

export interface HighlightRegionGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  opacity: number;
  label?: string;
}

export interface EvaluatedChartGeometry {
  // Bar chart
  bars: BarGeometry[];
  // Line / area chart
  linePoints: LinePoint[];
  // Pie / donut
  arcs: ArcGeometry[];
  centerX: number;
  centerY: number;
  // Shared
  gridLines: GridLineGeometry[];
  xAxisLabels: AxisLabel[];
  yAxisLabels: AxisLabel[];
  legendEntries: LegendEntry[];
  plotArea: PlotArea;
  t: number;
  anchors: AnchorMap;
  highlights: HighlightRegionGeometry[];
}

// ---------------------------------------------------------------------------
// Easing library
// ---------------------------------------------------------------------------

function applyEasing(
  t: number,
  easing: ChartAnimationConfig["easing"] = "easeOutCubic"
): number {
  switch (easing) {
    case "linear":
      return t;
    case "easeInCubic":
      return t * t * t;
    case "easeOutCubic":
      return 1 - Math.pow(1 - t, 3);
    case "easeInOutCubic":
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case "easeOutQuart":
      return 1 - Math.pow(1 - t, 4);
    case "easeOutElastic": {
      const c4 = (2 * Math.PI) / 3;
      return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    default:
      return 1 - Math.pow(1 - t, 3);
  }
}

// ---------------------------------------------------------------------------
// Value formatting
// ---------------------------------------------------------------------------

function formatValue(v: number, labelFormat?: string): string {
  if (!labelFormat) {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
  return labelFormat.replace("{{value}}", String(Math.round(v)));
}

// ---------------------------------------------------------------------------
// Stagger helper — shared across generators
// ---------------------------------------------------------------------------

function computeLocalT(
  globalT: number,
  itemIndex: number,
  staggerStep: number,
  animMode: ChartAnimationConfig["mode"],
  easing: ChartAnimationConfig["easing"]
): { localT: number; active: boolean } {
  if (animMode === "none") return { localT: 1, active: true };
  const offset = itemIndex * staggerStep;
  const active = globalT > offset;
  const window = Math.max(0.001, 1 - offset);
  const localT = active ? Math.min(1, (globalT - offset) / window) : 0;
  return { localT: applyEasing(localT, easing), active };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = [
  "#45FF72", "#FF4141", "#4ECDC4", "#FFE66D", "#A78BFA",
  "#F97316", "#06B6D4", "#EC4899",
];

const PADDING = {
  top: 40,
  right: 20,
  bottom: 44,
  left: 52,
};

const LEGEND_HEIGHT = 32;
const LEGEND_RIGHT_WIDTH = 120;

// ---------------------------------------------------------------------------
// VisualizationEngine
// ---------------------------------------------------------------------------

export class VisualizationEngine {
  /**
   * Evaluate a ChartNode into flat geometry at normalized time t ∈ [0,1].
   *
   * @param node   Fully data-bound ChartNode (series[].data populated by DataBindingEngine)
   * @param width  Absolute pixel width
   * @param height Absolute pixel height
   * @param t      Normalized animation time [0,1]
   */
  evaluate(node: ChartNode, width: number, height: number, t: number): EvaluatedChartGeometry {
    const series = this.normalizeSeries(node);
    const catCount = Math.max(1, ...series.map((s) => (s.data ?? []).length));

    if (series.length === 0 || catCount === 0) {
      return this.emptyGeometry(width, height, t);
    }

    // ── Shared: plot area ──────────────────────────────────────────────────
    const isPieFamily = node.chartType === "pie" || node.chartType === "donut";
    const legendH =
      node.showLegend && node.legendPosition !== "right" ? LEGEND_HEIGHT : 0;
    const legendW =
      node.showLegend && node.legendPosition === "right" ? LEGEND_RIGHT_WIDTH : 0;

    const plot: PlotArea = {
      x: isPieFamily ? 0 : PADDING.left,
      y: isPieFamily ? 0 : PADDING.top,
      w: width - (isPieFamily ? 0 : PADDING.left + PADDING.right) - legendW,
      h: height - (isPieFamily ? 0 : PADDING.top + PADDING.bottom) - legendH,
    };

    // ── Shared: legend ─────────────────────────────────────────────────────
    const legendEntries = node.showLegend
      ? this.computeLegend(series, node.legendPosition ?? "bottom", plot, width, height, legendH)
      : [];

    // ── Per-type geometry dispatch ─────────────────────────────────────────
    const animConf: ChartAnimationConfig = node.chartAnimation ?? { mode: "none" };
    const axisConf: AxisConfig = node.axis ?? {};

    if (isPieFamily) {
      const arcs = this.computeArcs(node, series, width, height, legendH, animConf, t);
      const cx = plot.w / 2 + (legendW > 0 ? 0 : 0);
      const cy = (height - legendH) / 2;
      return {
        bars: [], linePoints: [], arcs,
        centerX: cx, centerY: cy,
        gridLines: [], xAxisLabels: [], yAxisLabels: [],
        legendEntries, plotArea: plot, t,
        anchors: this.computeAnchors([], [], arcs),
        highlights: [],
      };
    }

    // Shared: domain, grid, axes (bar + line + area)
    const categories = this.resolveCategories(node, series);
    const { domainMin, domainMax } = this.computeDomain(series, axisConf, node.stacked ?? false);
    const tickCount = axisConf.tickCount ?? 5;
    const gridLines = this.computeGridLines(domainMin, domainMax, tickCount, plot, axisConf);
    const yAxisLabels = this.computeYAxisLabels(gridLines, plot);
    const xAxisLabels = this.computeXAxisLabels(categories, plot);
    const highlights = this.computeHighlights(node, categories, plot);

    if (node.chartType === "bar") {
      const barStyle: ChartBarStyle = node.barStyle ?? {};
      const bars = this.computeBars(
        series, categories, plot, domainMin, domainMax, barStyle, animConf, t
      );
      return {
        bars, linePoints: [], arcs: [],
        centerX: 0, centerY: 0,
        gridLines, xAxisLabels, yAxisLabels,
        legendEntries, plotArea: plot, t,
        anchors: this.computeAnchors(bars, [], []),
        highlights,
      };
    }

    if (node.chartType === "line" || node.chartType === "area") {
      const linePoints = this.computeLinePaths(
        series, categories, plot, domainMin, domainMax, animConf, t
      );
      return {
        bars: [], linePoints, arcs: [],
        centerX: 0, centerY: 0,
        gridLines, xAxisLabels, yAxisLabels,
        legendEntries, plotArea: plot, t,
        anchors: this.computeAnchors([], linePoints, []),
        highlights,
      };
    }

    // Fallback: empty (radar, scatter — future generators)
    return this.emptyGeometry(width, height, t);
  }

  // ── Series normalisation ──────────────────────────────────────────────────

  private normalizeSeries(node: ChartNode): ChartSeries[] {
    const palette = node.colorPalette ?? DEFAULT_PALETTE;
    return (node.series ?? []).map((s, i) => ({
      id: s.id ?? s.name ?? `series-${i}`,
      name: s.name ?? s.id ?? `Series ${i + 1}`,
      color: s.color || palette[i % palette.length],
      data: s.data ?? [],
      stackGroup: s.stackGroup,
    }));
  }

  private resolveCategories(node: ChartNode, series: ChartSeries[]): string[] {
    if (node.xLabels && node.xLabels.length > 0) return node.xLabels;
    const maxLen = Math.max(...series.map((s) => (s.data ?? []).length));
    return Array.from({ length: maxLen }, (_, i) => `Cat ${i + 1}`);
  }

  // ── Domain ────────────────────────────────────────────────────────────────

  private computeDomain(
    series: ChartSeries[],
    axis: AxisConfig,
    stacked: boolean
  ): { domainMin: number; domainMax: number } {
    const domainMin = axis.min ?? 0;
    let domainMax = axis.max;

    if (domainMax === undefined) {
      if (stacked) {
        const catCount = Math.max(...series.map((s) => (s.data ?? []).length));
        let stackMax = 0;
        for (let i = 0; i < catCount; i++) {
          const total = series.reduce((sum, s) => sum + ((s.data ?? [])[i] ?? 0), 0);
          if (total > stackMax) stackMax = total;
        }
        domainMax = stackMax;
      } else {
        domainMax = Math.max(1, ...series.flatMap((s) => s.data ?? []));
      }
      domainMax = this.niceMax(domainMax);
    }

    return { domainMin, domainMax };
  }

  private niceMax(v: number): number {
    if (v <= 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
    for (const f of [1, 2, 2.5, 5, 10]) {
      const candidate = f * magnitude;
      if (candidate >= v) return candidate;
    }
    return v;
  }

  private valueToY(value: number, domainMin: number, domainMax: number, plot: PlotArea): number {
    const pct = (value - domainMin) / Math.max(1, domainMax - domainMin);
    return plot.y + plot.h - pct * plot.h;
  }

  // ── Grid & Axes ───────────────────────────────────────────────────────────

  private computeGridLines(
    domainMin: number,
    domainMax: number,
    tickCount: number,
    plot: PlotArea,
    axis: AxisConfig
  ): GridLineGeometry[] {
    return Array.from({ length: tickCount + 1 }, (_, i) => {
      const value = domainMin + ((domainMax - domainMin) * i) / tickCount;
      return { y: this.valueToY(value, domainMin, domainMax, plot), value, label: formatValue(value, axis.labelFormat) };
    });
  }

  private computeYAxisLabels(gridLines: GridLineGeometry[], plot: PlotArea): AxisLabel[] {
    return gridLines.map((gl) => ({
      x: plot.x - 8, y: gl.y, text: gl.label, anchor: "end" as const,
    }));
  }

  private computeXAxisLabels(categories: string[], plot: PlotArea): AxisLabel[] {
    const catCount = categories.length;
    const catPad = Math.max(8, plot.w * 0.04);
    const catW = (plot.w - catPad * 2) / catCount;
    return categories.map((label, ci) => ({
      x: plot.x + catPad + ci * catW + catW / 2,
      y: plot.y + plot.h + 16,
      text: label,
      anchor: "middle" as const,
    }));
  }

  // ── Bar geometry generator ────────────────────────────────────────────────

  private computeBars(
    series: ChartSeries[],
    categories: string[],
    plot: PlotArea,
    domainMin: number,
    domainMax: number,
    barStyle: ChartBarStyle,
    animConf: ChartAnimationConfig,
    t: number
  ): BarGeometry[] {
    const bars: BarGeometry[] = [];
    const catCount = categories.length;
    const seriesCount = series.length;
    const groupGap = barStyle.groupGap ?? 6;
    const catPad = Math.max(8, plot.w * 0.04);
    const catW = (plot.w - catPad * 2) / catCount;
    const groupW = catW - 8;
    const barW = Math.max(4, (groupW - (seriesCount - 1) * groupGap) / seriesCount);
    const staggerStep = animConf.stagger ?? 0.08;

    series.forEach((s, si) => {
      const data = s.data ?? [];
      categories.forEach((_, ci) => {
        const rawValue = data[ci] ?? 0;
        const barIndex = ci * seriesCount + si;
        const { localT: easedT, active } = computeLocalT(t, barIndex, staggerStep, animConf.mode, animConf.easing);
        const fullH = Math.max(0, ((rawValue - domainMin) / Math.max(1, domainMax - domainMin)) * plot.h);
        const animH = fullH * easedT;
        const bx = plot.x + catPad + ci * catW + si * (barW + groupGap);
        bars.push({
          seriesId: s.id,
          categoryIndex: ci,
          x: bx, y: plot.y + plot.h - animH,
          w: barW, h: animH, fullH,
          color: s.color,
          rawValue,
          animatedValue: rawValue * easedT,
          labelText: formatValue(rawValue * easedT),
          active,
        });
      });
    });

    return bars;
  }

  // ── Line / Area geometry generator ────────────────────────────────────────

  private computeLinePaths(
    series: ChartSeries[],
    categories: string[],
    plot: PlotArea,
    domainMin: number,
    domainMax: number,
    animConf: ChartAnimationConfig,
    t: number
  ): LinePoint[] {
    const points: LinePoint[] = [];
    const catCount = categories.length;
    const catPad = Math.max(8, plot.w * 0.04);
    const catW = (plot.w - catPad * 2) / catCount;
    const staggerStep = animConf.stagger ?? 0.06;
    const baseY = plot.y + plot.h;

    series.forEach((s, si) => {
      const data = s.data ?? [];
      categories.forEach((_, ci) => {
        const rawValue = data[ci] ?? 0;
        // Stagger per point (left-to-right within each series, series offset)
        const pointIndex = si * catCount + ci;
        const { localT: easedT, active } = computeLocalT(t, pointIndex, staggerStep, animConf.mode, animConf.easing);
        const fullY = this.valueToY(rawValue, domainMin, domainMax, plot);
        // At t=0: point is at baseline; at t=1: at data position
        const animY = baseY - (baseY - fullY) * easedT;
        const px = plot.x + catPad + ci * catW + catW / 2;
        points.push({
          seriesId: s.id,
          categoryIndex: ci,
          x: px, y: animY, fullY,
          baseY,
          color: s.color,
          rawValue,
          animatedValue: rawValue * easedT,
          labelText: formatValue(rawValue * easedT),
          active,
        });
      });
    });

    return points;
  }

  // ── Pie / Donut arc geometry generator ────────────────────────────────────

  private computeArcs(
    node: ChartNode,
    series: ChartSeries[],
    width: number,
    height: number,
    legendH: number,
    animConf: ChartAnimationConfig,
    t: number
  ): ArcGeometry[] {
    const arcs: ArcGeometry[] = [];
    const isDonut = node.chartType === "donut";
    const holeRatio = (node as any).donutHoleRatio ?? 0.55;

    const cx = width / 2;
    const cy = (height - legendH) / 2;
    const outerR = Math.min(cx, cy) * 0.85;
    const innerR = isDonut ? outerR * holeRatio : 0;

    // Sum for percentage
    const total = series.reduce((sum, s) => sum + ((s.data ?? [])[0] ?? 0), 0) || 1;
    const staggerStep = animConf.stagger ?? 0.1;

    let cumulativeAngle = -Math.PI / 2; // Start at 12 o'clock

    series.forEach((s, i) => {
      const rawValue = (s.data ?? [])[0] ?? 0;
      const percentage = rawValue / total;
      const fullSweep = percentage * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const fullEndAngle = startAngle + fullSweep;

      // Animate each sector sweeping from startAngle outward
      const { localT: easedT, active } = computeLocalT(t, i, staggerStep, animConf.mode, animConf.easing);
      const animSweep = fullSweep * easedT;
      const endAngle = startAngle + animSweep;

      // Label at arc midpoint
      const midAngle = startAngle + fullSweep / 2;
      const labelR = (innerR + outerR) / 2;
      const labelX = cx + Math.cos(midAngle) * labelR;
      const labelY = cy + Math.sin(midAngle) * labelR;

      arcs.push({
        seriesId: s.id,
        startAngle, endAngle, fullEndAngle,
        innerRadius: innerR, outerRadius: outerR,
        color: s.color,
        rawValue,
        animatedValue: rawValue * easedT,
        percentage: percentage * 100,
        labelText: `${Math.round(percentage * 100)}%`,
        labelX, labelY,
      });

      cumulativeAngle = fullEndAngle;
    });

    return arcs;
  }

  // ── Legend ────────────────────────────────────────────────────────────────

  private computeLegend(
    series: ChartSeries[],
    position: "bottom" | "right" | "top",
    plot: PlotArea,
    chartWidth: number,
    chartHeight: number,
    legendH: number
  ): LegendEntry[] {
    const entries: LegendEntry[] = [];
    const itemSpacing = 120;

    if (position === "bottom") {
      const startX = (chartWidth - series.length * itemSpacing) / 2;
      const y = chartHeight - legendH / 2;
      series.forEach((s, i) => entries.push({ x: startX + i * itemSpacing, y, color: s.color, label: s.name }));
    } else if (position === "right") {
      const x = plot.x + plot.w + 16;
      series.forEach((s, i) => entries.push({ x, y: plot.y + 20 + i * 28, color: s.color, label: s.name }));
    } else {
      const startX = plot.x;
      series.forEach((s, i) => entries.push({ x: startX + i * itemSpacing, y: 12, color: s.color, label: s.name }));
    }

    return entries;
  }

  private computeAnchors(
    bars: BarGeometry[],
    linePoints: LinePoint[],
    arcs: ArcGeometry[]
  ): AnchorMap {
    const barAnchors: Record<string, Record<number, GeometryAnchor>> = {};
    const pointAnchors: Record<string, Record<number, GeometryAnchor>> = {};
    const arcAnchors: Record<string, GeometryAnchor> = {};

    bars.forEach((b) => {
      if (!barAnchors[b.seriesId]) barAnchors[b.seriesId] = {};
      barAnchors[b.seriesId][b.categoryIndex] = {
        x: b.x + b.w / 2,
        y: b.y,
        w: b.w,
        h: b.h,
        label: b.labelText,
      };
    });

    linePoints.forEach((pt) => {
      if (!pointAnchors[pt.seriesId]) pointAnchors[pt.seriesId] = {};
      pointAnchors[pt.seriesId][pt.categoryIndex] = {
        x: pt.x,
        y: pt.y,
        w: 0,
        h: 0,
        label: pt.labelText,
      };
    });

    arcs.forEach((a) => {
      arcAnchors[a.seriesId] = {
        x: a.labelX,
        y: a.labelY,
        w: 0,
        h: 0,
        label: a.labelText,
      };
    });

    return { bars: barAnchors, points: pointAnchors, arcs: arcAnchors };
  }

  private computeHighlights(
    node: ChartNode,
    categories: string[],
    plot: PlotArea
  ): HighlightRegionGeometry[] {
    if (!node.highlights || node.highlights.length === 0) return [];
    const catCount = Math.max(1, categories.length);
    const catPad = Math.max(8, plot.w * 0.04);
    const catW = (plot.w - catPad * 2) / catCount;

    return node.highlights.map((h) => {
      const [startIdx, endIdx] = h.dataIndexRange ?? [0, catCount - 1];
      const sIdx = Math.max(0, Math.min(catCount - 1, startIdx));
      const eIdx = Math.max(sIdx, Math.min(catCount - 1, endIdx));

      const hx = plot.x + catPad + sIdx * catW;
      const hw = (eIdx - sIdx + 1) * catW;

      return {
        x: hx,
        y: plot.y,
        w: hw,
        h: plot.h,
        color: h.color || "#FFE66D",
        opacity: h.opacity ?? 0.15,
        label: h.label,
      };
    });
  }

  // ── Empty geometry ────────────────────────────────────────────────────────

  private emptyGeometry(width: number, height: number, t: number): EvaluatedChartGeometry {
    return {
      bars: [], linePoints: [], arcs: [],
      centerX: width / 2, centerY: height / 2,
      gridLines: [], xAxisLabels: [], yAxisLabels: [],
      legendEntries: [],
      plotArea: {
        x: PADDING.left, y: PADDING.top,
        w: Math.max(0, width - PADDING.left - PADDING.right),
        h: Math.max(0, height - PADDING.top - PADDING.bottom),
      },
      t,
      anchors: { bars: {}, points: {}, arcs: {} },
      highlights: [],
    };
  }
}

export const visualizationEngine = new VisualizationEngine();
