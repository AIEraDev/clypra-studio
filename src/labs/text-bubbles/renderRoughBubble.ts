// NOTE: roughjs is an intentional dependency of the text-bubbles lab feature.
// It is NOT part of the canvas-capture (FEAT-001/FEAT-002) work — it landed in
// the same integration commit only because both features were developed together.
// The hand-drawn sketch aesthetic it provides is a first-class visual requirement
// of the text-bubbles preset authoring flow and cannot be replicated with native
// <canvas> path operations without losing that aesthetic.
import rough from "roughjs";
import {
  compileBubblePath,
  type BubbleAssetDefinition,
} from "@clypra-studio/engine";

/**
 * Studio-only visualizer for the persisted roughness/seed contract. The shape
 * remains the canonical normalized SVG path; Rough.js only generates its
 * hand-drawn presentation at preview/export-artifact time.
 *
 * Belongs to: text-bubbles lab (src/labs/text-bubbles/).
 * NOT part of canvas-capture (src/labs/animation/services/canvasCapture.ts).
 */
export function renderRoughBubble(
  ctx: CanvasRenderingContext2D,
  definition: BubbleAssetDefinition,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const roughCanvas = rough.canvas(ctx.canvas);
  const { fill, outline, accent } = definition.layers;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width, height);
  ctx.globalAlpha = fill.opacity;
  roughCanvas.path(compileBubblePath(definition), {
    fill: fill.color,
    fillStyle:
      accent?.texture === "hatch"
        ? "hachure"
        : accent?.texture === "chalk"
          ? "cross-hatch"
          : "solid",
    fillWeight: 0.008,
    hachureGap: 0.04,
    hachureAngle: -25,
    stroke: outline.color,
    strokeWidth: outline.width,
    roughness: Math.max(0.15, outline.roughness * 3.5),
    bowing: outline.roughness * 1.5,
    seed: outline.seed,
  });
  ctx.restore();
}

/** Serializes the same seeded Rough.js drawing used in the Studio preview. */
export function compileRoughBubbleSvg(
  definition: BubbleAssetDefinition,
  width = 1000,
  height = 700,
): string {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", "-0.25 -0.25 1.5 1.5");
  const { fill, outline, accent } = definition.layers;
  const drawing = rough.svg(svg).path(compileBubblePath(definition), {
    fill: fill.color,
    fillStyle:
      accent?.texture === "hatch"
        ? "hachure"
        : accent?.texture === "chalk"
          ? "cross-hatch"
          : "solid",
    fillWeight: 0.008,
    hachureGap: 0.04,
    hachureAngle: -25,
    stroke: outline.color,
    strokeWidth: outline.width,
    roughness: Math.max(0.15, outline.roughness * 3.5),
    bowing: outline.roughness * 1.5,
    seed: outline.seed,
  });
  drawing.setAttribute("opacity", String(fill.opacity));
  svg.appendChild(drawing);
  return svg.outerHTML;
}
