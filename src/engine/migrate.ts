import type { TextEffectConfig, GlowLayer } from "../types";
import { defaultConfig } from "../presets";
import {
  type SceneDocument,
  type EffectLayer,
  type CustomEngineId,
  newLayerId,
  LEGACY_RENDERER_MAP,
  ENGINE_ID_TO_LEGACY,
} from "./schema";

function layer(
  type: EffectLayer["type"],
  name: string,
  params: Record<string, unknown>,
  extra?: Partial<EffectLayer>
): EffectLayer {
  return {
    id: newLayerId(),
    type,
    name,
    enabled: true,
    opacity: 1,
    blendMode: "source-over",
    target: type === "panel" ? "scene" : "text",
    params,
    ...extra,
  };
}

export function resolveCustomEngineId(cfg: TextEffectConfig): CustomEngineId | null {
  if (!cfg.customRenderer) return null;
  return LEGACY_RENDERER_MAP[cfg.customRenderer] ?? null;
}

/** Lossless migration from flat TextEffectConfig to SceneDocument */
export function textEffectConfigToScene(cfg: TextEffectConfig): SceneDocument {
  const engineId = resolveCustomEngineId(cfg);
  const layers: EffectLayer[] = [];

  if (engineId) {
    layers.push(
      layer("customEngine", "Custom Engine", { engineId }, {
        enabled: true,
        target: "scene",
      })
    );
    layers.push(
      layer("customEngine", "Engine Params", { ...collectEngineParams(cfg, engineId) }, {
        enabled: true,
        target: "text",
      })
    );
  }

  layers.push(
    layer(
      "panel",
      "Background Panel",
      {
        panelEnabled: cfg.panelEnabled,
        panelColor: cfg.panelColor,
        panelOpacity: cfg.panelOpacity,
        panelRadius: cfg.panelRadius,
        panelPaddingX: cfg.panelPaddingX,
        panelPaddingY: cfg.panelPaddingY,
        panelStrokeEnabled: cfg.panelStrokeEnabled,
        panelStrokeColor: cfg.panelStrokeColor,
        panelStrokeWidth: cfg.panelStrokeWidth,
      },
      { enabled: cfg.panelEnabled }
    )
  );

  (cfg.glowLayers || []).forEach((g: GlowLayer, i: number) => {
    layers.push(
      layer("glow", `Glow ${i + 1}`, { ...g }, { enabled: g.enabled, opacity: (g.opacity ?? 100) / 100 })
    );
  });

  layers.push(
    layer(
      "shadow",
      "Shadow",
      {
        shadowEnabled: cfg.shadowEnabled,
        shadowColor: cfg.shadowColor,
        shadowBlur: cfg.shadowBlur,
        shadowOffsetX: cfg.shadowOffsetX,
        shadowOffsetY: cfg.shadowOffsetY,
        shadowOpacity: cfg.shadowOpacity,
        shadowType: cfg.shadowType,
      },
      { enabled: cfg.shadowEnabled }
    )
  );

  layers.push(
    layer(
      "extrusion",
      "Bevel / Extrusion",
      {
        bevelEnabled: cfg.bevelEnabled,
        bevelDepth: cfg.bevelDepth,
        bevelHighlight: cfg.bevelHighlight,
        bevelShadow: cfg.bevelShadow,
        bevelDirection: cfg.bevelDirection,
        bevelCoreColor: cfg.bevelCoreColor,
        bevelEdgeColor: cfg.bevelEdgeColor,
        bevelEdgeWidth: cfg.bevelEdgeWidth,
        bevelBlur: cfg.bevelBlur,
        bevelBlurColor: cfg.bevelBlurColor,
        bevelPerspectiveEnabled: cfg.bevelPerspectiveEnabled,
        bevelVanishingPointX: cfg.bevelVanishingPointX,
        bevelVanishingPointY: cfg.bevelVanishingPointY,
        bevelFocalLength: cfg.bevelFocalLength,
      },
      { enabled: cfg.bevelEnabled }
    )
  );

  layers.push(
    layer(
      "duplicateStack",
      "Stack Extrusion",
      {
        stackEnabled: cfg.stackEnabled,
        stackCount: cfg.stackCount,
        stackOffsetX: cfg.stackOffsetX,
        stackOffsetY: cfg.stackOffsetY,
        stackOpacityDecay: cfg.stackOpacityDecay,
        stackColor1: cfg.stackColor1,
        stackColor2: cfg.stackColor2,
        stackColor3: cfg.stackColor3,
        stackColor4: cfg.stackColor4,
      },
      { enabled: !!cfg.stackEnabled }
    )
  );

  layers.push(
    layer(
      "stroke",
      "Stroke",
      {
        strokeEnabled: cfg.strokeEnabled,
        strokeColor: cfg.strokeColor,
        strokeWidth: cfg.strokeWidth,
        strokePosition: cfg.strokePosition,
        strokeOpacity: cfg.strokeOpacity,
        strokeLineJoin: cfg.strokeLineJoin,
        strokeBlur: cfg.strokeBlur,
        strokeType: cfg.strokeType,
        strokeColorSecondary: cfg.strokeColorSecondary,
        strokeWidthSecondary: cfg.strokeWidthSecondary,
        strokeFadeRange: cfg.strokeFadeRange,
      },
      { enabled: cfg.strokeEnabled }
    )
  );

  layers.push(
    layer(
      "fill",
      "Fill",
      {
        fillType: cfg.fillType,
        fillColor: cfg.fillColor,
        fillGradientAngle: cfg.fillGradientAngle,
        fillGradientStops: cfg.fillGradientStops,
        patternType: cfg.patternType,
      },
      { enabled: cfg.fillType !== "none" }
    )
  );

  layers.push(
    layer("mask", "Text Alpha Mask", { maskType: "alphaText", revealProgress: 1 }, { enabled: false })
  );

  layers.push(
    layer("filter", "Compositor FX", { blur: 0, bloom: 0 }, { enabled: false, target: "previous" })
  );

  return {
    version: 1,
    effectName: cfg.effectName,
    canvas: {
      width: cfg.canvasWidth,
      height: cfg.canvasHeight,
      background: "transparent",
    },
    text: {
      content: cfg.text,
      fontFamily: cfg.fontFamily,
      fontWeight: cfg.fontWeight,
      fontStyle: cfg.fontStyle,
      fontSize: cfg.fontSize,
      letterSpacing: cfg.letterSpacing,
      lineHeight: cfg.lineHeight,
      textPosX: cfg.textPosX,
      textPosY: cfg.textPosY,
    },
    effectLayers: layers,
    customEngineId: engineId,
    engineParams: engineId ? collectEngineParams(cfg, engineId) : undefined,
    compositor: { blur: 0, bloom: 0, bloomThreshold: 0.6 },
    timeline: { duration: 2, fps: 30, loop: true, tracks: [] },
    legacyConfig: { ...cfg },
  };
}

