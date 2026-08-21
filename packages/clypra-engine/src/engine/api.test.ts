import { describe, it, expect } from "vitest";
import { defaultConfig } from "../presets";
import { textEffectConfigToScene } from "./migrate";
import {
  updateSceneText,
  updateScenePanel,
  updateSceneStroke,
  updateSceneShadow,
  updateSceneBevel,
  updateSceneStack,
  updateSceneFill,
  updateSceneGlow,
  updateSceneCanvas,
  updateSceneCustomEngine,
  TextEffectBuilder,
} from "./api";
import type { TextEffectDefinition } from "../types";

describe("Clypra Engine Programmatic API", () => {
  describe("Functional Scene Mutators", () => {
    it("updates scene text and font correctly", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      const updated = updateSceneText(scene, {
        content: "NEW TEXT",
        fontFamily: "Roboto",
        fontSize: 120,
        fontWeight: 400,
        fontStyle: "italic",
      });

      expect(updated.text.content).toBe("NEW TEXT");
      expect(updated.text.fontFamily).toBe("Roboto");
      expect(updated.text.fontSize).toBe(120);
      expect(updated.text.fontWeight).toBe(400);
      expect(updated.text.fontStyle).toBe("italic");

      // Verify legacyConfig sync
      expect(updated.legacyConfig?.text).toBe("NEW TEXT");
      expect(updated.legacyConfig?.fontFamily).toBe("Roboto");
      expect(updated.legacyConfig?.fontSize).toBe(120);
    });

    it("updates scene background panel (bounding plate)", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      // Disable first if present
      let updated = updateScenePanel(scene, { enabled: false });
      let panelLayer = updated.effectLayers.find((l) => l.type === "panel");
      expect(panelLayer).toBeDefined();
      expect(panelLayer?.enabled).toBe(false);
      expect(updated.legacyConfig?.panelEnabled).toBe(false);

      // Update color and radius and enable it
      updated = updateScenePanel(updated, {
        enabled: true,
        color: "#FF0000",
        radius: 20,
        opacity: 90,
      });

      panelLayer = updated.effectLayers.find((l) => l.type === "panel");
      expect(panelLayer?.enabled).toBe(true);
      expect(panelLayer?.params.panelColor).toBe("#FF0000");
      expect(panelLayer?.params.panelRadius).toBe(20);
      expect(panelLayer?.params.panelOpacity).toBe(90);

      expect(updated.legacyConfig?.panelEnabled).toBe(true);
      expect(updated.legacyConfig?.panelColor).toBe("#FF0000");
      expect(updated.legacyConfig?.panelRadius).toBe(20);
    });

    it("creates panel layer if it did not exist", () => {
      const scene = textEffectConfigToScene(defaultConfig);
      // Remove panel layer manually to simulate absence
      scene.effectLayers = scene.effectLayers.filter((l) => l.type !== "panel");

      const updated = updateScenePanel(scene, {
        enabled: true,
        color: "#00FF00",
      });

      const panelLayer = updated.effectLayers.find((l) => l.type === "panel");
      expect(panelLayer).toBeDefined();
      expect(panelLayer?.enabled).toBe(true);
      expect(panelLayer?.params.panelColor).toBe("#00FF00");
    });

    it("updates scene stroke", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      const updated = updateSceneStroke(scene, {
        enabled: true,
        strokeColor: "#0000FF",
        strokeWidth: 8,
      });

      const strokeLayer = updated.effectLayers.find((l) => l.type === "stroke");
      expect(strokeLayer?.enabled).toBe(true);
      expect(strokeLayer?.params.strokeColor).toBe("#0000FF");
      expect(strokeLayer?.params.strokeWidth).toBe(8);

      expect(updated.legacyConfig?.strokeEnabled).toBe(true);
      expect(updated.legacyConfig?.strokeColor).toBe("#0000FF");
      expect(updated.legacyConfig?.strokeWidth).toBe(8);
    });

    it("updates scene shadow", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      const updated = updateSceneShadow(scene, {
        enabled: true,
        shadowColor: "#000000",
        shadowBlur: 25,
      });

      const shadowLayer = updated.effectLayers.find((l) => l.type === "shadow");
      expect(shadowLayer?.enabled).toBe(true);
      expect(shadowLayer?.params.shadowColor).toBe("#000000");
      expect(shadowLayer?.params.shadowBlur).toBe(25);
    });

    it("updates scene bevel", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      const updated = updateSceneBevel(scene, {
        enabled: true,
        bevelDepth: 15,
        bevelHighlight: "#FFAA00",
      });

      const bevelLayer = updated.effectLayers.find((l) => l.type === "extrusion");
      expect(bevelLayer?.enabled).toBe(true);
      expect(bevelLayer?.params.bevelDepth).toBe(15);
      expect(bevelLayer?.params.bevelHighlight).toBe("#FFAA00");
    });

    it("updates scene stack", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      const updated = updateSceneStack(scene, {
        enabled: true,
        stackCount: 5,
        stackColor1: "#111111",
      });

      const stackLayer = updated.effectLayers.find((l) => l.type === "duplicateStack");
      expect(stackLayer?.enabled).toBe(true);
      expect(stackLayer?.params.stackCount).toBe(5);
      expect(stackLayer?.params.stackColor1).toBe("#111111");
    });

    it("updates scene fill", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      const stops = [
        { color: "#FF0000", offset: 0 },
        { color: "#0000FF", offset: 100 },
      ];
      const updated = updateSceneFill(scene, {
        fillType: "linear",
        fillGradientAngle: 180,
        fillGradientStops: stops,
      });

      const fillLayer = updated.effectLayers.find((l) => l.type === "fill");
      expect(fillLayer?.enabled).toBe(true);
      expect(fillLayer?.params.fillType).toBe("linear");
      expect(fillLayer?.params.fillGradientAngle).toBe(180);
      expect(fillLayer?.params.fillGradientStops).toEqual(stops);
    });

    it("updates specific glow layer and appends if out of bounds", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      // Mutate existing/new index 0
      let updated = updateSceneGlow(scene, 0, {
        enabled: true,
        color: "#FF00FF",
        blur: 15,
      });

      let glowLayers = updated.effectLayers.filter((l) => l.type === "glow");
      expect(glowLayers[0].enabled).toBe(true);
      expect(glowLayers[0].params.color).toBe("#FF00FF");
      expect(glowLayers[0].params.blur).toBe(15);

      // Append out-of-bounds glow (e.g. index 3 when there are only 3 elements 0, 1, 2)
      updated = updateSceneGlow(updated, 3, {
        enabled: true,
        color: "#FFFF00",
        blur: 45,
      });

      glowLayers = updated.effectLayers.filter((l) => l.type === "glow");
      expect(glowLayers.length).toBe(4);
      expect(glowLayers[3].enabled).toBe(true);
      expect(glowLayers[3].params.color).toBe("#FFFF00");
      expect(glowLayers[3].params.blur).toBe(45);
    });

    it("updates scene canvas dimensions", () => {
      const scene = textEffectConfigToScene(defaultConfig);

      const updated = updateSceneCanvas(scene, {
        width: 1920,
        height: 1080,
      });

      expect(updated.canvas.width).toBe(1920);
      expect(updated.canvas.height).toBe(1080);
      expect(updated.legacyConfig?.canvasWidth).toBe(1920);
      expect(updated.legacyConfig?.canvasHeight).toBe(1080);
    });

    it("updates scene custom engine parameters", () => {
      const scene = textEffectConfigToScene({
        ...defaultConfig,
        customRenderer: "InkBrushEngine",
      });

      const updated = updateSceneCustomEngine(scene, {
        inkColor: "#FF00FF",
        bristleDensity: 0.5,
      });

      expect(updated.engineParams?.inkColor).toBe("#FF00FF");
      expect(updated.engineParams?.bristleDensity).toBe(0.5);
      expect(updated.legacyConfig?.inkColor).toBe("#FF00FF");
      expect(updated.legacyConfig?.bristleDensity).toBe(0.5);
    });
  });

  describe("TextEffectBuilder", () => {
    it("builds a text effect using fluent chainable methods", () => {
      const builder = new TextEffectBuilder()
        .setText("FLUENT API")
        .setFont({ family: "Outfit", size: 90, weight: 900 })
        .setPanel({ enabled: true, color: "#111122", radius: 8 })
        .setFillColor("#00FFFF")
        .setStroke({ enabled: true, color: "#000000", width: 5 })
        .setShadow({ enabled: true, color: "#333333", blur: 12 })
        .setGlow(0, { enabled: true, color: "#00FFFF", blur: 15 })
        .setBevel({ enabled: true, depth: 10 })
        .setStack({ enabled: true, count: 4 });

      const config = builder.buildConfig();
      expect(config.text).toBe("FLUENT API");
      expect(config.fontFamily).toBe("Outfit");
      expect(config.fontSize).toBe(90);
      expect(config.panelEnabled).toBe(true);
      expect(config.panelColor).toBe("#111122");
      expect(config.fillColor).toBe("#00FFFF");
      expect(config.strokeEnabled).toBe(true);
      expect(config.strokeColor).toBe("#000000");
      expect(config.shadowEnabled).toBe(true);
      expect(config.bevelEnabled).toBe(true);
      expect(config.stackEnabled).toBe(true);

      const scene = builder.buildScene();
      expect(scene.text.content).toBe("FLUENT API");
      expect(scene.text.fontFamily).toBe("Outfit");
      expect(scene.effectLayers.find((l) => l.type === "panel")?.enabled).toBe(true);
    });

    it("instantiates correctly from config, scene, and definitions", () => {
      // fromConfig
      const b1 = TextEffectBuilder.fromConfig(defaultConfig);
      expect(b1.buildConfig().text).toBe(defaultConfig.text);

      // fromScene
      const scene = textEffectConfigToScene(defaultConfig);
      const b2 = TextEffectBuilder.fromScene(scene);
      expect(b2.buildConfig().text).toBe(defaultConfig.text);

      // fromDefinition
      const mockDefinition: TextEffectDefinition = {
        id: "mock-id",
        name: "Mock Name",
        category: "Classic",
        description: "Mock description",
        tags: ["tag1"],
        font: {
          family: "Poppins",
          weight: 700,
          style: "normal",
          letterSpacing: 2,
          lineHeight: 1.2,
        },
        fills: [{ type: "solid", color: "#FFFFFF" }],
        strokes: [{ color: "#000000", width: 4 }],
        shadows: [{ color: "#333", blur: 10, offsetX: 5, offsetY: 5 }],
      };

      const b3 = TextEffectBuilder.fromDefinition(mockDefinition, "MOCK TEXT", 100);
      const builtCfg = b3.buildConfig();
      expect(builtCfg.text).toBe("MOCK TEXT");
      expect(builtCfg.fontFamily).toBe("Poppins");
      expect(builtCfg.fontSize).toBe(100);
      expect(builtCfg.strokeEnabled).toBe(true);
      expect(builtCfg.strokeColor).toBe("#000000");
    });
  });
});
