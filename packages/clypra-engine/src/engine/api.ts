import type { TextEffectConfig, GlowLayer, GradientStop, TextEffectDefinition } from "../types";
import { type SceneDocument, type EffectLayer, newLayerId, LEGACY_RENDERER_MAP } from "./schema";
import { textEffectConfigToScene, sceneToConfig, _buildConfig } from "./migrate";
import { defaultConfig } from "../presets";

// ─── Direct Scene Mutation Helper Functions ──────────────────────────────────

/**
 * Updates text properties on a SceneDocument and its cached legacy config.
 */
export function updateSceneText(
  doc: SceneDocument,
  patch: Partial<{
    content: string;
    fontFamily: string;
    fontWeight: number;
    fontStyle: "normal" | "italic";
    fontSize: number;
    letterSpacing: number;
    lineHeight: number;
    textPosX: "left" | "center" | "right";
    textPosY: "top" | "middle" | "bottom";
    wrapText: boolean;
    autoFitText: boolean;
    perCharFillEnabled: boolean;
    charFillColors: string[];
  }>
): SceneDocument {
  const nextText = { ...doc.text };
  if (patch.content !== undefined) nextText.content = patch.content;
  if (patch.fontFamily !== undefined) nextText.fontFamily = patch.fontFamily;
  if (patch.fontWeight !== undefined) nextText.fontWeight = patch.fontWeight;
  if (patch.fontStyle !== undefined) nextText.fontStyle = patch.fontStyle;
  if (patch.fontSize !== undefined) nextText.fontSize = patch.fontSize;
  if (patch.letterSpacing !== undefined) nextText.letterSpacing = patch.letterSpacing;
  if (patch.lineHeight !== undefined) nextText.lineHeight = patch.lineHeight;
  if (patch.textPosX !== undefined) nextText.textPosX = patch.textPosX;
  if (patch.textPosY !== undefined) nextText.textPosY = patch.textPosY;
  if (patch.wrapText !== undefined) nextText.wrapText = patch.wrapText;
  if (patch.autoFitText !== undefined) nextText.autoFitText = patch.autoFitText;
  if (patch.perCharFillEnabled !== undefined) nextText.perCharFillEnabled = patch.perCharFillEnabled;
  if (patch.charFillColors !== undefined) nextText.charFillColors = patch.charFillColors;

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.content !== undefined) nextLegacyConfig.text = patch.content;
    if (patch.fontFamily !== undefined) nextLegacyConfig.fontFamily = patch.fontFamily;
    if (patch.fontWeight !== undefined) nextLegacyConfig.fontWeight = patch.fontWeight;
    if (patch.fontStyle !== undefined) nextLegacyConfig.fontStyle = patch.fontStyle;
    if (patch.fontSize !== undefined) nextLegacyConfig.fontSize = patch.fontSize;
    if (patch.letterSpacing !== undefined) nextLegacyConfig.letterSpacing = patch.letterSpacing;
    if (patch.lineHeight !== undefined) nextLegacyConfig.lineHeight = patch.lineHeight;
    if (patch.textPosX !== undefined) nextLegacyConfig.textPosX = patch.textPosX;
    if (patch.textPosY !== undefined) nextLegacyConfig.textPosY = patch.textPosY;
    if (patch.wrapText !== undefined) nextLegacyConfig.wrapText = patch.wrapText;
    if (patch.autoFitText !== undefined) nextLegacyConfig.autoFitText = patch.autoFitText;
    if (patch.perCharFillEnabled !== undefined) nextLegacyConfig.perCharFillEnabled = patch.perCharFillEnabled;
    if (patch.charFillColors !== undefined) nextLegacyConfig.charFillColors = patch.charFillColors;
  }

  return {
    ...doc,
    text: nextText,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates or creates the Background Panel (bounding plate) in a SceneDocument.
 */
export function updateScenePanel(
  doc: SceneDocument,
  patch: Partial<{
    enabled: boolean;
    color: string;
    opacity: number;
    radius: number;
    paddingX: number;
    paddingY: number;
    strokeEnabled: boolean;
    strokeColor: string;
    strokeWidth: number;
  }>
): SceneDocument {
  let panelFound = false;
  const nextLayers = doc.effectLayers.map((layer) => {
    if (layer.type === "panel") {
      panelFound = true;
      const nextParams = { ...layer.params };
      if (patch.color !== undefined) nextParams.panelColor = patch.color;
      if (patch.opacity !== undefined) nextParams.panelOpacity = patch.opacity;
      if (patch.radius !== undefined) nextParams.panelRadius = patch.radius;
      if (patch.paddingX !== undefined) nextParams.panelPaddingX = patch.paddingX;
      if (patch.paddingY !== undefined) nextParams.panelPaddingY = patch.paddingY;
      if (patch.strokeEnabled !== undefined) nextParams.panelStrokeEnabled = patch.strokeEnabled;
      if (patch.strokeColor !== undefined) nextParams.panelStrokeColor = patch.strokeColor;
      if (patch.strokeWidth !== undefined) nextParams.panelStrokeWidth = patch.strokeWidth;

      const enabled = patch.enabled !== undefined ? patch.enabled : layer.enabled;
      if (patch.enabled !== undefined) {
        nextParams.panelEnabled = patch.enabled;
      }
      return {
        ...layer,
        enabled,
        params: nextParams,
      };
    }
    return layer;
  });

  const layers = [...nextLayers];
  if (!panelFound) {
    const defaultParams = {
      panelEnabled: patch.enabled ?? true,
      panelColor: patch.color ?? "#1E1E26",
      panelOpacity: patch.opacity ?? 80,
      panelRadius: patch.radius ?? 12,
      panelPaddingX: patch.paddingX ?? 40,
      panelPaddingY: patch.paddingY ?? 20,
      panelStrokeEnabled: patch.strokeEnabled ?? false,
      panelStrokeColor: patch.strokeColor ?? "#2A2A38",
      panelStrokeWidth: patch.strokeWidth ?? 2,
    };
    const newL: EffectLayer = {
      id: newLayerId(),
      type: "panel",
      name: "Background Panel",
      enabled: patch.enabled ?? true,
      opacity: 1,
      blendMode: "source-over",
      target: "scene",
      params: defaultParams,
    };
    layers.unshift(newL);
  }

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.enabled !== undefined) nextLegacyConfig.panelEnabled = patch.enabled;
    if (patch.color !== undefined) nextLegacyConfig.panelColor = patch.color;
    if (patch.opacity !== undefined) nextLegacyConfig.panelOpacity = patch.opacity;
    if (patch.radius !== undefined) nextLegacyConfig.panelRadius = patch.radius;
    if (patch.paddingX !== undefined) nextLegacyConfig.panelPaddingX = patch.paddingX;
    if (patch.paddingY !== undefined) nextLegacyConfig.panelPaddingY = patch.paddingY;
    if (patch.strokeEnabled !== undefined) nextLegacyConfig.panelStrokeEnabled = patch.strokeEnabled;
    if (patch.strokeColor !== undefined) nextLegacyConfig.panelStrokeColor = patch.strokeColor;
    if (patch.strokeWidth !== undefined) nextLegacyConfig.panelStrokeWidth = patch.strokeWidth;
  }

  return {
    ...doc,
    effectLayers: layers,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates or creates the Stroke (outline styling) in a SceneDocument.
 */
export function updateSceneStroke(
  doc: SceneDocument,
  patch: Partial<{
    enabled: boolean;
    strokeColor: string;
    strokeWidth: number;
    strokePosition: "outside" | "center" | "inside";
    strokeOpacity: number;
    strokeLineJoin: "round" | "miter" | "bevel";
    strokeBlur: number;
    strokeType: "single" | "double" | "neon";
    strokeColorSecondary: string;
    strokeWidthSecondary: number;
    strokeFadeRange: number;
  }>
): SceneDocument {
  let found = false;
  const nextLayers = doc.effectLayers.map((layer) => {
    if (layer.type === "stroke") {
      found = true;
      const nextParams = { ...layer.params };
      if (patch.strokeColor !== undefined) nextParams.strokeColor = patch.strokeColor;
      if (patch.strokeWidth !== undefined) nextParams.strokeWidth = patch.strokeWidth;
      if (patch.strokePosition !== undefined) nextParams.strokePosition = patch.strokePosition;
      if (patch.strokeOpacity !== undefined) nextParams.strokeOpacity = patch.strokeOpacity;
      if (patch.strokeLineJoin !== undefined) nextParams.strokeLineJoin = patch.strokeLineJoin;
      if (patch.strokeBlur !== undefined) nextParams.strokeBlur = patch.strokeBlur;
      if (patch.strokeType !== undefined) nextParams.strokeType = patch.strokeType;
      if (patch.strokeColorSecondary !== undefined) nextParams.strokeColorSecondary = patch.strokeColorSecondary;
      if (patch.strokeWidthSecondary !== undefined) nextParams.strokeWidthSecondary = patch.strokeWidthSecondary;
      if (patch.strokeFadeRange !== undefined) nextParams.strokeFadeRange = patch.strokeFadeRange;

      const enabled = patch.enabled !== undefined ? patch.enabled : layer.enabled;
      if (patch.enabled !== undefined) {
        nextParams.strokeEnabled = patch.enabled;
      }
      return {
        ...layer,
        enabled,
        params: nextParams,
      };
    }
    return layer;
  });

  const layers = [...nextLayers];
  if (!found) {
    const defaultParams = {
      strokeEnabled: patch.enabled ?? true,
      strokeColor: patch.strokeColor ?? "#7C6FFF",
      strokeWidth: patch.strokeWidth ?? 4,
      strokePosition: patch.strokePosition ?? "outside",
      strokeOpacity: patch.strokeOpacity ?? 100,
      strokeLineJoin: patch.strokeLineJoin ?? "round",
      strokeBlur: patch.strokeBlur ?? 0,
      strokeType: patch.strokeType ?? "single",
      strokeColorSecondary: patch.strokeColorSecondary ?? "#FFFFFF",
      strokeWidthSecondary: patch.strokeWidthSecondary ?? 4,
      strokeFadeRange: patch.strokeFadeRange ?? 0,
    };
    const newL: EffectLayer = {
      id: newLayerId(),
      type: "stroke",
      name: "Stroke",
      enabled: patch.enabled ?? true,
      opacity: 1,
      blendMode: "source-over",
      target: "text",
      params: defaultParams,
    };
    const fillIdx = layers.findIndex((l) => l.type === "fill");
    if (fillIdx >= 0) {
      layers.splice(fillIdx, 0, newL);
    } else {
      const maskIdx = layers.findIndex((l) => l.type === "mask" || l.type === "filter");
      if (maskIdx >= 0) {
        layers.splice(maskIdx, 0, newL);
      } else {
        layers.push(newL);
      }
    }
  }

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.enabled !== undefined) nextLegacyConfig.strokeEnabled = patch.enabled;
    if (patch.strokeColor !== undefined) nextLegacyConfig.strokeColor = patch.strokeColor;
    if (patch.strokeWidth !== undefined) nextLegacyConfig.strokeWidth = patch.strokeWidth;
    if (patch.strokePosition !== undefined) nextLegacyConfig.strokePosition = patch.strokePosition;
    if (patch.strokeOpacity !== undefined) nextLegacyConfig.strokeOpacity = patch.strokeOpacity;
    if (patch.strokeLineJoin !== undefined) nextLegacyConfig.strokeLineJoin = patch.strokeLineJoin;
    if (patch.strokeBlur !== undefined) nextLegacyConfig.strokeBlur = patch.strokeBlur;
    if (patch.strokeType !== undefined) nextLegacyConfig.strokeType = patch.strokeType;
    if (patch.strokeColorSecondary !== undefined) nextLegacyConfig.strokeColorSecondary = patch.strokeColorSecondary;
    if (patch.strokeWidthSecondary !== undefined) nextLegacyConfig.strokeWidthSecondary = patch.strokeWidthSecondary;
    if (patch.strokeFadeRange !== undefined) nextLegacyConfig.strokeFadeRange = patch.strokeFadeRange;
  }

  return {
    ...doc,
    effectLayers: layers,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates or creates the Shadow in a SceneDocument.
 */
export function updateSceneShadow(
  doc: SceneDocument,
  patch: Partial<{
    enabled: boolean;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    shadowOpacity: number;
    shadowType: "drop" | "inner";
  }>
): SceneDocument {
  let found = false;
  const nextLayers = doc.effectLayers.map((layer) => {
    if (layer.type === "shadow") {
      found = true;
      const nextParams = { ...layer.params };
      if (patch.shadowColor !== undefined) nextParams.shadowColor = patch.shadowColor;
      if (patch.shadowBlur !== undefined) nextParams.shadowBlur = patch.shadowBlur;
      if (patch.shadowOffsetX !== undefined) nextParams.shadowOffsetX = patch.shadowOffsetX;
      if (patch.shadowOffsetY !== undefined) nextParams.shadowOffsetY = patch.shadowOffsetY;
      if (patch.shadowOpacity !== undefined) nextParams.shadowOpacity = patch.shadowOpacity;
      if (patch.shadowType !== undefined) nextParams.shadowType = patch.shadowType;

      const enabled = patch.enabled !== undefined ? patch.enabled : layer.enabled;
      if (patch.enabled !== undefined) {
        nextParams.shadowEnabled = patch.enabled;
      }
      return {
        ...layer,
        enabled,
        params: nextParams,
      };
    }
    return layer;
  });

  const layers = [...nextLayers];
  if (!found) {
    const defaultParams = {
      shadowEnabled: patch.enabled ?? true,
      shadowColor: patch.shadowColor ?? "#000000",
      shadowBlur: patch.shadowBlur ?? 10,
      shadowOffsetX: patch.shadowOffsetX ?? 5,
      shadowOffsetY: patch.shadowOffsetY ?? 5,
      shadowOpacity: patch.shadowOpacity ?? 80,
      shadowType: patch.shadowType ?? "drop",
    };
    const newL: EffectLayer = {
      id: newLayerId(),
      type: "shadow",
      name: "Shadow",
      enabled: patch.enabled ?? true,
      opacity: 1,
      blendMode: "source-over",
      target: "text",
      params: defaultParams,
    };
    const panelIdx = layers.findIndex((l) => l.type === "panel");
    if (panelIdx >= 0) {
      layers.splice(panelIdx + 1, 0, newL);
    } else {
      layers.unshift(newL);
    }
  }

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.enabled !== undefined) nextLegacyConfig.shadowEnabled = patch.enabled;
    if (patch.shadowColor !== undefined) nextLegacyConfig.shadowColor = patch.shadowColor;
    if (patch.shadowBlur !== undefined) nextLegacyConfig.shadowBlur = patch.shadowBlur;
    if (patch.shadowOffsetX !== undefined) nextLegacyConfig.shadowOffsetX = patch.shadowOffsetX;
    if (patch.shadowOffsetY !== undefined) nextLegacyConfig.shadowOffsetY = patch.shadowOffsetY;
    if (patch.shadowOpacity !== undefined) nextLegacyConfig.shadowOpacity = patch.shadowOpacity;
    if (patch.shadowType !== undefined) nextLegacyConfig.shadowType = patch.shadowType;
  }

  return {
    ...doc,
    effectLayers: layers,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates or creates the 3D Bevel/Extrusion in a SceneDocument.
 */
export function updateSceneBevel(
  doc: SceneDocument,
  patch: Partial<{
    enabled: boolean;
    bevelDepth: number;
    bevelHighlight: string;
    bevelShadow: string;
    bevelDirection: "bottom-right" | "bottom" | "right";
    bevelCoreColor: string;
    bevelEdgeColor: string;
    bevelEdgeWidth: number;
    bevelBlur: number;
    bevelBlurColor: string;
    bevelPerspectiveEnabled: boolean;
    bevelVanishingPointX: number;
    bevelVanishingPointY: number;
    bevelFocalLength: number;
  }>
): SceneDocument {
  let found = false;
  const nextLayers = doc.effectLayers.map((layer) => {
    if (layer.type === "extrusion") {
      found = true;
      const nextParams = { ...layer.params };
      if (patch.bevelDepth !== undefined) nextParams.bevelDepth = patch.bevelDepth;
      if (patch.bevelHighlight !== undefined) nextParams.bevelHighlight = patch.bevelHighlight;
      if (patch.bevelShadow !== undefined) nextParams.bevelShadow = patch.bevelShadow;
      if (patch.bevelDirection !== undefined) nextParams.bevelDirection = patch.bevelDirection;
      if (patch.bevelCoreColor !== undefined) nextParams.bevelCoreColor = patch.bevelCoreColor;
      if (patch.bevelEdgeColor !== undefined) nextParams.bevelEdgeColor = patch.bevelEdgeColor;
      if (patch.bevelEdgeWidth !== undefined) nextParams.bevelEdgeWidth = patch.bevelEdgeWidth;
      if (patch.bevelBlur !== undefined) nextParams.bevelBlur = patch.bevelBlur;
      if (patch.bevelBlurColor !== undefined) nextParams.bevelBlurColor = patch.bevelBlurColor;
      if (patch.bevelPerspectiveEnabled !== undefined) nextParams.bevelPerspectiveEnabled = patch.bevelPerspectiveEnabled;
      if (patch.bevelVanishingPointX !== undefined) nextParams.bevelVanishingPointX = patch.bevelVanishingPointX;
      if (patch.bevelVanishingPointY !== undefined) nextParams.bevelVanishingPointY = patch.bevelVanishingPointY;
      if (patch.bevelFocalLength !== undefined) nextParams.bevelFocalLength = patch.bevelFocalLength;

      const enabled = patch.enabled !== undefined ? patch.enabled : layer.enabled;
      if (patch.enabled !== undefined) {
        nextParams.bevelEnabled = patch.enabled;
      }
      return {
        ...layer,
        enabled,
        params: nextParams,
      };
    }
    return layer;
  });

  const layers = [...nextLayers];
  if (!found) {
    const defaultParams = {
      bevelEnabled: patch.enabled ?? true,
      bevelDepth: patch.bevelDepth ?? 5,
      bevelHighlight: patch.bevelHighlight ?? "#FFFFFF",
      bevelShadow: patch.bevelShadow ?? "#000000",
      bevelDirection: patch.bevelDirection ?? "bottom-right",
      bevelCoreColor: patch.bevelCoreColor ?? "#000000",
      bevelEdgeColor: patch.bevelEdgeColor ?? "#2A2A38",
      bevelEdgeWidth: patch.bevelEdgeWidth ?? 0,
      bevelBlur: patch.bevelBlur ?? 0,
      bevelBlurColor: patch.bevelBlurColor ?? "#000000",
      bevelPerspectiveEnabled: patch.bevelPerspectiveEnabled ?? false,
      bevelVanishingPointX: patch.bevelVanishingPointX ?? 40,
      bevelVanishingPointY: patch.bevelVanishingPointY ?? 80,
      bevelFocalLength: patch.bevelFocalLength ?? 400,
    };
    const newL: EffectLayer = {
      id: newLayerId(),
      type: "extrusion",
      name: "Bevel / Extrusion",
      enabled: patch.enabled ?? true,
      opacity: 1,
      blendMode: "source-over",
      target: "text",
      params: defaultParams,
    };
    const stackIdx = layers.findIndex((l) => l.type === "duplicateStack");
    if (stackIdx >= 0) {
      layers.splice(stackIdx, 0, newL);
    } else {
      const strokeIdx = layers.findIndex((l) => l.type === "stroke");
      if (strokeIdx >= 0) {
        layers.splice(strokeIdx, 0, newL);
      } else {
        const maskIdx = layers.findIndex((l) => l.type === "mask" || l.type === "filter");
        if (maskIdx >= 0) {
          layers.splice(maskIdx, 0, newL);
        } else {
          layers.push(newL);
        }
      }
    }
  }

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.enabled !== undefined) nextLegacyConfig.bevelEnabled = patch.enabled;
    if (patch.bevelDepth !== undefined) nextLegacyConfig.bevelDepth = patch.bevelDepth;
    if (patch.bevelHighlight !== undefined) nextLegacyConfig.bevelHighlight = patch.bevelHighlight;
    if (patch.bevelShadow !== undefined) nextLegacyConfig.bevelShadow = patch.bevelShadow;
    if (patch.bevelDirection !== undefined) nextLegacyConfig.bevelDirection = patch.bevelDirection;
    if (patch.bevelCoreColor !== undefined) nextLegacyConfig.bevelCoreColor = patch.bevelCoreColor;
    if (patch.bevelEdgeColor !== undefined) nextLegacyConfig.bevelEdgeColor = patch.bevelEdgeColor;
    if (patch.bevelEdgeWidth !== undefined) nextLegacyConfig.bevelEdgeWidth = patch.bevelEdgeWidth;
    if (patch.bevelBlur !== undefined) nextLegacyConfig.bevelBlur = patch.bevelBlur;
    if (patch.bevelBlurColor !== undefined) nextLegacyConfig.bevelBlurColor = patch.bevelBlurColor;
    if (patch.bevelPerspectiveEnabled !== undefined) nextLegacyConfig.bevelPerspectiveEnabled = patch.bevelPerspectiveEnabled;
    if (patch.bevelVanishingPointX !== undefined) nextLegacyConfig.bevelVanishingPointX = patch.bevelVanishingPointX;
    if (patch.bevelVanishingPointY !== undefined) nextLegacyConfig.bevelVanishingPointY = patch.bevelVanishingPointY;
    if (patch.bevelFocalLength !== undefined) nextLegacyConfig.bevelFocalLength = patch.bevelFocalLength;
  }

  return {
    ...doc,
    effectLayers: layers,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates or creates the Stack Extrusion (multi-layer overlaps) in a SceneDocument.
 */
export function updateSceneStack(
  doc: SceneDocument,
  patch: Partial<{
    enabled: boolean;
    stackCount: number;
    stackOffsetX: number;
    stackOffsetY: number;
    stackOpacityDecay: number;
    stackColor1: string;
    stackColor2: string;
    stackColor3: string;
    stackColor4: string;
  }>
): SceneDocument {
  let found = false;
  const nextLayers = doc.effectLayers.map((layer) => {
    if (layer.type === "duplicateStack") {
      found = true;
      const nextParams = { ...layer.params };
      if (patch.stackCount !== undefined) nextParams.stackCount = patch.stackCount;
      if (patch.stackOffsetX !== undefined) nextParams.stackOffsetX = patch.stackOffsetX;
      if (patch.stackOffsetY !== undefined) nextParams.stackOffsetY = patch.stackOffsetY;
      if (patch.stackOpacityDecay !== undefined) nextParams.stackOpacityDecay = patch.stackOpacityDecay;
      if (patch.stackColor1 !== undefined) nextParams.stackColor1 = patch.stackColor1;
      if (patch.stackColor2 !== undefined) nextParams.stackColor2 = patch.stackColor2;
      if (patch.stackColor3 !== undefined) nextParams.stackColor3 = patch.stackColor3;
      if (patch.stackColor4 !== undefined) nextParams.stackColor4 = patch.stackColor4;

      const enabled = patch.enabled !== undefined ? patch.enabled : layer.enabled;
      if (patch.enabled !== undefined) {
        nextParams.stackEnabled = patch.enabled;
      }
      return {
        ...layer,
        enabled,
        params: nextParams,
      };
    }
    return layer;
  });

  const layers = [...nextLayers];
  if (!found) {
    const defaultParams = {
      stackEnabled: patch.enabled ?? true,
      stackCount: patch.stackCount ?? 3,
      stackOffsetX: patch.stackOffsetX ?? 10,
      stackOffsetY: patch.stackOffsetY ?? -10,
      stackOpacityDecay: patch.stackOpacityDecay ?? 20,
      stackColor1: patch.stackColor1 ?? "#FF7C00",
      stackColor2: patch.stackColor2 ?? "#00FFDD",
      stackColor3: patch.stackColor3 ?? "#FF00AA",
      stackColor4: patch.stackColor4 ?? "#AA00FF",
    };
    const newL: EffectLayer = {
      id: newLayerId(),
      type: "duplicateStack",
      name: "Stack Extrusion",
      enabled: patch.enabled ?? true,
      opacity: 1,
      blendMode: "source-over",
      target: "text",
      params: defaultParams,
    };
    const strokeIdx = layers.findIndex((l) => l.type === "stroke");
    if (strokeIdx >= 0) {
      layers.splice(strokeIdx, 0, newL);
    } else {
      const maskIdx = layers.findIndex((l) => l.type === "mask" || l.type === "filter");
      if (maskIdx >= 0) {
        layers.splice(maskIdx, 0, newL);
      } else {
        layers.push(newL);
      }
    }
  }

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.enabled !== undefined) nextLegacyConfig.stackEnabled = patch.enabled;
    if (patch.stackCount !== undefined) nextLegacyConfig.stackCount = patch.stackCount;
    if (patch.stackOffsetX !== undefined) nextLegacyConfig.stackOffsetX = patch.stackOffsetX;
    if (patch.stackOffsetY !== undefined) nextLegacyConfig.stackOffsetY = patch.stackOffsetY;
    if (patch.stackOpacityDecay !== undefined) nextLegacyConfig.stackOpacityDecay = patch.stackOpacityDecay;
    if (patch.stackColor1 !== undefined) nextLegacyConfig.stackColor1 = patch.stackColor1;
    if (patch.stackColor2 !== undefined) nextLegacyConfig.stackColor2 = patch.stackColor2;
    if (patch.stackColor3 !== undefined) nextLegacyConfig.stackColor3 = patch.stackColor3;
    if (patch.stackColor4 !== undefined) nextLegacyConfig.stackColor4 = patch.stackColor4;
  }

  return {
    ...doc,
    effectLayers: layers,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates or creates the Fill layer in a SceneDocument.
 */
export function updateSceneFill(
  doc: SceneDocument,
  patch: Partial<{
    fillType: "solid" | "linear" | "radial" | "pattern" | "none";
    fillColor: string;
    fillGradientAngle: number;
    fillGradientStops: GradientStop[];
    patternType: "chalk" | "noise" | "grunge" | "carbon" | "stripes" | "film" | "brushed" | "marble" | "halftone" | "paper";
    perCharFillEnabled: boolean;
    charFillColors: string[];
  }>
): SceneDocument {
  let found = false;
  const nextLayers = doc.effectLayers.map((layer) => {
    if (layer.type === "fill") {
      found = true;
      const nextParams = { ...layer.params };
      if (patch.fillType !== undefined) nextParams.fillType = patch.fillType;
      if (patch.fillColor !== undefined) nextParams.fillColor = patch.fillColor;
      if (patch.fillGradientAngle !== undefined) nextParams.fillGradientAngle = patch.fillGradientAngle;
      if (patch.fillGradientStops !== undefined) nextParams.fillGradientStops = patch.fillGradientStops;
      if (patch.patternType !== undefined) nextParams.patternType = patch.patternType;
      if (patch.perCharFillEnabled !== undefined) nextParams.perCharFillEnabled = patch.perCharFillEnabled;
      if (patch.charFillColors !== undefined) nextParams.charFillColors = patch.charFillColors;

      const enabled = patch.fillType !== undefined ? patch.fillType !== "none" : layer.enabled;
      return {
        ...layer,
        enabled,
        params: nextParams,
      };
    }
    return layer;
  });

  const layers = [...nextLayers];
  if (!found) {
    const defaultParams = {
      fillType: patch.fillType ?? "solid",
      fillColor: patch.fillColor ?? "#FFFFFF",
      fillGradientAngle: patch.fillGradientAngle ?? 90,
      fillGradientStops: patch.fillGradientStops ?? [
        { color: "#FFFFFF", offset: 0 },
        { color: "#E0E0E0", offset: 100 },
      ],
      patternType: patch.patternType ?? "chalk",
      perCharFillEnabled: patch.perCharFillEnabled ?? false,
      charFillColors: patch.charFillColors ?? [],
    };
    const newL: EffectLayer = {
      id: newLayerId(),
      type: "fill",
      name: "Fill",
      enabled: patch.fillType !== "none",
      opacity: 1,
      blendMode: "source-over",
      target: "text",
      params: defaultParams,
    };
    const maskIdx = layers.findIndex((l) => l.type === "mask" || l.type === "filter");
    if (maskIdx >= 0) {
      layers.splice(maskIdx, 0, newL);
    } else {
      layers.push(newL);
    }
  }

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.fillType !== undefined) nextLegacyConfig.fillType = patch.fillType;
    if (patch.fillColor !== undefined) nextLegacyConfig.fillColor = patch.fillColor;
    if (patch.fillGradientAngle !== undefined) nextLegacyConfig.fillGradientAngle = patch.fillGradientAngle;
    if (patch.fillGradientStops !== undefined) nextLegacyConfig.fillGradientStops = patch.fillGradientStops;
    if (patch.patternType !== undefined) nextLegacyConfig.patternType = patch.patternType;
    if (patch.perCharFillEnabled !== undefined) nextLegacyConfig.perCharFillEnabled = patch.perCharFillEnabled;
    if (patch.charFillColors !== undefined) nextLegacyConfig.charFillColors = patch.charFillColors;
  }

  return {
    ...doc,
    effectLayers: layers,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates a specific Glow layer in a SceneDocument by index.
 * If the index is out of bounds, appends new default glow layers until reached.
 */
export function updateSceneGlow(
  doc: SceneDocument,
  index: number,
  patch: Partial<GlowLayer>
): SceneDocument {
  const currentGlowLayers = doc.effectLayers.filter((l) => l.type === "glow");
  const layers = [...doc.effectLayers];

  if (index >= currentGlowLayers.length) {
    const needed = index - currentGlowLayers.length + 1;
    for (let i = 0; i < needed; i++) {
      const isTarget = i === needed - 1;
      const defaultGlow: GlowLayer = {
        enabled: isTarget ? (patch.enabled ?? false) : false,
        color: isTarget ? (patch.color ?? "#7C6FFF") : "#7C6FFF",
        blur: isTarget ? (patch.blur ?? 20) : 20,
        opacity: isTarget ? (patch.opacity ?? 80) : 80,
        type: isTarget ? (patch.type ?? "outer") : "outer",
        strength: isTarget ? patch.strength : undefined,
        spread: isTarget ? patch.spread : undefined,
      };

      const newL: EffectLayer = {
        id: newLayerId(),
        type: "glow",
        name: `Glow ${currentGlowLayers.length + i + 1}`,
        enabled: defaultGlow.enabled,
        opacity: defaultGlow.opacity / 100,
        blendMode: "source-over",
        target: "text",
        params: defaultGlow as unknown as Record<string, unknown>,
      };

      const lastGlowIdx = layers.map((l) => l.type).lastIndexOf("glow");
      if (lastGlowIdx >= 0) {
        layers.splice(lastGlowIdx + 1 + i, 0, newL);
      } else {
        const insertIdx = layers.findIndex((l) => l.type === "mask" || l.type === "filter");
        if (insertIdx >= 0) {
          layers.splice(insertIdx + i, 0, newL);
        } else {
          layers.push(newL);
        }
      }
    }
  } else {
    let glowCount = 0;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === "glow") {
        if (glowCount === index) {
          const layer = layers[i];
          const nextParams = { ...layer.params, ...patch } as unknown as GlowLayer;
          const enabled = patch.enabled !== undefined ? patch.enabled : layer.enabled;
          const opacity = patch.opacity !== undefined ? patch.opacity / 100 : layer.opacity;
          layers[i] = {
            ...layer,
            enabled,
            opacity,
            params: nextParams as unknown as Record<string, unknown>,
          };
          break;
        }
        glowCount++;
      }
    }
  }

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (!nextLegacyConfig.glowLayers) nextLegacyConfig.glowLayers = [];
    while (nextLegacyConfig.glowLayers.length <= index) {
      nextLegacyConfig.glowLayers.push({
        enabled: false,
        color: "#7C6FFF",
        blur: 20,
        opacity: 80,
        type: "outer",
      });
    }
    nextLegacyConfig.glowLayers[index] = { ...nextLegacyConfig.glowLayers[index], ...patch };
  }

  return {
    ...doc,
    effectLayers: layers,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates Canvas dimensions on a SceneDocument.
 */
export function updateSceneCanvas(
  doc: SceneDocument,
  patch: Partial<{
    width: number;
    height: number;
    background: string;
  }>
): SceneDocument {
  const nextCanvas = { ...doc.canvas };
  if (patch.width !== undefined) nextCanvas.width = patch.width;
  if (patch.height !== undefined) nextCanvas.height = patch.height;
  if (patch.background !== undefined) nextCanvas.background = patch.background;

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.width !== undefined) nextLegacyConfig.canvasWidth = patch.width;
    if (patch.height !== undefined) nextLegacyConfig.canvasHeight = patch.height;
  }

  return {
    ...doc,
    canvas: nextCanvas,
    legacyConfig: nextLegacyConfig,
  };
}

