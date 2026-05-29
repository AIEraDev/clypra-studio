import type { TextEffectConfig } from "../types";
import { renderTextEffectCore } from "../renderer";
import { sceneToConfig, textEffectConfigToScene } from "./migrate";
import { applyTimelineAtTime } from "./animation";
import type { SceneDocument } from "./schema";
import { WebGLCompositor } from "../compositor";
import { applyMaskReveal } from "./mask";

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

  const filterLayers = animated.effectLayers.filter((l) => l.type === "filter" && l.enabled);
  const lastFilter = filterLayers[filterLayers.length - 1]?.params as { blur?: number; bloom?: number };
  const comp = {
    blur: lastFilter?.blur ?? animated.compositor.blur ?? 0,
    bloom: lastFilter?.bloom ?? animated.compositor.bloom ?? 0,
    bloomThreshold: animated.compositor.bloomThreshold ?? 0.6,
  };

  const usePostFx =
    !options.skipPostFx && (comp.blur > 0 || comp.bloom > 0);

  const finishFrame = () => applyMaskReveal(ctx, animated, w, h);

  if (!usePostFx) {
    renderTextEffectCore(ctx, cfg);
    finishFrame();
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
      finishFrame();
      return;
    }
    renderTextEffectCore(offCtx, cfg);
    applyMaskReveal(offCtx, animated, w, h);
    const compositor = options.compositor ?? getCompositor();
    if (compositor?.isSupported) {
      compositor.renderToContext(ctx, off, comp);
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
      applyMaskReveal(tctx, animated, w, h);
      const compositor = options.compositor ?? getCompositor();
      if (compositor?.isSupported) {
        compositor.renderToContext(ctx, temp, comp);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(temp, 0, 0);
      return;
    }
  }

  renderTextEffectCore(ctx, cfg);
  finishFrame();
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
