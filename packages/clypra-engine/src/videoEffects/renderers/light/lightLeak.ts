/**
 * Light Leak Effect
 */

import type { EffectParameters } from "../../types";

export function renderLightLeak(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `rgba(255, 200, 100, ${intensity * 0.3})`);
  gradient.addColorStop(1, "rgba(255, 200, 100, 0)");

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
}