/**
 * Updates Custom/Procedural Engine parameters (like Ink Brush) on a SceneDocument.
 */
export function updateSceneCustomEngine(
  doc: SceneDocument,
  patch: Partial<{
    customRenderer: string;
    inkColor: string;
    bristleDensity: number;
    bristleSkipRate: number;
    dripRate: number;
    dripMaxLength: number;
    grainDensity: number;
    skewX: number;
  }>
): SceneDocument {
  let nextEngineId = doc.customEngineId;
  if (patch.customRenderer !== undefined) {
    nextEngineId = patch.customRenderer ? (LEGACY_RENDERER_MAP[patch.customRenderer] ?? null) : null;
  }

  const nextParams = { ...doc.engineParams, ...patch };
  delete nextParams.customRenderer;

  const nextLayers = doc.effectLayers.map((layer) => {
    if (layer.type === "customEngine") {
      if (layer.name === "Custom Engine") {
        return {
          ...layer,
          params: { ...layer.params, engineId: nextEngineId },
        };
      } else if (layer.name === "Engine Params") {
        return {
          ...layer,
          params: { ...layer.params, ...nextParams },
        };
      }
    }
    return layer;
  });

  const nextLegacyConfig = doc.legacyConfig ? { ...doc.legacyConfig } : undefined;
  if (nextLegacyConfig) {
    if (patch.customRenderer !== undefined) nextLegacyConfig.customRenderer = patch.customRenderer;
    if (patch.inkColor !== undefined) nextLegacyConfig.inkColor = patch.inkColor;
    if (patch.bristleDensity !== undefined) nextLegacyConfig.bristleDensity = patch.bristleDensity;
    if (patch.bristleSkipRate !== undefined) nextLegacyConfig.bristleSkipRate = patch.bristleSkipRate;
    if (patch.dripRate !== undefined) nextLegacyConfig.dripRate = patch.dripRate;
    if (patch.dripMaxLength !== undefined) nextLegacyConfig.dripMaxLength = patch.dripMaxLength;
    if (patch.grainDensity !== undefined) nextLegacyConfig.grainDensity = patch.grainDensity;
    if (patch.skewX !== undefined) nextLegacyConfig.skewX = patch.skewX;
  }

  return {
    ...doc,
    customEngineId: nextEngineId,
    engineParams: nextParams,
    effectLayers: nextLayers,
    legacyConfig: nextLegacyConfig,
  };
}

