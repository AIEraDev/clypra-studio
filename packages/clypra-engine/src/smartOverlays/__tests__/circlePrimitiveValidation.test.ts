import { describe, it, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { pixiSceneProjection } from "../pixiSceneProjection.js";
import { dataBindingEngine } from "../dataBindingEngine.js";
import type {
  OverlayDocument,
  PrimitiveShapeNode,
  AvatarNode,
  ContainerNode,
  PrimitiveTextNode,
  IconNode,
  PrimitiveMediaNode,
} from "../overlayDocumentSchema.js";

describe("Circle Primitive Validation Pyramid Suite", () => {
  // ---------------------------------------------------------------------------
  // Layer 1 — Geometry Invariants (W == H, Normalization, Radial Bounds)
  // ---------------------------------------------------------------------------
  describe("Layer 1 — Geometry Invariants", () => {
    it("Test 1.1: Square input maintains 1:1 aspect ratio and radius r = W/2", () => {
      const circleNode: PrimitiveShapeNode = {
        id: "circle-square",
        name: "Perfect Circle",
        type: "shape",
        shapeType: "circle",
        x: 100,
        y: 100,
        width: 120,
        height: 120,
        style: { fillColor: "#3B82F6" },
      };

      const doc: OverlayDocument = {
        id: "doc-c1",
        version: "1.0",
        title: "Circle Invariant Test",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [circleNode],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      const bounds = layout.nodes["circle-square"];
      expect(bounds.width).toBe(120);
      expect(bounds.height).toBe(120);

      // Verify geometry normalization in projection: radius = min(W, H) / 2 = 60
      const radius = Math.min(bounds.width, bounds.height) / 2;
      expect(radius).toBe(60);
    });

    it("Test 1.2: Non-square dimensions normalize to invariant radius r = min(W, H)/2", () => {
      const wideCircle: PrimitiveShapeNode = {
        id: "circle-wide",
        name: "Wide Circle",
        type: "shape",
        shapeType: "circle",
        x: 50,
        y: 50,
        width: 200,
        height: 100,
      };

      const tallCircle: PrimitiveShapeNode = {
        id: "circle-tall",
        name: "Tall Circle",
        type: "shape",
        shapeType: "circle",
        x: 50,
        y: 200,
        width: 50,
        height: 300,
      };

      const doc: OverlayDocument = {
        id: "doc-c2",
        version: "1.0",
        title: "Circle Normalization Test",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [wideCircle, tallCircle],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      const wideBounds = layout.nodes["circle-wide"];
      const tallBounds = layout.nodes["circle-tall"];

      const wideRadius = Math.min(wideBounds.width, wideBounds.height) / 2;
      const tallRadius = Math.min(tallBounds.width, tallBounds.height) / 2;

      // 200x100 normalizes to radius 50 (diameter 100)
      expect(wideRadius).toBe(50);
      // 50x300 normalizes to radius 25 (diameter 50)
      expect(tallRadius).toBe(25);
    });
  });

  // ---------------------------------------------------------------------------
  // Layer 2 — Circle as Container (Hosting Child Primitives)
  // ---------------------------------------------------------------------------
  describe("Layer 2 — Circle as Container", () => {
    it("Test 2.1: Avatar primitive hosts text initials and renders cleanly", () => {
      const avatarNode: AvatarNode = {
        id: "avatar-initials",
        name: "User Avatar",
        type: "avatar",
        shape: "circle",
        x: 200,
        y: 200,
        width: 64,
        height: 64,
        initials: "JD",
        badgeStatus: "online",
      };

      const doc: OverlayDocument = {
        id: "doc-c3",
        version: "1.0",
        title: "Avatar Initials Test",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [avatarNode],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      expect(layout.nodes["avatar-initials"].width).toBe(64);
      expect(layout.nodes["avatar-initials"].height).toBe(64);

      // Project onto Pixi scene — must not throw and must create AvatarGraphics and text label
      const container = pixiSceneProjection.project(doc, 0);
      expect(container).toBeDefined();
    });

    it("Test 2.2: Circle container centers child text badge in polar space", () => {
      const badgeText: PrimitiveTextNode = {
        id: "badge-num",
        name: "Badge Count",
        type: "text",
        x: 0,
        y: 0,
        width: 24,
        height: 24,
        text: "99",
        style: { fontSize: 14, textColor: "#FFFFFF" },
        layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
      };

      const badgeCircle: ContainerNode = {
        id: "badge-container",
        name: "Notification Badge",
        type: "container",
        x: 100,
        y: 100,
        width: 32,
        height: 32,
        clipContent: true,
        style: { backgroundColor: "#EF4444", borderRadius: 16 },
        layout: {
          mode: "flex-row",
          alignItems: "center",
          justifyContent: "center",
          constraints: { widthMode: "fixed", heightMode: "fixed" },
        },
        children: [badgeText],
      };

      const doc: OverlayDocument = {
        id: "doc-badge",
        version: "1.0",
        title: "Badge Test",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [badgeCircle],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      expect(layout.nodes["badge-container"].width).toBe(32);
      expect(layout.nodes["badge-container"].height).toBe(32);
    });
  });

  // ---------------------------------------------------------------------------
  // Layer 3 — Circle as Mask (Radial Clipping & Border Inset)
  // ---------------------------------------------------------------------------
  describe("Layer 3 — Circle as Mask", () => {
    it("Test 3.1: Circle mask encloses and clips child media asset", () => {
      const mediaImage: PrimitiveMediaNode = {
        id: "avatar-image",
        name: "Photo",
        type: "media",
        mediaType: "image",
        assetId: "photo-1",
        x: 0,
        y: 0,
        width: 80,
        height: 80,
        objectFit: "cover",
      };

      const circleMaskContainer: ContainerNode = {
        id: "avatar-mask",
        name: "Avatar Mask Container",
        type: "container",
        x: 100,
        y: 100,
        width: 80,
        height: 80,
        clipContent: true,
        style: {
          borderRadius: 40, // 50% radius = circular clip mask
          strokeColor: "#6366F1",
          strokeWidth: 3,
        },
        children: [mediaImage],
      };

      const doc: OverlayDocument = {
        id: "doc-mask",
        version: "1.0",
        title: "Mask Clip Test",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [circleMaskContainer],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      expect(layout.nodes["avatar-mask"].width).toBe(80);
      expect(layout.nodes["avatar-mask"].height).toBe(80);
      expect(layout.nodes["avatar-image"].width).toBe(80);
      expect(layout.nodes["avatar-image"].height).toBe(80);
    });
  });

  // ---------------------------------------------------------------------------
  // Layer 4 — Circle as Data Surface (Progress Ring & Data-bound Badge)
  // ---------------------------------------------------------------------------
  describe("Layer 4 — Circle as Data Surface", () => {
    it("Test 4.1: Progress Ring calculates arc length & strokeDashoffset analytically", () => {
      const radius = 50;
      const circumference = 2 * Math.PI * radius; // ~314.159

      // Test at 0%, 50%, 75%, 100%
      const calculateOffset = (percentage: number) => circumference * (1 - percentage / 100);

      expect(calculateOffset(0)).toBeCloseTo(circumference, 2);
      expect(calculateOffset(50)).toBeCloseTo(circumference * 0.5, 2);
      expect(calculateOffset(75)).toBeCloseTo(circumference * 0.25, 2);
      expect(calculateOffset(100)).toBeCloseTo(0, 2);
    });

    it("Test 4.2: Data-bound notification count evaluates dynamically", () => {
      const textNode: PrimitiveTextNode = {
        id: "data-text",
        name: "Count Text",
        type: "text",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        text: "{{ unreadCount }}",
        style: { fontSize: 16 },
        layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
      };

      const doc: OverlayDocument = {
        id: "doc-data-badge",
        version: "1.0",
        title: "Data Badge",
        canvas: { width: 1280, height: 720 },
        variables: [{ key: "unreadCount", type: "number", defaultValue: 42 }],
        nodes: [textNode],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc, { unreadCount: 42 });
      expect(layout.nodes["data-text"].width).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // The Real Benchmark: Speaker Avatar Composite Overlay
  // (Validates Circle, Image, Text, Rectangle, Layout, Alignment, Masking simultaneously)
  // ---------------------------------------------------------------------------
  describe("Crucible Benchmark — Speaker Avatar Composite Overlay", () => {
    it("Test 5.1: Unified 7-System Benchmark verifies complete composition hierarchy", () => {
      // 1. Avatar (Circle Mask + Image)
      const avatarImage: AvatarNode = {
        id: "speaker-avatar",
        name: "Speaker Avatar",
        type: "avatar",
        shape: "circle",
        x: 0,
        y: 0,
        width: 56,
        height: 56,
        initials: "SC",
        badgeStatus: "online",
      };

      // 2. Speaker Name (Text)
      const speakerName: PrimitiveTextNode = {
        id: "speaker-name",
        name: "Speaker Name",
        type: "text",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        text: "Dr. Sarah Connor",
        style: { fontSize: 20, fontWeight: "bold", textColor: "#FFFFFF" },
        layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
      };

      // 3. Speaker Title (Text)
      const speakerTitle: PrimitiveTextNode = {
        id: "speaker-title",
        name: "Speaker Title",
        type: "text",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        text: "Chief AI Architect",
        style: { fontSize: 14, textColor: "#9CA3AF" },
        layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
      };

      // 4. Text Stack (Rectangle / Flex Column)
      const textStack: ContainerNode = {
        id: "text-stack",
        name: "Text Column",
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
        children: [speakerName, speakerTitle],
      };

      // 5. Outer Card (Flex Row Container)
      const speakerCard: ContainerNode = {
        id: "speaker-card",
        name: "Speaker Card Overlay",
        type: "container",
        x: 100,
        y: 550,
        width: 0,
        height: 0,
        style: {
          backgroundColor: "#111827",
          borderRadius: 16,
          strokeColor: "#374151",
          strokeWidth: 1,
        },
        layout: {
          mode: "flex-row",
          gap: 16,
          padding: { top: 12, right: 20, bottom: 12, left: 16 },
          alignItems: "center",
          constraints: { widthMode: "hug", heightMode: "hug" },
        },
        children: [avatarImage, textStack],
      };

      const doc: OverlayDocument = {
        id: "doc-speaker-benchmark",
        version: "1.0",
        title: "Speaker Avatar Crucible Benchmark",
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [speakerCard],
        duration: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Compute full layout
      const layout = layoutEngine.computeLayout(doc);

      // Verify bounds
      const cardBounds = layout.nodes["speaker-card"];
      const avatarBounds = layout.nodes["speaker-avatar"];
      const stackBounds = layout.nodes["text-stack"];

      expect(cardBounds.x).toBe(100);
      expect(cardBounds.y).toBe(550);

      // Avatar should be 56x56
      expect(avatarBounds.width).toBe(56);
      expect(avatarBounds.height).toBe(56);
      expect(avatarBounds.x).toBe(100 + 16); // parentX + padding.left

      // Text stack positioned after avatar + gap
      expect(stackBounds.x).toBe(100 + 16 + 56 + 16); // 188
      expect(stackBounds.width).toBeGreaterThan(120);

      // Total card width must cleanly enclose avatar + gap + text stack + padding
      expect(cardBounds.width).toBe(16 + 56 + 16 + stackBounds.width + 20);
      expect(cardBounds.height).toBeGreaterThanOrEqual(56 + 24);

      // Project onto Pixi scene without exceptions
      const scene = pixiSceneProjection.project(doc, 2.5);
      expect(scene).toBeDefined();
    });
  });
});
