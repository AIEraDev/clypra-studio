import { TextTemplate, TemplateLayer, TemplateTextLayer, TemplateShapeLayer, TemplateImageLayer } from "../types";
import { evaluateAnimatable } from "./keyframes";
import { wrapTextToWidth } from "../engine/textLayout";

// Newton-Raphson approximation solver for cubic bezier curve easing
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  return function (t: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    let tApprox = t;
    for (let i = 0; i < 8; i++) {
      const x = 3 * (1 - tApprox) * (1 - tApprox) * tApprox * x1 + 3 * (1 - tApprox) * tApprox * tApprox * x2 + tApprox * tApprox * tApprox;
      const slope = 3 * (1 - tApprox) * (1 - tApprox) * x1 + 6 * (1 - tApprox) * tApprox * (x2 - x1) + 3 * tApprox * tApprox * (1 - x2);
      if (Math.abs(slope) < 1e-6) break;
      tApprox -= (x - t) / slope;
    }

    return 3 * (1 - tApprox) * (1 - tApprox) * tApprox * y1 + 3 * (1 - tApprox) * tApprox * tApprox * y2 + tApprox * tApprox * tApprox;
  };
}

export interface AnimationState {
  opacity: number;
  x: number;
  y: number;
  scale: number;
  blur: number;
  typewriterProgress: number;
}

export class TemplateRenderer {
  private template: TextTemplate;
  private editedValues: Map<string, Partial<TemplateLayer>>;
  private imageCache = new Map<string, any>(); // cache loaded images to prevent flickering
  private currentTime: number = 0; // Track current time for keyframe evaluation

  constructor(template: TextTemplate) {
    this.template = template;
    this.editedValues = new Map();
  }

  updateLayer(layerId: string, changes: Partial<TemplateLayer>): void {
    const existing = this.editedValues.get(layerId) ?? {};
    this.editedValues.set(layerId, { ...existing, ...changes });
  }

  // Merge default values with studio edits / customizations
  private resolveLayer(layer: TemplateLayer): TemplateLayer {
    const overrides = this.editedValues.get(layer.id) ?? {};
    return { ...layer, ...overrides } as TemplateLayer;
  }

  // Helper to evaluate animatable properties
  private evaluateLayerProperty(layer: TemplateLayer, prop: "x" | "y" | "width" | "height"): number {
    const value = (layer as any)[prop];
    return evaluateAnimatable(value, this.currentTime, this.template.duration);
  }

