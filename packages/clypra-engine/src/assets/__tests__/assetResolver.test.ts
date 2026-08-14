import { describe, it, expect, beforeEach } from "vitest";
import { AssetResolver, AssetProtocolHandler } from "../assetResolver.js";
import { AssetRegistry } from "../assetRegistry.js";

describe("AssetResolver", () => {
  let resolver: AssetResolver;
  let registry: AssetRegistry;

  beforeEach(() => {
    resolver = new AssetResolver();
    registry = new AssetRegistry();
  });

  it("should pass through https and http URLs", async () => {
    const url = "https://cdn.example.com/photo.jpg";
    const resolved = await resolver.resolve(url, {}, registry);
    expect(resolved).toBe(url);
  });

  it("should resolve asset:// protocols with base path", async () => {
    const handler = resolver.getHandler("asset") as AssetProtocolHandler;
    handler.setBasePath("/projects/my-video/assets");

    const resolved = await resolver.resolve("asset://avatars/john.png", {}, registry);
    expect(resolved).toBe("/projects/my-video/assets/avatars/john.png");
  });

  it("should resolve binding expressions {{speaker.avatar}} from context data", async () => {
    const context = {
      speaker: {
        name: "Alex",
        avatar: "https://cdn.example.com/alex.jpg",
      },
    };

    const resolved = await resolver.resolve("{{speaker.avatar}}", context, registry);
    expect(resolved).toBe("https://cdn.example.com/alex.jpg");
  });

  it("should resolve binding:// protocol paths", () => {
    const context = {
      product: {
        thumbnail: "asset://images/shoe.png",
      },
    };

    const resolved = resolver.resolveSync("binding://product.thumbnail", context, registry);
    expect(resolved).toBe("asset://images/shoe.png");
  });

  it("should resolve registered asset IDs with context bindings", async () => {
    registry.register({
      id: "dynamic-hero",
      protocol: "binding",
      source: "{{currentScene.heroImage}}",
    });

    const context = {
      currentScene: {
        heroImage: "https://example.com/scene1.png",
      },
    };

    const resolved = await resolver.resolve("dynamic-hero", context, registry);
    expect(resolved).toBe("https://example.com/scene1.png");
  });
});