function collectEngineParams(cfg: TextEffectConfig, id: CustomEngineId): Record<string, unknown> {
  switch (id) {
    case "ink":
      return {
        inkColor: cfg.inkColor,
        bristleDensity: cfg.bristleDensity,
        bristleSkipRate: cfg.bristleSkipRate,
        dripRate: cfg.dripRate,
        dripMaxLength: cfg.dripMaxLength,
        grainDensity: cfg.grainDensity,
        skewX: cfg.skewX,
      };
    case "fire":
      return {
        fireColor: cfg.fireColor,
        fireIntensity: cfg.fireIntensity,
        fireFlameHeight: cfg.fireFlameHeight,
        fireEmberCount: cfg.fireEmberCount,
      };
    case "ice":
      return {
        iceColor: cfg.iceColor,
        iceThickness: cfg.iceThickness,
        iceIcicleHeight: cfg.iceIcicleHeight,
        iceFrostDensity: cfg.iceFrostDensity,
        iceSnowHeight: cfg.iceSnowHeight,
      };
    case "aura":
      return {
        auraColor: cfg.auraColor,
        auraGlowColor: cfg.auraGlowColor,
        auraIntensity: cfg.auraIntensity,
        auraReach: cfg.auraReach,
        auraParticleCount: cfg.auraParticleCount,
      };
    default:
      return {};
  }
}

