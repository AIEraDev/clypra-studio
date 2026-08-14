/**
 * Series Engine
 *
 * Core mathematical engine for series-based visual analytics:
 * - Domain / Range mapping and scale normalization
 * - Radial / Arc sweep calculations (Gauges)
 * - Multi-series chart geometry (Bar, Line, Area, Donut)
 * - Threshold band state evaluation
 * - Milestone status evaluation (Timeline)
 */

export interface ThresholdBand {
  value: number; // Upper threshold limit or trigger value
  state?: "normal" | "warning" | "critical";
  color?: string;
  label?: string;
}

export interface EvaluatedThreshold {
  value: number;
  state: "normal" | "warning" | "critical";
  color: string;
  label?: string;
}

export interface ArcGeometryOutput {
  cx: number;
  cy: number;
  radius: number;
  innerRadius: number;
  startAngle: number; // Radians
  fullSweep: number; // Radians
  animSweep: number; // Radians at progress t
  normalizedProgress: number; // [0.0, 1.0]
}

export interface SeriesPoint {
  x: number;
  y: number;
  rawValue: number;
  category: string;
  seriesId: string;
  color: string;
}

export interface BarGeometryItem {
  seriesId: string;
  categoryIndex: number;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rawValue: number;
  color: string;
}

export interface ChartScale {
  domainMin: number;
  domainMax: number;
  categories: string[];
  seriesIds: string[];
}

export interface MilestoneItem {
  id: string;
  title: string;
  time?: number;
  timestamp?: string;
  description?: string;
}

export interface EvaluatedMilestone {
  id: string;
  title: string;
  x: number;
  y: number;
  status: "completed" | "active" | "future";
  progress: number; // [0.0, 1.0]
}

export class SeriesEngine {
  /**
   * Evaluate threshold state and color from sorted threshold bands.
   */
  public static evaluateThreshold(
    value: number,
    thresholds: ThresholdBand[] = [],
    defaultColor = "#3B82F6",
    defaultState: "normal" | "warning" | "critical" = "normal"
  ): EvaluatedThreshold {
    if (!thresholds || thresholds.length === 0) {
      return { value, state: defaultState, color: defaultColor };
    }

    const sorted = [...thresholds].sort((a, b) => a.value - b.value);
    let resolvedState: "normal" | "warning" | "critical" = defaultState;
    let resolvedColor = defaultColor;
    let resolvedLabel: string | undefined;

    for (const th of sorted) {
      if (value >= th.value) {
        if (th.state) resolvedState = th.state;
        if (th.color) resolvedColor = th.color;
        if (th.label) resolvedLabel = th.label;
      }
    }

    // Default semantic colors if not specified
    if (!resolvedColor) {
      if (resolvedState === "critical") resolvedColor = "#EF4444";
      else if (resolvedState === "warning") resolvedColor = "#F59E0B";
      else resolvedColor = "#10B981";
    }

    return {
      value,
      state: resolvedState,
      color: resolvedColor,
      label: resolvedLabel,
    };
  }

  /**
   * Calculate radial and arc sweep geometry for Gauges and Circular Indicators.
   */
  public static computeArcGeometry(
    value: number,
    min = 0,
    max = 100,
    width = 300,
    height = 200,
    style: "semicircle" | "arc" | "full" = "semicircle",
    sweepAngleDeg = 240,
    animationProgress = 1.0
  ): ArcGeometryOutput {
    const rawVal = typeof value === "number" ? value : min;
    const ratio = Math.min(1.0, Math.max(0.0, (rawVal - min) / Math.max(0.0001, max - min)));

    let startAngle: number;
    let fullSweep: number;

    if (style === "semicircle") {
      startAngle = Math.PI; // 9 o'clock
      fullSweep = Math.PI; // 180 degrees to 3 o'clock
    } else if (style === "full") {
      startAngle = -Math.PI / 2; // 12 o'clock
      fullSweep = Math.PI * 2; // 360 degrees
    } else {
      // Custom arc (e.g. 240 deg)
      fullSweep = (sweepAngleDeg * Math.PI) / 180;
      startAngle = Math.PI / 2 + (Math.PI * 2 - fullSweep) / 2;
    }

    const clampedT = Math.min(1.0, Math.max(0.0, animationProgress));
    const animSweep = fullSweep * ratio * clampedT;

    const cx = width / 2;
    const cy = style === "semicircle" ? height * 0.8 : height / 2;
    const radius = Math.min(width, height) * 0.42;
    const innerRadius = radius * 0.72;

    return {
      cx: Math.round(cx),
      cy: Math.round(cy),
      radius: Math.round(radius),
      innerRadius: Math.round(innerRadius),
      startAngle,
      fullSweep,
      animSweep,
      normalizedProgress: ratio,
    };
  }

  /**
   * Extract domain scale and categorical metadata across arbitrary dataset arrays.
   */
  public static computeScale(
    data: any[],
    xField = "category",
    seriesKeys: string[] = []
  ): ChartScale {
    const categories: string[] = [];
    const seriesSet = new Set<string>(seriesKeys);

    let domainMin = Infinity;
    let domainMax = -Infinity;

    if (!Array.isArray(data) || data.length === 0) {
      return { domainMin: 0, domainMax: 100, categories: [], seriesIds: seriesKeys };
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cat = String(row[xField] ?? `Item ${i + 1}`);
      categories.push(cat);

      // Auto-detect numeric fields if seriesKeys is empty
      if (seriesKeys.length === 0) {
        for (const key of Object.keys(row)) {
          if (key !== xField && typeof row[key] === "number") {
            seriesSet.add(key);
          }
        }
      }

      for (const sKey of seriesSet) {
        const val = Number(row[sKey]);
        if (!isNaN(val)) {
          domainMin = Math.min(domainMin, val);
          domainMax = Math.max(domainMax, val);
        }
      }
    }

    if (domainMin === Infinity) domainMin = 0;
    if (domainMax === -Infinity) domainMax = 100;
    if (domainMin > 0) domainMin = 0; // Baseline at 0 for standard bar/line graphs
    if (domainMin === domainMax) domainMax = domainMin + 10;

    return {
      domainMin,
      domainMax,
      categories,
      seriesIds: Array.from(seriesSet),
    };
  }

