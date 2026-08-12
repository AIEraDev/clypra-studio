/**
 * Phase 4R.2 — Modular Visualization Renderer & Projection Registry
 *
 * Decouples PixiJS rendering execution from engine geometry evaluation.
 * Consumes EvaluatedChartGeometry / EvaluatedGaugeGeometry / etc. and projects onto PixiJS Containers.
 */

import { Container, Graphics as PixiGraphics, Text as PixiText, TextStyle, type ColorSource } from "pixi.js";
import type { EvaluatedChartGeometry } from "./visualizationEngine.js";

export interface VisualizationRenderContext {
  container: Container;
  hexToNumber: (hex: string | undefined, fallback?: number) => number;
  renderLabel: (
    parent: Container,
    name: string,
    text: string,
    x: number,
    y: number,
    size?: number,
    color?: string,
    bold?: boolean,
    fontFamily?: string
  ) => void;
}

export interface VisualizationRenderer<TGeometry = any> {
  render(geometry: TGeometry, context: VisualizationRenderContext): void;
}

export class VisualizationRendererRegistry {
  private renderers = new Map<string, VisualizationRenderer>();

  public register<TGeometry = any>(type: string, renderer: VisualizationRenderer<TGeometry>): void {
    this.renderers.set(type, renderer);
  }

  public get<TGeometry = any>(type: string): VisualizationRenderer<TGeometry> | undefined {
    return this.renderers.get(type);
  }

  public has(type: string): boolean {
    return this.renderers.has(type);
  }
}

export const visualizationRendererRegistry = new VisualizationRendererRegistry();

// ── Register Chart Renderer ──────────────────────────────────────────────────

