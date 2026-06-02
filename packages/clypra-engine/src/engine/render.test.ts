import { describe, it, expect } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { builtInPresets } from "../presets";
import { textEffectConfigToScene } from "./migrate";
import { evaluateScene } from "./evaluate";

(globalThis as typeof globalThis & { __clypraCreateCanvas?: typeof createCanvas }).__clypraCreateCanvas =
  createCanvas;

describe("evaluateScene render parity", () => {
  it("renders every built-in preset without throwing and produces visible pixels", () => {
    for (const preset of builtInPresets) {
      const scene = textEffectConfigToScene(preset.config);
      const w = scene.canvas.width || 800;
      const h = scene.canvas.height || 200;
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

      expect(() => evaluateScene(scene, 0, ctx)).not.toThrow();
      expect(() => evaluateScene(scene, 0.5, ctx)).not.toThrow();

      const data = ctx.getImageData(0, 0, w, h).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += data[i] + data[i + 1] + data[i + 2] + data[i + 3];
      }
      expect(sum).toBeGreaterThan(0);
    }
  });
});
