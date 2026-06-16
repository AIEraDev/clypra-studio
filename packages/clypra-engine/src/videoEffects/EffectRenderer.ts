/**
 * Effect Renderer
 *
 * Applies behavior-driven effects to canvas contexts.
 * These are NOT video files - they are algorithmic transformations.
 *
 * Examples:
 * - shake: Randomly offset canvas position
 * - blur: Apply blur filter
 * - vhs: Add scanlines, color shift, noise
 * - glitch: Random block displacement
 */

import type { EffectRenderer as EffectRendererType, EffectParameters } from "./types";

export class EffectRenderer {
  /**
   * Apply an effect to a canvas context
   *
   * @param ctx - Canvas 2D context
   * @param renderer - Effect type
   * @param params - Effect parameters
   * @param intensity - Effect intensity (0-1)
   * @param time - Current time for animated effects
   */
  static apply(ctx: CanvasRenderingContext2D, renderer: EffectRendererType, params: EffectParameters, intensity: number = 1, time: number = 0): void {
    const method = this.getRenderer(renderer);
    if (method) {
      method.call(this, ctx, params, intensity, time);
    } else {
      console.warn(`Unknown effect renderer: ${renderer}`);
    }
  }

  /**
   * Get the renderer function for an effect type
   */
  private static getRenderer(type: EffectRendererType): ((ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number) => void) | null {
    const renderers: Record<EffectRendererType, any> = {
      // Camera effects
      shake: this.renderShake,
      zoom: this.renderZoom,
      pan: this.renderPan,
      rotate: this.renderRotate,
      dolly: this.renderDolly,

      // Blur effects
      blur: this.renderBlur,
      motion_blur: this.renderMotionBlur,
      radial_blur: this.renderRadialBlur,
      zoom_blur: this.renderZoomBlur,

      // Style effects
      vhs: this.renderVHS,
      glitch: this.renderGlitch,
      rgb_split: this.renderRGBSplit,
      chromatic_aberration: this.renderChromaticAberration,
      film_grain: this.renderFilmGrain,
      scanlines: this.renderScanlines,
      crt: this.renderCRT,
      pixelate: this.renderPixelate,

      // Distortion effects
      wave: this.renderWave,
      ripple: this.renderRipple,
      bulge: this.renderBulge,
      twist: this.renderTwist,
      fisheye: this.renderFisheye,

      // Light effects
      flash: this.renderFlash,
      flicker: this.renderFlicker,
      vignette: this.renderVignette,
      glow: this.renderGlow,
      light_leak: this.renderLightLeak,

      // Time effects
      speed_ramp: this.renderSpeedRamp,
      freeze_frame: this.renderFreezeFrame,
      echo: this.renderEcho,
      strobe: this.renderStrobe,

      // Body effects are handled in the canonical rasterizer where source
      // frame pixels are available for mask generation.
      "body-segmentation-glow": this.renderBodyEffectNoop,
      body_glow: this.renderBodyEffectNoop,
      body_outline: this.renderBodyEffectNoop,
      body_particles: this.renderBodyEffectNoop,
    };

    return renderers[type] || null;
  }

  // ============================================================================
  // CAMERA EFFECTS
  // ============================================================================

  private static renderShake(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const shakeIntensity = (params.intensity || 50) * intensity;
    const frequency = params.frequency || 10;

    const offsetX = Math.sin(time * frequency) * shakeIntensity;
    const offsetY = Math.cos(time * frequency * 1.3) * shakeIntensity;

    ctx.translate(offsetX, offsetY);
  }

  private static renderZoom(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const scale = 1 + (params.scale || 0.2) * intensity;
    const centerX = params.centerX || 0.5;
    const centerY = params.centerY || 0.5;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.translate(width * centerX, height * centerY);
    ctx.scale(scale, scale);
    ctx.translate(-width * centerX, -height * centerY);
  }

  private static renderPan(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const panX = (params.panX || 0) * intensity;
    const panY = (params.panY || 0) * intensity;
    ctx.translate(panX, panY);
  }

  private static renderRotate(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const angle = (params.angle || 0) * intensity * (Math.PI / 180);
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    ctx.translate(-width / 2, -height / 2);
  }

  private static renderDolly(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    // Dolly is essentially zoom + slight rotation
    this.renderZoom(ctx, params, intensity, time);
  }

  private static renderBodyEffectNoop(): void {
    // Body renderers require source-frame pixels and are dispatched from
    // core/render/rasterizer.ts so preview and export share the same output.
  }

  // ============================================================================
  // BLUR EFFECTS
  // ============================================================================

  private static renderBlur(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const blurAmount = (params.blurAmount || 10) * intensity;
    ctx.filter = `blur(${blurAmount}px)`;
  }

  private static renderMotionBlur(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const blurAmount = (params.blurAmount || 10) * intensity;
    const direction = params.direction || 0;

    // Motion blur is implemented via multiple draws with decreasing opacity
    // This is a simplified version - production would use proper motion vectors
    ctx.filter = `blur(${blurAmount}px)`;
  }

  private static renderRadialBlur(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const blurAmount = (params.blurAmount || 10) * intensity;
    // Radial blur requires custom shader or multiple draws
    // Simplified with standard blur
    ctx.filter = `blur(${blurAmount}px)`;
  }