// ─── Fluent TextEffectBuilder Class ──────────────────────────────────────────

/**
 * Fluent API builder class designed to easily construct, update, and export
 * text effects programmatically.
 */
export class TextEffectBuilder {
  private config: TextEffectConfig;

  constructor(initialConfig?: Partial<TextEffectConfig>) {
    this.config = { ...defaultConfig, ...initialConfig };
  }

  /** Load builder from an existing TextEffectConfig object */
  static fromConfig(config: TextEffectConfig): TextEffectBuilder {
    return new TextEffectBuilder(config);
  }

  /** Load builder from an existing SceneDocument */
  static fromScene(scene: SceneDocument): TextEffectBuilder {
    return new TextEffectBuilder(sceneToConfig(scene));
  }

  /**
   * Load builder from a downloaded TextEffectDefinition.
   * Resolves the styling definition structure to a flat engine config.
   */
  static fromDefinition(
    effect: TextEffectDefinition,
    text = "CLYPRA",
    fontSize = 80,
    canvasWidth = 800,
    canvasHeight = 200
  ): TextEffectBuilder {
    const config = _buildConfig(effect, text, fontSize, canvasWidth, canvasHeight);
    return new TextEffectBuilder(config);
  }

  /** Set text string content */
  setText(text: string): this {
    this.config.text = text;
    return this;
  }

