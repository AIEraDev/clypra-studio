import type { TextEffectConfig } from "../types";
import { renderTextEffectCore } from "../renderer";
import { sceneToConfig, textEffectConfigToScene } from "./migrate";
import { applyTimelineAtTime } from "./animation";
import type { SceneDocument } from "./schema";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, DEFAULT_FPS, DEFAULT_DURATION } from "./schema";
import { applyMaskReveal } from "./mask";
import { CanvasDevice, supportsCtxFilter } from "../platform";

export interface EvaluateOptions {
  skipPostFx?: boolean;
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
    // Browser/Studio fallback stays Canvas2D-only. Desktop production preview
    // and export use the native Rust renderer; this path is intentionally a
    // lightweight source preview and must never create a second GPU renderer.
    ctx.clearRect(0, 0, w, h);
    if (supportsCtxFilter()) {
      ctx.save();
      const blur = Math.max(0, comp.blur);
      const bloom = Math.max(0, comp.bloom);
      if (blur > 0) ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(temp as unknown as CanvasImageSource, 0, 0);
      if (bloom > 0) {
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = Math.min(0.8, bloom * 0.25);
        ctx.filter = `blur(${Math.max(1, bloom * 4)}px)`;
        ctx.drawImage(temp as unknown as CanvasImageSource, 0, 0);
      }
      ctx.restore();
    } else {
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
