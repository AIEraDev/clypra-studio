/**
 * Rotate Effect
 */

import type { EffectParameters } from "../../types";

export function renderRotate(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const angle = (params.angle || 0) * intensity * (Math.PI / 180);
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.translate(width / 2, height / 2);
  ctx.rotate(angle);
  ctx.translate(-width / 2, -height / 2);
}
