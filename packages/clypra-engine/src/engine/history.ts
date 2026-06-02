import type { TextEffectConfig } from "../types";
import type { SceneDocument } from "./schema";
import { textEffectConfigToScene, sceneToConfig } from "./migrate";

export function parseHistorySnapshot(raw: string): {
  scene: SceneDocument;
  config: TextEffectConfig;
} {
  const parsed = JSON.parse(raw) as SceneDocument | TextEffectConfig;
  if (typeof parsed === "object" && parsed !== null && "version" in parsed && (parsed as SceneDocument).version === 1 && Array.isArray((parsed as SceneDocument).effectLayers)) {
    const scene = parsed as SceneDocument;
    return { scene, config: sceneToConfig(scene) };
  }
  const config = parsed as TextEffectConfig;
  return { scene: textEffectConfigToScene(config), config };
}

export function snapshotScene(scene: SceneDocument): string {
  return JSON.stringify(scene);
}
