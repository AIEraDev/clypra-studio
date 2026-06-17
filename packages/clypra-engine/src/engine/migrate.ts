import type { TextEffectConfig, GlowLayer, TextEffectDefinition, EvaluatedTextLayer } from "../types";
import { defaultConfig } from "../presets";
import { type SceneDocument, type EffectLayer, type CustomEngineId, newLayerId, LEGACY_RENDERER_MAP, ENGINE_ID_TO_LEGACY } from "./schema";
import { ensureDefaultTimeline } from "./timelineDefaults";

function layer(type: EffectLayer["type"], name: string, params: Record<string, unknown>, extra?: Partial<EffectLayer>): EffectLayer {
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
      layer(
        "customEngine",
        "Custom Engine",
        { engineId },
        {
          enabled: true,
          target: "scene",
        },
      ),
    );
    layers.push(
      layer(
        "customEngine",
        "Engine Params",
        { ...collectEngineParams(cfg, engineId) },
        {
          enabled: true,
          target: "text",
        },
      ),
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
      { enabled: cfg.panelEnabled },
    ),
  );

  (cfg.glowLayers || []).forEach((g: GlowLayer, i: number) => {
    layers.push(layer("glow", `Glow ${i + 1}`, { ...g }, { enabled: g.enabled, opacity: (g.opacity ?? 100) / 100 }));
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
      { enabled: cfg.shadowEnabled },
    ),
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
      { enabled: cfg.bevelEnabled },
    ),
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
      { enabled: !!cfg.stackEnabled },
    ),
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
      { enabled: cfg.strokeEnabled },
    ),
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
        perCharFillEnabled: cfg.perCharFillEnabled,
        charFillColors: cfg.charFillColors,
      },
      { enabled: cfg.fillType !== "none" },
    ),
  );

  layers.push(layer("mask", "Text Alpha Mask", { maskType: "alphaText", revealProgress: 1 }, { enabled: false }));

  layers.push(layer("filter", "Compositor FX", { blur: 0, bloom: 0 }, { enabled: false, target: "previous" }));

  const doc: SceneDocument = {
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
      wrapText: cfg.wrapText !== false,
      autoFitText: !!cfg.autoFitText,
      perCharFillEnabled: cfg.perCharFillEnabled,
      charFillColors: cfg.charFillColors,
    },
    effectLayers: layers,
    customEngineId: engineId,
    engineParams: engineId ? collectEngineParams(cfg, engineId) : undefined,
    compositor: { blur: 0, bloom: 0, bloomThreshold: 0.6 },
    timeline: { duration: 2, fps: 30, loop: true, tracks: [] },
    legacyConfig: { ...cfg },
  };

  return ensureDefaultTimeline(doc);
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
    default:
      return {};
  }
}

function getLayerParams<T extends Record<string, unknown>>(doc: SceneDocument, type: EffectLayer["type"], index = 0): T | undefined {
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
  base.wrapText = doc.text.wrapText !== false;
  base.autoFitText = !!doc.text.autoFitText;
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

  base.perCharFillEnabled = doc.text.perCharFillEnabled ?? (fill?.perCharFillEnabled as boolean);
  base.charFillColors = doc.text.charFillColors ?? (fill?.charFillColors as string[] | undefined);

  if (doc.customEngineId) {
    base.customRenderer = ENGINE_ID_TO_LEGACY[doc.customEngineId];
    Object.assign(base, doc.engineParams || {});
  } else {
    base.customRenderer = undefined;
  }

  base.glowLayers = base.glowLayers.slice(0, 6);

  const filterLayers = doc.effectLayers.filter((l) => l.type === "filter" && l.enabled);
  const filter = filterLayers[filterLayers.length - 1]?.params as { blur?: number; bloom?: number };
  const compositor = {
    blur: filter?.blur ?? doc.compositor.blur ?? 0,
    bloom: filter?.bloom ?? doc.compositor.bloom ?? 0,
    bloomThreshold: doc.compositor.bloomThreshold ?? 0.6,
  };

  return base;
}

