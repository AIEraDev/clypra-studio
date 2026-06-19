import { TextTemplate, TemplateLayer, TemplateTextLayer, TemplateShapeLayer, TemplateImageLayer } from "../types";

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

  // Compute animation parameters (transforms, opacity, scale, typewriter, etc.)
  private computeTransform(
    layer: TemplateLayer,
    time: number
  ): AnimationState {
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

  private applyPreset(
    preset: string,
    t: number,
    direction: "in" | "out"
  ): AnimationState {
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
  drawFrame(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    time: number
  ): void {
    ctx.clearRect(0, 0, this.template.canvasWidth, this.template.canvasHeight);
    if (!this.template || !Array.isArray(this.template.layers)) return;

    for (const layer of this.template.layers) {
      const resolved = this.resolveLayer(layer);
      const transform = this.computeTransform(resolved, time);

      ctx.save();
      ctx.globalAlpha = transform.opacity;
      
      // Calculate local layout coordinates center for scaling
      const cx = resolved.x + resolved.width / 2;
      const cy = resolved.y + resolved.height / 2;

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

  private drawTextLayer(
    ctx: CanvasRenderingContext2D,
    layer: TemplateTextLayer,
    transform: AnimationState
  ): void {
    const { content, fontFamily, fontSize, color, align, x, y, width, height } = layer;
    
    // Slice characters for typewriter animations
    const visibleCharsCount = Math.floor(transform.typewriterProgress * content.length);
    const textToDraw = content.slice(0, visibleCharsCount);

    ctx.font = `${fontSize}px "${fontFamily}", sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = align;

    let drawX = x;
    if (align === "center") {
      drawX = x + width / 2;
    } else if (align === "right") {
      drawX = x + width;
    }
    const drawY = y + height / 2;

    ctx.fillText(textToDraw, drawX, drawY);
  }

  private drawShapeLayer(
    ctx: CanvasRenderingContext2D,
    layer: TemplateShapeLayer
  ): void {
    const { shape, fill, stroke, x, y, width, height } = layer;

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

    if (stroke && stroke.width > 0) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.stroke();
    }
  }

  private drawImageLayer(
    ctx: CanvasRenderingContext2D,
    layer: TemplateImageLayer
  ): void {
    const { url, x, y, width, height } = layer;
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
