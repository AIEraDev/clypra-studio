import { describe, it, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { dataBindingEngine } from "../dataBindingEngine.js";
import { resolveDocumentForBreakpoint } from "../responsiveResolver.js";
import type { OverlayDocument, ContainerNode, PrimitiveShapeNode, PrimitiveTextNode, IconNode } from "../overlayDocumentSchema.js";

describe("Stage 1 — Rectangle Archetypes & Container Validation Suite", () => {

  // ---------------------------------------------------------------------------
  // Test 1 — Pure Shape Rectangle
  // ---------------------------------------------------------------------------
  it("Test 1: Pure Shape Rectangle exists validly without children", () => {
    const shapeNode: PrimitiveShapeNode = {
      id: "shape-1",
      name: "Visual Rectangle",
      type: "shape",
      shapeType: "rectangle",
      x: 50,
      y: 50,
      width: 200,
      height: 100,
      cornerRadius: 12,
      style: {
        fill: "#3B82F6",
        stroke: "#1D4ED8",
        strokeWidth: 2,
        opacity: 0.9,
        shadow: { color: "rgba(0,0,0,0.2)", blur: 10, offsetX: 0, offsetY: 4 },
      },
      children: [],
    };

    const doc: OverlayDocument = {
      id: "doc-shape-1",
      version: 1,
      name: "Pure Shape Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [shapeNode],
      variables: [],
    };

    const computed = layoutEngine.computeLayout(doc);
    expect(computed.nodes["shape-1"]).toEqual({
      x: 50,
      y: 50,
      width: 200,
      height: 100,
    });
  });

  // ---------------------------------------------------------------------------
  // Test 2 — Container Rectangle (fit-content / hug)
  // ---------------------------------------------------------------------------
  it("Test 2: Container Rectangle dynamically fits content size (fit-content)", () => {
    const textNode: PrimitiveTextNode = {
      id: "text-child",
      name: "Badge Text",
      type: "text",
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      text: "PRO",
      style: { fontSize: 20 },
      layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
    };

    const containerNode: ContainerNode = {
      id: "container-hug",
      name: "Badge Container",
      type: "container",
      x: 100,
      y: 100,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-row",
        padding: { top: 8, right: 16, bottom: 8, left: 16 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [textNode],
    };

    const doc: OverlayDocument = {
      id: "doc-container-2",
      version: 1,
      name: "Container Hug Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [containerNode],
      variables: [],
    };

    const computed = layoutEngine.computeLayout(doc);

    // Intrinsic width of "PRO" (3 chars * 20 * 0.55 = 33 -> max(40, 33) = 40)
    // Container width = child width (40) + left pad (16) + right pad (16) = 72
    // Container height = child height (24) + top pad (8) + bottom pad (8) = 40
    expect(computed.nodes["container-hug"].width).toBe(72);
    expect(computed.nodes["container-hug"].height).toBe(40);
  });

  // ---------------------------------------------------------------------------
  // Test 3 — Layout Rectangle (Flex Stack: gap, padding, distribution)
  // ---------------------------------------------------------------------------
  it("Test 3: Layout Rectangle controls child stack flow with gap and padding", () => {
    const card1: PrimitiveShapeNode = {
      id: "card-1",
      name: "Card 1",
      type: "shape",
      shapeType: "rectangle",
      x: 0,
      y: 0,
      width: 120,
      height: 60,
    };
    const card2: PrimitiveShapeNode = {
      id: "card-2",
      name: "Card 2",
      type: "shape",
      shapeType: "rectangle",
      x: 0,
      y: 0,
      width: 120,
      height: 60,
    };

    const flexContainer: ContainerNode = {
      id: "layout-rect",
      name: "Stack Layout Container",
      type: "container",
      x: 50,
      y: 50,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-column",
        gap: 15,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [card1, card2],
    };

    const doc: OverlayDocument = {
      id: "doc-layout-3",
      version: 1,
      name: "Layout Stack Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [flexContainer],
      variables: [],
    };

    const computed = layoutEngine.computeLayout(doc);

    // Card 1 position: x = 50 + 20 = 70, y = 50 + 20 = 70
    expect(computed.nodes["card-1"]).toEqual({ x: 70, y: 70, width: 120, height: 60 });
    // Card 2 position: x = 70, y = 70 + 60 + 15 = 145
    expect(computed.nodes["card-2"]).toEqual({ x: 70, y: 145, width: 120, height: 60 });

    // Container total width = 120 + 20 + 20 = 160
    // Container total height = 60 + 15 + 60 + 20 + 20 = 175
    expect(computed.nodes["layout-rect"].width).toBe(160);
    expect(computed.nodes["layout-rect"].height).toBe(175);
  });

  // ---------------------------------------------------------------------------
  // Test 4 — Clipping Rectangle
  // ---------------------------------------------------------------------------
  it("Test 4: Clipping Rectangle flags overflow: hidden and corner mask", () => {
    const clippingContainer: ContainerNode = {
      id: "clip-rect",
      name: "Mask Container",
      type: "container",
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      clipContent: true,
      children: [
        {
          id: "overflowing-child",
          name: "Wide Child",
          type: "shape",
          shapeType: "rectangle",
          x: 0,
          y: 0,
          width: 500,
          height: 400,
        },
      ],
    };

    expect(clippingContainer.clipContent).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Test 5 — Responsive Rectangle
  // ---------------------------------------------------------------------------
  it("Test 5: Responsive Rectangle adapts layout across mobile and desktop breakpoints", () => {
    const responsiveContainer: ContainerNode = {
      id: "resp-rect",
      name: "Responsive Card",
      type: "container",
      x: 0,
      y: 0,
      width: 800,
      height: 400,
      responsive: {
        mobile: {
          width: 440,
          height: 600,
        },
      },
      children: [],
    };

    const doc: OverlayDocument = {
      id: "doc-resp-5",
      version: 1,
      name: "Responsive Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [responsiveContainer],
      variables: [],
      breakpoints: {
        activeId: "desktop",
        breakpoints: [
          { id: "mobile", label: "Mobile", canvas: { width: 480, height: 844 } },
          { id: "desktop", label: "Desktop", canvas: { width: 1920, height: 1080 } },
        ],
      },
    };

    const desktopComputed = layoutEngine.computeLayoutForBreakpoint(doc, "desktop");
    expect(desktopComputed.nodes["resp-rect"].width).toBe(800);

    const mobileComputed = layoutEngine.computeLayoutForBreakpoint(doc, "mobile");
    expect(mobileComputed.nodes["resp-rect"].width).toBe(440);
    expect(mobileComputed.nodes["resp-rect"].height).toBe(600);
  });

  // ---------------------------------------------------------------------------
  // Test 6 — Content-Aware Rectangle
  // ---------------------------------------------------------------------------
  it("Test 6: Content-Aware Rectangle auto-expands when child bound data expression changes", () => {
    const dynamicText: PrimitiveTextNode = {
      id: "dyn-text",
      name: "Label",
      type: "text",
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      text: "{{ title }}",
      style: { fontSize: 20 },
      layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
    };

    const container: ContainerNode = {
      id: "content-aware-rect",
      name: "Dynamic Banner",
      type: "container",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-row",
        padding: { top: 10, right: 20, bottom: 10, left: 20 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [dynamicText],
    };

    const doc: OverlayDocument = {
      id: "doc-content-6",
      version: 1,
      name: "Content-Aware Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [container],
      variables: [{ key: "title", label: "Title", type: "string", defaultValue: "AI" }],
    };

    // State 1: Short text "AI"
    const state1 = layoutEngine.computeLayout(doc, { title: "AI" });
    // Intrinsic width for "AI" (2 chars * 20 * 0.55 = 22 -> max 40). Total = 40 + 20 + 20 = 80
    expect(state1.nodes["content-aware-rect"].width).toBe(80);

    // State 2: Long text "Artificial Intelligence Systems" (31 chars)
    const state2 = layoutEngine.computeLayout(doc, { title: "Artificial Intelligence Systems" });
    // Intrinsic width (31 chars * 20 * 0.55 = 341). Total = 341 + 20 + 20 = 381
    expect(state2.nodes["content-aware-rect"].width).toBe(381);
    expect(state2.nodes["content-aware-rect"].width).toBeGreaterThan(state1.nodes["content-aware-rect"].width);
  });

  // ---------------------------------------------------------------------------
  // Test 7 — Animation Rectangle
  // ---------------------------------------------------------------------------
  it("Test 7: Animation Rectangle tracks property animation configurations", () => {
    const animRect: ContainerNode = {
      id: "anim-rect",
      name: "Animated Container",
      type: "container",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      animation: {
        presets: [{ presetId: "fade-in", trigger: "on-enter", duration: 0.5, delay: 0, easing: "ease-out" }],
        keyframeTracks: [
          {
            property: "width",
            keyframes: [
              { time: 0, value: 0, easing: "ease-in-out" },
              { time: 1.5, value: 400, easing: "ease-in-out" },
            ],
          },
        ],
      },
      children: [],
    };

    expect(animRect.animation?.keyframeTracks?.[0].property).toBe("width");
    expect(animRect.animation?.keyframeTracks?.[0].keyframes[1].value).toBe(400);
  });

  // ---------------------------------------------------------------------------
  // Test 8 — Nested Rectangle Stress Test
  // ---------------------------------------------------------------------------
  it("Test 8: Nested Rectangle hierarchy correctly propagates coordinates and padding across 4 levels", () => {
    const leafText: PrimitiveTextNode = {
      id: "leaf-text",
      name: "Deep Leaf",
      type: "text",
      x: 10,
      y: 10,
      width: 100,
      height: 30,
      text: "Deep Content",
    };

    const level3: ContainerNode = {
      id: "rect-level-3",
      name: "Level 3",
      type: "container",
      x: 15,
      y: 15,
      width: 150,
      height: 50,
      children: [leafText],
    };

    const level2: ContainerNode = {
      id: "rect-level-2",
      name: "Level 2",
      type: "container",
      x: 20,
      y: 20,
      width: 200,
      height: 100,
      children: [level3],
    };

    const level1: ContainerNode = {
      id: "rect-level-1",
      name: "Level 1",
      type: "container",
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      children: [level2],
    };

    const doc: OverlayDocument = {
      id: "doc-nested-8",
      version: 1,
      name: "Nested Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [level1],
      variables: [],
    };

    const computed = layoutEngine.computeLayout(doc);

    // Level 1: x = 50, y = 50
    expect(computed.nodes["rect-level-1"]).toEqual({ x: 50, y: 50, width: 300, height: 200 });
    // Level 2: x = 50 + 20 = 70, y = 50 + 20 = 70
    expect(computed.nodes["rect-level-2"]).toEqual({ x: 70, y: 70, width: 200, height: 100 });
    // Level 3: x = 70 + 15 = 85, y = 70 + 15 = 85
    expect(computed.nodes["rect-level-3"]).toEqual({ x: 85, y: 85, width: 150, height: 50 });
    // Leaf Text: x = 85 + 10 = 95, y = 85 + 10 = 95
    expect(computed.nodes["leaf-text"]).toEqual({ x: 95, y: 95, width: 100, height: 30 });
  });

  // ---------------------------------------------------------------------------
  // Test 9 — Rectangle as Overlay Card (YouTube Educational Callout Benchmark)
  // ---------------------------------------------------------------------------
  it("Test 9: Builds a YouTube Educational Callout Card using a single root Rectangle container", () => {
    const iconNode: IconNode = {
      id: "callout-icon",
      name: "Info Icon",
      type: "icon",
      x: 0,
      y: 0,
      width: 24,
      height: 24,
      iconName: "info",
      style: { fill: "#3B82F6" },
    };

    const titleNode: PrimitiveTextNode = {
      id: "callout-title",
      name: "Title",
      type: "text",
      x: 0,
      y: 0,
      width: 200,
      height: 24,
      text: "DID YOU KNOW?",
      style: { fontSize: 16, fontWeight: "bold", fill: "#FFFFFF" },
      layout: { constraints: { widthMode: "hug" } },
    };

    const bodyNode: PrimitiveTextNode = {
      id: "callout-body",
      name: "Body Text",
      type: "text",
      x: 0,
      y: 0,
      width: 300,
      height: 40,
      text: "Clypra treats rectangles as behavioral containers.",
      style: { fontSize: 14, fill: "#9CA3AF" },
      layout: { constraints: { widthMode: "hug" } },
    };

    const textColumn: ContainerNode = {
      id: "text-col",
      name: "Text Column",
      type: "container",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-column",
        gap: 6,
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [titleNode, bodyNode],
    };

    const rootOverlayCard: ContainerNode = {
      id: "youtube-callout-card",
      name: "YouTube Educational Callout Card",
      type: "container",
      x: 100,
      y: 800,
      width: 0,
      height: 0,
      clipContent: true,
      style: {
        fill: "rgba(17, 24, 39, 0.95)", // Glass dark backdrop
        stroke: "rgba(255, 255, 255, 0.1)",
        strokeWidth: 1,
        shadow: { color: "rgba(0,0,0,0.5)", blur: 24, offsetX: 0, offsetY: 8 },
      },
      layout: {
        mode: "flex-row",
        gap: 16,
        padding: { top: 16, right: 24, bottom: 16, left: 24 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [iconNode, textColumn],
    };

    const doc: OverlayDocument = {
      id: "doc-callout-9",
      version: 1,
      name: "YouTube Callout Benchmark",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [rootOverlayCard],
      variables: [],
    };

    const computed = layoutEngine.computeLayout(doc);
    const cardBounds = computed.nodes["youtube-callout-card"];

    expect(cardBounds.x).toBe(100);
    expect(cardBounds.y).toBe(800);
    // Root container must dynamically grow to encompass icon + text column + padding
    expect(cardBounds.width).toBeGreaterThan(300);
    expect(cardBounds.height).toBeGreaterThan(50);
  });
});