export function syncCompositorFromScene(doc: SceneDocument): CompositorFromScene {
  const filterLayers = doc.effectLayers.filter((l) => l.type === "filter" && l.enabled);
  const filter = filterLayers[filterLayers.length - 1]?.params as { blur?: number; bloom?: number };
  return {
    blur: filter?.blur ?? doc.compositor.blur ?? 0,
    bloom: filter?.bloom ?? doc.compositor.bloom ?? 0,
    bloomThreshold: doc.compositor.bloomThreshold ?? 0.6,
  };
}

export interface CompositorFromScene {
  blur: number;
  bloom: number;
  bloomThreshold: number;
}

function createDefaultFromScene(doc: SceneDocument): TextEffectConfig {
  const cfg = { ...defaultConfig };
  cfg.text = doc.text.content;
  return cfg;
}

/** Apply engine params from scene onto config without require() */
export function mergeSceneIntoConfig(doc: SceneDocument, base: TextEffectConfig): TextEffectConfig {
  const out = sceneToConfig({ ...doc, legacyConfig: base });
  return out;
}

export function resolveFontFamilyName(fontFamily: string): string {
  const f = fontFamily?.toLowerCase() || "";

  // Google Web Fonts (Variable)
  if (f.includes("inter")) return "Inter Variable";
  if (f.includes("montserrat")) return "Montserrat Variable";
  if (f.includes("geist")) return "Geist Variable";
  if (f.includes("space grotesk") || f.includes("grotesk")) return "Space Grotesk Variable";
  if (f.includes("outfit")) return "Outfit Variable";
  if (f.includes("roboto variable")) return "Roboto Variable";
  if (f.includes("roboto condensed")) return "Roboto Condensed";
  if (f === "roboto") return "Roboto Variable";
  if (f.includes("open sans")) return "Open Sans Variable";
  if (f.includes("raleway")) return "Raleway Variable";
  if (f.includes("oswald")) return "Oswald Variable";
  if (f.includes("playfair display")) return "Playfair Display Variable";
  if (f.includes("nunito")) return "Nunito Variable";
  if (f.includes("dancing script")) return "Dancing Script Variable";

  // Google Web Fonts (Static)
  if (f === "lato") return "Lato";
  if (f === "anton") return "Anton";
  if (f === "bebas neue") return "Bebas Neue";
  if (f === "poppins") return "Poppins";
  if (f === "permanent marker") return "Permanent Marker";
  if (f === "bangers") return "Bangers";
  if (f === "press start 2p") return "Press Start 2P";
  if (f === "pacifico") return "Pacifico";

  // System / unknown fonts
  return fontFamily;
}