visualizationRendererRegistry.register<EvaluatedChartGeometry>("chart", {
  render(geo: EvaluatedChartGeometry, ctx: VisualizationRenderContext) {
    const { container, hexToNumber, renderLabel } = ctx;

    // 1. Highlight regions (under grid/bars)
    if (geo.highlights && geo.highlights.length > 0) {
      let hlGfx = container.getChildByName("ChartHighlights") as PixiGraphics;
      if (!hlGfx) {
        hlGfx = new PixiGraphics();
        hlGfx.name = "ChartHighlights";
        container.addChildAt(hlGfx, 0);
      }
      hlGfx.clear();
      for (const hl of geo.highlights) {
        hlGfx.rect(hl.x, hl.y, hl.w, hl.h);
        hlGfx.fill({ color: hexToNumber(hl.color), alpha: hl.opacity });
      }
    }

    // 2. Grid lines
    let gridGfx = container.getChildByName("ChartGrid") as PixiGraphics;
    if (!gridGfx) {
      gridGfx = new PixiGraphics();
      gridGfx.name = "ChartGrid";
      container.addChild(gridGfx);
    }
    gridGfx.clear();
    for (const gl of geo.gridLines) {
      gridGfx.moveTo(geo.plotArea.x, gl.y);
      gridGfx.lineTo(geo.plotArea.x + geo.plotArea.w, gl.y);
      gridGfx.stroke({ color: hexToNumber("#1F2937"), width: 1, alpha: 0.6 });
    }

    // 3. Axis labels
    geo.yAxisLabels.forEach((lbl, i) => {
      renderLabel(container, `yLbl_${i}`, lbl.text, lbl.x - 40, lbl.y - 7, 11, "#6B7280", false);
    });
    geo.xAxisLabels.forEach((lbl, i) => {
      renderLabel(container, `xLbl_${i}`, lbl.text, lbl.x - 30, lbl.y, 11, "#9CA3AF", false);
    });

    // 4. Bars
    if (geo.bars.length > 0) {
      const seriesIds = [...new Set(geo.bars.map((b) => b.seriesId))];
      for (const sid of seriesIds) {
        const gfxName = `ChartBars-${sid}`;
        let barGfx = container.getChildByName(gfxName) as PixiGraphics;
        if (!barGfx) {
          barGfx = new PixiGraphics();
          barGfx.name = gfxName;
          container.addChild(barGfx);
        }
        barGfx.clear();
        for (const bar of geo.bars.filter((b) => b.seriesId === sid && b.active && b.h > 0)) {
          barGfx.roundRect(bar.x, bar.y, bar.w, bar.h, 4);
          barGfx.fill({ color: hexToNumber(bar.color) });
        }
      }

      // Bar labels
      geo.bars.forEach((bar) => {
        if (!bar.active || bar.h < 4) return;
        renderLabel(
          container,
          `barLbl_${bar.seriesId}_${bar.categoryIndex}`,
          bar.labelText,
          bar.x + bar.w / 2 - 15,
          bar.y - 18,
          12,
          "#FFFFFF",
          true
        );
      });
    }

    // 5. Line / Area
    if (geo.linePoints.length > 0) {
      const seriesIds = [...new Set(geo.linePoints.map((p) => p.seriesId))];
      for (const sid of seriesIds) {
        const pts = geo.linePoints.filter((p) => p.seriesId === sid && p.active);
        if (pts.length < 2) continue;

        // Area fill
        let areaGfx = container.getChildByName(`ChartArea-${sid}`) as PixiGraphics;
        if (!areaGfx) {
          areaGfx = new PixiGraphics();
          areaGfx.name = `ChartArea-${sid}`;
          container.addChild(areaGfx);
        }
        areaGfx.clear();
        areaGfx.moveTo(pts[0].x, pts[0].baseY);
        pts.forEach((p) => areaGfx.lineTo(p.x, p.y));
        areaGfx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].baseY);
        areaGfx.closePath();
        areaGfx.fill({ color: hexToNumber(pts[0].color), alpha: 0.25 });

        // Line path
        let lineGfx = container.getChildByName(`ChartLine-${sid}`) as PixiGraphics;
        if (!lineGfx) {
          lineGfx = new PixiGraphics();
          lineGfx.name = `ChartLine-${sid}`;
          container.addChild(lineGfx);
        }
        lineGfx.clear();
        lineGfx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          lineGfx.lineTo(pts[i].x, pts[i].y);
        }
        lineGfx.stroke({ color: hexToNumber(pts[0].color), width: 3 });

        // Point dots
        pts.forEach((p) => {
          lineGfx.circle(p.x, p.y, 4);
          lineGfx.fill({ color: hexToNumber(p.color) });
        });
      }
    }

    // 6. Arcs (Pie / Donut)
    if (geo.arcs.length > 0) {
      let arcGfx = container.getChildByName("ChartArcs") as PixiGraphics;
      if (!arcGfx) {
        arcGfx = new PixiGraphics();
        arcGfx.name = "ChartArcs";
        container.addChild(arcGfx);
      }
      arcGfx.clear();
      const cx = geo.centerX;
      const cy = geo.centerY;

      for (const arc of geo.arcs) {
        if (arc.endAngle <= arc.startAngle) continue;
        arcGfx.moveTo(cx, cy);
        arcGfx.arc(cx, cy, arc.outerRadius, arc.startAngle, arc.endAngle);
        arcGfx.lineTo(cx, cy);
        arcGfx.fill({ color: hexToNumber(arc.color) });

        if (arc.innerRadius > 0) {
          arcGfx.moveTo(cx + arc.innerRadius, cy);
          arcGfx.arc(cx, cy, arc.innerRadius, 0, Math.PI * 2);
          arcGfx.fill({ color: hexToNumber("#111827") });
        }

        if (arc.rawValue > 0) {
          renderLabel(
            container,
            `arcLbl_${arc.seriesId}`,
            arc.labelText,
            arc.labelX - 12,
            arc.labelY - 7,
            11,
            "#FFFFFF",
            true
          );
        }
      }
    }

    // 7. Legend entries
    geo.legendEntries.forEach((leg, i) => {
      let dotGfx = container.getChildByName(`legDot_${i}`) as PixiGraphics;
      if (!dotGfx) {
        dotGfx = new PixiGraphics();
        dotGfx.name = `legDot_${i}`;
        container.addChild(dotGfx);
      }
      dotGfx.clear();
      dotGfx.circle(leg.x, leg.y + 6, 5);
      dotGfx.fill({ color: hexToNumber(leg.color) });

      renderLabel(container, `legLbl_${i}`, leg.label, leg.x + 10, leg.y, 12, "#D1D5DB", false);
    });
  }
});
