/**
 * Zoom Effect
 */

import type { EffectParameters } from "../../types";

export function renderZoom(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const scale = 1 + (params.scale || 0.2) * intensity;
  const centerX = params.centerX || 0.5;
  const centerY = params.centerY || 0.5;

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.translate(width * centerX, height * centerY);
  ctx.scale(scale, scale);
  ctx.translate(-width * centerX, -height * centerY);
}