  /** Configure Font and alignment settings */
  setFont(
    font: Partial<{
      family: string;
      weight: number;
      style: "normal" | "italic";
      size: number;
      letterSpacing: number;
      lineHeight: number;
    }>
  ): this {
    if (font.family !== undefined) this.config.fontFamily = font.family;
    if (font.weight !== undefined) this.config.fontWeight = font.weight;
    if (font.style !== undefined) this.config.fontStyle = font.style;
    if (font.size !== undefined) this.config.fontSize = font.size;
    if (font.letterSpacing !== undefined) this.config.letterSpacing = font.letterSpacing;
    if (font.lineHeight !== undefined) this.config.lineHeight = font.lineHeight;
    return this;
  }

  /** Configure Background Panel (bounding plate) */
  setPanel(
    panel: Partial<{
      enabled: boolean;
      color: string;
      opacity: number;
      radius: number;
      paddingX: number;
      paddingY: number;
      strokeEnabled: boolean;
      strokeColor: string;
      strokeWidth: number;
    }>
  ): this {
    if (panel.enabled !== undefined) this.config.panelEnabled = panel.enabled;
    if (panel.color !== undefined) this.config.panelColor = panel.color;
    if (panel.opacity !== undefined) this.config.panelOpacity = panel.opacity;
    if (panel.radius !== undefined) this.config.panelRadius = panel.radius;
    if (panel.paddingX !== undefined) this.config.panelPaddingX = panel.paddingX;
    if (panel.paddingY !== undefined) this.config.panelPaddingY = panel.paddingY;
    if (panel.strokeEnabled !== undefined) this.config.panelStrokeEnabled = panel.strokeEnabled;
    if (panel.strokeColor !== undefined) this.config.panelStrokeColor = panel.strokeColor;
    if (panel.strokeWidth !== undefined) this.config.panelStrokeWidth = panel.strokeWidth;
    return this;
  }

