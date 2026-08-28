import { describe, expect, it } from "vitest";
import {
  defaultConfig,
  sceneToConfig,
  textEffectConfigToScene,
} from "@clypra-studio/engine";
import { restoreCanonicalScene } from "./studioSceneState";

describe("Studio canonical scene state", () => {
  it("repairs legacy config/scene drift for all visual layer activation", () => {
    const config = {
      ...defaultConfig,
      glowLayers: defaultConfig.glowLayers.map((layer, index) =>
        index === 0
          ? {
              ...layer,
              enabled: true,
              color: "#FFFFFF",
              blur: 95,
              opacity: 100,
            }
          : layer,
      ),
      panelEnabled: false,
      shadowEnabled: true,
      strokeEnabled: true,
    };
    const staleScene = textEffectConfigToScene(config);
    staleScene.effectLayers = staleScene.effectLayers.map((layer) =>
      layer.type === "glow"
        ? { ...layer, enabled: false }
        : layer,
    );
    staleScene.timeline = {
      ...staleScene.timeline,
      duration: 7,
    };

    const restored = restoreCanonicalScene(
      { config, scene: staleScene },
      defaultConfig,
    );
    const restoredConfig = sceneToConfig(restored);

    expect(restored.effectLayers.find((layer) => layer.type === "glow")?.enabled).toBe(true);
    expect(restoredConfig.glowLayers[0]).toMatchObject({
      enabled: true,
      blur: 95,
      opacity: 100,
    });
    expect(restored.effectLayers.find((layer) => layer.type === "panel")?.enabled).toBe(false);
    expect(restored.effectLayers.find((layer) => layer.type === "shadow")?.enabled).toBe(true);
    expect(restored.timeline.duration).toBe(7);
  });

  it("canonicalizes scenes without turning present-but-disabled layers on", () => {
    const scene = textEffectConfigToScene({
      ...defaultConfig,
      glowLayers: [
        {
          ...defaultConfig.glowLayers[0],
          enabled: false,
          blur: 95,
        },
      ],
      panelEnabled: false,
    });

    const restored = restoreCanonicalScene({ scene }, defaultConfig);

    expect(restored.effectLayers.map((layer) => layer.id)).toContain("glow-1");
    expect(restored.effectLayers.find((layer) => layer.id === "glow-1")?.enabled).toBe(false);
    expect(restored.effectLayers.find((layer) => layer.id === "panel")?.enabled).toBe(false);
  });
});
