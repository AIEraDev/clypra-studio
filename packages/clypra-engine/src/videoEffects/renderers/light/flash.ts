/**
 * Flash Effect
 */

import type { EffectParameters } from "../../types";

export function renderFlash(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const flashColor = params.flashColor || "#ffffff";
  const flashIntensity = (params.flashIntensity || 1) * intensity;

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = flashColor;
  ctx.globalAlpha = flashIntensity;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
