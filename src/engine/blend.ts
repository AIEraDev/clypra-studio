import type { SceneDocument, EffectLayer } from "./schema";
import { sceneToConfig, textEffectConfigToScene } from "./migrate";
import type { TextEffectConfig } from "../types";
import { newLayerId } from "./schema";

function mixNum(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function mixFloat(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixColor(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => {
    const x = h.replace("#", "");
    const n = parseInt(x.length === 3 ? x.split("").map((c) => c + c).join("") : x, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  try {
    const a = parse(hexA);
    const b = parse(hexB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1).toUpperCase()}`;
  } catch {
    return t > 0.5 ? hexB : hexA;
  }
}

function blendLayerParams(
  paramsA: Record<string, unknown>,
  paramsB: Record<string, unknown>,
  t: number
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(paramsA), ...Object.keys(paramsB)]);
  for (const key of keys) {
    const a = paramsA[key];
    const b = paramsB[key];
    if (typeof a === "number" && typeof b === "number") {
      out[key] = Number.isInteger(a) && Number.isInteger(b) ? mixNum(a, b, t) : mixFloat(a, b, t);
    } else if (typeof a === "string" && typeof b === "string" && a.startsWith("#") && b.startsWith("#")) {
      out[key] = mixColor(a, b, t);
    } else if (Array.isArray(a) && Array.isArray(b) && key === "fillGradientStops") {
      out[key] = a.map((stopA: { color: string; offset: number }, i: number) => {
        const stopB = (b as typeof a)[i] || stopA;
        return {
          color: mixColor(stopA.color, stopB.color, t),
          offset: mixNum(stopA.offset, stopB.offset, t),
        };
      });
    } else {
      out[key] = t > 0.5 ? b : a;
    }
  }
  return out;
}

function matchLayersByType(a: EffectLayer[], b: EffectLayer[]): Array<[EffectLayer | null, EffectLayer | null]> {
  const pairs: Array<[EffectLayer | null, EffectLayer | null]> = [];
  const types = new Set([...a.map((l) => l.type), ...b.map((l) => l.type)]);
  for (const type of types) {
    const la = a.filter((l) => l.type === type);
    const lb = b.filter((l) => l.type === type);
    const max = Math.max(la.length, lb.length);
    for (let i = 0; i < max; i++) {
      pairs.push([la[i] ?? null, lb[i] ?? null]);
    }
  }
  return pairs;
}

/** Blend two scenes by layer params (Lab preset blend) */
export function blendScenes(
  sceneA: SceneDocument,
  sceneB: SceneDocument,
  ratio: number
): SceneDocument {
  const pairs = matchLayersByType(sceneA.effectLayers, sceneB.effectLayers);
  const layers: EffectLayer[] = [];

  for (const [la, lb] of pairs) {
    if (!la && lb) {
      layers.push({ ...lb, id: newLayerId(), opacity: lb.opacity * ratio });
      continue;
    }
    if (la && !lb) {
      layers.push({ ...la, id: newLayerId(), opacity: la.opacity * (1 - ratio) });
      continue;
    }
    if (!la || !lb) continue;
    layers.push({
      ...la,
      id: newLayerId(),
      enabled: ratio > 0.5 ? lb.enabled : la.enabled,
      opacity: mixFloat(la.opacity, lb.opacity, ratio),
      params: blendLayerParams(la.params, lb.params, ratio),
    });
  }

  return {
    version: 1,
    effectName: ratio > 0.5 ? sceneB.effectName : sceneA.effectName,
    canvas: {
      width: mixNum(sceneA.canvas.width, sceneB.canvas.width, ratio),
      height: mixNum(sceneA.canvas.height, sceneB.canvas.height, ratio),
      background: sceneA.canvas.background,
    },
    text: {
      content: sceneA.text.content,
      fontFamily: ratio > 0.5 ? sceneB.text.fontFamily : sceneA.text.fontFamily,
      fontWeight: ratio > 0.5 ? sceneB.text.fontWeight : sceneA.text.fontWeight,
      fontStyle: ratio > 0.5 ? sceneB.text.fontStyle : sceneA.text.fontStyle,
      fontSize: mixNum(sceneA.text.fontSize, sceneB.text.fontSize, ratio),
      letterSpacing: mixNum(sceneA.text.letterSpacing, sceneB.text.letterSpacing, ratio),
      lineHeight: mixFloat(sceneA.text.lineHeight, sceneB.text.lineHeight, ratio),
      textPosX: ratio > 0.5 ? sceneB.text.textPosX : sceneA.text.textPosX,
      textPosY: ratio > 0.5 ? sceneB.text.textPosY : sceneA.text.textPosY,
    },
    effectLayers: layers,
    customEngineId: ratio > 0.5 ? sceneB.customEngineId : sceneA.customEngineId,
    engineParams:
      sceneA.engineParams && sceneB.engineParams
        ? blendLayerParams(
            sceneA.engineParams as Record<string, unknown>,
            sceneB.engineParams as Record<string, unknown>,
            ratio
          )
        : ratio > 0.5
          ? sceneB.engineParams
          : sceneA.engineParams,
    compositor: {
      blur: mixFloat(sceneA.compositor.blur, sceneB.compositor.blur, ratio),
      bloom: mixFloat(sceneA.compositor.bloom, sceneB.compositor.bloom, ratio),
      bloomThreshold: mixFloat(
        sceneA.compositor.bloomThreshold ?? 0.6,
        sceneB.compositor.bloomThreshold ?? 0.6,
        ratio
      ),
    },
    timeline: ratio > 0.5 ? sceneB.timeline : sceneA.timeline,
  };
}

export function blendConfigs(
  cfgA: TextEffectConfig,
  cfgB: TextEffectConfig,
  ratio: number
): TextEffectConfig {
  return sceneToConfig(blendScenes(textEffectConfigToScene(cfgA), textEffectConfigToScene(cfgB), ratio));
}
