import { describe, it, expect, beforeEach } from "vitest";
import { AssetRegistry } from "../assetRegistry.js";

describe("AssetRegistry", () => {
  let registry: AssetRegistry;

  beforeEach(() => {
    registry = new AssetRegistry();
  });

  it("should infer protocol correctly from various URI formats", () => {
    expect(AssetRegistry.inferProtocol("asset://avatars/sarah.png")).toBe("asset");
    expect(AssetRegistry.inferProtocol("https://cdn.example.com/hero.jpg")).toBe("https");
    expect(AssetRegistry.inferProtocol("http://localhost:3000/image.png")).toBe("http");
    expect(AssetRegistry.inferProtocol("file:///Users/dev/image.png")).toBe("file");
    expect(AssetRegistry.inferProtocol("blob:uuid-5678")).toBe("blob");
    expect(AssetRegistry.inferProtocol("font://Inter")).toBe("font");
    expect(AssetRegistry.inferProtocol("binding://speaker.avatar")).toBe("binding");
    expect(AssetRegistry.inferProtocol("{{speaker.avatar}}")).toBe("binding");
  });

  it("should register and retrieve an asset descriptor", () => {
    const desc = registry.register({
      id: "speaker-1",
      protocol: "https",
      source: "https://example.com/avatar.jpg",
      focalPoint: { x: 0.5, y: 0.2 },
    });

    expect(registry.has("speaker-1")).toBe(true);
    const retrieved = registry.get("speaker-1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.source).toBe("https://example.com/avatar.jpg");
    expect(retrieved?.focalPoint).toEqual({ x: 0.5, y: 0.2 });
    expect(retrieved?.version).toBe(1);
  });

  it("should register from raw source with automatic protocol inference", () => {
    registry.registerFromSource("project-hero", "asset://backgrounds/gradient.png", {
      tags: ["background", "hero"],
    });

    const desc = registry.get("project-hero");
    expect(desc?.protocol).toBe("asset");
    expect(desc?.tags).toContain("hero");
  });

  it("should update intrinsic metadata and calculate aspect ratio", () => {
    registry.registerFromSource("chart-img", "https://example.com/chart.png");

    registry.updateIntrinsicMetadata("chart-img", {
      width: 1920,
      height: 1080,
      aspectRatio: 0,
      mimeType: "image/png",
    });

    const desc = registry.get("chart-img");
    expect(desc?.intrinsicMeta?.width).toBe(1920);
    expect(desc?.intrinsicMeta?.height).toBe(1080);
    expect(desc?.intrinsicMeta?.aspectRatio).toBeCloseTo(16 / 9);
  });

  it("should clamp focal points between 0 and 1", () => {
    registry.registerFromSource("avatar-1", "asset://avatar.png");
    registry.updateFocalPoint("avatar-1", { x: 1.5, y: -0.5 });

    const desc = registry.get("avatar-1");
    expect(desc?.focalPoint?.x).toBe(1);
    expect(desc?.focalPoint?.y).toBe(0);
  });

  it("should export to and import from manifest JSON", () => {
    registry.registerFromSource("img1", "asset://1.png");
    registry.registerFromSource("img2", "https://2.png");

    const json = registry.toJSON();
    expect(json.length).toBe(2);

    const newRegistry = new AssetRegistry();
    newRegistry.fromJSON(json);
    expect(newRegistry.list().length).toBe(2);
    expect(newRegistry.has("img1")).toBe(true);
    expect(newRegistry.has("img2")).toBe(true);
  });
});
