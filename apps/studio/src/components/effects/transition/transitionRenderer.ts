/**
 * Transition Renderer
 * Canvas-based rendering engine for transition effects
 */

import type { TransitionPreset } from "./transitionPresets";

/**
 * Easing functions for smooth transitions
 */
export const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/**
 * Apply easing function to progress
 */
function applyEasing(progress: number, easing: keyof typeof EASING_FUNCTIONS): number {
  return EASING_FUNCTIONS[easing](progress);
}

/**
 * Render a fade transition
 */
function renderFadeTransition(ctx: CanvasRenderingContext2D, clipA: HTMLVideoElement | HTMLImageElement, clipB: HTMLVideoElement | HTMLImageElement, progress: number, params: Record<string, any>, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  if (params.color) {
    // Fade through color (e.g., black or white)
    const midPoint = 0.5;
    if (progress < midPoint) {
      // Fade out clip A to color
      const fadeOut = progress / midPoint;
      ctx.globalAlpha = 1 - fadeOut;
      ctx.drawImage(clipA, 0, 0, width, height);

      ctx.globalAlpha = fadeOut;
      ctx.fillStyle = params.color;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Fade in clip B from color
      const fadeIn = (progress - midPoint) / midPoint;
      ctx.globalAlpha = 1;
      ctx.fillStyle = params.color;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = fadeIn;
      ctx.drawImage(clipB, 0, 0, width, height);
    }
  } else {
    // Simple crossfade
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(clipA, 0, 0, width, height);

    ctx.globalAlpha = progress;
    ctx.drawImage(clipB, 0, 0, width, height);
  }

  ctx.globalAlpha = 1;
}

/**
 * Render a slide transition
 */
function renderSlideTransition(ctx: CanvasRenderingContext2D, clipA: HTMLVideoElement | HTMLImageElement, clipB: HTMLVideoElement | HTMLImageElement, progress: number, params: Record<string, any>, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  const direction = params.direction || "left";
  const push = params.push || false;

  let offsetAX = 0;
  let offsetAY = 0;
  let offsetBX = 0;
  let offsetBY = 0;

  switch (direction) {
    case "left":
      if (push) {
        offsetAX = -progress * width;
        offsetBX = width - progress * width;
      } else {
        offsetBX = width - progress * width;
      }
      break;
    case "right":
      if (push) {
        offsetAX = progress * width;
        offsetBX = -width + progress * width;
      } else {
        offsetBX = -width + progress * width;
      }
      break;
    case "up":
      if (push) {
        offsetAY = -progress * height;
        offsetBY = height - progress * height;
      } else {
        offsetBY = height - progress * height;
      }
      break;
    case "down":
      if (push) {
        offsetAY = progress * height;
        offsetBY = -height + progress * height;
      } else {
        offsetBY = -height + progress * height;
      }
      break;
  }

  // Draw clip A
  ctx.drawImage(clipA, offsetAX, offsetAY, width, height);

  // Draw clip B
  ctx.drawImage(clipB, offsetBX, offsetBY, width, height);
}

/**
 * Render a wipe transition
 */
function renderWipeTransition(ctx: CanvasRenderingContext2D, clipA: HTMLVideoElement | HTMLImageElement, clipB: HTMLVideoElement | HTMLImageElement, progress: number, params: Record<string, any>, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  // Draw clip A as base
  ctx.drawImage(clipA, 0, 0, width, height);

  const direction = params.direction || "horizontal";
  const feather = params.feather || 0;

  ctx.save();

  // Create clipping path based on direction
  ctx.beginPath();

  switch (direction) {
    case "horizontal": {
      const wipeX = progress * width;
      if (feather > 0) {
        // Soft edge with gradient
        const gradient = ctx.createLinearGradient(wipeX - feather, 0, wipeX + feather, 0);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(0.5, "rgba(0,0,0,0.5)");
        gradient.addColorStop(1, "rgba(0,0,0,1)");
        ctx.rect(0, 0, wipeX + feather, height);
      } else {
        ctx.rect(0, 0, wipeX, height);
      }
      break;
    }
    case "vertical": {
      const wipeY = progress * height;
      if (feather > 0) {
        const gradient = ctx.createLinearGradient(0, wipeY - feather, 0, wipeY + feather);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(0.5, "rgba(0,0,0,0.5)");
        gradient.addColorStop(1, "rgba(0,0,0,1)");
        ctx.rect(0, 0, width, wipeY + feather);
      } else {
        ctx.rect(0, 0, width, wipeY);
      }
      break;
    }
    case "diagonal": {
      // Top-left to bottom-right
      const diagonalProgress = progress * (width + height);
      ctx.moveTo(0, 0);
      if (diagonalProgress < width) {
        ctx.lineTo(diagonalProgress, 0);
        ctx.lineTo(0, Math.min(diagonalProgress, height));
      } else {
        ctx.lineTo(width, 0);
        ctx.lineTo(width, diagonalProgress - width);
        ctx.lineTo(0, diagonalProgress);
      }
      ctx.closePath();
      break;
    }
    case "circle": {
      const maxRadius = Math.sqrt(width * width + height * height) / 2;
      const radius = progress * maxRadius;
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
      break;
    }
    case "clock": {
      // Rotating clock hand from 12 o'clock
      const angle = progress * Math.PI * 2;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.sqrt(width * width + height * height);

      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
      ctx.closePath();
      break;
    }
  }

  ctx.clip();
  ctx.drawImage(clipB, 0, 0, width, height);
  ctx.restore();
}