  /**
   * Generate bar geometries (grouped or single series) mapped to plot bounds.
   */
  public static computeBars(
    data: any[],
    scale: ChartScale,
    plotWidth: number,
    plotHeight: number,
    xField = "category",
    seriesConfig: Array<{ id: string; color?: string }> = [],
    animationProgress = 1.0
  ): BarGeometryItem[] {
    const categories = scale.categories;
    const seriesIds = scale.seriesIds;
    if (categories.length === 0 || seriesIds.length === 0) return [];

    const numCategories = categories.length;
    const numSeries = seriesIds.length;
    const catWidth = plotWidth / numCategories;
    const groupPadding = catWidth * 0.2;
    const availableGroupW = catWidth - groupPadding;
    const barWidth = Math.max(2, availableGroupW / numSeries);
    const domainSpan = scale.domainMax - scale.domainMin;

    const defaultPalette = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
    const bars: BarGeometryItem[] = [];

    data.forEach((row, catIdx) => {
      const cat = categories[catIdx];
      const groupStartX = catIdx * catWidth + groupPadding / 2;

      seriesIds.forEach((sId, sIdx) => {
        const rawVal = Number(row[sId] ?? 0);
        const ratio = Math.max(0, (rawVal - scale.domainMin) / domainSpan);
        const fullHeight = ratio * plotHeight;
        const animatedHeight = fullHeight * Math.min(1.0, Math.max(0.0, animationProgress));

        const barX = groupStartX + sIdx * barWidth;
        const barY = plotHeight - animatedHeight;

        const config = seriesConfig.find((c) => c.id === sId);
        const color = config?.color || defaultPalette[sIdx % defaultPalette.length];

        bars.push({
          seriesId: sId,
          categoryIndex: catIdx,
          category: cat,
          x: Math.round(barX),
          y: Math.round(barY),
          width: Math.round(barWidth),
          height: Math.round(animatedHeight),
          rawValue: rawVal,
          color,
        });
      });
    });

    return bars;
  }

  /**
   * Generate polyline points and area paths for line charts.
   */
  public static computeLinePoints(
    data: any[],
    scale: ChartScale,
    plotWidth: number,
    plotHeight: number,
    xField = "category",
    seriesConfig: Array<{ id: string; color?: string }> = [],
    animationProgress = 1.0
  ): Map<string, SeriesPoint[]> {
    const result = new Map<string, SeriesPoint[]>();
    const categories = scale.categories;
    const seriesIds = scale.seriesIds;
    if (categories.length === 0 || seriesIds.length === 0) return result;

    const numCategories = categories.length;
    const catStep = numCategories > 1 ? plotWidth / (numCategories - 1) : plotWidth / 2;
    const domainSpan = scale.domainMax - scale.domainMin;
    const defaultPalette = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

    seriesIds.forEach((sId, sIdx) => {
      const points: SeriesPoint[] = [];
      const config = seriesConfig.find((c) => c.id === sId);
      const color = config?.color || defaultPalette[sIdx % defaultPalette.length];

      data.forEach((row, catIdx) => {
        const rawVal = Number(row[sId] ?? 0);
        const ratio = Math.max(0, (rawVal - scale.domainMin) / domainSpan);
        const fullY = plotHeight - ratio * plotHeight;
        const baselineY = plotHeight;
        const animY = baselineY - (baselineY - fullY) * Math.min(1.0, Math.max(0.0, animationProgress));
        const px = numCategories > 1 ? catIdx * catStep : plotWidth / 2;

        points.push({
          x: Math.round(px),
          y: Math.round(animY),
          rawValue: rawVal,
          category: categories[catIdx],
          seriesId: sId,
          color,
        });
      });

      result.set(sId, points);
    });

    return result;
  }

  /**
   * Evaluate milestone sequences for timeline progress indicators.
   */
  public static evaluateMilestones(
    milestones: MilestoneItem[],
    activeMilestoneIndex = 0,
    width = 800,
    height = 60,
    orientation: "horizontal" | "vertical" = "horizontal"
  ): EvaluatedMilestone[] {
    if (!Array.isArray(milestones) || milestones.length === 0) return [];

    const count = milestones.length;
    const isHoriz = orientation === "horizontal";
    const pad = 40;
    const totalSpan = isHoriz ? width - pad * 2 : height - pad * 2;
    const step = count > 1 ? totalSpan / (count - 1) : 0;

    return milestones.map((m, idx) => {
      let status: "completed" | "active" | "future" = "future";
      if (idx < activeMilestoneIndex) status = "completed";
      else if (idx === activeMilestoneIndex) status = "active";

      const coord = pad + idx * step;
      const x = isHoriz ? coord : width / 2;
      const y = isHoriz ? height / 2 : coord;
      const progress = count > 1 ? idx / (count - 1) : 1.0;

      return {
        id: m.id || `milestone-${idx}`,
        title: m.title,
        x: Math.round(x),
        y: Math.round(y),
        status,
        progress,
      };
    });
  }
}