export function _buildConfig(effect: TextEffectDefinition, text: string, fontSize: number, canvasWidth: number, canvasHeight: number, time?: number, clipStartTime?: number, clipDuration?: number): TextEffectConfig & { width: number; height: number } {
  const fill = effect.fills?.[0];
  const stroke = effect.strokes?.[0];
  const shadow = effect.shadows?.[0];
  const bevel = effect.bevel;
  const panel = effect.panel;

  // Font size ratio for proportional scaling (based on 100px studio reference)
  const ratio = fontSize / 100;

  // Build base standard configuration
  const config: any = {
    // Canvas / text
    width: canvasWidth,
    height: canvasHeight,
    canvasWidth,
    canvasHeight,
    text,
    time: time ?? 0,
    clipStartTime: clipStartTime ?? 0,
    clipDuration: clipDuration ?? 5.0,

    // Font
    fontFamily: resolveFontFamilyName(effect.font.family),
    fontWeight: effect.font.weight,
    fontStyle: effect.font.style,
    fontSize,
    letterSpacing: effect.font.letterSpacing,
    lineHeight: effect.font.lineHeight,
  };

  if (effect.animation) {
    config.animation = effect.animation;
  }

  // Fill
  if (fill) {
    if (fill.type !== undefined) config.fillType = fill.type;
    if (fill.color !== undefined) config.fillColor = fill.color;
    if (fill.gradient?.angle !== undefined) config.fillGradientAngle = fill.gradient.angle;
    if (fill.gradient?.stops !== undefined) config.fillGradientStops = fill.gradient.stops;
    if (fill.patternType !== undefined) config.patternType = fill.patternType;
    if (fill.perCharFillEnabled !== undefined) config.perCharFillEnabled = fill.perCharFillEnabled;
    if (fill.charFillColors !== undefined) config.charFillColors = fill.charFillColors;
  } else {
    config.fillType = "none";
  }

  // Stroke
  config.strokeEnabled = !!stroke;
  if (stroke) {
    if (stroke.color !== undefined) config.strokeColor = stroke.color;
    if (stroke.width !== undefined) config.strokeWidth = stroke.width * ratio;
    if (stroke.position !== undefined) config.strokePosition = stroke.position;
    if (stroke.opacity !== undefined) config.strokeOpacity = stroke.opacity;
    if (stroke.lineJoin !== undefined) config.strokeLineJoin = stroke.lineJoin;
    if (stroke.blur !== undefined) config.strokeBlur = stroke.blur * ratio;
    if (stroke.type !== undefined) config.strokeType = stroke.type;
    if (stroke.colorSecondary !== undefined) config.strokeColorSecondary = stroke.colorSecondary;
    if (stroke.widthSecondary !== undefined) config.strokeWidthSecondary = stroke.widthSecondary * ratio;
    if (stroke.fadeRange !== undefined) config.strokeFadeRange = stroke.fadeRange;
  }

  // Drop / inner shadow
  config.shadowEnabled = !!shadow;
  if (shadow) {
    if (shadow.color !== undefined) config.shadowColor = shadow.color;
    if (shadow.blur !== undefined) config.shadowBlur = shadow.blur * ratio;
    // Support both flat (legacy) and nested (current Studio output) offset structures
    if (shadow.offset?.x !== undefined) config.shadowOffsetX = shadow.offset.x * ratio;
    else if (shadow.offsetX !== undefined) config.shadowOffsetX = shadow.offsetX * ratio;
    if (shadow.offset?.y !== undefined) config.shadowOffsetY = shadow.offset.y * ratio;
    else if (shadow.offsetY !== undefined) config.shadowOffsetY = shadow.offsetY * ratio;
    if (shadow.opacity !== undefined) config.shadowOpacity = shadow.opacity;
    if (shadow.type !== undefined) config.shadowType = shadow.type;
  }

  // Bevel
  config.bevelEnabled = !!bevel;
  if (bevel) {
    if (bevel.depth !== undefined) config.bevelDepth = Math.round(bevel.depth * ratio);
    // Support both property names (Studio exports 'highlight'/'shadow', legacy may use 'highlightColor'/'shadowColor')
    if (bevel.highlight !== undefined) config.bevelHighlight = bevel.highlight;
    else if (bevel.highlightColor !== undefined) config.bevelHighlight = bevel.highlightColor;
    if (bevel.shadow !== undefined) config.bevelShadow = bevel.shadow;
    else if (bevel.shadowColor !== undefined) config.bevelShadow = bevel.shadowColor;
    if (bevel.direction !== undefined) config.bevelDirection = bevel.direction;
    if (bevel.coreColor !== undefined) config.bevelCoreColor = bevel.coreColor;
    if (bevel.edgeColor !== undefined) config.bevelEdgeColor = bevel.edgeColor;
    if (bevel.edgeWidth !== undefined) config.bevelEdgeWidth = bevel.edgeWidth * ratio;
    if (bevel.blur !== undefined) config.bevelBlur = bevel.blur * ratio;
    if (bevel.blurColor !== undefined) config.bevelBlurColor = bevel.blurColor;
    if (bevel.perspectiveEnabled !== undefined) config.bevelPerspectiveEnabled = bevel.perspectiveEnabled;
    if (bevel.vanishingPointX !== undefined) config.bevelVanishingPointX = bevel.vanishingPointX;
    if (bevel.vanishingPointY !== undefined) config.bevelVanishingPointY = bevel.vanishingPointY;
    if (bevel.focalLength !== undefined) config.bevelFocalLength = bevel.focalLength;
  }

  // Duplicate Stack
  if (effect.stack) {
    config.stackEnabled = !!effect.stack.count;
    if (effect.stack.count !== undefined) config.stackCount = effect.stack.count;
    if (effect.stack.offsetX !== undefined) config.stackOffsetX = effect.stack.offsetX * ratio;
    if (effect.stack.offsetY !== undefined) config.stackOffsetY = effect.stack.offsetY * ratio;
    if (effect.stack.opacityDecay !== undefined) config.stackOpacityDecay = effect.stack.opacityDecay;
    if (effect.stack.color1 !== undefined) config.stackColor1 = effect.stack.color1;
    if (effect.stack.color2 !== undefined) config.stackColor2 = effect.stack.color2;
    if (effect.stack.color3 !== undefined) config.stackColor3 = effect.stack.color3;
    if (effect.stack.color4 !== undefined) config.stackColor4 = effect.stack.color4;
  }

  // Panel / background
  config.panelEnabled = !!panel;
  if (panel) {
    if (panel.color !== undefined) config.panelColor = panel.color;
    if (panel.opacity !== undefined) config.panelOpacity = panel.opacity;
    if (panel.radius !== undefined) config.panelRadius = panel.radius;
    // Support both flat (legacy) and nested (current Studio output) padding structures
    if (panel.padding?.x !== undefined) config.panelPaddingX = panel.padding.x * ratio;
    else if (panel.paddingX !== undefined) config.panelPaddingX = panel.paddingX * ratio;
    if (panel.padding?.y !== undefined) config.panelPaddingY = panel.padding.y * ratio;
    else if (panel.paddingY !== undefined) config.panelPaddingY = panel.paddingY * ratio;
    if (panel.stroke !== undefined) {
      config.panelStrokeEnabled = !!panel.stroke;
      if (panel.stroke.color !== undefined) config.panelStrokeColor = panel.stroke.color;
      if (panel.stroke.width !== undefined) config.panelStrokeWidth = panel.stroke.width * ratio;
    }
  }

  // Glow layers
  if (effect.glows) {
    config.glowLayers = effect.glows.map((g: any) => {
      const mappedGlow: any = {
        enabled: true,
        color: g.color,
        blur: typeof g.blur === "number" ? g.blur * ratio : (g.blur ?? 0),
        opacity: g.opacity,
        type: (g.type ?? "outer") as "inner" | "outer",
      };
      if (g.strength !== undefined) mappedGlow.strength = g.strength;
      if (g.spread !== undefined) mappedGlow.spread = (g.spread as number) * ratio;
      return mappedGlow;
    });
  }

  const rawEffect = effect as any;
  if (rawEffect.customRenderer !== undefined) config.customRenderer = rawEffect.customRenderer;
  if (rawEffect.inkColor !== undefined) config.inkColor = rawEffect.inkColor;
  if (rawEffect.bristleDensity !== undefined) config.bristleDensity = rawEffect.bristleDensity;
  if (rawEffect.bristleSkipRate !== undefined) config.bristleSkipRate = rawEffect.bristleSkipRate;
  if (rawEffect.dripRate !== undefined) config.dripRate = rawEffect.dripRate;
  if (rawEffect.dripMaxLength !== undefined) config.dripMaxLength = rawEffect.dripMaxLength;
  if (rawEffect.grainDensity !== undefined) config.grainDensity = rawEffect.grainDensity;
  if (rawEffect.skewX !== undefined) config.skewX = rawEffect.skewX;

  // Auto-forward unrecognised keys
  const standardKeys = new Set([
    "id",
    "name",
    "category",
    "description",
    "tags",
    "font",
    "fills",
    "strokes",
    "shadows",
    "glows",
    "glow",
    "bevel",
    "panel",
    "background",
    "text",
    "animation",
    "stack",
    "boundingBox",
    "version",
    "width",
    "height",
    "canvasWidth",
    "canvasHeight",
    "effectName",
    "fontFamily",
    "fontWeight",
    "fontStyle",
    "fontSize",
    "letterSpacing",
    "lineHeight",
    "fillType",
    "fillColor",
    "fillGradientAngle",
    "fillGradientStops",
    "patternType",
    "perCharFillEnabled",
    "charFillColors",
    "strokeEnabled",
    "strokeColor",
    "strokeWidth",
    "strokePosition",
    "strokeOpacity",
    "strokeLineJoin",
    "strokeBlur",
    "strokeType",
    "strokeColorSecondary",
    "strokeWidthSecondary",
    "strokeFadeRange",
    "glowLayers",
    "shadowEnabled",
    "shadowColor",
    "shadowBlur",
    "shadowOffsetX",
    "shadowOffsetY",
    "shadowOpacity",
    "shadowType",
    "bevelEnabled",
    "bevelDepth",
    "bevelHighlight",
    "bevelShadow",
    "bevelDirection",
    "bevelCoreColor",
    "bevelEdgeColor",
    "bevelEdgeWidth",
    "bevelBlur",
    "bevelBlurColor",
    "bevelPerspectiveEnabled",
    "bevelVanishingPointX",
    "bevelVanishingPointY",
    "bevelFocalLength",
    "stackEnabled",
    "stackCount",
    "stackOffsetX",
    "stackOffsetY",
    "stackOpacityDecay",
    "stackColor1",
    "stackColor2",
    "stackColor3",
    "stackColor4",
    "panelEnabled",
    "panelColor",
    "panelOpacity",
    "panelRadius",
    "panelPaddingX",
    "panelPaddingY",
    "panelStrokeEnabled",
    "panelStrokeColor",
    "panelStrokeWidth",
    "textPosX",
    "textPosY",
    "autoFitText",
    "wrapText",
    "customRenderer",
    "inkColor",
    "bristleDensity",
    "bristleSkipRate",
    "dripRate",
    "dripMaxLength",
    "grainDensity",
    "skewX",
  ]);
  for (const key of Object.keys(effect)) {
    if (!standardKeys.has(key)) {
      config[key] = (effect as any)[key];
    }
  }

  return config;
}

