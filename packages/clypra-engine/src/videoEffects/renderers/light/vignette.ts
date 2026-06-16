/**
 * Vignette Effect
 */

import type { EffectParameters } from "../../types";

export function renderVignette(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const radius = params.radius || 0.7;

  const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * radius, width / 2, height / 2, Math.max(width, height));

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.7})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
