import { describe, it, expect } from "vitest";
import { injectText, injectTextStyle, injectGlobalTextStyle, injectColor, injectSolidColor, injectBatch, hexToLottieRgb, type TextLayerConfig, type TextCustomization } from "./lottieInjector";
import { createBlankLottie, addTextLayer, addSolidLayer } from "./lottieEditor";

function makeTextLottie() {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addTextLayer(l, "Primary Layer", "Hello World");
  l = addTextLayer(l, "Secondary Layer", "Subtitle");
  return l;
}

describe("hexToLottieRgb", () => {
  it("converts white correctly", () => {
    expect(hexToLottieRgb("#FFFFFF")).toEqual([1, 1, 1]);
  });
  it("converts black correctly", () => {
    expect(hexToLottieRgb("#000000")).toEqual([0, 0, 0]);
  });
  it("converts red correctly", () => {
    const [r, g, b] = hexToLottieRgb("#FF0000");
    expect(r).toBeCloseTo(1, 2);
    expect(g).toBeCloseTo(0, 2);
    expect(b).toBeCloseTo(0, 2);
  });
  it("handles missing hash", () => {
    expect(hexToLottieRgb("FF0000")).toEqual(hexToLottieRgb("#FF0000"));
  });
  it("clamps values to 0-1", () => {
    const result = hexToLottieRgb("#FFFFFF");
    result.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
});

describe("injectText", () => {
  it("injects primary text into mapped layer", () => {
    const lottie = makeTextLottie();
    const layers: TextLayerConfig[] = [{ layerName: "Primary Layer", defaultText: "Hello World", maxCharacters: 50, role: "primary" }];
    const customization: TextCustomization = { primary: "NEW TEXT", secondary: "", accent: "" };
    const result = injectText(lottie, customization, layers);
    const layer = result.layers.find((l: any) => l.nm === "Primary Layer");
    expect(layer?.t?.d?.k?.[0]?.s?.t).toBe("NEW TEXT");
  });

  it("respects maxCharacters limit", () => {
    const lottie = makeTextLottie();
    const layers: TextLayerConfig[] = [{ layerName: "Primary Layer", defaultText: "Hello", maxCharacters: 5, role: "primary" }];
    const customization: TextCustomization = { primary: "TOOLONGTEXT", secondary: "", accent: "" };
    const result = injectText(lottie, customization, layers);
    const layer = result.layers.find((l: any) => l.nm === "Primary Layer");
    expect(layer?.t?.d?.k?.[0]?.s?.t).toBe("TOOLO");
  });

  it("does not mutate original lottie", () => {
    const lottie = makeTextLottie();
    const original = JSON.stringify(lottie);
    const layers: TextLayerConfig[] = [{ layerName: "Primary Layer", defaultText: "Hello", maxCharacters: 50, role: "primary" }];
    injectText(lottie, { primary: "CHANGED", secondary: "", accent: "" }, layers);
    expect(JSON.stringify(lottie)).toBe(original);
  });

  it("converts newlines to carriage returns for Lottie compatibility", () => {
    const lottie = makeTextLottie();
    const layers: TextLayerConfig[] = [{ layerName: "Primary Layer", defaultText: "Hello", maxCharacters: 50, role: "primary" }];
    const result = injectText(lottie, { primary: "Line1\nLine2", secondary: "", accent: "" }, layers);
    const layer = result.layers.find((l: any) => l.nm === "Primary Layer");
    expect(layer?.t?.d?.k?.[0]?.s?.t).toBe("Line1\rLine2");
  });
});

describe("injectTextStyle", () => {
  it("applies font size override", () => {
    const lottie = makeTextLottie();
    const result = injectTextStyle(lottie, "Primary Layer", { fontSize: 120 });
    const layer = result.layers.find((l: any) => l.nm === "Primary Layer");
    expect(layer?.t?.d?.k?.[0]?.s?.s).toBe(120);
  });

  it("applies fill color override", () => {
    const lottie = makeTextLottie();
    const result = injectTextStyle(lottie, "Primary Layer", { fillColor: "#FF0000" });
    const layer = result.layers.find((l: any) => l.nm === "Primary Layer");
    const fc = layer?.t?.d?.k?.[0]?.s?.fc;
    expect(fc[0]).toBeCloseTo(1, 2);
    expect(fc[1]).toBeCloseTo(0, 2);
    expect(fc[2]).toBeCloseTo(0, 2);
  });

  it("applies font name override", () => {
    const lottie = makeTextLottie();
    const result = injectTextStyle(lottie, "Primary Layer", { fontName: "Montserrat-Black" });
    const layer = result.layers.find((l: any) => l.nm === "Primary Layer");
    expect(layer?.t?.d?.k?.[0]?.s?.f).toBe("Montserrat-Black");
  });

  it("applies opacity override via transform", () => {
    const lottie = makeTextLottie();
    const result = injectTextStyle(lottie, "Primary Layer", { opacity: 50 });
    const layer = result.layers.find((l: any) => l.nm === "Primary Layer");
    expect(layer?.ks?.o?.k).toBe(50);
  });

  it("does not affect other layers", () => {
    const lottie = makeTextLottie();
    const result = injectTextStyle(lottie, "Primary Layer", { fontSize: 200 });
    const secondary = result.layers.find((l: any) => l.nm === "Secondary Layer");
    expect(secondary?.t?.d?.k?.[0]?.s?.s).not.toBe(200);
  });
});

describe("injectGlobalTextStyle", () => {
  it("applies font size to all text layers", () => {
    const lottie = makeTextLottie();
    const result = injectGlobalTextStyle(lottie, { fontSize: 96 });
    const textLayers = result.layers.filter((l: any) => l.ty === 5);
    for (const layer of textLayers) {
      expect(layer.t?.d?.k?.[0]?.s?.s).toBe(96);
    }
  });
});

describe("injectColor", () => {
  it("returns unchanged lottie for unknown layer name", () => {
    const lottie = makeTextLottie();
    const result = injectColor(lottie, "NonExistentLayer", "#FF0000");
    expect(JSON.stringify(result)).toBe(JSON.stringify(lottie));
  });
});

describe("injectSolidColor", () => {
  it("updates solid layer color", () => {
    let lottie = createBlankLottie(1920, 1080, 30, 120);
    lottie = addSolidLayer(lottie, "Background", "#000000", 1920, 1080);
    const result = injectSolidColor(lottie, "Background", "#FF5500");
    const layer = result.layers.find((l: any) => l.nm === "Background");
    expect(layer?.sc).toBe("#FF5500");
  });
});

describe("injectBatch", () => {
  it("applies text and visibility in one pass", () => {
    const lottie = makeTextLottie();
    const layers: TextLayerConfig[] = [{ layerName: "Primary Layer", defaultText: "Hello", maxCharacters: 50, role: "primary" }];
    const hiddenLayers = new Set([1]); // hide second layer
    const result = injectBatch(lottie, {
      textCustomization: { customization: { primary: "BATCH TEXT", secondary: "", accent: "" }, layers },
      hiddenLayers,
    });
    const primary = result.layers.find((l: any) => l.nm === "Primary Layer");
    expect(primary?.t?.d?.k?.[0]?.s?.t).toBe("BATCH TEXT");
    expect(result.layers[1]?.hd).toBe(true);
    expect(result.layers[0]?.hd).toBe(false);
  });

  it("does not mutate original", () => {
    const lottie = makeTextLottie();
    const original = JSON.stringify(lottie);
    injectBatch(lottie, { colorOverrides: [{ layerName: "Primary Layer", color: "#FF0000" }] });
    expect(JSON.stringify(lottie)).toBe(original);
  });
});
