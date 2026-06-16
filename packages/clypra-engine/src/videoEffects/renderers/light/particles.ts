/**
 * Particles Effect Renderer
 * Creates floating particles with various behaviors
 */

import type { EffectParameters } from "../../types";

export function renderParticles(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Parameters
  const particleCount = Math.floor((params.particleCount ?? 100) * intensity);
  const particleSize = (params.particleSize ?? 3) * intensity;
  const particleColor = params.particleColor ?? "#FFFFFF";
  const driftSpeed = params.driftSpeed ?? 1;
  const fadeEffect = params.fadeEffect ?? true;

  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < particleCount; i++) {
    // Deterministic particle position based on index and time
    const seed = i * 0.1;
    const x = (Math.sin(time * driftSpeed * 0.5 + seed) * 0.5 + 0.5) * width;
    const y = ((time * driftSpeed * 20 + i * 15) % (height + 100)) - 50;

    // Size variation
    const sizeVariation = Math.sin(time * 2 + seed) * 0.3 + 0.7;
    const size = particleSize * sizeVariation;

    // Fade particles at top and bottom
    let alpha = intensity * 0.8;
    if (fadeEffect) {
      if (y < 100) {
        alpha *= y / 100;
      } else if (y > height - 100) {
        alpha *= (height - y) / 100;
      }
    }

    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = particleColor;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export function renderDustParticles(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Parameters for dust - slower, more organic
  const particleCount = Math.floor((params.particleCount ?? 60) * intensity);
  const particleSize = (params.particleSize ?? 2) * intensity;
  const particleColor = params.particleColor ?? "#E0E0E0";

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.3 * intensity;

  for (let i = 0; i < particleCount; i++) {
    // Very slow, drifting motion
    const seed = i * 0.05;
    const x = (Math.sin(time * 0.2 + seed) * 0.5 + 0.5) * width;
    const y = (Math.cos(time * 0.15 + seed * 2) * 0.5 + 0.5) * height;

    // Subtle size pulsing
    const sizePulse = Math.sin(time + seed * 3) * 0.2 + 0.8;
    const size = particleSize * sizePulse;

    // Subtle opacity variation
    const alphaVariation = Math.sin(time * 0.5 + seed * 5) * 0.3 + 0.7;

    ctx.globalAlpha = 0.2 * intensity * alphaVariation;
    ctx.fillStyle = particleColor;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