export function layerToTextEffectConfig(layer: EvaluatedTextLayer): TextEffectConfig & { width: number; height: number } {
  const normWeight = typeof layer.fontWeight === "number" ? layer.fontWeight : layer.fontWeight === "bold" ? 700 : 400;

  const config = {
    ...defaultConfig,
    width: layer.width,
    height: layer.height,
    canvasWidth: layer.width,
    canvasHeight: layer.height,
    text: layer.text,
    fontFamily: resolveFontFamilyName(layer.fontFamily),
    fontWeight: normWeight,
    fontStyle: layer.fontStyle || "normal",
    fontSize: layer.fontSize,
    letterSpacing: layer.letterSpacing ?? 0,
    lineHeight: layer.lineHeight ?? 1.2,
    fillType: layer.color ? "solid" : "none",
    fillColor: layer.color ?? "#FFFFFF",
    strokeEnabled: !!layer.stroke,
    strokeColor: layer.stroke?.color ?? "#000000",
    strokeWidth: layer.stroke?.width ?? 0,
    strokePosition: "center",
    strokeOpacity: 100,
    strokeLineJoin: "round",
    shadowEnabled: !!layer.shadow,
    shadowColor: layer.shadow?.color ?? "#000000",
    shadowBlur: layer.shadow?.blur ?? 0,
    shadowOffsetX: layer.shadow?.offsetX ?? 0,
    shadowOffsetY: layer.shadow?.offsetY ?? 0,
    shadowOpacity: 100,
    shadowType: "drop",
    panelEnabled: !!layer.background,
    panelColor: layer.background?.color ?? "#1E1E26",
    panelOpacity: 80,
    panelRadius: layer.background?.borderRadius ?? 6,
    panelPaddingX: layer.background?.padding ?? 12,
    panelPaddingY: layer.background?.padding ?? 12,
    textPosX: layer.textAlign || "center",
    textPosY: layer.verticalAlign === "middle" ? "middle" : layer.verticalAlign || "middle",
  } as any;

  return config;
}
