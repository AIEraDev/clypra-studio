import { TextTemplate, TemplateLayer, TemplateTextLayer, TemplateShapeLayer, TemplateImageLayer } from "../types";
import { evaluateAnimatable } from "./keyframes";
import { wrapTextToWidth } from "../engine/textLayout";
import { resolveFontFamilyName } from "../engine/migrate";

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
  private lastLayerLayouts = new Map<string, { x: number; y: number; width: number; height: number }>();

  constructor(template: TextTemplate) {
    this.template = template;
    this.editedValues = new Map();
  }

  updateLayer(layerId: string, changes: Partial<TemplateLayer>): void {
    const existing = this.editedValues.get(layerId) ?? {};
    this.editedValues.set(layerId, { ...existing, ...changes } as Partial<TemplateLayer>);
  }

  getLayerLayout(layerId: string): { x: number; y: number; width: number; height: number } | null {
    return this.lastLayerLayouts.get(layerId) ?? null;
  }

  // Merge default values with studio edits / customizations
  private resolveLayer(layer: TemplateLayer): TemplateLayer {
    const overrides = this.editedValues.get(layer.id) ?? {};
    return { ...layer, ...overrides } as TemplateLayer;
  }

  // Helper to evaluate animatable numeric-only properties (x, y) — always returns a number.
  private evaluateLayerProperty(layer: TemplateLayer, prop: "x" | "y"): number {
    const value = (layer as any)[prop];
    return evaluateAnimatable(value, this.currentTime, this.template.duration);
  }

  // For text layers: evaluate width or height, returning the raw value which may be "auto".
  private evaluateTextDimension(layer: TemplateTextLayer, prop: "width" | "height"): number | "auto" {
    const value = layer[prop];
    if (value === "auto") return "auto";
    return evaluateAnimatable(value as any, this.currentTime, this.template.duration);
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

  drawFrame(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    time: number,
    fitToContentOrOpts: boolean | { fitToContent?: boolean; skipClear?: boolean } = false
  ): void {
    const fitToContent = typeof fitToContentOrOpts === "boolean" ? fitToContentOrOpts : !!fitToContentOrOpts?.fitToContent;
    const skipClear = typeof fitToContentOrOpts === "object" ? !!fitToContentOrOpts?.skipClear : false;

    this.currentTime = time; // Track current time for keyframe evaluation

    if (fitToContent) {
      // If we don't have layouts yet, draw once to populate them
      const hasLayouts = this.lastLayerLayouts.size > 0;
      if (!hasLayouts) {
        this.drawLayers(ctx, time);
      }

      const bounds = this.getContentBounds();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        if (!skipClear) {
          ctx.clearRect(0, 0, this.template.canvasWidth, this.template.canvasHeight);
        }
        ctx.save();

        const padding = 0.85; // 15% margin
        const scale = Math.min(
          this.template.canvasWidth / bounds.width,
          this.template.canvasHeight / bounds.height
        ) * padding;

        // Limit maximum scale to 3.0 to prevent pixelation of very small text
        const finalScale = Math.min(3.0, scale);

        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;

        ctx.translate(this.template.canvasWidth / 2, this.template.canvasHeight / 2);
        ctx.scale(finalScale, finalScale);
        ctx.translate(-cx, -cy);

        this.drawLayers(ctx, time);

        ctx.restore();
        return;
      }
    }

    // Default normal draw
    if (!skipClear) {
      ctx.clearRect(0, 0, this.template.canvasWidth, this.template.canvasHeight);
    }
    this.drawLayers(ctx, time);
  }

  getContentBounds(): { x: number; y: number; width: number; height: number } | null {
    if (this.lastLayerLayouts.size === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const layout of this.lastLayerLayouts.values()) {
      minX = Math.min(minX, layout.x);
      minY = Math.min(minY, layout.y);
      maxX = Math.max(maxX, layout.x + layout.width);
      maxY = Math.max(maxY, layout.y + layout.height);
    }

    if (minX === Infinity || minY === Infinity) return null;
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private drawLayers(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, time: number): void {
    if (!this.template || !Array.isArray(this.template.layers)) return;
    this.lastLayerLayouts.clear();

    for (const layer of this.template.layers) {
      const resolved = this.resolveLayer(layer);
      const transform = this.computeTransform(resolved, time);

      // Evaluate layer opacity
      const layerOpacity = (resolved as any).opacity !== undefined ? evaluateAnimatable((resolved as any).opacity, this.currentTime, this.template.duration) : 1;

      ctx.save();
      ctx.globalAlpha = transform.opacity * layerOpacity; // Combine animation and layer opacity

      // Evaluate position and size for transform center calculation.
      // For text layers with "auto" dimensions we don't know the true size until after
      // font measurement inside drawTextLayer, so we use the layer origin (x, y) as the
      // scale pivot. This is acceptable because auto-sized layers are typically non-animated
      // (they don't have scale animations). Numeric dimensions work as before.
      const x = this.evaluateLayerProperty(resolved, "x");
      const y = this.evaluateLayerProperty(resolved, "y");

      let cx: number;
      let cy: number;

      if (resolved.kind === "text") {
        const textLayer = resolved as TemplateTextLayer;
        const rawW = this.evaluateTextDimension(textLayer, "width");
        const rawH = this.evaluateTextDimension(textLayer, "height");
        // For auto dims use the layer origin as pivot (scale from top-left corner).
        cx = rawW === "auto" ? x : x + (rawW as number) / 2;
        cy = rawH === "auto" ? y : y + (rawH as number) / 2;
      } else {
        const width  = evaluateAnimatable((resolved as any).width,  this.currentTime, this.template.duration) as number;
        const height = evaluateAnimatable((resolved as any).height, this.currentTime, this.template.duration) as number;
        cx = x + width  / 2;
        cy = y + height / 2;
      }

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
    const rawFontFamily = resolved.fontFamily;
    const fontFamily = resolveFontFamilyName(rawFontFamily);
    const fontSize = evaluateAnimatable(resolved.fontSize, this.currentTime, this.template.duration);
    const fontWeight = evaluateAnimatable(resolved.fontWeight, this.currentTime, this.template.duration);
    const color = evaluateAnimatable(resolved.color, this.currentTime, this.template.duration);
    const align = resolved.align;
    const x = evaluateAnimatable(resolved.x, this.currentTime, this.template.duration);
    const y = evaluateAnimatable(resolved.y, this.currentTime, this.template.duration);

    // width / height may be "auto" — defer resolution until after ctx.font is set.
    const rawWidth  = this.evaluateTextDimension(resolved, "width");
    const rawHeight = this.evaluateTextDimension(resolved, "height");

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

    // Slice characters for typewriter animations
    const visibleCharsCount = Math.floor(transform.typewriterProgress * content.length);
    const textToDraw = content.slice(0, visibleCharsCount);

    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", "${rawFontFamily}", sans-serif`;
    // Always use alphabetic baseline — we position manually using real font metrics
    // so we never double-account the baseline shift.
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = align;

    // ── Resolve "auto" dimensions after ctx.font is set so measureText is accurate ──
    //
    // For a width-auto layer the panel grows to exactly fit the text horizontally.
    // For a height-auto layer the panel grows to exactly fit the ink vertically
    // (across all wrapped lines when overflow === "wrap").
    //
    // The sentinel value -1 is used internally only; it is never exposed to callers.

    let adjustedFontSize = fontSize;
    let lines = [textToDraw];

    // ── Step 1: wrap lines (needed to know height-auto value for wrapped text) ──
    // We may need to wrap before we can resolve height. But wrapping itself needs
    // contentW, which needs width. So: resolve width first, then wrap, then height.

    // Resolve width first (may need measurement)
    let resolvedWidth: number;
    if (rawWidth === "auto") {
      // Measure the text at the current font to derive panel width.
      const measured = ctx.measureText(textToDraw || "Ag").width;
      resolvedWidth = measured + pl + pr;
    } else {
      resolvedWidth = rawWidth as number;
    }

    // Content width is now known
    const contentW = Math.max(0, resolvedWidth - pl - pr);

    // ── Step 2: handle overflow strategies that affect line count / font size ──
    if (overflow === "shrink") {
      // Shrink font to fit inside the content area in BOTH dimensions.
      // 1. Fit to width first.
      const measuredWidth = ctx.measureText(textToDraw).width;
      let scale = (measuredWidth > contentW && contentW > 0)
        ? contentW / measuredWidth
        : 1;
      // 2. Also fit to height (single-line: inkLineH ≈ fontSize).
      // If height is auto, shrink is a no-op in the vertical axis.
      if (rawHeight !== "auto") {
        const declaredContentH = Math.max(0, (rawHeight as number) - pt - pb);
        const singleLineH = fontSize * 1.0; // approximate ink height before measure
        if (singleLineH * scale > declaredContentH && declaredContentH > 0) {
          scale = Math.min(scale, declaredContentH / singleLineH);
        }
      }
      if (scale < 1) {
        adjustedFontSize = fontSize * scale;
        ctx.font = `${fontWeight} ${adjustedFontSize}px "${fontFamily}", "${rawFontFamily}", sans-serif`;
      }
    } else if (overflow === "wrap") {
      // Wrap text to content width; height may grow to fit (if height is "auto").
      lines = wrapTextToWidth(ctx, textToDraw, contentW, 0);
    } else if (overflow === "expand-panel") {
      // expand-panel: width grows to text + padding (same as width:"auto" but via overflow).
      // If width was already "auto" this is essentially the same result.
      const measuredWidth = ctx.measureText(textToDraw).width;
      resolvedWidth = measuredWidth + pl + pr;
    }

    // ── Step 3: resolve height (may depend on wrapped line count) ──
    let resolvedHeight: number;
    if (rawHeight === "auto") {
      // Measure real font metrics if available, otherwise approximate.
      const sampleMetrics = ctx.measureText(lines[0] || "Ag");
      const ascent  = sampleMetrics.actualBoundingBoxAscent  ?? adjustedFontSize * 0.8;
      const descent = sampleMetrics.actualBoundingBoxDescent ?? adjustedFontSize * 0.2;
      const inkLineH    = ascent + descent;
      const lineAdvance = adjustedFontSize * 1.2;
      const totalInkH   = lines.length === 1
        ? inkLineH
        : inkLineH + (lines.length - 1) * lineAdvance;
      resolvedHeight = totalInkH + pt + pb;
    } else {
      resolvedHeight = rawHeight as number;
    }

    // ── BORDER-BOX: panel occupies exactly the resolved layer bounds ──────────
    // Padding shrinks the text content area inward — it does NOT expand the panel.
    // Exception: expand-panel (and auto width) grows the panel itself to fit the text.
    let bgX = x;
    let bgY = y;
    let bgWidth  = resolvedWidth;
    let bgHeight = resolvedHeight;

    // For expand-panel / auto-width with centered/right alignment, anchor the panel
    // on the original x reference point (same behaviour as expand-panel always had).
    if (overflow === "expand-panel" || rawWidth === "auto") {
      if (align === "center") {
        // x is treated as the horizontal centre of the declared slot.
        // For auto, x is just the left origin, so anchor on x directly.
        bgX = rawWidth === "auto" ? x : (x + (rawWidth as number) / 2) - bgWidth / 2;
      } else if (align === "right") {
        bgX = rawWidth === "auto" ? x : (x + (rawWidth as number)) - bgWidth;
      } else {
        bgX = x;
      }
    }

    this.lastLayerLayouts.set(resolved.id, { x: bgX, y: bgY, width: bgWidth, height: bgHeight });

    // Content area (where text lives)
    let contentX = bgX + pl;
    let contentY = bgY + pt;
    let contentH = Math.max(0, bgHeight - pt - pb);

    // ── Always clip to panel bounds ─────────────────────────────────────────
    // Every overflow strategy (clip, shrink, wrap, expand-panel) must respect
    // the panel rectangle as a hard boundary. Text must never visually escape
    // the panel regardless of content length or font size.
    // For expand-panel, bgWidth/bgX have already been grown to fit the text,
    // so clipping to those grown bounds is still correct (no visible clipping).
    ctx.save(); // clip save — restored after text drawing
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

    // Measure real ascent for the current font so we can anchor ink precisely.
    const sampleMetrics = ctx.measureText(lines[0] || "Ag");
    const ascent = sampleMetrics.actualBoundingBoxAscent ?? adjustedFontSize * 0.8;
    const descent = sampleMetrics.actualBoundingBoxDescent ?? adjustedFontSize * 0.2;
    const inkLineH = ascent + descent;
    const lineHeight = adjustedFontSize * 1.2;

    if (overflow === "wrap") {
      const totalInkHeight = inkLineH + (lines.length - 1) * lineHeight;
      let firstBaselineY: number;
      if (verticalAlign === "top") {
        firstBaselineY = contentY + ascent;
      } else if (verticalAlign === "bottom") {
        firstBaselineY = contentY + contentH - totalInkHeight + ascent;
      } else { // middle
        firstBaselineY = contentY + (contentH - totalInkHeight) / 2 + ascent;
      }
      lines.forEach((line, index) => {
        ctx.fillText(line, drawX, firstBaselineY + index * lineHeight);
      });
    } else {
      let drawY: number;
      if (verticalAlign === "top") {
        drawY = contentY + ascent;
      } else if (verticalAlign === "bottom") {
        drawY = contentY + contentH - descent;
      } else { // middle
        drawY = contentY + (contentH - inkLineH) / 2 + ascent;
      }
      ctx.fillText(lines[0], drawX, drawY);
    }

    // Restore panel clip context
    ctx.restore();

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

    this.lastLayerLayouts.set(resolved.id, { x, y, width, height });

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

    this.lastLayerLayouts.set(resolved.id, { x, y, width, height });

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