function getLayerParams<T extends Record<string, unknown>>(
  doc: SceneDocument,
  type: EffectLayer["type"],
  index = 0
): T | undefined {
  const found = doc.effectLayers.filter((l) => l.type === type);
  return found[index]?.params as T | undefined;
}

/** Flatten SceneDocument back to TextEffectConfig for legacy controls and renderer */
export function sceneToConfig(doc: SceneDocument): TextEffectConfig {
  const base: TextEffectConfig = doc.legacyConfig
    ? { ...doc.legacyConfig }
    : {
        ...createDefaultFromScene(doc),
      };

  base.effectName = doc.effectName;
  base.text = doc.text.content;
  base.fontFamily = doc.text.fontFamily;
  base.fontWeight = doc.text.fontWeight;
  base.fontStyle = doc.text.fontStyle;
  base.fontSize = doc.text.fontSize;
  base.letterSpacing = doc.text.letterSpacing;
  base.lineHeight = doc.text.lineHeight;
  base.textPosX = doc.text.textPosX;
  base.textPosY = doc.text.textPosY;
  base.canvasWidth = doc.canvas.width;
  base.canvasHeight = doc.canvas.height;

  const panel = getLayerParams<Record<string, unknown>>(doc, "panel");
  if (panel) {
    Object.assign(base, {
      panelEnabled: panel.panelEnabled,
      panelColor: panel.panelColor,
      panelOpacity: panel.panelOpacity,
      panelRadius: panel.panelRadius,
      panelPaddingX: panel.panelPaddingX,
      panelPaddingY: panel.panelPaddingY,
      panelStrokeEnabled: panel.panelStrokeEnabled,
      panelStrokeColor: panel.panelStrokeColor,
      panelStrokeWidth: panel.panelStrokeWidth,
    });
  }

  const glows = doc.effectLayers.filter((l) => l.type === "glow");
  base.glowLayers = glows.map((l) => {
    const p = l.params as unknown as GlowLayer;
    return {
      enabled: l.enabled && (p.enabled ?? true),
      color: p.color ?? "#7C6FFF",
      blur: p.blur ?? 20,
      opacity: Math.round((p.opacity ?? 80) * (l.opacity ?? 1)),
      type: p.type ?? "outer",
      strength: p.strength,
      spread: p.spread,
    };
  });
  while (base.glowLayers.length < 3) {
    base.glowLayers.push({
      enabled: false,
      color: "#7C6FFF",
      blur: 20,
      opacity: 80,
      type: "outer",
    });
  }

  const shadow = getLayerParams<Record<string, unknown>>(doc, "shadow");
  if (shadow) Object.assign(base, shadow);

  const extrusion = getLayerParams<Record<string, unknown>>(doc, "extrusion");
  if (extrusion) Object.assign(base, extrusion);

  const stack = getLayerParams<Record<string, unknown>>(doc, "duplicateStack");
  if (stack) Object.assign(base, stack);

  const stroke = getLayerParams<Record<string, unknown>>(doc, "stroke");
  if (stroke) Object.assign(base, stroke);

  const fill = getLayerParams<Record<string, unknown>>(doc, "fill");
  if (fill) Object.assign(base, fill);

  if (doc.customEngineId) {
    base.customRenderer = ENGINE_ID_TO_LEGACY[doc.customEngineId];
    Object.assign(base, doc.engineParams || {});
  } else {
    base.customRenderer = undefined;
  }

  const filter = getLayerParams<{ blur?: number; bloom?: number }>(doc, "filter");
  if (filter) {
    doc.compositor.blur = filter.blur ?? doc.compositor.blur;
    doc.compositor.bloom = filter.bloom ?? doc.compositor.bloom;
  }

  return base;
}

function createDefaultFromScene(doc: SceneDocument): TextEffectConfig {
  const cfg = { ...defaultConfig };
  cfg.text = doc.text.content;
  return cfg;
}

/** Apply engine params from scene onto config without require() */
export function mergeSceneIntoConfig(
  doc: SceneDocument,
  base: TextEffectConfig
): TextEffectConfig {
  const out = sceneToConfig({ ...doc, legacyConfig: base });
  return out;
}
