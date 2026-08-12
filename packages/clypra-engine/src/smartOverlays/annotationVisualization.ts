/**
 * Phase 4R.4 / 4R.7 — Annotation & Connector Definitions & Renderers
 *
 * Resolves floating annotations and connectors against geometry anchors.
 */

import { Container, Graphics as PixiGraphics } from "pixi.js";
import type { AnnotationNode, ConnectorNode } from "./overlayDocumentSchema.js";
import { visualizationRegistry, type VisualizationDefinition } from "./visualizationRegistry.js";
import { visualizationRendererRegistry, type VisualizationRenderContext } from "./visualizationProjection.js";

export interface EvaluatedAnnotationGeometry {
  text: string;
  x: number; // Final absolute pixel position of annotation box
  y: number;
  anchorX?: number; // Point being pointed at (e.g. bar top)
  anchorY?: number;
  showLeader: boolean;
  leaderColor: string;
  pointerStyle: "dot" | "arrow" | "none";
}

export class AnnotationVisualizationDefinition implements VisualizationDefinition<AnnotationNode, EvaluatedAnnotationGeometry> {
  public type = "annotation";
  public name = "Geometry Annotation";
  public category = "annotation" as const;
  public schema = [];
  public supports = { dataBinding: true, animation: true, responsive: true };

  public evaluate(node: AnnotationNode, context: { width: number; height: number; t: number }): EvaluatedAnnotationGeometry {
    const offsetX = node.offsetX ?? 0;
    const offsetY = node.offsetY ?? -30;

    return {
      text: node.text ?? "",
      x: node.x + offsetX,
      y: node.y + offsetY,
      anchorX: node.x,
      anchorY: node.y,
      showLeader: node.showLeader !== false,
      leaderColor: node.leaderColor || "#A78BFA",
      pointerStyle: node.pointerStyle || "dot",
    };
  }
}

export const annotationVisualization = new AnnotationVisualizationDefinition();
visualizationRegistry.register(annotationVisualization);

visualizationRendererRegistry.register<EvaluatedAnnotationGeometry>("annotation", {
  render(geo: EvaluatedAnnotationGeometry, ctx: VisualizationRenderContext) {
    const { container, hexToNumber, renderLabel } = ctx;

    let gfx = container.getChildByLabel("AnnotationGfx") as PixiGraphics;
    if (!gfx) {
      gfx = new PixiGraphics();
      gfx.label = "AnnotationGfx";
      container.addChild(gfx);
    }
    gfx.clear();

    if (geo.showLeader && geo.anchorX !== undefined && geo.anchorY !== undefined) {
      gfx.moveTo(geo.x, geo.y);
      gfx.lineTo(geo.anchorX, geo.anchorY);
      gfx.stroke({ color: hexToNumber(geo.leaderColor), width: 1.5 });

      if (geo.pointerStyle === "dot") {
        gfx.circle(geo.anchorX, geo.anchorY, 3);
        gfx.fill({ color: hexToNumber(geo.leaderColor) });
      }
    }

    renderLabel(container, "annText", geo.text, geo.x, geo.y - 12, 12, "#FFFFFF", true);
  },
});

// ── Connector ────────────────────────────────────────────────────────────────

export interface EvaluatedConnectorGeometry {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  strokeColor: string;
  strokeWidth: number;
  lineStyle: "straight" | "curved" | "elbow";
  arrowHead: "none" | "start" | "end" | "both";
}

export class ConnectorVisualizationDefinition implements VisualizationDefinition<ConnectorNode, EvaluatedConnectorGeometry> {
  public type = "connector";
  public name = "Connector Arrow";
  public category = "annotation" as const;
  public schema = [];
  public supports = { dataBinding: true, animation: true, responsive: true };

  public evaluate(node: ConnectorNode, context: { width: number; height: number; t: number }): EvaluatedConnectorGeometry {
    return {
      fromX: node.x,
      fromY: node.y,
      toX: node.x + node.width,
      toY: node.y + node.height,
      strokeColor: node.strokeColor || "#3B82F6",
      strokeWidth: node.strokeWidth || 2,
      lineStyle: node.lineStyle || "straight",
      arrowHead: node.arrowHead || "end",
    };
  }
}

export const connectorVisualization = new ConnectorVisualizationDefinition();
visualizationRegistry.register(connectorVisualization);

visualizationRendererRegistry.register<EvaluatedConnectorGeometry>("connector", {
  render(geo: EvaluatedConnectorGeometry, ctx: VisualizationRenderContext) {
    const { container, hexToNumber } = ctx;

    let gfx = container.getChildByLabel("ConnectorGfx") as PixiGraphics;
    if (!gfx) {
      gfx = new PixiGraphics();
      gfx.label = "ConnectorGfx";
      container.addChild(gfx);
    }
    gfx.clear();

    gfx.moveTo(geo.fromX, geo.fromY);
    if (geo.lineStyle === "elbow") {
      const midX = (geo.fromX + geo.toX) / 2;
      gfx.lineTo(midX, geo.fromY);
      gfx.lineTo(midX, geo.toY);
      gfx.lineTo(geo.toX, geo.toY);
    } else {
      gfx.lineTo(geo.toX, geo.toY);
    }
    gfx.stroke({ color: hexToNumber(geo.strokeColor), width: geo.strokeWidth });

    if (geo.arrowHead === "end" || geo.arrowHead === "both") {
      gfx.circle(geo.toX, geo.toY, 4);
      gfx.fill({ color: hexToNumber(geo.strokeColor) });
    }
  },
});
