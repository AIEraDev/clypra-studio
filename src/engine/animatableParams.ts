import type { EffectLayer, EffectLayerType } from "./schema";

export interface AnimatableParamDef {
  path: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const LAYER_OPACITY: AnimatableParamDef = {
  path: "layerOpacity",
  label: "Layer opacity",
  min: 0,
  max: 1,
  step: 0.01,
};

const BY_TYPE: Partial<Record<EffectLayerType, AnimatableParamDef[]>> = {
  shadow: [
    { path: "shadowOffsetX", label: "Offset X", min: -120, max: 120, step: 1 },
    { path: "shadowOffsetY", label: "Offset Y", min: -120, max: 120, step: 1 },
    { path: "shadowBlur", label: "Blur", min: 0, max: 80, step: 1 },
    { path: "shadowOpacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%" },
  ],
  glow: [
    { path: "blur", label: "Blur", min: 0, max: 120, step: 1 },
    { path: "opacity", label: "Glow opacity", min: 0, max: 100, step: 1, unit: "%" },
    { path: "spread", label: "Spread", min: 0, max: 100, step: 1 },
    { path: "strength", label: "Strength", min: 0, max: 100, step: 1 },
  ],
  extrusion: [
    { path: "bevelDepth", label: "Depth", min: 0, max: 80, step: 1 },
    { path: "bevelHighlight", label: "Highlight", min: 0, max: 100, step: 1 },
    { path: "bevelShadow", label: "Shadow", min: 0, max: 100, step: 1 },
    { path: "bevelBlur", label: "Ambient blur", min: 0, max: 40, step: 1 },
  ],
  duplicateStack: [
    { path: "stackOffsetX", label: "Stack offset X", min: -40, max: 40, step: 1 },
    { path: "stackOffsetY", label: "Stack offset Y", min: -40, max: 40, step: 1 },
    { path: "stackCount", label: "Stack count", min: 1, max: 24, step: 1 },
  ],
  stroke: [
    { path: "strokeWidth", label: "Width", min: 0, max: 40, step: 0.5 },
    { path: "strokeOpacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%" },
    { path: "strokeBlur", label: "Blur", min: 0, max: 30, step: 1 },
  ],
  fill: [{ path: "fillOpacity", label: "Fill opacity", min: 0, max: 100, step: 1, unit: "%" }],
  panel: [
    { path: "panelOpacity", label: "Panel opacity", min: 0, max: 100, step: 1, unit: "%" },
    { path: "panelPaddingX", label: "Padding X", min: 0, max: 120, step: 1 },
    { path: "panelPaddingY", label: "Padding Y", min: 0, max: 120, step: 1 },
  ],
  mask: [{ path: "revealProgress", label: "Reveal", min: 0, max: 1, step: 0.01 }],
  filter: [
    { path: "blur", label: "Blur", min: 0, max: 20, step: 0.1 },
    { path: "bloom", label: "Bloom", min: 0, max: 2, step: 0.05 },
  ],
};

export function getAnimatableParamsForLayer(layer: EffectLayer): AnimatableParamDef[] {
  const typeParams = BY_TYPE[layer.type] ?? [];
  return [LAYER_OPACITY, ...typeParams];
}

export function getAnimatableParamDef(layer: EffectLayer, paramPath: string): AnimatableParamDef | undefined {
  return getAnimatableParamsForLayer(layer).find((p) => p.path === paramPath);
}

export function readLayerScalar(layer: EffectLayer, paramPath: string): number {
  if (paramPath === "layerOpacity") return layer.opacity;
  const parts = paramPath.split(".");
  let target: Record<string, unknown> = layer.params;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = target[key];
    if (typeof next !== "object" || next === null) return 0;
    target = next as Record<string, unknown>;
  }
  const leaf = parts[parts.length - 1];
  const v = target[leaf];
  return typeof v === "number" ? v : 0;
}
