import { describe, it, expect } from "vitest";
import { LayoutEngine } from "../layoutEngine.js";
import type {
  OverlayDocument,
  FrameNode,
  PrimitiveShapeNode,
  PrimitiveTextNode,
  MediaNode,
} from "../overlayDocumentSchema.js";

/**
 * Hero Benchmark: Speaker Card
 *
 * Validates all 5 foundational primitives in unified declarative composition:
 * 1. Rectangle (Card Surface, Border, Radius, Padding)
 * 2. Layout Frame (Row & Column directional composition)
 * 3. Circle (Radial geometry & Avatar container)
 * 4. Media Image (Avatar image bitmap)
 * 5. Text (Speaker Name & Title with font metrics and dynamic data bindings)
 */
describe("Hero Benchmark: Speaker Card Unified Primitive Composition", () => {
  const layoutEngine = new LayoutEngine();

  const createSpeakerCardDoc = (overrides?: {
    speakerName?: string;
    speakerRole?: string;
    avatarSize?: number;
    gap?: number;
    padding?: number;
  }): OverlayDocument => {
    const avatarSize = overrides?.avatarSize ?? 64;
    const gap = overrides?.gap ?? 16;
    const padding = overrides?.padding ?? 16;
    const name = overrides?.speakerName ?? "Ada Lovelace";
    const role = overrides?.speakerRole ?? "Mathematician & Computing Pioneer";

    return {
      id: "doc-speaker-card-hero",
      version: "1.0",
      title: "Hero Benchmark: Speaker Card",
      canvas: { width: 1920, height: 1080 },
      variables: [
        { key: "speakerName", defaultValue: name },
        { key: "speakerRole", defaultValue: role },
      ],
      breakpoints: {
        defaultBreakpoint: "desktop",
        breakpoints: [
          {
            id: "bp-mobile-vertical",
            name: "Mobile Vertical Stream",
            mediaQuery: { maxWidth: 1080, orientation: "portrait" },
            canvas: { width: 1080, height: 1920 },
          },
        ],
      },
      nodes: [
        // 1. Rectangle Outer Card Frame [Hug, Hug]
        {
          id: "speaker-card-container",
          name: "Speaker Card Rectangle",
          type: "frame",
          x: 80,
          y: 800,
          width: 0,
          height: 0,
          style: {
            fillColor: "#1E1E24",
            borderRadius: 16,
            strokeColor: "#3F3F46",
            strokeWidth: 1,
            shadow: { color: "rgba(0,0,0,0.4)", blur: 16, x: 0, y: 8 },
          },
          layout: {
            mode: "flex-row",
            constraints: { widthMode: "hug", heightMode: "hug" },
            alignItems: "center",
            gap,
            padding: { top: padding, right: padding + 8, bottom: padding, left: padding },
          },
          responsive: {
            "bp-mobile-vertical": {
              layout: {
                mode: "flex-column",
                alignItems: "center",
                gap: 12,
                padding: 20,
              },
            },
          },
          children: [
            // 2. Circle Avatar (Shape Circle + Media Image)
            {
              id: "avatar-circle-container",
              name: "Avatar Circle",
              type: "shape",
              shapeType: "circle",
              x: 0,
              y: 0,
              width: avatarSize,
              height: avatarSize,
              style: {
                fillColor: "#27272A",
                strokeColor: "#6366F1",
                strokeWidth: 2,
              },
              layout: {
                constraints: { widthMode: "fixed", heightMode: "fixed" },
              },
              children: [
                {
                  id: "avatar-image",
                  name: "Avatar Image",
                  type: "media",
                  mediaType: "image",
                  src: "https://assets.clypra.io/avatars/ada.png",
                  x: 0,
                  y: 0,
                  width: avatarSize,
                  height: avatarSize,
                  objectFit: "cover",
                  layout: {
                    constraints: { widthMode: "fill", heightMode: "fill" },
                  },
                } as MediaNode,
              ],
            } as PrimitiveShapeNode,

            // 3. Nested LayoutFrame: Column Stacking Text Nodes
            {
              id: "text-stack-column",
              name: "Text Stack Column",
              type: "frame",
              x: 0,
              y: 0,
              width: 0,
              height: 0,
              layout: {
                mode: "flex-column",
                constraints: { widthMode: "hug", heightMode: "hug" },
                justifyContent: "center",
                gap: 4,
                padding: 0,
              },
              children: [
                // 4. Speaker Name Text Node
                {
                  id: "speaker-name-node",
                  name: "Speaker Name",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  text: "{{ speakerName }}",
                  style: {
                    fontFamily: "Inter, sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    textColor: "#FFFFFF",
                    lineHeight: 1.2,
                  },
                  layout: {
                    constraints: { widthMode: "hug", heightMode: "hug" },
                  },
                } as PrimitiveTextNode,

                // 5. Speaker Role Text Node
                {
                  id: "speaker-role-node",
                  name: "Speaker Role",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  text: "{{ speakerRole }}",
                  style: {
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    fontWeight: 400,
                    textColor: "#9CA3AF",
                    lineHeight: 1.2,
                  },
                  layout: {
                    constraints: { widthMode: "hug", heightMode: "hug" },
                  },
                } as PrimitiveTextNode,
              ],
            } as FrameNode,
          ],
        } as FrameNode,
      ],
      duration: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  it("Benchmark 1: Resolves exact Hug bounds and alignment across all 5 primitives", () => {
    const doc = createSpeakerCardDoc();
    const state = layoutEngine.computeLayout(doc);
    const bounds = state.nodes;

    const nameB = bounds["speaker-name-node"];
    const roleB = bounds["speaker-role-node"];
    const colB = bounds["text-stack-column"];
    const avatarB = bounds["avatar-circle-container"];
    const cardB = bounds["speaker-card-container"];

    // 1. Text measurements exist and are positive
    expect(nameB.width).toBeGreaterThan(50);
    expect(nameB.height).toBeGreaterThan(15);
    expect(roleB.width).toBeGreaterThan(100);
    expect(roleB.height).toBeGreaterThan(10);

    // 2. Column Frame hugs max width of children and accumulated height + gap
    const expectedColW = Math.max(nameB.width, roleB.width);
    const expectedColH = nameB.height + 4 + roleB.height;
    expect(colB.width).toBe(expectedColW);
    expect(colB.height).toBe(expectedColH);

    // 3. Avatar is fixed 64x64
    expect(avatarB.width).toBe(64);
    expect(avatarB.height).toBe(64);

    // 4. Card Frame hugs (leftPad + avatar + gap + colW + rightPad)
    const expectedCardW = 16 + 64 + 16 + expectedColW + 24; // right padding is 16 + 8 = 24
    const expectedCardH = 16 + Math.max(64, expectedColH) + 16;
    expect(cardB.width).toBe(expectedCardW);
    expect(cardB.height).toBe(expectedCardH);

    // 5. Cross-axis vertical centering of avatar & text column inside card
    expect(avatarB.y).toBe(800 + 16);
    const colExpectedY = 800 + 16 + (Math.max(64, expectedColH) - expectedColH) / 2;
    expect(colB.y).toBe(Math.round(colExpectedY));
  });

  it("Benchmark 2: Dynamic Text Growth triggers seamless, deterministic expansion", () => {
    const doc = createSpeakerCardDoc();

    // Baseline layout
    const baseBounds = layoutEngine.computeLayout(doc, {
      speakerName: "Ada",
      speakerRole: "Dev",
    }).nodes;
    const baseCardW = baseBounds["speaker-card-container"].width;

    // Mutated with long academic title
    const longBounds = layoutEngine.computeLayout(doc, {
      speakerName: "Dr. Alexandria Montgomery-Smythe III",
      speakerRole: "Vice President of Global Distributed Systems & Neural Computing",
    }).nodes;
    const longCardW = longBounds["speaker-card-container"].width;

    // Verify automatic expansion without manual coordinate changes
    expect(longCardW).toBeGreaterThan(baseCardW + 200);

    // Verify gap & padding invariants remain constant
    const longColW = longBounds["text-stack-column"].width;
    expect(longCardW).toBe(16 + 64 + 16 + longColW + 24);
  });

  it("Benchmark 3: Responsive Breakpoint seamlessly shifts Horizontal Card to Vertical Badge", () => {
    const doc = createSpeakerCardDoc();

    // 1. Desktop Broadcast (Horizontal Lower-Third)
    const desktopBounds = layoutEngine.computeLayoutForBreakpoint(doc, null).nodes;
    const deskAvatar = desktopBounds["avatar-circle-container"];
    const deskCol = desktopBounds["text-stack-column"];
    const deskCard = desktopBounds["speaker-card-container"];

    // Desktop is row: avatar and text-col are horizontal siblings
    expect(deskCol.x).toBeGreaterThan(deskAvatar.x);
    expect(deskCard.width).toBeGreaterThan(deskCard.height);

    // 2. Mobile Broadcast (Vertical Stream Badge)
    const mobileBounds = layoutEngine.computeLayoutForBreakpoint(doc, "bp-mobile-vertical").nodes;
    const mobAvatar = mobileBounds["avatar-circle-container"];
    const mobCol = mobileBounds["text-stack-column"];
    const mobCard = mobileBounds["speaker-card-container"];

    // Mobile is column: text-col is strictly below avatar
    expect(mobCol.y).toBeGreaterThan(mobAvatar.y + mobAvatar.height);
    // Mobile card width hugs column max width + padding
    expect(mobCard.width).toBe(20 + Math.max(64, mobCol.width) + 20);
    // Mobile card height accumulates vertical stack: topPad + avatar + gap(12) + colH + bottomPad
    expect(mobCard.height).toBe(20 + 64 + 12 + mobCol.height + 20);
  });
});