  /** Configure outline / stroke styling */
  setStroke(
    stroke: Partial<{
      enabled: boolean;
      color: string;
      width: number;
      position: "outside" | "center" | "inside";
      opacity: number;
      lineJoin: "round" | "miter" | "bevel";
      blur: number;
      type: "single" | "double" | "neon";
      colorSecondary: string;
      widthSecondary: number;
      fadeRange: number;
    }>
  ): this {
    if (stroke.enabled !== undefined) this.config.strokeEnabled = stroke.enabled;
    if (stroke.color !== undefined) this.config.strokeColor = stroke.color;
    if (stroke.width !== undefined) this.config.strokeWidth = stroke.width;
    if (stroke.position !== undefined) this.config.strokePosition = stroke.position;
    if (stroke.opacity !== undefined) this.config.strokeOpacity = stroke.opacity;
    if (stroke.lineJoin !== undefined) this.config.strokeLineJoin = stroke.lineJoin;
    if (stroke.blur !== undefined) this.config.strokeBlur = stroke.blur;
    if (stroke.type !== undefined) this.config.strokeType = stroke.type;
    if (stroke.colorSecondary !== undefined) this.config.strokeColorSecondary = stroke.colorSecondary;
    if (stroke.widthSecondary !== undefined) this.config.strokeWidthSecondary = stroke.widthSecondary;
    if (stroke.fadeRange !== undefined) this.config.strokeFadeRange = stroke.fadeRange;
    return this;
  }

