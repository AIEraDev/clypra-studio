/**
 * Phase 4P — VisualizationEngine
 *
 * Pure geometry generator: (ChartNode, width, height, t) → EvaluatedChartGeometry.
 *
 * No Pixi, no DOM, no async. Deterministic and fully testable.
 * Called every frame by PixiSceneProjection with the current animation t ∈ [0,1].
 */

import type {
  ChartNode,
  ChartSeries,
  AxisConfig,
  ChartBarStyle,
  ChartAnimationConfig,
} from "./overlayDocumentSchema.js";

// ---------------------------------------------------------------------------
// Internal geometry types (Pixi projection consumes these)
// ---------------------------------------------------------------------------

export interface BarGeometry {
  /** Series id (matches ChartSeries.id) */
  seriesId: string;
  /** Category index (0-based) */
  categoryIndex: number;
  /** Absolute pixel x within chart node bounds */
  x: number;
  /** Absolute pixel y within chart node bounds (top of bar) */
  y: number;
  /** Bar width (px) */
  w: number;
  /** Animated bar height (px) — 0 at t=0, full at t=1 */
  h: number;
  /** Full bar height at t=1 (px) */
  fullH: number;
  /** Hex fill color */
  color: string;
  /** Raw data value */
  rawValue: number;
  /** Animated data value at current t (for count-up labels) */
  animatedValue: number;
  /** Formatted label string */
  labelText: string;
  /** Whether this bar's stagger window has started */
  active: boolean;
}

export interface GridLineGeometry {
  /** Pixel y position within chart node bounds */
  y: number;
  /** Formatted tick label */
  label: string;
  /** Raw numeric value of this tick */
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

export interface EvaluatedChartGeometry {
  bars: BarGeometry[];
  gridLines: GridLineGeometry[];
  xAxisLabels: AxisLabel[];
  yAxisLabels: AxisLabel[];
  legendEntries: LegendEntry[];
  plotArea: PlotArea;
  /** Normalized animation progress [0,1] after stagger/easing */
  t: number;
}

// ---------------------------------------------------------------------------
// Easing library (pure functions)
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
    // Smart defaults: compact large numbers
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
  return labelFormat.replace("{{value}}", String(Math.round(v)));
}

// ---------------------------------------------------------------------------
// Default palette
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = [
  "#45FF72",
  "#FF4141",
  "#4ECDC4",
  "#FFE66D",
  "#A78BFA",
  "#F97316",
  "#06B6D4",
  "#EC4899",
];

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const PADDING = {
  top: 40,    // chart title + top breathing room
  right: 20,
  bottom: 44, // x-axis labels
  left: 52,   // y-axis labels
};

const LEGEND_HEIGHT = 32; // per row when legendPosition === "bottom"
const LEGEND_RIGHT_WIDTH = 120;

// ---------------------------------------------------------------------------
// VisualizationEngine
// ---------------------------------------------------------------------------

