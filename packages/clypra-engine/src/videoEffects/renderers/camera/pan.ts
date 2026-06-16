/**
 * Pan Effect
 */

import type { EffectParameters } from "../../types";

export function renderPan(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const panX = (params.panX || 0) * intensity;
  const panY = (params.panY || 0) * intensity;
  ctx.translate(panX, panY);
}
