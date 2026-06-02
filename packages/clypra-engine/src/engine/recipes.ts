import type { Preset } from "../types";
import { builtInPresets } from "../presets";
import type { SceneDocument, StyleRecipe } from "./schema";
import { textEffectConfigToScene } from "./migrate";

const sceneCache = new Map<string, SceneDocument>();

export function getPresetScene(preset: Preset): SceneDocument {
  if (sceneCache.has(preset.id)) {
    return structuredClone(sceneCache.get(preset.id)!);
  }
  const scene = textEffectConfigToScene(preset.config);
  sceneCache.set(preset.id, scene);
  return structuredClone(scene);
}

export function presetToRecipe(preset: Preset): StyleRecipe {
  const scene = getPresetScene(preset);
  return {
    id: preset.id,
    name: preset.name,
    category: preset.category,
    layers: structuredClone(scene.effectLayers),
    exposed: [
      "fill.fillColor",
      "stroke.strokeWidth",
      "shadow.shadowBlur",
      "glow.0.opacity",
    ],
    tags: [preset.category || "Classic", preset.id],
    customEngineId: scene.customEngineId,
    scene,
  };
}

export const builtInRecipes: StyleRecipe[] = builtInPresets.map(presetToRecipe);

export function applyRecipeToScene(
  base: SceneDocument,
  recipe: StyleRecipe
): SceneDocument {
  return {
    ...base,
    effectName: recipe.name,
    effectLayers: structuredClone(recipe.layers),
    customEngineId: recipe.customEngineId ?? null,
    engineParams: recipe.scene?.engineParams,
    compositor: recipe.scene?.compositor ?? base.compositor,
    timeline: recipe.scene?.timeline ?? base.timeline,
  };
}

export function clearRecipeCache(): void {
  sceneCache.clear();
}