/**
 * Render a zoom transition
 */
function renderZoomTransition(ctx: CanvasRenderingContext2D, clipA: HTMLVideoElement | HTMLImageElement, clipB: HTMLVideoElement | HTMLImageElement, progress: number, params: Record<string, any>, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  const direction = params.direction || "in";
  const scaleFrom = params.scaleFrom || 0.5;
  const scaleTo = params.scaleTo || 1.0;
  const blur = params.blur || 0;

  if (direction === "in") {
    // Zoom in: clip B grows from small to full
    // Show clip A at full size fading out
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(clipA, 0, 0, width, height);

    // Clip B zooms in
    const scale = scaleFrom + (scaleTo - scaleFrom) * progress;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    if (blur > 0) {
      const currentBlur = blur * (1 - progress);
      ctx.filter = `blur(${currentBlur}px)`;
    }

    ctx.globalAlpha = progress;
    ctx.drawImage(clipB, offsetX, offsetY, scaledWidth, scaledHeight);
    ctx.filter = "none";
  } else {
    // Zoom out: clip A grows and fades out
    const scale = 1.0 + (scaleTo - 1.0) * progress;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    if (blur > 0) {
      const currentBlur = blur * progress;
      ctx.filter = `blur(${currentBlur}px)`;
    }

    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(clipA, offsetX, offsetY, scaledWidth, scaledHeight);
    ctx.filter = "none";

    // Clip B appears underneath
    ctx.globalAlpha = progress;
    ctx.drawImage(clipB, 0, 0, width, height);
  }

  ctx.globalAlpha = 1;
}

/**
 * Render a blur transition
 */
function renderBlurTransition(ctx: CanvasRenderingContext2D, clipA: HTMLVideoElement | HTMLImageElement, clipB: HTMLVideoElement | HTMLImageElement, progress: number, params: Record<string, any>, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  const maxBlur = params.maxBlur || 10;

  // Blur increases to midpoint, then decreases
  const blurAmount = Math.sin(progress * Math.PI) * maxBlur;

  ctx.filter = `blur(${blurAmount}px)`;

  // Crossfade during blur
  ctx.globalAlpha = 1 - progress;
  ctx.drawImage(clipA, 0, 0, width, height);

  ctx.globalAlpha = progress;
  ctx.drawImage(clipB, 0, 0, width, height);

  ctx.filter = "none";
  ctx.globalAlpha = 1;
}

/**
 * Render a pixelate transition
 */
function renderPixelateTransition(ctx: CanvasRenderingContext2D, clipA: HTMLVideoElement | HTMLImageElement, clipB: HTMLVideoElement | HTMLImageElement, progress: number, params: Record<string, any>, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  const maxPixelSize = params.maxPixelSize || 16;

  // Pixelate increases to midpoint, then decreases
  const pixelSize = Math.max(1, Math.sin(progress * Math.PI) * maxPixelSize);

  // Determine which clip to show based on progress
  const sourceClip = progress < 0.5 ? clipA : clipB;

  // Calculate downscaled dimensions
  const cols = Math.ceil(width / pixelSize);
  const rows = Math.ceil(height / pixelSize);

  // Draw pixelated image
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * pixelSize;
      const y = row * pixelSize;

      // Sample color from center of pixel block
      const sampleX = x + pixelSize / 2;
      const sampleY = y + pixelSize / 2;

      // Draw a small sample from source and stretch it
      ctx.drawImage(sourceClip, sampleX, sampleY, 1, 1, x, y, pixelSize, pixelSize);
    }
  }

  // Crossfade between clips at midpoint
  if (progress > 0.4 && progress < 0.6) {
    const crossfadeProgress = (progress - 0.4) / 0.2;
    ctx.globalAlpha = crossfadeProgress;
    ctx.drawImage(clipB, 0, 0, width, height);
    ctx.globalAlpha = 1;
  }
}

/**
 * Main transition renderer
 */
export function renderTransition(
  ctx: CanvasRenderingContext2D,
  clipA: HTMLVideoElement | HTMLImageElement,
  clipB: HTMLVideoElement | HTMLImageElement,
  transition: TransitionPreset,
  rawProgress: number, // 0-1
  duration: number,
): void {
  // Apply easing to progress
  const progress = applyEasing(rawProgress, transition.defaultEasing);

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Route to appropriate renderer based on transition type
  switch (transition.type) {
    case "fade":
      renderFadeTransition(ctx, clipA, clipB, progress, transition.params, width, height);
      break;

    case "slide":
      renderSlideTransition(ctx, clipA, clipB, progress, transition.params, width, height);
      break;

    case "wipe":
      renderWipeTransition(ctx, clipA, clipB, progress, transition.params, width, height);
      break;

    case "zoom":
      renderZoomTransition(ctx, clipA, clipB, progress, transition.params, width, height);
      break;

    case "blur":
      renderBlurTransition(ctx, clipA, clipB, progress, transition.params, width, height);
      break;

    case "pixelate":
      renderPixelateTransition(ctx, clipA, clipB, progress, transition.params, width, height);
      break;

    default:
      // Fallback to simple fade
      renderFadeTransition(ctx, clipA, clipB, progress, {}, width, height);
  }
}
