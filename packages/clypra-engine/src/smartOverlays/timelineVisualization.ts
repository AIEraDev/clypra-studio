/**
 * Phase 4R.6 / 4R.7 — Timeline Visualization Definition & Renderer
 *
 * Evaluates TimelineNode geometry (events along a temporal axis) and registers renderer in VisualizationRendererRegistry.
 */

import { Container, Graphics as PixiGraphics } from "pixi.js";
import type { TimelineNode, TimelineEvent } from "./overlayDocumentSchema.js";
import { visualizationRegistry, type VisualizationDefinition } from "./visualizationRegistry.js";
import { visualizationRendererRegistry, type VisualizationRenderContext } from "./visualizationProjection.js";

export interface EvaluatedTimelineEvent {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  description?: string;
  active: boolean;
}

export interface EvaluatedTimelineGeometry {
  axisX1: number;
  axisY1: number;
  axisX2: number;
  axisY2: number;
  trackColor: string;
  events: EvaluatedTimelineEvent[];
}

export class TimelineVisualizationDefinition implements VisualizationDefinition<TimelineNode, EvaluatedTimelineGeometry> {
  public type = "timeline";
  public name = "Timeline Axis";
  public category = "timeline" as const;
  public schema = [];
  public supports = { dataBinding: true, animation: true, responsive: true };

  public evaluate(node: TimelineNode, context: { width: number; height: number; t: number }): EvaluatedTimelineGeometry {
    const events = node.events ?? [];
    const orientation = node.orientation ?? "horizontal";
    const isHoriz = orientation === "horizontal";

    const pad = 40;
    const axisX1 = isHoriz ? pad : context.width / 2;
    const axisY1 = isHoriz ? context.height / 2 : pad;
    const axisX2 = isHoriz ? context.width - pad : context.width / 2;
    const axisY2 = isHoriz ? context.height / 2 : context.height - pad;

    const totalLen = isHoriz ? axisX2 - axisX1 : axisY2 - axisY1;
    const maxTime = Math.max(1, ...events.map((e) => e.time));
    const staggerStep = 1 / Math.max(1, events.length);

    const evalEvents: EvaluatedTimelineEvent[] = events.map((e, i) => {
      const pct = e.time / maxTime;
      const ex = isHoriz ? axisX1 + pct * totalLen : axisX1;
      const ey = isHoriz ? axisY1 : axisY1 + pct * totalLen;

      // Sequential entrance based on t
      const eventT = Math.min(1, Math.max(0, (context.t - i * staggerStep * 0.5) / 0.5));
      const active = eventT > 0;

      return {
        id: e.id,
        label: e.label,
        x: ex,
        y: ey,
        color: e.color || "#45FF72",
        description: e.description,
        active,
      };
    });

    return {
      axisX1,
      axisY1,
      axisX2,
      axisY2,
      trackColor: node.trackColor || "#374151",
      events: evalEvents,
    };
  }
}

export const timelineVisualization = new TimelineVisualizationDefinition();
visualizationRegistry.register(timelineVisualization);

// ── Timeline Pixi Renderer ───────────────────────────────────────────────────

visualizationRendererRegistry.register<EvaluatedTimelineGeometry>("timeline", {
  render(geo: EvaluatedTimelineGeometry, ctx: VisualizationRenderContext) {
    const { container, hexToNumber, renderLabel } = ctx;

    let gfx = container.getChildByName("TimelineGfx") as PixiGraphics;
    if (!gfx) {
      gfx = new PixiGraphics();
      gfx.name = "TimelineGfx";
      container.addChild(gfx);
    }
    gfx.clear();

    // Axis line
    gfx.moveTo(geo.axisX1, geo.axisY1);
    gfx.lineTo(geo.axisX2, geo.axisY2);
    gfx.stroke({ color: hexToNumber(geo.trackColor), width: 4 });

    // Event nodes
    geo.events.forEach((ev, i) => {
      if (!ev.active) return;

      gfx.circle(ev.x, ev.y, 8);
      gfx.fill({ color: hexToNumber(ev.color) });
      gfx.stroke({ color: hexToNumber("#FFFFFF"), width: 2 });

      renderLabel(container, `evLbl_${i}`, ev.label, ev.x - 20, ev.y - 25, 12, "#FFFFFF", true);
      if (ev.description) {
        renderLabel(container, `evDesc_${i}`, ev.description, ev.x - 20, ev.y + 12, 10, "#9CA3AF", false);
      }
    });
  },
});
