import { describe, it, expect } from "vitest";
import { builtInPresets } from "../presets";
import { textEffectConfigToScene, sceneToConfig } from "./migrate";
import { blendConfigs } from "./blend";
import { getPresetScene } from "./recipes";

describe("textEffectConfigToScene migration", () => {
  it("round-trips all built-in presets without losing key fields", () => {
    for (const preset of builtInPresets) {
      const scene = textEffectConfigToScene(preset.config);
      const back = sceneToConfig(scene);

      expect(back.text).toBe(preset.config.text);
      expect(back.fontFamily).toBe(preset.config.fontFamily);
      expect(back.fillType).toBe(preset.config.fillType);
      expect(back.fillColor).toBe(preset.config.fillColor);
      expect(back.strokeEnabled).toBe(preset.config.strokeEnabled);
      expect(back.bevelEnabled).toBe(preset.config.bevelEnabled);
      expect(back.customRenderer).toBe(preset.config.customRenderer);
      expect(back.glowLayers.length).toBeGreaterThanOrEqual(3);
      expect(scene.effectLayers.length).toBeGreaterThan(5);
      expect(scene.version).toBe(1);
    }
  });

  it("caches preset scenes", () => {
    const a = getPresetScene(builtInPresets[0]);
    const b = getPresetScene(builtInPresets[0]);
    expect(a).not.toBe(b);
    expect(a.effectName).toBe(b.effectName);
  });

  it("round-trips per-character fill colors", () => {
    const cfg = {
      ...builtInPresets[0].config,
      fillType: "solid" as const,
      perCharFillEnabled: true,
      charFillColors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
    };
    const scene = textEffectConfigToScene(cfg);
    const back = sceneToConfig(scene);
    expect(back.perCharFillEnabled).toBe(true);
    expect(back.charFillColors?.slice(0, 3)).toEqual(["#ff0000", "#00ff00", "#0000ff"]);
  });

  it("blends two configs", () => {
    const a = builtInPresets[0].config;
    const b = builtInPresets[1].config;
    const mid = blendConfigs(a, b, 0.5);
    expect(mid.fontSize).toBe(Math.round((a.fontSize + b.fontSize) / 2));
  });
});