  /** Configure drop shadow / inner shadow styling */
  setShadow(
    shadow: Partial<{
      enabled: boolean;
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
      opacity: number;
      type: "drop" | "inner";
    }>
  ): this {
    if (shadow.enabled !== undefined) this.config.shadowEnabled = shadow.enabled;
    if (shadow.color !== undefined) this.config.shadowColor = shadow.color;
    if (shadow.blur !== undefined) this.config.shadowBlur = shadow.blur;
    if (shadow.offsetX !== undefined) this.config.shadowOffsetX = shadow.offsetX;
    if (shadow.offsetY !== undefined) this.config.shadowOffsetY = shadow.offsetY;
    if (shadow.opacity !== undefined) this.config.shadowOpacity = shadow.opacity;
    if (shadow.type !== undefined) this.config.shadowType = shadow.type;
    return this;
  }

  /** Configure a specific glow layer by index */
  setGlow(index: number, glow: Partial<GlowLayer>): this {
    if (!this.config.glowLayers) this.config.glowLayers = [];
    while (this.config.glowLayers.length <= index) {
      this.config.glowLayers.push({ enabled: false, color: "#7C6FFF", blur: 20, opacity: 80, type: "outer" });
    }
    this.config.glowLayers[index] = { ...this.config.glowLayers[index], ...glow };
    return this;
  }

