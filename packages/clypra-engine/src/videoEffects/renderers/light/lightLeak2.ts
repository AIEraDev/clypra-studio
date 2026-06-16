/**
 * Light Leak 2 Effect
 * Animated red/orange light that moves from bottom-left → bottom-right → top-right
 */

import type { EffectParameters } from "../../types";
import { hexToRgba } from "../../utils/colorUtils";

export function renderLightLeak2(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Animation duration (configurable via params, default 3 seconds)
  const duration = params.duration || 3;
  const progress = (time % duration) / duration; // 0 to 1

  // Define animation phases:
  // 0.0 - 0.4: bottom-left to bottom-right
  // 0.4 - 0.8: bottom-right to top-right
  // 0.8 - 1.0: fade out at top-right

  let x: number, y: number;
  let fadeMultiplier = 1;

  if (progress < 0.4) {
    // Phase 1: bottom-left to bottom-right
    const phase1Progress = progress / 0.4;
    x = width * phase1Progress;
    y = height;
  } else if (progress < 0.8) {
    // Phase 2: bottom-right to top-right
    const phase2Progress = (progress - 0.4) / 0.4;
    x = width;
    y = height * (1 - phase2Progress);
  } else {
    // Phase 3: fade out at top-right
    const phase3Progress = (progress - 0.8) / 0.2;
    x = width;
    y = 0;
    fadeMultiplier = 1 - phase3Progress;
  }

  // Create wider radial gradient for bigger light leak
  const leakSize = Math.min(width, height) * (params.size || 0.8);
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, leakSize);

  // Red/orange color scheme
  const color1 = params.color1 || "#FF6B35"; // Vivid red-orange
  const color2 = params.color2 || "#FF8C42"; // Softer orange
  const color3 = params.color3 || "#FFA500"; // Golden orange

  // Add gradient stops with increased intensity and glow
  const alpha = intensity * fadeMultiplier;
  gradient.addColorStop(0, hexToRgba(color1, alpha * 0.9));
  gradient.addColorStop(0.2, hexToRgba(color2, alpha * 0.7));
  gradient.addColorStop(0.5, hexToRgba(color3, alpha * 0.4));
  gradient.addColorStop(0.8, hexToRgba(color3, alpha * 0.1));
  gradient.addColorStop(1, "rgba(255, 165, 0, 0)");

  // Apply with screen blend mode for realistic light leak
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
}
