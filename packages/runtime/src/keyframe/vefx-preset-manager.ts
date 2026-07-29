import type { VefxPresetTemplate, KeyframePoint, AudioBinding, NodeGraph } from "@clypra-studio/types";

export class VefxPresetManager {
  public static exportPreset(
    name: string,
    keyframes: KeyframePoint[],
    audioBindings?: AudioBinding[],
    nodeGraph?: NodeGraph
  ): string {
    const preset: VefxPresetTemplate = {
      version: "1.0.0",
      name,
      keyframes,
      audioBindings,
      nodeGraph,
    };

    return JSON.stringify(preset, null, 2);
  }

  public static importPreset(jsonContent: string): VefxPresetTemplate {
    const parsed = JSON.parse(jsonContent) as VefxPresetTemplate;
    if (!parsed || !parsed.version || !parsed.name || !Array.isArray(parsed.keyframes)) {
      throw new Error("Invalid .vefx preset file structure.");
    }
    return parsed;
  }
}
