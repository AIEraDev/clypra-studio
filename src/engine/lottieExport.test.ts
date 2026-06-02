import { describe, it, expect } from "vitest";
import { buildDotLottie, downloadLottieJson, encodeGif, type GifFrame } from "./lottieExport";
import { createBlankLottie, addTextLayer } from "./lottieEditor";

describe("buildDotLottie", () => {
  it("returns a Blob", async () => {
    const lottie = createBlankLottie(1920, 1080, 30, 120);
    const blob = await buildDotLottie(lottie, "test-animation");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("produces a ZIP with correct MIME type", async () => {
    const lottie = createBlankLottie(1920, 1080, 30, 120);
    const blob = await buildDotLottie(lottie, "test-animation");
    expect(blob.type).toBe("application/zip");
  });

  it("ZIP starts with PK signature (valid ZIP)", async () => {
    const lottie = createBlankLottie(1920, 1080, 30, 120);
    const blob = await buildDotLottie(lottie, "test-animation");
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // ZIP local file header signature: 0x50 0x4B 0x03 0x04
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it("ZIP contains animation.json and manifest.json", async () => {
    const lottie = createBlankLottie(1920, 1080, 30, 120);
    const blob = await buildDotLottie(lottie, "my-anim");
    const buf = await blob.arrayBuffer();
    const text = new TextDecoder().decode(buf);
    expect(text).toContain("animations/my-anim.json");
    expect(text).toContain("manifest.json");
  });

  it("manifest contains correct animation id", async () => {
    const lottie = createBlankLottie(1920, 1080, 30, 120);
    const blob = await buildDotLottie(lottie, "hero-title", { loop: false, autoplay: false, speed: 2 });
    const buf = await blob.arrayBuffer();
    const text = new TextDecoder().decode(buf);
    expect(text).toContain("hero-title");
    expect(text).toContain("Clypra Studio");
  });

  it("handles complex lottie with text layers", async () => {
    let lottie = createBlankLottie(1920, 1080, 30, 120);
    lottie = addTextLayer(lottie, "Title", "HELLO WORLD");
    const blob = await buildDotLottie(lottie, "complex-anim");
    expect(blob.size).toBeGreaterThan(100);
  });
});

describe("encodeGif", () => {
  it("returns a Uint8Array", () => {
    const frame: GifFrame = {
      imageData: { data: new Uint8ClampedArray(4 * 4 * 4).fill(255), width: 4, height: 4, colorSpace: "srgb" } as ImageData,
      delay: 10,
    };
    const result = encodeGif([frame], 4, 4);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("starts with GIF89a header", () => {
    const frame: GifFrame = {
      imageData: { data: new Uint8ClampedArray(4 * 4 * 4).fill(128), width: 4, height: 4, colorSpace: "srgb" } as ImageData,
      delay: 10,
    };
    const result = encodeGif([frame], 4, 4);
    const header = String.fromCharCode(...Array.from(result.slice(0, 6)));
    expect(header).toBe("GIF89a");
  });

  it("ends with GIF trailer byte 0x3B", () => {
    const frame: GifFrame = {
      imageData: { data: new Uint8ClampedArray(4 * 4 * 4).fill(64), width: 4, height: 4, colorSpace: "srgb" } as ImageData,
      delay: 10,
    };
    const result = encodeGif([frame], 4, 4);
    expect(result[result.length - 1]).toBe(0x3b);
  });

  it("encodes multiple frames", () => {
    const makeFrame = (fill: number): GifFrame => ({
      imageData: { data: new Uint8ClampedArray(4 * 4 * 4).fill(fill), width: 4, height: 4, colorSpace: "srgb" } as ImageData,
      delay: 5,
    });
    const result = encodeGif([makeFrame(0), makeFrame(128), makeFrame(255)], 4, 4);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
});