  /** Configure solid color fill */
  setFillColor(color: string): this {
    this.config.fillType = "solid";
    this.config.fillColor = color;
    return this;
  }

  /** Configure linear gradient fill */
  setFillGradient(angle: number, stops: GradientStop[]): this {
    this.config.fillType = "linear";
    this.config.fillGradientAngle = angle;
    this.config.fillGradientStops = stops;
    return this;
  }

  /** Configure texture pattern fill */
  setFillPattern(patternType: NonNullable<TextEffectConfig["patternType"]>): this {
    this.config.fillType = "pattern";
    this.config.patternType = patternType;
    return this;
  }

  /** Configure per-character solid color fill overrides */
  setPerCharFill(enabled: boolean, colors: string[]): this {
    this.config.perCharFillEnabled = enabled;
    this.config.charFillColors = colors;
    return this;
  }

  /** Configure 3D extrusion/bevel settings */
  setBevel(
    bevel: Partial<{
      enabled: boolean;
      depth: number;
      highlight: string;
      bevelShadow: string;
      direction: "bottom-right" | "bottom" | "right";
      coreColor: string;
      edgeColor: string;
      edgeWidth: number;
      blur: number;
      blurColor: string;
      perspectiveEnabled: boolean;
      vanishingPointX: number;
      vanishingPointY: number;
      focalLength: number;
    }>
  ): this {
    if (bevel.enabled !== undefined) this.config.bevelEnabled = bevel.enabled;
    if (bevel.depth !== undefined) this.config.bevelDepth = bevel.depth;
    if (bevel.highlight !== undefined) this.config.bevelHighlight = bevel.highlight;
    if (bevel.bevelShadow !== undefined) this.config.bevelShadow = bevel.bevelShadow;
    if (bevel.direction !== undefined) this.config.bevelDirection = bevel.direction;
    if (bevel.coreColor !== undefined) this.config.bevelCoreColor = bevel.coreColor;
    if (bevel.edgeColor !== undefined) this.config.bevelEdgeColor = bevel.edgeColor;
    if (bevel.edgeWidth !== undefined) this.config.bevelEdgeWidth = bevel.edgeWidth;
    if (bevel.blur !== undefined) this.config.bevelBlur = bevel.blur;
    if (bevel.blurColor !== undefined) this.config.bevelBlurColor = bevel.blurColor;
    if (bevel.perspectiveEnabled !== undefined) this.config.bevelPerspectiveEnabled = bevel.perspectiveEnabled;
    if (bevel.vanishingPointX !== undefined) this.config.bevelVanishingPointX = bevel.vanishingPointX;
    if (bevel.vanishingPointY !== undefined) this.config.bevelVanishingPointY = bevel.vanishingPointY;
    if (bevel.focalLength !== undefined) this.config.bevelFocalLength = bevel.focalLength;
    return this;
  }

