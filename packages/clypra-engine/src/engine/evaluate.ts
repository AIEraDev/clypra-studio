import type { TextEffectConfig } from "../types";
import { renderTextEffectCore } from "../renderer";
import { sceneToConfig, textEffectConfigToScene } from "./migrate";
import { applyTimelineAtTime } from "./animation";
import type { SceneDocument } from "./schema";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, DEFAULT_FPS, DEFAULT_DURATION } from "./schema";
import { WebGLCompositor } from "../compositor";
import { applyMaskReveal } from "./mask";
import { CanvasDevice } from "../platform";

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
 * Dispose the shared module-level compositor and release GPU resources.
 * Call on hot-module-reload or application teardown to prevent WebGL context leaks.
 */
export function disposeSharedCompositor(): void {
  sharedCompositor?.dispose();
  sharedCompositor = null;
}

/**
 * Single source of truth for rendering a scene at time t.
 */
export function evaluateScene(doc: SceneDocument, time: number, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, options: EvaluateOptions = {}): void {
  const animated = applyTimelineAtTime(doc, time);
  const cfg = sceneToConfig(animated);

  const w = cfg.canvasWidth || DEFAULT_CANVAS_WIDTH;
  const h = cfg.canvasHeight || DEFAULT_CANVAS_HEIGHT;

  const filterLayers = animated.effectLayers.filter((l) => l.type === "filter" && l.enabled);
  const lastFilter = filterLayers[filterLayers.length - 1]?.params as { blur?: number; bloom?: number };
  const comp = {
    blur: lastFilter?.blur ?? animated.compositor.blur ?? 0,
    bloom: lastFilter?.bloom ?? animated.compositor.bloom ?? 0,
    bloomThreshold: animated.compositor.bloomThreshold ?? 0.6,
  };

  const usePostFx = !options.skipPostFx && (comp.blur > 0 || comp.bloom > 0);

  const finishFrame = () => applyMaskReveal(ctx, animated, w, h);

  if (!usePostFx) {
    ctx.clearRect(0, 0, w, h);
    renderTextEffectCore(ctx, cfg);
    finishFrame();
    return;
  }

  // ── Intermediate buffer using unified CanvasDevice pool ───────────────────
  const temp = CanvasDevice.acquire(w, h);
  const tctx = temp.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (tctx) {
    tctx.clearRect(0, 0, w, h);
    renderTextEffectCore(tctx, cfg);
    applyMaskReveal(tctx, animated, w, h);
    const compositor = options.compositor ?? getCompositor();
    if (compositor?.isSupported) {
      compositor.renderToContext(ctx, temp, comp);
    } else {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(temp as unknown as CanvasImageSource, 0, 0);
    }
    CanvasDevice.release(temp);
    return;
  }

  CanvasDevice.release(temp);
  renderTextEffectCore(ctx, cfg);
  finishFrame();
}

export function evaluateConfig(cfg: TextEffectConfig, time: number, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, options?: EvaluateOptions): void {
  evaluateScene(textEffectConfigToScene(cfg), time, ctx, options);
}

export function advanceSceneTime(doc: SceneDocument, steps: number): number {
  const dt = 1 / (doc.timeline.fps || DEFAULT_FPS);
  const next = (doc as SceneDocument & { _time?: number })._time ?? 0;
  const duration = doc.timeline.duration || DEFAULT_DURATION;
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
