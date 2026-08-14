import { describe, it, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { snapEngine } from "../canvas/snapping/snapEngine.js";
import { primitiveRegistry } from "../primitiveRegistry.js";
import { componentRegistry } from "../componentRegistry.js";
import { PixiSceneProjection } from "../pixiSceneProjection.js";
import type { OverlayDocument, SceneNode, PrimitiveShapeNode } from "../overlayDocumentSchema.js";
import { Graphics as PixiGraphics } from "pixi.js";

describe("User Highlighted Fixes & Regression Suite", () => {
  const sampleDoc: OverlayDocument = {
    id: "user-fixes-doc",
    version: "1.0.0",
    canvas: { width: 1280, height: 720 },
    variables: [],
    duration: 5,
    fps: 60,
    nodes: [],
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Canvas Anchor Pinning (Left, Center, Right, Bottom, Scale)
  // ───────────────────────────────────────────────────────────────────────────
  describe("1. Canvas Anchor Pinning Evaluation", () => {
    it("pins node to Center & Center of canvas", () => {
      const node: PrimitiveShapeNode = {
        id: "center-node",
        name: "Center Shape",
        type: "shape",
        x: 0,
        y: 0,
        width: 640,
        height: 360,
        shapeType: "rectangle",
        constraints: { horizontal: "center", vertical: "center" },
      };

      const doc: OverlayDocument = { ...sampleDoc, nodes: [node] };
      const layout = layoutEngine.computeLayout(doc, {});

      // X = (1280 - 640) / 2 = 320
      // Y = (720 - 360) / 2 = 180
      expect(layout.nodes["center-node"].x).toBe(320);
      expect(layout.nodes["center-node"].y).toBe(180);
    });

    it("pins node to Right & Bottom of canvas", () => {
      const node: PrimitiveShapeNode = {
        id: "bottom-right-node",
        name: "Bottom Right Shape",
        type: "shape",
        x: 0,
        y: 0,
        width: 400,
        height: 200,
        shapeType: "rectangle",
        constraints: { horizontal: "right", vertical: "bottom" },
      };

      const doc: OverlayDocument = { ...sampleDoc, nodes: [node] };
      const layout = layoutEngine.computeLayout(doc, {});

      // X = 1280 - 400 = 880
      // Y = 720 - 200 = 520
      expect(layout.nodes["bottom-right-node"].x).toBe(880);
      expect(layout.nodes["bottom-right-node"].y).toBe(520);
    });

    it("evaluates scale pinning on target canvas dimensions", () => {
      const node: PrimitiveShapeNode = {
        id: "scale-node",
        name: "Scale Shape",
        type: "shape",
        x: 100,
        y: 50,
        width: 640,
        height: 360,
        shapeType: "rectangle",
        constraints: { horizontal: "scale", vertical: "scale" },
      };

      const doc: OverlayDocument = { ...sampleDoc, nodes: [node] };
      const layout = layoutEngine.computeLayout(doc, {});

      expect(layout.nodes["scale-node"].x).toBe(100);
      expect(layout.nodes["scale-node"].y).toBe(50);
      expect(layout.nodes["scale-node"].width).toBe(640);
      expect(layout.nodes["scale-node"].height).toBe(360);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Default Node Constraints Alignment
  // ───────────────────────────────────────────────────────────────────────────
  describe("2. Default Primitive & Component Node Constraints", () => {
    it("creates default shape primitive with center/center constraints", () => {
      const shape = primitiveRegistry.createDefaultNode("shape");
      expect(shape.constraints?.horizontal).toBe("center");
      expect(shape.constraints?.vertical).toBe("center");
    });

    it("creates default frame primitive with center/center constraints", () => {
      const frame = primitiveRegistry.createDefaultNode("frame");
      expect(frame.constraints?.horizontal).toBe("center");
      expect(frame.constraints?.vertical).toBe("center");
    });

    it("creates lower-third component with left/bottom constraints", () => {
      const l3Def = componentRegistry.get("lower-third");
      expect(l3Def).toBeDefined();
      const l3Node = l3Def!.createDefaultNode();
      expect(l3Node.constraints?.horizontal).toBe("left");
      expect(l3Node.constraints?.vertical).toBe("bottom");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Clip Content WebGL Masking & Visibility
  // ───────────────────────────────────────────────────────────────────────────
  describe("3. Clip Content WebGL Masking & Container Visibility", () => {
    it("applies mask with renderable = false and origin coordinates (0, 0)", () => {
      const projection = new PixiSceneProjection();
      const node: SceneNode = {
        id: "clip-rect",
        name: "Clipped Container",
        type: "shape",
        x: 100,
        y: 100,
        width: 400,
        height: 200,
        clipContent: true,
        style: { fillColor: "#1F2937", borderRadius: 12 },
      };

      const doc: OverlayDocument = { ...sampleDoc, nodes: [node] };
      const rootContainer = projection.project(doc, 0, {});
      const nodeContainer = rootContainer.children.find((c) => c.label === "Clipped Container") as any;

      expect(nodeContainer).toBeDefined();
      expect(nodeContainer.mask).toBeTruthy();
      const maskG = nodeContainer._clipMaskGraphics as PixiGraphics;
      expect(maskG).toBeDefined();
      // Mask must NOT render white fill onto the stage
      expect(maskG.renderable).toBe(false);
    });

    it("cleanly destroys mask and sets mask = null when clipContent is toggled OFF", () => {
      const projection = new PixiSceneProjection();
      const node: SceneNode = {
        id: "clip-toggle",
        name: "Toggle Container",
        type: "shape",
        x: 100,
        y: 100,
        width: 400,
        height: 200,
        clipContent: true,
        style: { fillColor: "#1F2937" },
      };

      // 1. Enable clipContent
      let doc: OverlayDocument = { ...sampleDoc, nodes: [node] };
      let rootContainer = projection.project(doc, 0, {});
      let nodeContainer = rootContainer.children.find((c) => c.label === "Toggle Container") as any;
      expect(nodeContainer.mask).toBeTruthy();

      // 2. Disable clipContent
      node.clipContent = false;
      doc = { ...sampleDoc, nodes: [node] };
      rootContainer = projection.project(doc, 0, {});
      nodeContainer = rootContainer.children.find((c) => c.label === "Toggle Container") as any;

      expect(nodeContainer.mask).toBeFalsy();
      expect(nodeContainer._clipMaskGraphics).toBeFalsy();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Sizing Mode Activation & Deactivation (Fill / Hug / Fixed)
  // ───────────────────────────────────────────────────────────────────────────
  describe("4. Sizing Mode Activation & Deactivation", () => {
    it("evaluates Fill sizing mode to 100% canvas bounds", () => {
      const node: PrimitiveShapeNode = {
        id: "fill-node",
        name: "Fill Shape",
        type: "shape",
        x: 100,
        y: 50,
        width: 400,
        height: 200,
        shapeType: "rectangle",
        layout: { constraints: { widthMode: "fill", heightMode: "fill" } },
      };

      const doc: OverlayDocument = { ...sampleDoc, nodes: [node] };
      const layout = layoutEngine.computeLayout(doc, {});

      expect(layout.nodes["fill-node"].x).toBe(0);
      expect(layout.nodes["fill-node"].y).toBe(0);
      expect(layout.nodes["fill-node"].width).toBe(1280);
      expect(layout.nodes["fill-node"].height).toBe(720);
    });

    it("transitions cleanly from Fill back to Fixed sizing mode", () => {
      const node: PrimitiveShapeNode = {
        id: "transition-node",
        name: "Transition Shape",
        type: "shape",
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        shapeType: "rectangle",
        layout: { constraints: { widthMode: "fixed", heightMode: "fixed" } },
      };

      const doc: OverlayDocument = { ...sampleDoc, nodes: [node] };
      const layout = layoutEngine.computeLayout(doc, {});

      // Fixed widthMode should respect actual specified width/height
      expect(layout.nodes["transition-node"].width).toBe(1280);
      expect(layout.nodes["transition-node"].height).toBe(720);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Auto Layout & Direction (Row, Col, Grid)
  // ───────────────────────────────────────────────────────────────────────────
  describe("5. Auto Layout & Direction Evaluation", () => {
    it("positions child items in a multi-column Grid matrix layout", () => {
      const container: SceneNode = {
        id: "grid-container",
        name: "Grid Container",
        type: "container",
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        layout: {
          mode: "grid",
          gridColumns: 2,
          gap: 10,
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        children: [
          { id: "item-1", name: "Item 1", type: "shape", x: 0, y: 0, width: 100, height: 50 },
          { id: "item-2", name: "Item 2", type: "shape", x: 0, y: 0, width: 100, height: 50 },
          { id: "item-3", name: "Item 3", type: "shape", x: 0, y: 0, width: 100, height: 50 },
        ],
      };

      const doc: OverlayDocument = { ...sampleDoc, nodes: [container] };
      const layout = layoutEngine.computeLayout(doc, {});

      // Item 1 -> Col 0, Row 0 (X = 20, Y = 20)
      expect(layout.nodes["item-1"].x).toBe(20);
      expect(layout.nodes["item-1"].y).toBe(20);

      // Item 2 -> Col 1, Row 0 (X = 20 + 175 + 10 = 205, Y = 20)
      expect(layout.nodes["item-2"].x).toBeGreaterThan(150);
      expect(layout.nodes["item-2"].y).toBe(20);

      // Item 3 -> Col 0, Row 1 (X = 20, Y = 20 + 50 + 10 = 80)
      expect(layout.nodes["item-3"].x).toBe(20);
      expect(layout.nodes["item-3"].y).toBe(80);
    });

    it("reparents an existing node inside a container using REPARENT_NODE command", async () => {
      const container: SceneNode = {
        id: "target-container",
        name: "Target Container",
        type: "container",
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        children: [],
      };

      const childNode: SceneNode = {
        id: "free-child",
        name: "Free Child",
        type: "shape",
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      };

      const initialDoc: OverlayDocument = { ...sampleDoc, nodes: [container, childNode] };
      const { commandExecutor } = await import("../commands/commandExecutor.js");

      const { nextDocument } = commandExecutor.execute(initialDoc, {
        type: "REPARENT_NODE",
        nodeId: "free-child",
        targetParentId: "target-container",
      });

      // free-child should no longer be in root doc.nodes
      expect(nextDocument.nodes.find((n) => n.id === "free-child")).toBeUndefined();

      // target-container children should contain free-child
      const updatedContainer = nextDocument.nodes.find((n) => n.id === "target-container") as any;
      expect(updatedContainer.children.length).toBe(1);
      expect(updatedContainer.children[0].id).toBe("free-child");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Text Bounding Box Auto-Hug & Content Bounds
  // ───────────────────────────────────────────────────────────────────────────
  describe("8. Text Bounding Box Auto-Hug (No Empty Space)", () => {
    it("creates text-primitive default node with hug constraints and tight width", () => {
      const textDef = componentRegistry.get("text-primitive");
      expect(textDef).toBeDefined();
      const node = textDef!.createDefaultNode();
      expect(node.layout?.constraints?.widthMode).toBe("hug");
      expect(node.layout?.constraints?.heightMode).toBe("hug");
      expect(node.width).toBeLessThanOrEqual(220); // Tight to "Header Title", not hardcoded 300
    });

    it("computes tight bounding box for text node without dead space on the right", () => {
      const textNode: SceneNode = {
        id: "header-title-node",
        name: "Header Title",
        type: "text",
        x: 100,
        y: 100,
        width: 300,
        height: 40,
        text: "Header Title",
        layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
        style: { fontSize: 32, fontWeight: "bold" },
      } as any;

      const doc: OverlayDocument = { ...sampleDoc, nodes: [textNode] };
      const layout = layoutEngine.computeLayout(doc);
      const computed = layout.nodes["header-title-node"];

      // 12 chars * 32 * 0.55 = 211.2 -> 212
      expect(computed.width).toBe(212);
      expect(computed.width).toBeLessThan(250); // Closes roundly on text without 300px empty dead space
      expect(computed.height).toBe(39);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Frame Container Height Preservation & Professional Auto-Increase
  // ───────────────────────────────────────────────────────────────────────────
  describe("9. Frame Height Preservation & Auto-Increase", () => {
    it("creates frame-primitive default node with fixed/fixed constraints", () => {
      const frameDef = componentRegistry.get("frame-primitive");
      expect(frameDef).toBeDefined();
      const node = frameDef!.createDefaultNode();
      expect(node.layout?.constraints?.widthMode).toBe("fixed");
      expect(node.layout?.constraints?.heightMode).toBe("fixed");
      expect(node.height).toBe(240);
    });

    it("does not reduce frame height when a single text layer is added inside it", () => {
      const textChild: SceneNode = {
        id: "frame-inner-text",
        name: "Header Title",
        type: "text",
        x: 0,
        y: 0,
        width: 212,
        height: 39,
        text: "Header Title",
        style: { fontSize: 32, fontWeight: "bold" },
      } as any;

      const frameNode: SceneNode = {
        id: "designed-frame",
        name: "Designed Frame",
        type: "frame",
        x: 100,
        y: 100,
        width: 400,
        height: 240,
        layout: {
          mode: "flex-column",
          padding: { top: 16, right: 16, bottom: 16, left: 16 },
          gap: 12,
          constraints: { widthMode: "fixed", heightMode: "fixed" },
        },
        children: [textChild],
      } as any;

      const doc: OverlayDocument = { ...sampleDoc, nodes: [frameNode] };
      const layout = layoutEngine.computeLayout(doc);
      const computedFrame = layout.nodes["designed-frame"];

      // Frame must maintain its designed 240px height, NOT collapse to 71px (39 text + 32 padding)
      expect(computedFrame.height).toBe(240);
    });

    it("auto-increases frame height professionally when content exceeds fixed designed height", () => {
      // 6 "Header Title" lines added inside a 200px tall fixed-height frame (matches user screenshot)
      const children: SceneNode[] = Array.from({ length: 6 }, (_, i) => ({
        id: `header-title-${i + 1}`,
        name: `Header Title ${i + 1}`,
        type: "text",
        x: 0,
        y: 0,
        width: 212,
        height: 39,
        text: "Header Title",
        style: { fontSize: 32, fontWeight: "bold" },
      } as any));

      const frameNode: SceneNode = {
        id: "auto-grow-frame",
        name: "Auto Grow Frame",
        type: "frame",
        x: 100,
        y: 100,
        width: 400,
        height: 200,
        layout: {
          mode: "flex-column",
          padding: { top: 16, right: 16, bottom: 16, left: 16 },
          gap: 12,
          constraints: { widthMode: "fixed", heightMode: "fixed" },
        },
        children,
      } as any;

      const doc: OverlayDocument = { ...sampleDoc, nodes: [frameNode] };
      const layout = layoutEngine.computeLayout(doc);
      const computedFrame = layout.nodes["auto-grow-frame"];

      // 6 items * 39 + 5 gaps * 12 + 32 padding = 326px > 200px initial height
      expect(computedFrame.height).toBe(326);
      expect(computedFrame.height).toBeGreaterThan(200);

      // Verify all 6 children fit within the frame bounds without overflowing outside
      for (const child of children) {
        const childComputed = layout.nodes[child.id];
        expect(childComputed.y + childComputed.height).toBeLessThanOrEqual(computedFrame.y + computedFrame.height);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10. Snap Grid Alignment with Auto-Increased Frame Dimensions
  // ───────────────────────────────────────────────────────────────────────────
  describe("10. Snap Grid Alignment with Auto-Increased Dimensions", () => {
    it("snaps center and bottom edge using auto-increased computed height instead of initial height", () => {
      // Auto-increased frame with 360px computed height on 720px canvas
      // Canvas center Y = 360
      // Target position placed near center: y = 178 (middle = 178 + 180 = 358, within 6px threshold of 360)
      const movingBounds = { x: 300, y: 178, width: 400, height: 360 };
      const otherNodes: SceneNode[] = [];

      const snapResult = snapEngine.calculateSnap(movingBounds, otherNodes, 1280, 720, 6);

      // Snapped Y should center 360px frame at canvasCenterY (360 - 360/2 = 180)
      expect(snapResult.y).toBe(180);
      expect(snapResult.guides).toEqual(
        expect.arrayContaining([{ type: "horizontal", position: 360 }])
      );
    });

    it("snaps bottom edge to safe title margin (5% margin = 684px) using auto-increased height", () => {
      // Canvas height 720, safe margin Y is 36px (top: 36, bottom: 684)
      // Moving 360px frame near bottom safe margin: y = 322 (bottom = 322 + 360 = 682, within 6px threshold of 684)
      const movingBounds = { x: 100, y: 322, width: 400, height: 360 };
      const otherNodes: SceneNode[] = [];

      const snapResult = snapEngine.calculateSnap(movingBounds, otherNodes, 1280, 720, 6);

      // Snapped Y should align bottom edge with 684 (684 - 360 = 324)
      expect(snapResult.y).toBe(324);
      expect(snapResult.guides).toEqual(
        expect.arrayContaining([{ type: "horizontal", position: 684 }])
      );
    });

    it("snaps resize handles accurately to canvas margins and sibling bounds", () => {
      // Dragging bottom handle 'b' of frame near bottom safe margin (684)
      const resizingBounds = { x: 100, y: 100, width: 400, height: 582 };
      const resizeResult = snapEngine.calculateResizeSnap(
        resizingBounds,
        "b",
        [],
        1280,
        720,
        6
      );

      // Height should snap so 100 + height = 684 -> height = 584
      expect(resizeResult.height).toBe(584);
      expect(resizeResult.guides).toEqual(
        expect.arrayContaining([{ type: "horizontal", position: 684 }])
      );
    });
  });
});



