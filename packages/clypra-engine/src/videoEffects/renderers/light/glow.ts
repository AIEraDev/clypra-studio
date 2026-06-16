/**
 * Glow Effect
 */

import type { EffectParameters } from "../../types";

export function renderGlow(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const glowAmount = (params.glowAmount || 10) * intensity;
  ctx.shadowBlur = glowAmount;
  ctx.shadowColor = params.glowColor || "#ffffff";
}
