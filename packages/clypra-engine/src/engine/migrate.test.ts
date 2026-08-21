import { describe, it, expect } from "vitest";
import { defaultConfig } from "../presets";
import type { Preset } from "../types";
import { textEffectConfigToScene, sceneToConfig } from "./migrate";
import { blendConfigs } from "./blend";
import { getPresetScene } from "./recipes";

const samplePreset: Preset = {
  id: "test-preset-1",
  name: "Test Preset",
  category: "Classic",
  config: defaultConfig,
};

describe("textEffectConfigToScene migration", () => {
  it("round-trips default config without losing key fields", () => {
    const scene = textEffectConfigToScene(defaultConfig);
    const back = sceneToConfig(scene);

    expect(back.text).toBe(defaultConfig.text);
    expect(back.fontFamily).toBe(defaultConfig.fontFamily);
    expect(back.fillType).toBe(defaultConfig.fillType);
    expect(back.fillColor).toBe(defaultConfig.fillColor);
    expect(back.strokeEnabled).toBe(defaultConfig.strokeEnabled);
    expect(back.bevelEnabled).toBe(defaultConfig.bevelEnabled);
    expect(scene.version).toBe(1);
  });

  it("caches preset scenes", () => {
    const a = getPresetScene(samplePreset);
    const b = getPresetScene(samplePreset);
    expect(a).not.toBe(b);
    expect(a.effectName).toBe(b.effectName);
  });

  it("round-trips per-character fill colors", () => {
    const cfg = {
      ...defaultConfig,
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
    const a = { ...defaultConfig, fontSize: 40 };
    const b = { ...defaultConfig, fontSize: 80 };
    const mid = blendConfigs(a, b, 0.5);
    expect(mid.fontSize).toBe(60);
  });
});
