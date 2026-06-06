import { describe, it, expect } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { wrapTextToWidth, computeTextLayout } from "./textLayout";

(globalThis as typeof globalThis & { __clypraCreateCanvas?: typeof createCanvas }).__clypraCreateCanvas =
  createCanvas;

describe("textLayout wrapping and bounds", () => {
  it("wraps text character-by-character to a max width", () => {
    const canvas = createCanvas(800, 200);
    const ctx = canvas.getContext("2d")!;
    ctx.font = "16px Arial";

    // A long word with a very tight width should be wrapped char-by-char
    const wrapped = wrapTextToWidth(ctx, "abcdefghijklmnopqrstuvwxyz", 40, 0);
    expect(wrapped.length).toBeGreaterThan(1);
    expect(wrapped.join("")).toBe("abcdefghijklmnopqrstuvwxyz");

    // Empty line paragraphs should be preserved
    const emptyWrapped = wrapTextToWidth(ctx, "A\n\nB", 100, 0);
    expect(emptyWrapped).toEqual(["A", "", "B"]);
  });

  it("centers bounds vertically", () => {
    const canvas = createCanvas(800, 200);
    const ctx = canvas.getContext("2d")!;
    
    const cfg = {
      text: "CLYPRA",
      effectName: "Test",
      fontFamily: "Arial",
      fontWeight: 700,
      fontStyle: "normal" as const,
      fontSize: 100,
      letterSpacing: 0,
      lineHeight: 1.2,
      canvasWidth: 800,
      canvasHeight: 200,
      textPosX: "center" as const,
      textPosY: "middle" as const,
      panelEnabled: true,
      panelPaddingX: 40,
      panelPaddingY: 20,
      fillType: "solid" as const,
      fillColor: "#ffffff",
      fillGradientStops: [],
      strokeEnabled: false,
      strokeColor: "#000000",
      strokeWidth: 0,
      strokePosition: "outside" as const,
      strokeOpacity: 100,
      strokeLineJoin: "round" as const,
      glowLayers: [],
      shadowEnabled: false,
      shadowColor: "#000000",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 100,
      shadowType: "drop" as const,
      bevelEnabled: false,
      bevelDepth: 0,
      bevelHighlight: "#ffffff",
      bevelShadow: "#000000",
      bevelDirection: "bottom-right" as const,
    };

    const layout = computeTextLayout(ctx, cfg, { wrap: true, autoFit: false });
    
    // Check that the layout bounds center aligns perfectly with the visual center of standard caps
    const visualCenter = layout.startY - 0.35 * layout.fontSize;
    const boundsCenter = (layout.bounds.yMin + layout.bounds.yMax) / 2;
    expect(boundsCenter).toBeCloseTo(visualCenter, 5);
  });
});