  private static renderZoomBlur(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const blurAmount = (params.blurAmount || 10) * intensity;
    ctx.filter = `blur(${blurAmount}px)`;
  }

  // ============================================================================
  // STYLE EFFECTS
  // ============================================================================

  private static renderVHS(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Add scanlines
    this.renderScanlines(ctx, { scanlineCount: 100 }, intensity, time);

    // Add color shift
    const colorOffset = (params.colorOffset || 5) * intensity;
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.1})`;
    ctx.fillRect(colorOffset, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    // Add noise
    const noiseAmount = (params.noiseAmount || 0.1) * intensity;
    this.addNoise(ctx, noiseAmount);
  }

  private static renderGlitch(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const glitchIntensity = (params.glitchIntensity || 50) * intensity;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Random horizontal slices with RGB shift
    const sliceCount = Math.floor(5 * intensity);
    for (let i = 0; i < sliceCount; i++) {
      const y = Math.random() * height;
      const sliceHeight = Math.random() * 20;
      const offset = (Math.random() - 0.5) * glitchIntensity;

      const imageData = ctx.getImageData(0, y, width, sliceHeight);
      ctx.putImageData(imageData, offset, y);
    }
  }

  private static renderRGBSplit(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const splitDistance = (params.splitDistance || 10) * intensity;
    const angle = (params.angle || 0) * (Math.PI / 180);

    const offsetX = Math.cos(angle) * splitDistance;
    const offsetY = Math.sin(angle) * splitDistance;

    // This is a simplified version - full implementation needs channel separation
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.3})`;
    ctx.fillRect(offsetX, offsetY, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }

  private static renderChromaticAberration(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    // Similar to RGB split but radiating from center
    this.renderRGBSplit(ctx, params, intensity, time);
  }

  private static renderFilmGrain(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const grainIntensity = (params.grainIntensity || 0.1) * intensity;
    this.addNoise(ctx, grainIntensity);
  }

  private static renderScanlines(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const scanlineCount = params.scanlineCount || 100;
    const height = ctx.canvas.height;
    const spacing = height / scanlineCount;

    ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.3})`;
    for (let i = 0; i < scanlineCount; i++) {
      ctx.fillRect(0, i * spacing, ctx.canvas.width, spacing / 2);
    }
  }

  private static renderCRT(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    // Combine scanlines, vignette, and slight curve
    this.renderScanlines(ctx, params, intensity, time);
    this.renderVignette(ctx, { radius: 0.8 }, intensity, time);
  }

  private static renderPixelate(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const pixelSize = Math.max(1, Math.floor((params.pixelSize || 10) * intensity));
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Downscale and upscale for pixelation effect
    ctx.imageSmoothingEnabled = false;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCanvas.width = Math.floor(width / pixelSize);
    tempCanvas.height = Math.floor(height / pixelSize);

    tempCtx.drawImage(ctx.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(tempCanvas, 0, 0, width, height);
  }

  // ============================================================================
  // DISTORTION EFFECTS
  // ============================================================================

  private static renderWave(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    // Wave distortion requires pixel manipulation
    // Simplified placeholder
    console.warn("Wave effect requires WebGL shader implementation");
  }

  private static renderRipple(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    console.warn("Ripple effect requires WebGL shader implementation");
  }

  private static renderBulge(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    console.warn("Bulge effect requires WebGL shader implementation");
  }

  private static renderTwist(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    console.warn("Twist effect requires WebGL shader implementation");
  }

  private static renderFisheye(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    console.warn("Fisheye effect requires WebGL shader implementation");
  }

  // ============================================================================
  // LIGHT EFFECTS
  // ============================================================================

  private static renderFlash(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const flashColor = params.flashColor || "#ffffff";
    const flashIntensity = (params.flashIntensity || 1) * intensity;

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = flashColor;
    ctx.globalAlpha = flashIntensity;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private static renderFlicker(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const flickerAmount = Math.random() * intensity;
    ctx.globalAlpha = 1 - flickerAmount * 0.5;
  }

  private static renderVignette(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const radius = params.radius || 0.7;

    const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * radius, width / 2, height / 2, Math.max(width, height));

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.7})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private static renderGlow(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const glowAmount = (params.glowAmount || 10) * intensity;
    ctx.shadowBlur = glowAmount;
    ctx.shadowColor = params.glowColor || "#ffffff";
  }

  private static renderLightLeak(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
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

  // ============================================================================
  // TIME EFFECTS
  // ============================================================================

  private static renderSpeedRamp(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    // Speed ramp is handled at the playback level, not rendering
    // This is a placeholder
  }

  private static renderFreezeFrame(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    // Freeze frame is handled at the playback level
    // This is a placeholder
  }

  private static renderEcho(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    // Echo requires frame buffer
    // Simplified with opacity
    ctx.globalAlpha = 1 - intensity * 0.3;
  }

  private static renderStrobe(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
    const frequency = params.frequency || 10;
    const strobeOn = Math.sin(time * frequency * Math.PI) > 0;

    if (strobeOn) {
      this.renderFlash(ctx, { flashIntensity: 0.8 }, intensity, time);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static addNoise(ctx: CanvasRenderingContext2D, amount: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 255 * amount;
      data[i] += noise; // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }

    ctx.putImageData(imageData, 0, 0);
  }
}