  // Compute animation parameters (transforms, opacity, scale, typewriter, etc.)
  private computeTransform(layer: TemplateLayer, time: number): AnimationState {
    const animation = layer.animation;
    const inEnd = animation.inDuration;
    const outStart = this.template.duration - animation.outDuration;

    if (time < inEnd && inEnd > 0) {
      const t = time / inEnd; // linear progress: 0 to 1
      return this.applyPreset(animation.in, t, "in");
    } else if (time > outStart && animation.outDuration > 0) {
      const t = (time - outStart) / animation.outDuration; // linear progress: 0 to 1
      return this.applyPreset(animation.out, t, "out");
    }

    // Default fully-held state
    return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0, typewriterProgress: 1 };
  }

  private applyPreset(preset: string, t: number, direction: "in" | "out"): AnimationState {
    // Material Standard Ease: cubicBezier(0.4, 0, 0.2, 1)
    const ease = cubicBezier(0.4, 0, 0.2, 1)(t);
    const p = direction === "in" ? ease : 1 - ease;

    let opacity = 1;
    let x = 0;
    let y = 0;
    let scale = 1;
    let blur = 0;
    let typewriterProgress = 1;

    switch (preset) {
      case "fade":
        opacity = p;
        break;
      case "slide-up":
        opacity = p;
        y = (1 - p) * 40;
        break;
      case "slide-down":
        opacity = p;
        y = (p - 1) * 40;
        break;
      case "slide-left":
        opacity = p;
        x = (1 - p) * 40;
        break;
      case "slide-right":
        opacity = p;
        x = (p - 1) * 40;
        break;
      case "scale-in":
        opacity = p;
        scale = 0.8 + p * 0.2;
        break;
      case "scale-out":
        opacity = p;
        scale = 1.2 - (1 - p) * 0.2;
        break;
      case "blur-in":
        opacity = p;
        blur = (1 - p) * 15;
        break;
      case "blur-out":
        opacity = p;
        blur = (1 - p) * 15;
        break;
      case "typewriter":
        typewriterProgress = p;
        break;
      case "none":
      default:
        break;
    }

    return { opacity, x, y, scale, blur, typewriterProgress };
  }

  // Draw template frame at a specific point in time (0 to duration)
  drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, time: number): void {
    this.currentTime = time; // Store current time for keyframe evaluation
    ctx.clearRect(0, 0, this.template.canvasWidth, this.template.canvasHeight);
    if (!this.template || !Array.isArray(this.template.layers)) return;

    for (const layer of this.template.layers) {
      const resolved = this.resolveLayer(layer);
      const transform = this.computeTransform(resolved, time);

      // Evaluate layer opacity
      const layerOpacity = (resolved as any).opacity !== undefined ? evaluateAnimatable((resolved as any).opacity, this.currentTime, this.template.duration) : 1;

      ctx.save();
      ctx.globalAlpha = transform.opacity * layerOpacity; // Combine animation and layer opacity

      // Evaluate position and size for transform center calculation
      const x = this.evaluateLayerProperty(resolved, "x");
      const y = this.evaluateLayerProperty(resolved, "y");
      const width = this.evaluateLayerProperty(resolved, "width");
      const height = this.evaluateLayerProperty(resolved, "height");

      // Calculate local layout coordinates center for scaling
      const cx = x + width / 2;
      const cy = y + height / 2;

      // Apply transforms
      ctx.translate(cx + transform.x, cy + transform.y);
      ctx.scale(transform.scale, transform.scale);
      // Translate back to origin of layer
      ctx.translate(-cx, -cy);

      if (transform.blur > 0 && "filter" in ctx) {
        ctx.filter = `blur(${transform.blur}px)`;
      }

      if (resolved.kind === "text") {
        this.drawTextLayer(ctx as CanvasRenderingContext2D, resolved as TemplateTextLayer, transform);
      } else if (resolved.kind === "shape") {
        this.drawShapeLayer(ctx as CanvasRenderingContext2D, resolved as TemplateShapeLayer);
      } else if (resolved.kind === "image") {
        this.drawImageLayer(ctx as CanvasRenderingContext2D, resolved as TemplateImageLayer);
      }

      ctx.restore();
    }
  }

  private drawTextLayer(ctx: CanvasRenderingContext2D, layer: TemplateTextLayer, transform: AnimationState): void {
    const resolved = layer;

    // Evaluate all animatable properties at current time
    const content = resolved.content;
    const fontFamily = resolved.fontFamily;
    const fontSize = evaluateAnimatable(resolved.fontSize, this.currentTime, this.template.duration);
    const fontWeight = evaluateAnimatable(resolved.fontWeight, this.currentTime, this.template.duration);
    const color = evaluateAnimatable(resolved.color, this.currentTime, this.template.duration);
    const align = resolved.align;
    const x = evaluateAnimatable(resolved.x, this.currentTime, this.template.duration);
    const y = evaluateAnimatable(resolved.y, this.currentTime, this.template.duration);
    const width = evaluateAnimatable(resolved.width, this.currentTime, this.template.duration);
    const height = evaluateAnimatable(resolved.height, this.currentTime, this.template.duration);

    // Evaluate background properties if present
    const backgroundColor = resolved.backgroundColor ? evaluateAnimatable(resolved.backgroundColor, this.currentTime, this.template.duration) : null;
    const backgroundOpacity = resolved.backgroundOpacity !== undefined ? evaluateAnimatable(resolved.backgroundOpacity, this.currentTime, this.template.duration) : 1;
    const backgroundRadius = resolved.backgroundRadius !== undefined ? evaluateAnimatable(resolved.backgroundRadius, this.currentTime, this.template.duration) : 0;
    const backgroundBorderColor = resolved.backgroundBorderColor ? evaluateAnimatable(resolved.backgroundBorderColor, this.currentTime, this.template.duration) : null;
    const backgroundBorderWidth = resolved.backgroundBorderWidth !== undefined ? evaluateAnimatable(resolved.backgroundBorderWidth, this.currentTime, this.template.duration) : 0;

    // Resolve per-side padding — individual sides take priority; fall back to legacy `padding`
    const legacyPadding = resolved.padding !== undefined ? evaluateAnimatable(resolved.padding, this.currentTime, this.template.duration) : 0;
    const pt = resolved.paddingTop    !== undefined ? evaluateAnimatable(resolved.paddingTop,    this.currentTime, this.template.duration) : legacyPadding;
    const pr = resolved.paddingRight  !== undefined ? evaluateAnimatable(resolved.paddingRight,  this.currentTime, this.template.duration) : legacyPadding;
    const pb = resolved.paddingBottom !== undefined ? evaluateAnimatable(resolved.paddingBottom, this.currentTime, this.template.duration) : legacyPadding;
    const pl = resolved.paddingLeft   !== undefined ? evaluateAnimatable(resolved.paddingLeft,   this.currentTime, this.template.duration) : legacyPadding;

    const overflow = resolved.overflow;
    const verticalAlign = resolved.verticalAlign || "middle";

    // ── BORDER-BOX: panel occupies exactly the declared layer bounds ────────
    // Padding shrinks the text content area inward — it does NOT expand the panel.
    // Exception: expand-panel grows the panel itself to fit the text + padding.
    let bgX = x;
    let bgY = y;
    let bgWidth = width;
    let bgHeight = height;

    // Content area (where text lives)
    let contentX = x + pl;
    let contentW = Math.max(0, width - pl - pr);
    let contentY = y + pt;
    let contentH = Math.max(0, height - pt - pb);

    // Slice characters for typewriter animations
    const visibleCharsCount = Math.floor(transform.typewriterProgress * content.length);
    const textToDraw = content.slice(0, visibleCharsCount);

    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.textBaseline = verticalAlign;
    ctx.textAlign = align;

    let adjustedFontSize = fontSize;
    let lines = [textToDraw];

    if (overflow === "shrink") {
      // Shrink font to fit inside the content area width
      const measuredWidth = ctx.measureText(textToDraw).width;
      if (measuredWidth > contentW && contentW > 0) {
        adjustedFontSize = fontSize * (contentW / measuredWidth);
        ctx.font = `${fontWeight} ${adjustedFontSize}px "${fontFamily}", sans-serif`;
      }
    } else if (overflow === "wrap") {
      // Wrap text to content width; background height stays at declared height
      // (text simply flows within the content area)
      lines = wrapTextToWidth(ctx, textToDraw, contentW, 0);
    } else if (overflow === "expand-panel") {
      // Panel grows to measured text width + padding — border-box means padding
      // is included in the new bgWidth, so text still has its full measured space.
      const measuredWidth = ctx.measureText(textToDraw).width;
      bgWidth = measuredWidth + pl + pr;
      bgHeight = height; // height stays as declared
      if (align === "center") {
        bgX = (x + width / 2) - bgWidth / 2;
      } else if (align === "right") {
        bgX = (x + width) - bgWidth;
      } else {
        bgX = x; // left: starts at original x
      }
      // Recompute content area for the expanded panel
      contentX = bgX + pl;
      contentW = measuredWidth;
      contentY = bgY + pt;
      contentH = Math.max(0, bgHeight - pt - pb);
    }

    // Apply clipping against panel bounds if specified
    if (overflow === "clip") {
      ctx.save();
      ctx.beginPath();
      if (backgroundRadius > 0) {
        ctx.moveTo(bgX + backgroundRadius, bgY);
        ctx.lineTo(bgX + bgWidth - backgroundRadius, bgY);
        ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + backgroundRadius);
        ctx.lineTo(bgX + bgWidth, bgY + bgHeight - backgroundRadius);
        ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - backgroundRadius, bgY + bgHeight);
        ctx.lineTo(bgX + backgroundRadius, bgY + bgHeight);
        ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - backgroundRadius);
        ctx.lineTo(bgX, bgY + backgroundRadius);
        ctx.quadraticCurveTo(bgX, bgY, bgX + backgroundRadius, bgY);
      } else {
        ctx.rect(bgX, bgY, bgWidth, bgHeight);
      }
      ctx.closePath();
      ctx.clip();
    }

    // Draw background panel if backgroundColor is set
    if (backgroundColor) {
      const currentAlpha = ctx.globalAlpha;
      ctx.save();
      ctx.fillStyle = backgroundColor;
      ctx.globalAlpha = currentAlpha * backgroundOpacity;

      if (backgroundRadius > 0) {
        ctx.beginPath();
        ctx.moveTo(bgX + backgroundRadius, bgY);
        ctx.lineTo(bgX + bgWidth - backgroundRadius, bgY);
        ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + backgroundRadius);
        ctx.lineTo(bgX + bgWidth, bgY + bgHeight - backgroundRadius);
        ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - backgroundRadius, bgY + bgHeight);
        ctx.lineTo(bgX + backgroundRadius, bgY + bgHeight);
        ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - backgroundRadius);
        ctx.lineTo(bgX, bgY + backgroundRadius);
        ctx.quadraticCurveTo(bgX, bgY, bgX + backgroundRadius, bgY);
        ctx.closePath();
        ctx.fill();
        if (backgroundBorderColor && backgroundBorderWidth > 0) {
          ctx.strokeStyle = backgroundBorderColor;
          ctx.lineWidth = backgroundBorderWidth;
          ctx.globalAlpha = currentAlpha;
          ctx.stroke();
        }
      } else {
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        if (backgroundBorderColor && backgroundBorderWidth > 0) {
          ctx.strokeStyle = backgroundBorderColor;
          ctx.lineWidth = backgroundBorderWidth;
          ctx.globalAlpha = currentAlpha;
          ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
        }
      }

      ctx.restore();
      ctx.globalAlpha = currentAlpha;
    }

    // ── Render text inside the content area ────────────────────────────────
    ctx.fillStyle = color;

    // Horizontal anchor inside content area
    let drawX: number;
    if (align === "center") {
      drawX = contentX + contentW / 2;
    } else if (align === "right") {
      drawX = contentX + contentW;
    } else {
      drawX = contentX;
    }

    if (overflow === "wrap") {
      const lineHeight = adjustedFontSize * 1.2;
      const totalTextHeight = lines.length * lineHeight;
      let startY: number;
      if (verticalAlign === "top") {
        startY = contentY;
      } else if (verticalAlign === "bottom") {
        startY = contentY + contentH - (lines.length - 1) * lineHeight;
      } else { // middle
        startY = contentY + (contentH - totalTextHeight) / 2 + lineHeight / 2;
      }
      lines.forEach((line, index) => {
        ctx.fillText(line, drawX, startY + index * lineHeight);
      });
    } else {
      let drawY: number;
      if (verticalAlign === "top") {
        drawY = contentY;
      } else if (verticalAlign === "bottom") {
        drawY = contentY + contentH;
      } else { // middle
        drawY = contentY + contentH / 2;
      }
      ctx.fillText(lines[0], drawX, drawY);
    }

    // Restore clipping context
    if (overflow === "clip") {
      ctx.restore();
    }

    ctx.restore();
  }


  private drawShapeLayer(ctx: CanvasRenderingContext2D, layer: TemplateShapeLayer): void {
    const resolved = layer;

    // Evaluate all animatable properties at current time
    const shape = resolved.shape;
    const fill = evaluateAnimatable(resolved.fill, this.currentTime, this.template.duration);
    const x = evaluateAnimatable(resolved.x, this.currentTime, this.template.duration);
    const y = evaluateAnimatable(resolved.y, this.currentTime, this.template.duration);
    const width = evaluateAnimatable(resolved.width, this.currentTime, this.template.duration);
    const height = evaluateAnimatable(resolved.height, this.currentTime, this.template.duration);
    const stroke = resolved.stroke;

    ctx.fillStyle = fill;
    ctx.beginPath();

    if (shape === "rect") {
      ctx.rect(x, y, width, height);
    } else if (shape === "circle") {
      const rx = width / 2;
      const ry = height / 2;
      ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2);
    } else if (shape === "line") {
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height);
    }

    ctx.fill();

    if (stroke && stroke.width) {
      const strokeWidth = evaluateAnimatable(stroke.width, this.currentTime, this.template.duration);
      const strokeColor = evaluateAnimatable(stroke.color, this.currentTime, this.template.duration);

      if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    }
  }

  private drawImageLayer(ctx: CanvasRenderingContext2D, layer: TemplateImageLayer): void {
    const resolved = layer;

    // Evaluate animatable properties
    const url = resolved.url;
    const x = evaluateAnimatable(resolved.x, this.currentTime, this.template.duration);
    const y = evaluateAnimatable(resolved.y, this.currentTime, this.template.duration);
    const width = evaluateAnimatable(resolved.width, this.currentTime, this.template.duration);
    const height = evaluateAnimatable(resolved.height, this.currentTime, this.template.duration);

    if (!url) return;

    let img = this.imageCache.get(url);
    if (!img && typeof window !== "undefined") {
      img = new window.Image();
      img.src = url;
      this.imageCache.set(url, img);
    }

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, y, width, height);
    }
  }
}
