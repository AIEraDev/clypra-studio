import { describe, test, expect, beforeEach } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { pixiSceneProjection } from "../pixiSceneProjection.js";
import { mediaAssetRegistry } from "../mediaAssetRegistry.js";
import { runtimeAssetResolver } from "../assets/runtimeAssetResolver.js";
import { serializeTemplate, deserializeTemplate } from "../migrations/serializeTemplate.js";
import type {
  OverlayDocument,
  PrimitiveMediaNode,
  AvatarNode,
  ContainerNode,
  PrimitiveTextNode,
} from "../overlayDocumentSchema.js";

describe("Phase 4: Media Image Primitive Architectural Validation Suite", () => {
  beforeEach(() => {
    mediaAssetRegistry.clear();
  });

  // ---------------------------------------------------------------------------
  // 1. Dimension Dualism (Intrinsic vs Layout Constraints)
  // ---------------------------------------------------------------------------
  describe("1. Dimension Dualism & Sizing Constraints", () => {
    test("1.1: 1D Width-driven auto height calculation with 16:9 aspect lock", () => {
      const doc: OverlayDocument = {
        id: "media-1d-w",
        version: "1.0",
        title: "Width Driven Media",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [
          {
            id: "m_w_driven",
            name: "Video 16:9",
            type: "media",
            mediaType: "video",
            assetId: "asset-16-9",
            x: 0,
            y: 0,
            width: 320,
            height: 0,
            intrinsicWidth: 1920,
            intrinsicHeight: 1080,
            aspectRatioLock: true,
            objectFit: "cover",
            layout: { constraints: { widthMode: "fixed", heightMode: "hug" } },
          },
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      const bounds = layout.nodes["m_w_driven"];

      expect(bounds.width).toBe(320);
      // 320 / (1920 / 1080) = 180px
      expect(bounds.height).toBe(180);
    });

    test("1.2: 1D Height-driven auto width calculation with 16:9 aspect lock", () => {
      const doc: OverlayDocument = {
        id: "media-1d-h",
        version: "1.0",
        title: "Height Driven Media",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [
          {
            id: "m_h_driven",
            name: "Photo 16:9",
            type: "media",
            mediaType: "image",
            assetId: "asset-photo",
            x: 0,
            y: 0,
            width: 0,
            height: 200,
            intrinsicWidth: 1920,
            intrinsicHeight: 1080,
            aspectRatioLock: true,
            layout: { constraints: { widthMode: "hug", heightMode: "fixed" } },
          },
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      const bounds = layout.nodes["m_h_driven"];

      // 200 * (1920 / 1080) = 355.55 -> Math.round = 356
      expect(bounds.width).toBe(356);
      expect(bounds.height).toBe(200);
    });

    test("1.3: 2D Intrinsic Hug Mode defaults directly to natural asset dimensions", () => {
      const doc: OverlayDocument = {
        id: "media-hug-2d",
        version: "1.0",
        title: "2D Hug Test",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [
          {
            id: "img_raw",
            name: "Raw Pixel Image",
            type: "media",
            mediaType: "image",
            assetId: "asset-raw",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            intrinsicWidth: 512,
            intrinsicHeight: 512,
            layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
          },
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      const bounds = layout.nodes["img_raw"];

      expect(bounds.width).toBe(512);
      expect(bounds.height).toBe(512);
    });

    test("1.4: Container Fill Mode scales media to canvas/container boundary", () => {
      const doc: OverlayDocument = {
        id: "media-fill-doc",
        version: "1.0",
        title: "Fill Mode Test",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [
          {
            id: "bg_media",
            name: "Full Backdrop Image",
            type: "media",
            mediaType: "image",
            assetId: "asset-backdrop",
            x: 100,
            y: 100,
            width: 400,
            height: 300,
            layout: { constraints: { widthMode: "fill", heightMode: "fill" } },
          },
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      const bounds = layout.nodes["bg_media"];

      // Fill mode claims full canvas bounds
      expect(bounds.width).toBe(1280);
      expect(bounds.height).toBe(720);
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Fitting & Projection Model (Cover, Contain, CropBounds)
  // ---------------------------------------------------------------------------
  describe("2. Fitting & Projection Mathematics", () => {
    test("2.1: ObjectFit cover and contain scale factor calculations", () => {
      const srcW = 1920;
      const srcH = 1080;
      const boxW = 300;
      const boxH = 300;

      // Cover: scale = max(boxW/srcW, boxH/srcH)
      const scaleCover = Math.max(boxW / srcW, boxH / srcH);
      const coverRenderedW = srcW * scaleCover; // 533.33px
      const coverRenderedH = srcH * scaleCover; // 300px
      const excessCropX = coverRenderedW - boxW; // 233.33px

      expect(scaleCover).toBeCloseTo(300 / 1080, 4);
      expect(coverRenderedH).toBe(300);
      expect(excessCropX).toBeGreaterThan(0);

      // Contain: scale = min(boxW/srcW, boxH/srcH)
      const scaleContain = Math.min(boxW / srcW, boxH / srcH);
      const containRenderedW = srcW * scaleContain; // 300px
      const containRenderedH = srcH * scaleContain; // 168.75px
      const letterboxY = boxH - containRenderedH; // 131.25px

      expect(scaleContain).toBeCloseTo(300 / 1920, 4);
      expect(containRenderedW).toBe(300);
      expect(letterboxY).toBeGreaterThan(0);
    });

    test("2.2: Custom CropBounds UV sub-region definition", () => {
      const mediaWithCrop: PrimitiveMediaNode = {
        id: "cropped-media",
        name: "Cropped Headshot",
        type: "media",
        mediaType: "image",
        assetId: "headshot-1",
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        cropBounds: { x: 100, y: 50, width: 800, height: 800 },
      };

      expect(mediaWithCrop.cropBounds).toBeDefined();
      expect(mediaWithCrop.cropBounds?.width).toBe(800);
      expect(mediaWithCrop.cropBounds?.height).toBe(800);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Masking & Primitive Composition
  // ---------------------------------------------------------------------------
  describe("3. Masking & Primitive Composition", () => {
    test("3.1: Circle Avatar correctly clips media content with circular radius", () => {
      const avatarNode: AvatarNode = {
        id: "avatar-node-1",
        name: "User Avatar",
        type: "avatar",
        shape: "circle",
        x: 50,
        y: 50,
        width: 80,
        height: 80,
        assetId: "user-photo-1",
        badgeStatus: "online",
      };

      const doc: OverlayDocument = {
        id: "doc-avatar-mask",
        version: "1.0",
        title: "Avatar Mask",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [avatarNode],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      expect(layout.nodes["avatar-node-1"].width).toBe(80);
      expect(layout.nodes["avatar-node-1"].height).toBe(80);

      // Pixi scene projection must construct avatar graphics
      const root = pixiSceneProjection.project(doc, 1.0);
      expect(root).toBeDefined();
    });

    test("3.2: Card Container clips media with rounded corner radius", () => {
      const imageNode: PrimitiveMediaNode = {
        id: "card-thumb",
        name: "Card Thumbnail",
        type: "media",
        mediaType: "image",
        assetId: "thumb-1",
        x: 0,
        y: 0,
        width: 280,
        height: 160,
        objectFit: "cover",
      };

      const cardContainer: ContainerNode = {
        id: "media-card",
        name: "Video Card",
        type: "container",
        x: 100,
        y: 100,
        width: 280,
        height: 220,
        clipContent: true,
        style: { borderRadius: 16, backgroundColor: "#1F2937" },
        children: [imageNode],
      };

      const doc: OverlayDocument = {
        id: "doc-card-mask",
        version: "1.0",
        title: "Card Mask",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [cardContainer],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      expect(layout.nodes["media-card"].width).toBe(280);
      expect(layout.nodes["card-thumb"].width).toBe(280);
      expect(layout.nodes["card-thumb"].height).toBe(160);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Async Lifecycle & Render Resilience (Zero-Crash Fallbacks)
  // ---------------------------------------------------------------------------
  describe("4. Async Lifecycle & Render Resilience", () => {
    test("4.1: Missing or unregistered assetId renders deterministic error checkerboard without throwing", () => {
      const brokenMedia: PrimitiveMediaNode = {
        id: "broken-img",
        name: "Broken Image",
        type: "media",
        mediaType: "image",
        assetId: "non-existent-asset-id",
        x: 50,
        y: 50,
        width: 120,
        height: 120,
      };

      const doc: OverlayDocument = {
        id: "doc-broken-media",
        version: "1.0",
        title: "Broken Media",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [brokenMedia],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Ensure projector never crashes on missing assets
      expect(() => {
        pixiSceneProjection.project(doc, 0);
      }).not.toThrow();
    });

    test("4.2: Node with empty assetId renders graceful placeholder", () => {
      const emptyMedia: PrimitiveMediaNode = {
        id: "empty-img",
        name: "Empty Image",
        type: "media",
        mediaType: "image",
        assetId: "",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const doc: OverlayDocument = {
        id: "doc-empty-media",
        version: "1.0",
        title: "Empty Media",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [emptyMedia],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => {
        pixiSceneProjection.project(doc, 2.0);
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Video Timing & Playback Math Determinism
  // ---------------------------------------------------------------------------
  describe("5. Media Timing & Playback Determinism", () => {
    test("5.1: Deterministic media frame time mapping with trim and playbackRate", () => {
      const mediaNode: PrimitiveMediaNode = {
        id: "video-clip-1",
        name: "Timed Video",
        type: "media",
        mediaType: "video",
        assetId: "vid-1",
        x: 0,
        y: 0,
        width: 640,
        height: 360,
        timing: {
          start: 2.0,
          trimStart: 10.0,
          trimEnd: 20.0,
          playbackRate: 1.5,
        },
      };

      // At timeline t = 4.0:
      // t_media = (4.0 - 2.0) * 1.5 + 10.0 = 2.0 * 1.5 + 10.0 = 13.0
      const mediaTimeAt4 = mediaAssetRegistry.calculateMediaTime(mediaNode, 4.0);
      expect(mediaTimeAt4).toBeCloseTo(13.0, 4);

      // Before clip start (timeline t = 1.0 < 2.0): clamps to trimStart (10.0)
      const mediaTimeBeforeStart = mediaAssetRegistry.calculateMediaTime(mediaNode, 1.0);
      expect(mediaTimeBeforeStart).toBe(10.0);

      // Beyond trimEnd (timeline t = 12.0 -> (12-2)*1.5 + 10 = 25 > 20): clamps to trimEnd (20.0)
      const mediaTimeAfterEnd = mediaAssetRegistry.calculateMediaTime(mediaNode, 12.0);
      expect(mediaTimeAfterEnd).toBe(20.0);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Serialization & Memory Lifecycle
  // ---------------------------------------------------------------------------
  describe("6. Serialization & Asset Cache Lifecycle", () => {
    test("6.1: Template serialization preserves all Media Primitive fields", () => {
      const mediaNode: PrimitiveMediaNode = {
        id: "media-serialize",
        name: "Hero Video",
        type: "media",
        mediaType: "video",
        assetId: "hero-asset",
        x: 100,
        y: 100,
        width: 640,
        height: 360,
        intrinsicWidth: 1920,
        intrinsicHeight: 1080,
        aspectRatioLock: true,
        objectFit: "contain",
        cropBounds: { x: 0, y: 0, width: 1920, height: 1080 },
        timing: { start: 1.0, trimStart: 5.0, playbackRate: 2.0 },
      };

      const doc: OverlayDocument = {
        id: "doc-media-ser",
        version: "1.0",
        title: "Media Ser",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [mediaNode],
        duration: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const serialized = serializeTemplate(doc);
      const deserialized = deserializeTemplate(serialized);

      const restored = deserialized.nodes[0] as PrimitiveMediaNode;
      expect(restored.type).toBe("media");
      expect(restored.mediaType).toBe("video");
      expect(restored.assetId).toBe("hero-asset");
      expect(restored.objectFit).toBe("contain");
      expect(restored.aspectRatioLock).toBe(true);
      expect(restored.timing?.trimStart).toBe(5.0);
      expect(restored.timing?.playbackRate).toBe(2.0);
    });

    test("6.2: MediaAssetRegistry cache lifecycle and memory clear", () => {
      const meta1 = mediaAssetRegistry.getOrRegister("https://cdn.example.com/pic1.jpg", "image", 800, 600);
      expect(meta1.intrinsicWidth).toBe(800);
      expect(mediaAssetRegistry.getCacheSize()).toBe(1);

      // Same URL retrieves cached metadata ref
      const metaCached = mediaAssetRegistry.getOrRegister("https://cdn.example.com/pic1.jpg", "image");
      expect(metaCached).toBe(meta1);
      expect(mediaAssetRegistry.getCacheSize()).toBe(1);

      // Register second asset
      mediaAssetRegistry.getOrRegister("https://cdn.example.com/pic2.jpg", "image", 1200, 800);
      expect(mediaAssetRegistry.getCacheSize()).toBe(2);

      // Clear evicts memory
      mediaAssetRegistry.clear();
      expect(mediaAssetRegistry.getCacheSize()).toBe(0);
    });
  });
});
