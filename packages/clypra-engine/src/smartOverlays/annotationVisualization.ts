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
  width: number;
  height: number;
  anchorX?: number; // Point being pointed at
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
    const offsetY = node.offsetY ?? 0;

    return {
      text: node.text ?? "+42% Growth",
      x: node.x + offsetX,
      y: node.y + offsetY,
      width: node.width || 140,
      height: node.height || 70,
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

    const w = Math.max(100, geo.width);
    const h = Math.max(40, geo.height);
    const color = hexToNumber(geo.leaderColor);

    const anchorX = geo.anchorX ?? geo.x;
    const anchorY = geo.anchorY ?? geo.y;
    const localCardX = geo.x - anchorX;
    const localCardY = geo.y - anchorY;

    // 1. Sleek Glassmorphic Pill Card Background at localCard (0, 0, w, 30)
    const cardH = 30;
    gfx.roundRect(localCardX, localCardY, w, cardH, 15);
    gfx.fill({ color: 0x141424, alpha: 0.92 });
    gfx.stroke({ color, width: 1.5, alpha: 0.9 });

    // 2. Render Text Label centered in Pill Card
    renderLabel(container, "annText", geo.text, localCardX + w / 2, localCardY + cardH / 2, 11, "#FFFFFF", true);

    // 3. Accent Leader Line & Target Pointer Dot
    if (geo.showLeader) {
      const midX = localCardX + w / 2;
      const targetY = localCardY + h - 6;

      gfx.moveTo(midX, localCardY + cardH);
      gfx.lineTo(midX, targetY);
      gfx.stroke({ color, width: 1.5, alpha: 0.9 });

      if (geo.pointerStyle === "dot") {
        // Outer glowing pulse ring
        gfx.circle(midX, targetY, 6);
        gfx.fill({ color, alpha: 0.35 });

        // Inner dark border ring
        gfx.circle(midX, targetY, 4);
        gfx.fill({ color: 0x09090d });

        // Solid crisp center dot
        gfx.circle(midX, targetY, 2.5);
        gfx.fill({ color: 0xffffff });
      } else if (geo.pointerStyle === "arrow") {
        const headLen = 8;
        gfx.moveTo(midX, targetY);
        gfx.lineTo(midX - 4, targetY - headLen);
        gfx.lineTo(midX + 4, targetY - headLen);
        gfx.closePath();
        gfx.fill({ color });
      }
    }
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
  lineStyle: "straight" | "curved" | "elbow" | "orthogonal" | "bezier";
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
      toX: node.x + (node.width || 150),
      toY: node.y + (node.height || 80),
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

    const localFromX = 0;
    const localFromY = 0;
    const localToX = geo.toX - geo.fromX;
    const localToY = geo.toY - geo.fromY;
    const color = hexToNumber(geo.strokeColor);

    gfx.moveTo(localFromX, localFromY);
    if (geo.lineStyle === "elbow") {
      const midX = (localFromX + localToX) / 2;
      gfx.lineTo(midX, localFromY);
      gfx.lineTo(midX, localToY);
      gfx.lineTo(localToX, localToY);
    } else {
      gfx.lineTo(localToX, localToY);
    }
    gfx.stroke({ color, width: geo.strokeWidth });

    // Start Dot
    if (geo.arrowHead === "start" || geo.arrowHead === "both") {
      gfx.circle(localFromX, localFromY, 3.5);
      gfx.fill({ color });
    }

    // End Arrowhead (Precision Filled Arrow Triangle)
    if (geo.arrowHead === "end" || geo.arrowHead === "both") {
      const angle = Math.atan2(localToY - localFromY, localToX - localFromX);
      const headLen = 10;
      const x1 = localToX - headLen * Math.cos(angle - Math.PI / 6);
      const y1 = localToY - headLen * Math.sin(angle - Math.PI / 6);
      const x2 = localToX - headLen * Math.cos(angle + Math.PI / 6);
      const y2 = localToY - headLen * Math.sin(angle + Math.PI / 6);

      gfx.moveTo(localToX, localToY);
      gfx.lineTo(x1, y1);
      gfx.lineTo(x2, y2);
      gfx.closePath();
      gfx.fill({ color });
    }
  },
});
