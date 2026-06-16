/**
 * Fire Effect Renderer
 * Creates animated fire effects with particles and heat distortion
 */

import type { EffectParameters } from "../../types";

export function renderFire(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Parameters
  const fireHeight = (params.fireHeight ?? 0.4) * height;
  const particleCount = Math.floor((params.particleCount ?? 50) * intensity);
  const fireColor1 = params.fireColor1 ?? "#FF4500";
  const fireColor2 = params.fireColor2 ?? "#FFA500";
  const fireColor3 = params.fireColor3 ?? "#FFD700";

  // Create gradient for fire
  const gradient = ctx.createLinearGradient(0, height, 0, height - fireHeight);
  gradient.addColorStop(0, fireColor1);
  gradient.addColorStop(0.5, fireColor2);
  gradient.addColorStop(1, fireColor3);

  // Animate fire base
  ctx.globalAlpha = 0.6 * intensity;
  ctx.fillStyle = gradient;

  // Create wavy fire shape
  ctx.beginPath();
  ctx.moveTo(0, height);

  const waveCount = 8;
  const waveAmplitude = 40;
  const waveSpeed = time * 3;

  for (let i = 0; i <= width; i += width / 100) {
    const waveOffset = Math.sin((i / width) * waveCount + waveSpeed) * waveAmplitude;
    ctx.lineTo(i, height - fireHeight + waveOffset);
  }

  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Add fire particles
  ctx.globalAlpha = 0.8 * intensity;
  for (let i = 0; i < particleCount; i++) {
    const x = (Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5) * width;
    const particleProgress = (time * 0.5 + i * 0.1) % 1;
    const y = height - particleProgress * fireHeight * 1.2;
    const size = (1 - particleProgress) * 8 * intensity;
    const alpha = (1 - particleProgress) * intensity;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 3 === 0 ? fireColor1 : i % 3 === 1 ? fireColor2 : fireColor3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
