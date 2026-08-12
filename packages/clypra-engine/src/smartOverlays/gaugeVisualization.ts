/**
 * Phase 4R.5 / 4R.7 — Gauge Visualization Definition & Renderer
 *
 * Evaluates GaugeNode geometry (semicircle/arc/full) and registers renderer in VisualizationRendererRegistry.
 */

import { Container, Graphics as PixiGraphics } from "pixi.js";
import type { GaugeNode } from "./overlayDocumentSchema.js";
import { visualizationRegistry, type VisualizationDefinition } from "./visualizationRegistry.js";
import { visualizationRendererRegistry, type VisualizationRenderContext } from "./visualizationProjection.js";

export interface EvaluatedGaugeGeometry {
  cx: number;
  cy: number;
  radius: number;
  innerRadius: number;
  startAngle: number;
  fullSweep: number;
  animSweep: number;
  fillColor: string;
  trackColor: string;
  formattedValue: string;
  label?: string;
  showValue: boolean;
  showLabel: boolean;
}

export class GaugeVisualizationDefinition implements VisualizationDefinition<GaugeNode, EvaluatedGaugeGeometry> {
  public type = "gauge";
  public name = "Gauge Display";
  public category = "gauge" as const;
  public schema = [];
  public supports = { dataBinding: true, animation: true, responsive: true };

  public evaluate(node: GaugeNode, context: { width: number; height: number; t: number }): EvaluatedGaugeGeometry {
    const min = node.min ?? 0;
    const max = node.max ?? 100;
    const rawVal = typeof node.value === "number" ? node.value : min;
    const ratio = Math.min(1, Math.max(0, (rawVal - min) / Math.max(1, max - min)));

    const style = node.gaugeStyle ?? "semicircle";
    let startAngle: number;
    let fullSweep: number;

    if (style === "semicircle") {
      startAngle = Math.PI; // 9 o'clock
      fullSweep = Math.PI;  // 180 deg to 3 o'clock
    } else if (style === "full") {
      startAngle = -Math.PI / 2;
      fullSweep = Math.PI * 2;
    } else {
      const sweepDeg = node.sweepAngle ?? 240;
      fullSweep = (sweepDeg * Math.PI) / 180;
      startAngle = Math.PI / 2 + (Math.PI * 2 - fullSweep) / 2;
    }

    const animSweep = fullSweep * ratio * context.t;
    const cx = context.width / 2;
    const cy = style === "semicircle" ? context.height * 0.7 : context.height / 2;
    const radius = Math.min(context.width, context.height) * 0.4;
    const innerRadius = radius * 0.7;

    // Resolve color from thresholds if present
    let fillColor = node.fillColor || "#3B82F6";
    if (node.thresholds && node.thresholds.length > 0) {
      const sorted = [...node.thresholds].sort((a, b) => a.value - b.value);
      for (const th of sorted) {
        if (rawVal >= th.value) fillColor = th.color;
      }
    }

    return {
      cx,
      cy,
      radius,
      innerRadius,
      startAngle,
      fullSweep,
      animSweep,
      fillColor,
      trackColor: node.trackColor || "#1F2937",
      formattedValue: `${Math.round(rawVal * context.t)}`,
      label: node.label,
      showValue: node.showValue !== false,
      showLabel: node.showLabel !== false,
    };
  }
}

export const gaugeVisualization = new GaugeVisualizationDefinition();
visualizationRegistry.register(gaugeVisualization);

// ── Gauge Pixi Renderer ──────────────────────────────────────────────────────

visualizationRendererRegistry.register<EvaluatedGaugeGeometry>("gauge", {
  render(geo: EvaluatedGaugeGeometry, ctx: VisualizationRenderContext) {
    const { container, hexToNumber, renderLabel } = ctx;

    let gfx = container.getChildByName("GaugeGfx") as PixiGraphics;
    if (!gfx) {
      gfx = new PixiGraphics();
      gfx.name = "GaugeGfx";
      container.addChild(gfx);
    }
    gfx.clear();

    // Background track arc
    gfx.arc(geo.cx, geo.cy, geo.radius, geo.startAngle, geo.startAngle + geo.fullSweep);
    gfx.arc(geo.cx, geo.cy, geo.innerRadius, geo.startAngle + geo.fullSweep, geo.startAngle, true);
    gfx.fill({ color: hexToNumber(geo.trackColor) });

    // Animated fill arc
    if (geo.animSweep > 0) {
      gfx.arc(geo.cx, geo.cy, geo.radius, geo.startAngle, geo.startAngle + geo.animSweep);
      gfx.arc(geo.cx, geo.cy, geo.innerRadius, geo.startAngle + geo.animSweep, geo.startAngle, true);
      gfx.fill({ color: hexToNumber(geo.fillColor) });
    }

    // Value text
    if (geo.showValue) {
      renderLabel(container, "gaugeValue", geo.formattedValue, geo.cx - 20, geo.cy - 15, 32, "#FFFFFF", true);
    }
    if (geo.showLabel && geo.label) {
      renderLabel(container, "gaugeLabel", geo.label, geo.cx - 30, geo.cy + 25, 14, "#9CA3AF", false);
    }
  },
});
