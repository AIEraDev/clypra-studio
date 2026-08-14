import { describe, it, expect } from "vitest";
import { LayoutEngine } from "../layoutEngine.js";
import type {
  OverlayDocument,
  FrameNode,
  PrimitiveShapeNode,
  PrimitiveTextNode,
  PrimitiveMediaNode,
} from "../overlayDocumentSchema.js";

describe("Phase 3A: Layout Frame Spatial Composition Crucible Benchmark", () => {
  const layoutEngine = new LayoutEngine();

  // =========================================================================
  // DOMAIN 0: Measurement Propagation (Reactive Child Invalidation Chains)
  // =========================================================================
  describe("Domain 0: Measurement Propagation", () => {
    it("0.1: should bubble size changes up through nested frames when child text grows", () => {
      const createTestDoc = (textContent: string): OverlayDocument => ({
        id: "doc-prop-test",
        version: "1.0",
        title: "Propagation Test",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          {
            id: "card-root",
            name: "Card Frame",
            type: "frame",
            x: 100,
            y: 100,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              padding: { top: 16, right: 24, bottom: 16, left: 24 },
              gap: 16,
              alignItems: "center",
            },
            children: [
              {
                id: "avatar",
                name: "Avatar Circle",
                type: "shape",
                shapeType: "circle",
                x: 0,
                y: 0,
                width: 48,
                height: 48,
              } as PrimitiveShapeNode,
              {
                id: "inner-column",
                name: "Text Column",
                type: "frame",
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                layout: {
                  mode: "flex-column",
                  constraints: { widthMode: "hug", heightMode: "hug" },
                  gap: 4,
                  padding: 0,
                },
                children: [
                  {
                    id: "dynamic-title",
                    name: "Title",
                    type: "text",
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    text: textContent,
                    style: { fontSize: 20 },
                    layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
                  } as PrimitiveTextNode,
                ],
              } as FrameNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Pass 1: Short text "AI"
      const docShort = createTestDoc("AI");
      const resShort = layoutEngine.computeLayout(docShort).nodes;
      const titleWShort = resShort["dynamic-title"].width;
      const colWShort = resShort["inner-column"].width;
      const cardWShort = resShort["card-root"].width;

      expect(colWShort).toBe(titleWShort);
      expect(cardWShort).toBe(24 + 48 + 16 + titleWShort + 24);

      // Pass 2: Expanded text "Artificial Intelligence Platform"
      const docLong = createTestDoc("Artificial Intelligence Platform");
      const resLong = layoutEngine.computeLayout(docLong).nodes;
      const titleWLong = resLong["dynamic-title"].width;
      const colWLong = resLong["inner-column"].width;
      const cardWLong = resLong["card-root"].width;

      expect(titleWLong).toBeGreaterThan(titleWShort);
      expect(colWLong).toBe(titleWLong);
      expect(cardWLong).toBe(24 + 48 + 16 + titleWLong + 24);
      expect(cardWLong).toBeGreaterThan(cardWShort);
    });
  });

  // =========================================================================
  // DOMAIN 1: Directional Layout & Alignment
  // =========================================================================
  describe("Domain 1: Directional Layout & Alignment", () => {
    it("1.1: should correctly position row-reverse and column-reverse layouts", () => {
      const doc: OverlayDocument = {
        id: "doc-reverse",
        version: "1.0",
        title: "Reverse Layout",
        canvas: { width: 1000, height: 500 },
        variables: [],
        nodes: [
          {
            id: "row-rev-frame",
            name: "Row Reverse",
            type: "frame",
            x: 0,
            y: 0,
            width: 400,
            height: 100,
            layout: {
              mode: "row-reverse" as any,
              justifyContent: "flex-start",
              gap: 20,
              padding: { top: 10, right: 10, bottom: 10, left: 10 },
            },
            children: [
              { id: "first", name: "First", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 80, height: 50 } as PrimitiveShapeNode,
              { id: "second", name: "Second", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 80, height: 50 } as PrimitiveShapeNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      // In row-reverse, "second" comes first on the left, then "first"
      expect(res["second"].x).toBe(10);
      expect(res["first"].x).toBe(10 + 80 + 20); // 110
    });

    it("1.2: should support 2D directional gap objects { col, row }", () => {
      const doc: OverlayDocument = {
        id: "doc-2d-gap",
        version: "1.0",
        title: "2D Gap",
        canvas: { width: 1000, height: 500 },
        variables: [],
        nodes: [
          {
            id: "wrap-frame",
            name: "Wrap Frame",
            type: "frame",
            x: 0,
            y: 0,
            width: 250,
            height: 300,
            layout: {
              mode: "flex-row",
              wrap: "wrap",
              gap: { col: 15, row: 25 } as any,
              padding: 0,
            },
            children: [
              { id: "w1", name: "W1", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 100, height: 40 } as PrimitiveShapeNode,
              { id: "w2", name: "W2", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 100, height: 40 } as PrimitiveShapeNode,
              { id: "w3", name: "W3", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 100, height: 40 } as PrimitiveShapeNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      // Line 1:
      expect(res["w1"].x).toBe(0);
      expect(res["w1"].y).toBe(0);
      expect(res["w2"].x).toBe(115); // 100 + 15 (col gap)
      expect(res["w2"].y).toBe(0);

      // Line 2:
      expect(res["w3"].x).toBe(0);
      expect(res["w3"].y).toBe(65); // 40 (line 1 height) + 25 (row gap)
    });
  });

  // =========================================================================
  // DOMAIN 2: Sizing Dualism (Hug / Fill / Fixed)
  // =========================================================================
  describe("Domain 2: Sizing Dualism (Hug / Fill / Fixed)", () => {
    it("2.1: should accurately distribute remaining space to flex-fill children with weights", () => {
      const doc: OverlayDocument = {
        id: "doc-fill-weight",
        version: "1.0",
        title: "Fill Weight",
        canvas: { width: 1000, height: 500 },
        variables: [],
        nodes: [
          {
            id: "root-bar",
            name: "Bar Container",
            type: "frame",
            x: 0,
            y: 0,
            width: 500, // Total 500
            height: 80,
            layout: {
              mode: "flex-row",
              gap: 20, // 2 gaps = 40px
              padding: { top: 0, right: 0, bottom: 0, left: 0 },
            },
            children: [
              // Fixed: 100px
              { id: "fixed-box", name: "Fixed", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 100, height: 40 } as PrimitiveShapeNode,
              // Fill 1 (weight 1): remaining = 500 - 100 - 40 = 360 -> weight 1/3 = 120px
              {
                id: "fill-box-1",
                name: "Fill 1",
                type: "shape",
                shapeType: "rectangle",
                x: 0,
                y: 0,
                width: 0,
                height: 40,
                layout: { constraints: { widthMode: "fill" }, flexWeight: 1 } as any,
              } as PrimitiveShapeNode,
              // Fill 2 (weight 2): weight 2/3 = 240px
              {
                id: "fill-box-2",
                name: "Fill 2",
                type: "shape",
                shapeType: "rectangle",
                x: 0,
                y: 0,
                width: 0,
                height: 40,
                layout: { constraints: { widthMode: "fill" }, flexWeight: 2 } as any,
              } as PrimitiveShapeNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      expect(res["fixed-box"].width).toBe(100);
      expect(res["fill-box-1"].width).toBe(120);
      expect(res["fill-box-2"].width).toBe(240);

      // Verify positions:
      expect(res["fixed-box"].x).toBe(0);
      expect(res["fill-box-1"].x).toBe(120); // 100 + 20
      expect(res["fill-box-2"].x).toBe(260); // 120 + 120 + 20
    });
  });

  // =========================================================================
  // DOMAIN 3: Nested Layouts (Multi-Level Tree Recursion)
  // =========================================================================
  describe("Domain 3: Nested Layouts", () => {
    it("3.1: should resolve 3-level nested frames with zero coordinate drift", () => {
      const doc: OverlayDocument = {
        id: "doc-3-level",
        version: "1.0",
        title: "3 Level Nested",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          {
            id: "level-1-root",
            name: "Level 1",
            type: "frame",
            x: 200,
            y: 200,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-column",
              constraints: { widthMode: "hug", heightMode: "hug" },
              padding: 20,
              gap: 10,
            },
            children: [
              {
                id: "level-2-row",
                name: "Level 2",
                type: "frame",
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                layout: {
                  mode: "flex-row",
                  constraints: { widthMode: "hug", heightMode: "hug" },
                  padding: 10,
                  gap: 10,
                },
                children: [
                  {
                    id: "level-3-col",
                    name: "Level 3",
                    type: "frame",
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    layout: {
                      mode: "flex-column",
                      constraints: { widthMode: "hug", heightMode: "hug" },
                      padding: 5,
                      gap: 5,
                    },
                    children: [
                      { id: "leaf-box", name: "Leaf", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 80, height: 30 } as PrimitiveShapeNode,
                    ],
                  } as FrameNode,
                ],
              } as FrameNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      // Leaf Box: x = 200 + 20 (L1) + 10 (L2) + 5 (L3) = 235
      expect(res["leaf-box"].x).toBe(235);
      expect(res["leaf-box"].y).toBe(235);

      // Level 3 size: 80 + 10 = 90 x 30 + 10 = 40
      expect(res["level-3-col"].width).toBe(90);
      expect(res["level-3-col"].height).toBe(40);

      // Level 2 size: 90 + 20 = 110 x 40 + 20 = 60
      expect(res["level-2-row"].width).toBe(110);
      expect(res["level-2-row"].height).toBe(60);

      // Level 1 size: 110 + 40 = 150 x 60 + 40 = 100
      expect(res["level-1-root"].width).toBe(150);
      expect(res["level-1-root"].height).toBe(100);
    });
  });

  // =========================================================================
  // DOMAIN 4: Overflow & Constraints
  // =========================================================================
  describe("Domain 4: Overflow & Constraints", () => {
    it("4.1: should scale down text when constrained within fixed boundary frame", () => {
      const doc: OverlayDocument = {
        id: "doc-overflow-scale",
        version: "1.0",
        title: "Scale Down Overflow",
        canvas: { width: 1000, height: 500 },
        variables: [],
        nodes: [
          {
            id: "constrained-frame",
            name: "Fixed Box",
            type: "frame",
            x: 0,
            y: 0,
            width: 150,
            height: 60,
            layout: { mode: "flex-row", padding: 0 },
            children: [
              {
                id: "long-label",
                name: "Long Label",
                type: "text",
                x: 0,
                y: 0,
                width: 150,
                height: 40,
                text: "Extremely Long Header Text That Exceeds Container",
                style: { fontSize: 24, overflow: "scale-down", minFontSize: 12 },
                layout: { constraints: { widthMode: "fixed", heightMode: "hug" } },
              } as PrimitiveTextNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      expect(res["long-label"].width).toBe(150);
      expect(res["long-label"].height).toBeLessThanOrEqual(60);
    });
  });

  // =========================================================================
  // DOMAIN 5: Responsive Resolution Across Breakpoints
  // =========================================================================
  describe("Domain 5: Responsive Resolution Across Breakpoints", () => {
    it("5.1: should dynamically reconfigure from row on desktop to column on mobile breakpoint", () => {
      const doc: OverlayDocument = {
        id: "doc-responsive",
        version: "1.0",
        title: "Responsive Frame",
        canvas: { width: 1920, height: 1080 },
        breakpoints: {
          defaultBreakpoint: "desktop",
          breakpoints: [
            {
              id: "mobile-portrait",
              name: "Mobile Portrait",
              canvas: { width: 1080, height: 1920 },
            },
          ],
        },
        variables: [],
        nodes: [
          {
            id: "resp-frame",
            name: "Adaptive Container",
            type: "frame",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              gap: 20,
              padding: 20,
            },
            responsive: {
              "mobile-portrait": {
                layout: { mode: "flex-column", gap: 12, padding: 16 },
              },
            },
            children: [
              { id: "item-a", name: "A", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 100, height: 60 } as PrimitiveShapeNode,
              { id: "item-b", name: "B", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 100, height: 60 } as PrimitiveShapeNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Desktop layout (flex-row)
      const desktopRes = layoutEngine.computeLayoutForBreakpoint(doc, null).nodes;
      expect(desktopRes["item-b"].x).toBe(20 + 100 + 20); // 140
      expect(desktopRes["item-b"].y).toBe(20);
      expect(desktopRes["resp-frame"].width).toBe(20 + 100 + 20 + 100 + 20); // 260
      expect(desktopRes["resp-frame"].height).toBe(20 + 60 + 20); // 100

      // Mobile layout (flex-column override)
      const mobileRes = layoutEngine.computeLayoutForBreakpoint(doc, "mobile-portrait").nodes;
      expect(mobileRes["item-b"].x).toBe(16);
      expect(mobileRes["item-b"].y).toBe(16 + 60 + 12); // 88
      expect(mobileRes["resp-frame"].width).toBe(16 + 100 + 16); // 132
      expect(mobileRes["resp-frame"].height).toBe(16 + 60 + 12 + 60 + 16); // 164
    });
  });

  // =========================================================================
  // HERO BENCHMARK: The Production Speaker Card
  // =========================================================================
  describe("Hero Benchmark: The Production Speaker Card", () => {
    it("should composite Rectangle + Circle + MediaImage + Text + Nested LayoutFrame with zero manual positioning", () => {
      const speakerDoc: OverlayDocument = {
        id: "hero-speaker-card",
        version: "1.0",
        title: "Speaker Bio Overlay",
        canvas: { width: 1920, height: 1080 },
        variables: [
          { key: "name", label: "Speaker Name", type: "text", defaultValue: "Dr. Sarah Jenkins" },
          { key: "role", label: "Speaker Role", type: "text", defaultValue: "VP of Artificial Intelligence" },
        ],
        nodes: [
          // Root Card Frame (Surface with Hug dimensions, Center-Anchored)
          {
            id: "speaker-card-surface",
            name: "Card Surface",
            type: "frame",
            x: 80,
            y: 880, // Bottom-left lower third area
            width: 0,
            height: 0,
            style: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderRadius: 20,
              borderColor: "rgba(59, 130, 246, 0.4)",
              borderWidth: 2,
            },
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              padding: { top: 16, right: 28, bottom: 16, left: 20 },
              gap: 18,
              alignItems: "center",
            },
            children: [
              // 1. Avatar Circle Surface
              {
                id: "speaker-avatar-circle",
                name: "Avatar Mask",
                type: "shape",
                shapeType: "circle",
                x: 0,
                y: 0,
                width: 64,
                height: 64,
                style: { backgroundColor: "#3B82F6" },
                children: [
                  // 2. Embedded MediaImage Primitive
                  {
                    id: "speaker-photo",
                    name: "Headshot Image",
                    type: "media",
                    mediaType: "image",
                    assetId: "sarah-headshot",
                    x: 0,
                    y: 0,
                    width: 64,
                    height: 64,
                    intrinsicWidth: 1200,
                    intrinsicHeight: 1200,
                    layout: { constraints: { widthMode: "fixed", heightMode: "fixed" } },
                  } as PrimitiveMediaNode,
                ],
              } as PrimitiveShapeNode,

              // 3. Nested Text Column LayoutFrame
              {
                id: "speaker-info-col",
                name: "Info Column",
                type: "frame",
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                layout: {
                  mode: "flex-column",
                  constraints: { widthMode: "hug", heightMode: "hug" },
                  gap: 4,
                  padding: 0,
                },
                children: [
                  // 4. Speaker Name Typography
                  {
                    id: "speaker-name-text",
                    name: "Name Text",
                    type: "text",
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    text: "{{name}}",
                    style: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF" },
                    layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
                  } as PrimitiveTextNode,

                  // 5. Speaker Role Typography
                  {
                    id: "speaker-role-text",
                    name: "Role Text",
                    type: "text",
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    text: "{{role}}",
                    style: { fontSize: 14, color: "#94A3B8" },
                    layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
                  } as PrimitiveTextNode,
                ],
              } as FrameNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = layoutEngine.computeLayout(speakerDoc).nodes;

      // 1. Verify Avatar Geometry
      expect(result["speaker-avatar-circle"].width).toBe(64);
      expect(result["speaker-avatar-circle"].height).toBe(64);
      expect(result["speaker-avatar-circle"].x).toBe(80 + 20); // 100
      expect(result["speaker-avatar-circle"].y).toBe(880 + 16); // 896

      // 2. Verify Nested Text Hierarchy
      const nameW = result["speaker-name-text"].width;
      const roleW = result["speaker-role-text"].width;
      const nameH = result["speaker-name-text"].height;
      const roleH = result["speaker-role-text"].height;

      expect(nameW).toBeGreaterThan(100);
      expect(roleW).toBeGreaterThan(100);

      const expectedColW = Math.max(nameW, roleW);
      const expectedColH = nameH + 4 + roleH;

      expect(result["speaker-info-col"].width).toBe(expectedColW);
      expect(result["speaker-info-col"].height).toBe(expectedColH);

      // 3. Verify Cross-Axis Centering of Info Column relative to Avatar (64px)
      const maxContentH = Math.max(64, expectedColH);
      const expectedColY = 880 + 16 + (maxContentH - expectedColH) / 2;
      expect(result["speaker-info-col"].y).toBe(Math.round(expectedColY));

      // 4. Verify Master Card Frame Hug Dimensions
      const expectedCardW = 20 + 64 + 18 + expectedColW + 28;
      const expectedCardH = 16 + maxContentH + 16;

      expect(result["speaker-card-surface"].width).toBe(expectedCardW);
      expect(result["speaker-card-surface"].height).toBe(expectedCardH);
    });
  });
});