export class VisualizationEngine {
  /**
   * Evaluate a ChartNode into flat geometry at normalized time t ∈ [0,1].
   *
   * @param node   The fully data-bound ChartNode (series[].data already populated)
   * @param width  Absolute pixel width of the chart node
   * @param height Absolute pixel height of the chart node
   * @param t      Normalized animation time 0=start, 1=complete
   */
  evaluate(
    node: ChartNode,
    width: number,
    height: number,
    t: number
  ): EvaluatedChartGeometry {
    const series = this.normalizeSeries(node);
    const categories = this.resolveCategories(node, series);
    const catCount = categories.length;
    const seriesCount = series.length;

    if (catCount === 0 || seriesCount === 0) {
      return this.emptyGeometry(width, height, t);
    }

    // ── Plot area ──────────────────────────────────────────────────────────
    const legendH =
      node.showLegend && node.legendPosition !== "right"
        ? LEGEND_HEIGHT
        : 0;
    const legendW =
      node.showLegend && node.legendPosition === "right"
        ? LEGEND_RIGHT_WIDTH
        : 0;

    const plot: PlotArea = {
      x: PADDING.left,
      y: PADDING.top,
      w: width - PADDING.left - PADDING.right - legendW,
      h: height - PADDING.top - PADDING.bottom - legendH,
    };

    // ── Domain ─────────────────────────────────────────────────────────────
    const axisConf: AxisConfig = node.axis ?? {};
    const { domainMin, domainMax } = this.computeDomain(series, axisConf, node.stacked ?? false);

    // ── Grid lines & Y-axis labels ─────────────────────────────────────────
    const tickCount = axisConf.tickCount ?? 5;
    const gridLines = this.computeGridLines(domainMin, domainMax, tickCount, plot, axisConf);
    const yAxisLabels = this.computeYAxisLabels(gridLines, plot, axisConf);

    // ── Bar geometry ───────────────────────────────────────────────────────
    const barStyle: ChartBarStyle = node.barStyle ?? {};
    const animConf: ChartAnimationConfig = node.chartAnimation ?? { mode: "none" };
    const bars = this.computeBars(
      series, categories, catCount, seriesCount,
      plot, domainMin, domainMax, barStyle, animConf, t
    );

    // ── X-axis labels ──────────────────────────────────────────────────────
    const xAxisLabels = this.computeXAxisLabels(categories, catCount, plot);

    // ── Legend ─────────────────────────────────────────────────────────────
    const legendEntries = node.showLegend
      ? this.computeLegend(series, node.legendPosition ?? "bottom", plot, width, height, legendH)
      : [];

    return { bars, gridLines, xAxisLabels, yAxisLabels, legendEntries, plotArea: plot, t };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

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

  private computeDomain(
    series: ChartSeries[],
    axis: AxisConfig,
    stacked: boolean
  ): { domainMin: number; domainMax: number } {
    let domainMin = axis.min ?? 0;
    let domainMax = axis.max;

    if (domainMax === undefined) {
      if (stacked) {
        // Max = max sum of all series for any category
        const catCount = Math.max(...series.map((s) => (s.data ?? []).length));
        let stackMax = 0;
        for (let i = 0; i < catCount; i++) {
          const total = series.reduce((sum, s) => sum + ((s.data ?? [])[i] ?? 0), 0);
          if (total > stackMax) stackMax = total;
        }
        domainMax = stackMax;
      } else {
        // Max = max value across all series
        domainMax = Math.max(
          1,
          ...series.flatMap((s) => s.data ?? [])
        );
      }
      // Round up to a nice number
      domainMax = this.niceMax(domainMax);
    }

    return { domainMin, domainMax };
  }

  /** Round up to a visually clean ceiling value */
  private niceMax(v: number): number {
    if (v <= 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
    const niceFractions = [1, 2, 2.5, 5, 10];
    for (const f of niceFractions) {
      const candidate = f * magnitude;
      if (candidate >= v) return candidate;
    }
    return v;
  }

  private valueToY(value: number, domainMin: number, domainMax: number, plot: PlotArea): number {
    const pct = (value - domainMin) / Math.max(1, domainMax - domainMin);
    return plot.y + plot.h - pct * plot.h;
  }

  private computeGridLines(
    domainMin: number,
    domainMax: number,
    tickCount: number,
    plot: PlotArea,
    axis: AxisConfig
  ): GridLineGeometry[] {
    const lines: GridLineGeometry[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const value = domainMin + ((domainMax - domainMin) * i) / tickCount;
      const y = this.valueToY(value, domainMin, domainMax, plot);
      lines.push({ y, value, label: formatValue(value, axis.labelFormat) });
    }
    return lines;
  }

  private computeYAxisLabels(
    gridLines: GridLineGeometry[],
    plot: PlotArea,
    _axis: AxisConfig
  ): AxisLabel[] {
    return gridLines.map((gl) => ({
      x: plot.x - 8,
      y: gl.y,
      text: gl.label,
      anchor: "end" as const,
    }));
  }

  private computeBars(
    series: ChartSeries[],
    categories: string[],
    catCount: number,
    seriesCount: number,
    plot: PlotArea,
    domainMin: number,
    domainMax: number,
    barStyle: ChartBarStyle,
    animConf: ChartAnimationConfig,
    t: number
  ): BarGeometry[] {
    const bars: BarGeometry[] = [];
    const groupGap = barStyle.groupGap ?? 6;
    const catPad = Math.max(8, plot.w * 0.04);
    const catW = (plot.w - catPad * 2) / catCount;
    const groupW = catW - 8;
    const barW = Math.max(4, (groupW - (seriesCount - 1) * groupGap) / seriesCount);
    const totalBars = catCount * seriesCount;
    const staggerStep = animConf.stagger ?? 0.08;

    series.forEach((s, si) => {
      const data = s.data ?? [];
      categories.forEach((_, ci) => {
        const rawValue = data[ci] ?? 0;
        const barIndex = ci * seriesCount + si;

        // Compute per-bar t with stagger
        const staggerOffset = barIndex * staggerStep;
        const staggerWindow = 1 - staggerOffset;
        let localT = 0;
        if (t > staggerOffset && staggerWindow > 0) {
          localT = Math.min(1, (t - staggerOffset) / staggerWindow);
        }
        const easedT = animConf.mode === "none" ? 1 : applyEasing(localT, animConf.easing);

        const fullH = Math.max(
          0,
          ((rawValue - domainMin) / Math.max(1, domainMax - domainMin)) * plot.h
        );
        const animH = fullH * easedT;
        const animatedValue = rawValue * easedT;

        const bx = plot.x + catPad + ci * catW + si * (barW + groupGap);
        const by = plot.y + plot.h - animH;

        bars.push({
          seriesId: s.id,
          categoryIndex: ci,
          x: bx,
          y: by,
          w: barW,
          h: animH,
          fullH,
          color: s.color,
          rawValue,
          animatedValue,
          labelText: formatValue(animatedValue),
          active: t > staggerOffset,
        });
      });
    });

    return bars;
  }

  private computeXAxisLabels(
    categories: string[],
    catCount: number,
    plot: PlotArea
  ): AxisLabel[] {
    const catPad = Math.max(8, plot.w * 0.04);
    const catW = (plot.w - catPad * 2) / catCount;
    return categories.map((label, ci) => ({
      x: plot.x + catPad + ci * catW + catW / 2,
      y: plot.y + plot.h + 16,
      text: label,
      anchor: "middle" as const,
    }));
  }

  private computeLegend(
    series: ChartSeries[],
    position: "bottom" | "right" | "top",
    plot: PlotArea,
    chartWidth: number,
    chartHeight: number,
    legendH: number
  ): LegendEntry[] {
    const entries: LegendEntry[] = [];
    const swatchW = 14;
    const itemSpacing = 110;

    if (position === "bottom") {
      const startX = (chartWidth - series.length * itemSpacing) / 2;
      const y = chartHeight - legendH / 2;
      series.forEach((s, i) => {
        entries.push({ x: startX + i * itemSpacing, y, color: s.color, label: s.name });
      });
    } else if (position === "right") {
      const x = plot.x + plot.w + 16;
      series.forEach((s, i) => {
        entries.push({ x, y: plot.y + 20 + i * 28, color: s.color, label: s.name });
      });
    } else {
      // top
      const startX = plot.x;
      const y = 12;
      series.forEach((s, i) => {
        entries.push({ x: startX + i * itemSpacing, y, color: s.color, label: s.name });
      });
    }

    return entries;
  }

  private emptyGeometry(width: number, height: number, t: number): EvaluatedChartGeometry {
    return {
      bars: [],
      gridLines: [],
      xAxisLabels: [],
      yAxisLabels: [],
      legendEntries: [],
      plotArea: {
        x: PADDING.left,
        y: PADDING.top,
        w: Math.max(0, width - PADDING.left - PADDING.right),
        h: Math.max(0, height - PADDING.top - PADDING.bottom),
      },
      t,
    };
  }
}

export const visualizationEngine = new VisualizationEngine();
