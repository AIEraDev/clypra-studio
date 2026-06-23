/**
 * Transition Renderer
 *
 * Applies transitions between two video frames.
 * These are NOT video files - they are algorithmic blends.
 *
 * Examples:
 * - fade: Crossfade opacity
 * - zoom_in: Scale up during fade
 * - wipe_left: Reveal next frame from left
 *
 * Part of @clypra/engine - shared between clypra-studio and clypra app
 */

import type { TransitionRenderer as TransitionRendererType, TransitionParameters, EasingFunction } from "./types";

export class TransitionRenderer {
  /**
   * Render a transition between two frames
   *
   * @param ctx - Canvas 2D context
   * @param fromFrame - Canvas or image of the outgoing frame
   * @param toFrame - Canvas or image of the incoming frame
   * @param renderer - Transition type
   * @param params - Transition parameters
   * @param progress - Transition progress (0-1)
   */
  static render(ctx: CanvasRenderingContext2D, fromFrame: HTMLCanvasElement | HTMLImageElement, toFrame: HTMLCanvasElement | HTMLImageElement, renderer: TransitionRendererType, params: TransitionParameters, progress: number): void {
    const method = this.getRenderer(renderer);
    if (method) {
      // Apply easing to progress
      const easedProgress = this.applyEasing(progress, params.easing || "ease-in-out");
      method.call(this, ctx, fromFrame, toFrame, params, easedProgress);
    } else {
      console.warn(`Unknown transition renderer: ${renderer}`);
      // Fallback to simple fade
      this.renderFade(ctx, fromFrame, toFrame, params, progress);
    }
  }

  /**
   * Get the renderer function for a transition type
   */
  private static getRenderer(type: TransitionRendererType): ((ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number) => void) | null {
    const renderers: Record<TransitionRendererType, any> = {
      // Basic
      fade: this.renderFade,
      dissolve: this.renderDissolve,
      cut: this.renderCut,
      canvas: this.renderFade, // Legacy fallback for clypra app

      // Zoom
      zoom_in: this.renderZoomIn,
      zoom_out: this.renderZoomOut,
      zoom_blur: this.renderZoomBlur,

      // Slide
      slide_left: this.renderSlideLeft,
      slide_right: this.renderSlideRight,
      slide_up: this.renderSlideUp,
      slide_down: this.renderSlideDown,

      // Wipe
      wipe_left: this.renderWipeLeft,
      wipe_right: this.renderWipeRight,
      wipe_up: this.renderWipeUp,
      wipe_down: this.renderWipeDown,
      wipe_clockwise: this.renderWipeClockwise,
      wipe_center: this.renderWipeCenter,

      // Shape
      circle_expand: this.renderCircleExpand,
      circle_collapse: this.renderCircleCollapse,
      diamond_expand: this.renderDiamondExpand,
      rectangle_expand: this.renderRectangleExpand,

      // Blur
      blur_fade: this.renderBlurFade,
      directional_blur: this.renderDirectionalBlur,

      // Creative
      glitch: this.renderGlitch,
      rgb_split: this.renderRGBSplit,
      chromatic: this.renderChromatic,
      film_burn: this.renderFilmBurn,
      light_leak: this.renderLightLeak,
      whip_pan: this.renderWhipPan,
    };

    return renderers[type] || null;
  }

  // ============================================================================
  // BASIC TRANSITIONS
  // ============================================================================

  private static renderFade(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Draw from frame
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame
    ctx.globalAlpha = progress;
    ctx.drawImage(to, 0, 0, width, height);

    ctx.globalAlpha = 1;
  }

  private static renderDissolve(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    // Same as fade
    this.renderFade(ctx, from, to, params, progress);
  }

  private static renderCut(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Instant cut at 50% progress
    if (progress < 0.5) {
      ctx.drawImage(from, 0, 0, width, height);
    } else {
      ctx.drawImage(to, 0, 0, width, height);
    }
  }

  // ============================================================================
  // ZOOM TRANSITIONS
  // ============================================================================

