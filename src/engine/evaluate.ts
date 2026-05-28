import type { TextEffectConfig } from "../types";
import { renderTextEffectCore } from "../renderer";
import { sceneToConfig, textEffectConfigToScene } from "./migrate";
import { applyTimelineAtTime } from "./animation";
import type { SceneDocument } from "./schema";
import { WebGLCompositor } from "../compositor";

export interface EvaluateOptions {
  compositor?: WebGLCompositor | null;
  skipPostFx?: boolean;
}

let sharedCompositor: WebGLCompositor | null = null;

function getCompositor(): WebGLCompositor | null {
  if (typeof document === "undefined") return null;
  if (!sharedCompositor) {
    sharedCompositor = new WebGLCompositor();
  }
  return sharedCompositor;
}

/**
 * Single source of truth for rendering a scene at time t.
 */
export function evaluateScene(
  doc: SceneDocument,
  time: number,
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  options: EvaluateOptions = {}
): void {
  const animated = applyTimelineAtTime(doc, time);
  const cfg = sceneToConfig(animated);

  const w = cfg.canvasWidth || 800;
  const h = cfg.canvasHeight || 200;

  const usePostFx =
    !options.skipPostFx &&
    (animated.compositor.blur > 0 ||
      animated.compositor.bloom > 0 ||
      animated.effectLayers.some((l) => l.type === "filter" && l.enabled));

  if (!usePostFx) {
    renderTextEffectCore(ctx, cfg);
    return;
  }

  const off =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : null;

  if (off) {
    const offCtx = off.getContext("2d");
    if (!offCtx) {
      renderTextEffectCore(ctx, cfg);
      return;
    }
    renderTextEffectCore(offCtx, cfg);
    const compositor = options.compositor ?? getCompositor();
    if (compositor?.isSupported) {
      compositor.renderToContext(ctx, off, animated.compositor);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(off as unknown as CanvasImageSource, 0, 0);
    return;
  }

  // Fallback: draw to temp canvas in DOM
  if (typeof document !== "undefined") {
    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;
    const tctx = temp.getContext("2d");
    if (tctx) {
      renderTextEffectCore(tctx, cfg);
      const compositor = options.compositor ?? getCompositor();
      if (compositor?.isSupported) {
        compositor.renderToContext(ctx, temp, animated.compositor);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(temp, 0, 0);
      return;
    }
  }

  renderTextEffectCore(ctx, cfg);
}

export function evaluateConfig(
  cfg: TextEffectConfig,
  time: number,
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  options?: EvaluateOptions
): void {
  evaluateScene(textEffectConfigToScene(cfg), time, ctx, options);
}

export function advanceSceneTime(doc: SceneDocument, steps: number): number {
  const dt = 1 / (doc.timeline.fps || 30);
  const next = (doc as SceneDocument & { _time?: number })._time ?? 0;
  const duration = doc.timeline.duration || 2;
  let t = next + steps * dt;
  if (doc.timeline.loop) {
    t = duration > 0 ? t % duration : t;
  } else {
    t = Math.min(t, duration);
  }
  (doc as SceneDocument & { _time?: number })._time = t;
  return t;
}

export function getSceneTime(doc: SceneDocument): number {
  return (doc as SceneDocument & { _time?: number })._time ?? 0;
}

export function setSceneTime(doc: SceneDocument, time: number): void {
  (doc as SceneDocument & { _time?: number })._time = time;
}

export function resetSceneTime(doc: SceneDocument): void {
  (doc as SceneDocument & { _time?: number })._time = 0;
}