  /** Configure multi-stack duplicate extrusion */
  setStack(
    stack: Partial<{
      enabled: boolean;
      count: number;
      offsetX: number;
      offsetY: number;
      opacityDecay: number;
      color1: string;
      color2: string;
      color3: string;
      color4: string;
    }>
  ): this {
    if (stack.enabled !== undefined) this.config.stackEnabled = stack.enabled;
    if (stack.count !== undefined) this.config.stackCount = stack.count;
    if (stack.offsetX !== undefined) this.config.stackOffsetX = stack.offsetX;
    if (stack.offsetY !== undefined) this.config.stackOffsetY = stack.offsetY;
    if (stack.opacityDecay !== undefined) this.config.stackOpacityDecay = stack.opacityDecay;
    if (stack.color1 !== undefined) this.config.stackColor1 = stack.color1;
    if (stack.color2 !== undefined) this.config.stackColor2 = stack.color2;
    if (stack.color3 !== undefined) this.config.stackColor3 = stack.color3;
    if (stack.color4 !== undefined) this.config.stackColor4 = stack.color4;
    return this;
  }

  /** Configure canvas viewport size, alignment positioning, and wrapping behavior */
  setCanvas(
    canvas: Partial<{
      width: number;
      height: number;
      posX: "left" | "center" | "right";
      posY: "top" | "middle" | "bottom";
      wrapText: boolean;
      autoFitText: boolean;
    }>
  ): this {
    if (canvas.width !== undefined) this.config.canvasWidth = canvas.width;
    if (canvas.height !== undefined) this.config.canvasHeight = canvas.height;
    if (canvas.posX !== undefined) this.config.textPosX = canvas.posX;
    if (canvas.posY !== undefined) this.config.textPosY = canvas.posY;
    if (canvas.wrapText !== undefined) this.config.wrapText = canvas.wrapText;
    if (canvas.autoFitText !== undefined) this.config.autoFitText = canvas.autoFitText;
    return this;
  }

  /** Configure procedural InkBrushEngine variables (when customRenderer = InkBrushEngine) */
  setInkBrush(
    ink: Partial<{
      inkColor: string;
      bristleDensity: number;
      bristleSkipRate: number;
      dripRate: number;
      dripMaxLength: number;
      grainDensity: number;
      skewX: number;
    }>
  ): this {
    if (ink.inkColor !== undefined) this.config.inkColor = ink.inkColor;
    if (ink.bristleDensity !== undefined) this.config.bristleDensity = ink.bristleDensity;
    if (ink.bristleSkipRate !== undefined) this.config.bristleSkipRate = ink.bristleSkipRate;
    if (ink.dripRate !== undefined) this.config.dripRate = ink.dripRate;
    if (ink.dripMaxLength !== undefined) this.config.dripMaxLength = ink.dripMaxLength;
    if (ink.grainDensity !== undefined) this.config.grainDensity = ink.grainDensity;
    if (ink.skewX !== undefined) this.config.skewX = ink.skewX;
    return this;
  }

  /** Build and return a copy of the updated TextEffectConfig */
  buildConfig(): TextEffectConfig {
    return { ...this.config };
  }

  /** Build and return a SceneDocument prepared for rendering with evaluateScene */
  buildScene(): SceneDocument {
    return textEffectConfigToScene(this.config);
  }
}