  private static renderZoomIn(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const scale = params.scale || 1.3;

    // Zoom out from frame
    const fromScale = 1 + progress * (scale - 1);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(fromScale, fromScale);
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(from, -width / 2, -height / 2, width, height);
    ctx.restore();

    // Fade in to frame
    ctx.globalAlpha = progress;
    ctx.drawImage(to, 0, 0, width, height);

    ctx.globalAlpha = 1;
  }

  private static renderZoomOut(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const scale = params.scale || 0.7;

    // Zoom in from frame
    const fromScale = 1 - progress * (1 - scale);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(fromScale, fromScale);
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(from, -width / 2, -height / 2, width, height);
    ctx.restore();

    // Fade in to frame
    ctx.globalAlpha = progress;
    ctx.drawImage(to, 0, 0, width, height);

    ctx.globalAlpha = 1;
  }

  private static renderZoomBlur(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const blurAmount = (params.blurAmount || 10) * (1 - Math.abs(progress - 0.5) * 2);
    ctx.filter = `blur(${blurAmount}px)`;
    this.renderZoomIn(ctx, from, to, params, progress);
    ctx.filter = "none";
  }

  // ============================================================================
  // SLIDE TRANSITIONS
  // ============================================================================

  private static renderSlideLeft(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Slide from frame out to the left
    ctx.drawImage(from, -width * progress, 0, width, height);

    // Slide to frame in from the right
    ctx.drawImage(to, width * (1 - progress), 0, width, height);
  }

  private static renderSlideRight(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Slide from frame out to the right
    ctx.drawImage(from, width * progress, 0, width, height);

    // Slide to frame in from the left
    ctx.drawImage(to, -width * (1 - progress), 0, width, height);
  }

  private static renderSlideUp(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Slide from frame out to the top
    ctx.drawImage(from, 0, -height * progress, width, height);

    // Slide to frame in from the bottom
    ctx.drawImage(to, 0, height * (1 - progress), width, height);
  }

  private static renderSlideDown(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Slide from frame out to the bottom
    ctx.drawImage(from, 0, height * progress, width, height);

    // Slide to frame in from the top
    ctx.drawImage(to, 0, -height * (1 - progress), width, height);
  }

  // ============================================================================
  // WIPE TRANSITIONS
  // ============================================================================

