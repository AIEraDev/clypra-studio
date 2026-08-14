import { describe, test, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { mediaAssetRegistry } from "../mediaAssetRegistry.js";
import { dataBindingEngine } from "../dataBindingEngine.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";
import type { PrimitiveMediaNode } from "@clypra-studio/types";

describe("YouTube Educational Video Composition Benchmark (Media Crucible)", () => {
  test("1. Multi-Primitive Media Composition & Aspect Ratio Reflow", () => {
    const doc: OverlayDocument = {
      id: "yt-composition-doc",
      version: "1.0",
      title: "YouTube Educational Overlay",
      canvas: { width: 1920, height: 1080 },
      variables: [
        { key: "speaker.avatar", type: "string", defaultValue: "https://clypra.io/assets/avatar1.png" },
        { key: "speaker.name", type: "string", defaultValue: "Dr. Elena Rostova" },
      ],
      nodes: [
        {
          id: "lowerThirdCard",
          name: "Speaker Lower Third Card",
          type: "container",
          x: 80,
          y: 840,
          width: 600,
          height: 0,
          layout: {
            mode: "flex-row",
            gap: 20,
            padding: { top: 16, right: 24, bottom: 16, left: 24 },
            constraints: { widthMode: "hug", heightMode: "hug" },
          },
          children: [
            {
              id: "speakerAvatar",
              name: "Speaker Avatar (Image)",
              type: "media",
              mediaType: "image",
              assetId: "img-avatar",
              sourceUrl: "{{speaker.avatar}}",
              x: 0,
              y: 0,
              width: 80,
              height: 80,
              intrinsicWidth: 512,
              intrinsicHeight: 512,
              aspectRatioLock: true,
              objectFit: "cover",
              layout: { constraints: { widthMode: "fixed", heightMode: "fixed" } },
            },
            {
              id: "textGroup",
              name: "Name & Title Stack",
              type: "container",
              x: 0,
              y: 0,
              width: 0,
              height: 0,
              layout: {
                mode: "flex-column",
                gap: 4,
                constraints: { widthMode: "hug", heightMode: "hug" },
              },
              children: [
                {
                  id: "speakerName",
                  name: "Speaker Name",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  text: "{{speaker.name}}",
                  style: { fontSize: 24, fontWeight: "bold", textColor: "#FFFFFF" },
                  layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
                },
                {
                  id: "speakerTitle",
                  name: "Speaker Role",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  text: "Quantum Computing Director",
                  style: { fontSize: 16, textColor: "#A1A1AA" },
                  layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
                },
              ],
            },
          ],
        },
      ],
      duration: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const layout = layoutEngine.computeLayout(doc);
    const card = layout.nodes["lowerThirdCard"];
    const avatar = layout.nodes["speakerAvatar"];

    expect(card).toBeDefined();
    expect(avatar.width).toBe(80);
    expect(avatar.height).toBe(80);
    expect(card.width).toBeGreaterThan(300);
  });

  test("2. Video Temporal Frame Sync Calculation (Trim & Playback Rate)", () => {
    const videoNode: PrimitiveMediaNode = {
      id: "demoVideo",
      name: "Demo B-Roll Footage",
      type: "media",
      mediaType: "video",
      assetId: "v-broll",
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      timing: {
        start: 2.0, // Appears on timeline at 2.0s
        trimStart: 1.0, // Video starts 1.0s into source clip
        trimEnd: 8.0,
        playbackRate: 1.5, // Played back at 1.5x speed
      },
    };

    // Timeline at t = 1.0s (Before start) -> Clamp to trimStart = 1.0s
    expect(mediaAssetRegistry.calculateMediaTime(videoNode, 1.0)).toBe(1.0);

    // Timeline at t = 2.0s (Exact start) -> Trim start = 1.0s
    expect(mediaAssetRegistry.calculateMediaTime(videoNode, 2.0)).toBe(1.0);

    // Timeline at t = 4.0s (2s elapsed * 1.5x = 3s + 1.0s trimStart = 4.0s media time)
    expect(mediaAssetRegistry.calculateMediaTime(videoNode, 4.0)).toBe(4.0);

    // Timeline at t = 8.0s (Exceeds trimEnd 8.0s) -> Clamp to trimEnd = 8.0s
    expect(mediaAssetRegistry.calculateMediaTime(videoNode, 8.0)).toBe(8.0);
  });

  test("3. Dynamic Data Binding URL Swapping", () => {
    const context1 = { speaker: { avatar: "https://clypra.io/assets/avatar1.png" } };
    const context2 = { speaker: { avatar: "https://clypra.io/assets/avatar2.png" } };

    const url1 = dataBindingEngine.evaluateString("{{speaker.avatar}}", context1);
    const url2 = dataBindingEngine.evaluateString("{{speaker.avatar}}", context2);

    expect(url1).toBe("https://clypra.io/assets/avatar1.png");
    expect(url2).toBe("https://clypra.io/assets/avatar2.png");

    const meta1 = mediaAssetRegistry.getOrRegister(url1, "image", 512, 512);
    const meta2 = mediaAssetRegistry.getOrRegister(url2, "image", 1024, 1024);

    expect(meta1.intrinsicWidth).toBe(512);
    expect(meta2.intrinsicWidth).toBe(1024);
  });

  test("4. 100-Item Media Repeater Asset Cache Audit", () => {
    mediaAssetRegistry.clear();

    const sampleUrls = [
      "https://clypra.io/media/thumb1.jpg",
      "https://clypra.io/media/thumb2.jpg",
      "https://clypra.io/media/thumb3.jpg",
    ];

    // Simulate 100 product repeater cards referencing the 3 sample URLs
    for (let i = 0; i < 100; i++) {
      const targetUrl = sampleUrls[i % 3];
      mediaAssetRegistry.getOrRegister(targetUrl, "image", 640, 360);
    }

    // Cache should deduplicate down to exactly 3 unique URL entries
    expect(mediaAssetRegistry.getCacheSize()).toBe(3);
  });

  test("5. Preview vs Export Temporal Parity Assertion (Delta < 1px)", () => {
    const doc: OverlayDocument = {
      id: "media-parity-doc",
      version: "1.0",
      title: "Media Parity Test",
      canvas: { width: 1920, height: 1080 },
      variables: [],
      nodes: [
        {
          id: "lottieIcon",
          name: "Animated Callout Lottie",
          type: "media",
          mediaType: "lottie",
          assetId: "lottie-sparkle",
          x: 200,
          y: 300,
          width: 120,
          height: 120,
          aspectRatioLock: true,
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const previewLayout = layoutEngine.computeLayoutForBreakpoint(doc, null);
    const exportLayout = layoutEngine.computeLayout(doc);

    const p = previewLayout.nodes["lottieIcon"];
    const e = exportLayout.nodes["lottieIcon"];

    expect(Math.abs(p.x - e.x)).toBeLessThan(1);
    expect(Math.abs(p.y - e.y)).toBeLessThan(1);
    expect(Math.abs(p.width - e.width)).toBeLessThan(1);
    expect(Math.abs(p.height - e.height)).toBeLessThan(1);
  });
});
