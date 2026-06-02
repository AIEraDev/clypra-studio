import { describe, expect, it } from "vitest";
import {
  countTextGlyphs,
  resizeCharFillColors,
  rainbowCharFillColors,
} from "./perCharFill";

describe("perCharFill", () => {
  it("counts glyphs excluding newlines", () => {
    expect(countTextGlyphs("A\nB")).toBe(2);
    expect(countTextGlyphs("CLYPRA")).toBe(6);
  });

  it("resizes color array to match glyph count", () => {
    const colors = resizeCharFillColors("AB", ["#ff0000"], "#ffffff");
    expect(colors).toEqual(["#ff0000", "#ffffff"]);
    expect(resizeCharFillColors("A", colors, "#000")).toEqual(["#ff0000"]);
  });

  it("builds rainbow palette", () => {
    const colors = rainbowCharFillColors("ABC");
    expect(colors).toHaveLength(3);
    expect(colors[0]).toMatch(/^hsl\(/);
  });
});