  private static renderWipeLeft(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const wipeX = width * progress;

    // Draw from frame
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame with clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, wipeX, height);
    ctx.clip();
    ctx.drawImage(to, 0, 0, width, height);
    ctx.restore();
  }

  private static renderWipeRight(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const wipeX = width * (1 - progress);

    // Draw from frame
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame with clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(wipeX, 0, width - wipeX, height);
    ctx.clip();
    ctx.drawImage(to, 0, 0, width, height);
    ctx.restore();
  }

  private static renderWipeUp(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const wipeY = height * progress;

    // Draw from frame
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame with clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, wipeY);
    ctx.clip();
    ctx.drawImage(to, 0, 0, width, height);
    ctx.restore();
  }

  private static renderWipeDown(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const wipeY = height * (1 - progress);

    // Draw from frame
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame with clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, wipeY, width, height - wipeY);
    ctx.clip();
    ctx.drawImage(to, 0, 0, width, height);
    ctx.restore();
  }

  private static renderWipeClockwise(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const angle = progress * Math.PI * 2;

    // Draw from frame
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame with radial clipping
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, Math.max(width, height), -Math.PI / 2, angle - Math.PI / 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(to, 0, 0, width, height);
    ctx.restore();
  }

  private static renderWipeCenter(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(width, height) * progress;

    // Draw from frame
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame with circular clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(to, 0, 0, width, height);
    ctx.restore();
  }

  // ============================================================================
  // SHAPE TRANSITIONS
  // ============================================================================

  private static renderCircleExpand(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    this.renderWipeCenter(ctx, from, to, params, progress);
  }

  private static renderCircleCollapse(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    this.renderWipeCenter(ctx, to, from, params, 1 - progress);
  }

  private static renderDiamondExpand(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.max(width, height) * progress;

    // Draw from frame
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame with diamond clipping
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX + size, centerY);
    ctx.lineTo(centerX, centerY + size);
    ctx.lineTo(centerX - size, centerY);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(to, 0, 0, width, height);
    ctx.restore();
  }

  private static renderRectangleExpand(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const rectWidth = width * progress;
    const rectHeight = height * progress;
    const x = (width - rectWidth) / 2;
    const y = (height - rectHeight) / 2;

    // Draw from frame
    ctx.drawImage(from, 0, 0, width, height);

    // Draw to frame with rect clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, rectWidth, rectHeight);
    ctx.clip();
    ctx.drawImage(to, 0, 0, width, height);
    ctx.restore();
  }

  // ============================================================================
  // BLUR TRANSITIONS
  // ============================================================================

  private static renderBlurFade(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const blurAmount = (params.blurAmount || 10) * (1 - Math.abs(progress - 0.5) * 2);
    ctx.filter = `blur(${blurAmount}px)`;
    this.renderFade(ctx, from, to, params, progress);
    ctx.filter = "none";
  }

  private static renderDirectionalBlur(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    // Directional blur requires custom implementation
    // Fallback to blur fade
    this.renderBlurFade(ctx, from, to, params, progress);
  }

  // ============================================================================
  // CREATIVE TRANSITIONS
  // ============================================================================

  private static renderGlitch(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    // Combine both frames with glitch effect
    this.renderFade(ctx, from, to, params, progress);

    // Add glitch artifacts
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const glitchIntensity = Math.sin(progress * Math.PI) * 20;

    for (let i = 0; i < 5; i++) {
      const y = Math.random() * height;
      const sliceHeight = Math.random() * 20;
      const offset = (Math.random() - 0.5) * glitchIntensity;

      const imageData = ctx.getImageData(0, y, width, sliceHeight);
      ctx.putImageData(imageData, offset, y);
    }
  }

  private static renderRGBSplit(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    // Draw with RGB channel offset
    const offset = Math.sin(progress * Math.PI) * 10;

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.5;
    ctx.drawImage(from, offset, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(to, -offset, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private static renderChromatic(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    this.renderRGBSplit(ctx, from, to, params, progress);
  }

  private static renderFilmBurn(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    // Add burn effect overlay
    this.renderFade(ctx, from, to, params, progress);

    const intensity = Math.sin(progress * Math.PI);
    ctx.fillStyle = `rgba(255, 200, 100, ${intensity * 0.5})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private static renderLightLeak(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    // Add light leak overlay
    this.renderFade(ctx, from, to, params, progress);

    const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
    const intensity = Math.sin(progress * Math.PI);
    gradient.addColorStop(0, `rgba(255, 200, 100, ${intensity * 0.4})`);
    gradient.addColorStop(1, "rgba(255, 200, 100, 0)");

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }

  private static renderWhipPan(ctx: CanvasRenderingContext2D, from: HTMLCanvasElement | HTMLImageElement, to: HTMLCanvasElement | HTMLImageElement, params: TransitionParameters, progress: number): void {
    const blurAmount = Math.sin(progress * Math.PI) * 20;
    ctx.filter = `blur(${blurAmount}px)`;

    if (progress < 0.5) {
      const offset = progress * ctx.canvas.width * 2;
      ctx.drawImage(from, -offset, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
      const offset = (1 - progress) * ctx.canvas.width * 2;
      ctx.drawImage(to, offset, 0, ctx.canvas.width, ctx.canvas.height);
    }

    ctx.filter = "none";
  }

  // ============================================================================
  // EASING FUNCTIONS
  // ============================================================================

  private static applyEasing(t: number, easing: EasingFunction = "linear"): number {
    switch (easing) {
      case "linear":
        return t;
      case "ease":
      case "ease-in-out":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case "ease-in":
        return t * t;
      case "ease-out":
        return t * (2 - t);
      case "ease-in-quad":
        return t * t;
      case "ease-out-quad":
        return t * (2 - t);
      case "ease-in-out-quad":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case "ease-in-cubic":
        return t * t * t;
      case "ease-out-cubic":
        return --t * t * t + 1;
      case "ease-in-out-cubic":
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      case "ease-in-quart":
        return t * t * t * t;
      case "ease-out-quart":
        return 1 - --t * t * t * t;
      case "ease-in-out-quart":
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
      case "spring":
        return 1 - Math.cos(t * Math.PI * 2.5) * (1 - t);
      case "bounce":
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
      default:
        return t;
    }
  }
}
