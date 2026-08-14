import { describe, it, expect, beforeEach } from "vitest";
import {
  SelectionEngine,
  selectionEngine,
  TransformEngine,
  EditorCommandSystem,
  editorCommandSystem,
  PropertyInspectorEngine,
  propertyInspectorEngine,
  SmartGuideEngine,
  DataBindingAuthoringEngine,
  dataBindingAuthoringEngine,
} from "../editor/index.js";
import { LayoutEngine } from "../layoutEngine.js";
import type {
  OverlayDocument,
  FrameNode,
  PrimitiveShapeNode,
  PrimitiveTextNode,
  PrimitiveMediaNode,
} from "../overlayDocumentSchema.js";

describe("Layer 3A: Studio UI Editor Architecture Crucible Benchmark", () => {
  const layoutEngine = new LayoutEngine();

  const createEmptyDoc = (): OverlayDocument => ({
    id: "doc-editor-test",
    version: "1.0",
    title: "Editor Test",
    canvas: { width: 1920, height: 1080 },
    variables: [
      { key: "speakerName", type: "string", defaultValue: "Dr. Sarah Chen" },
      { key: "speakerRole", type: "string", defaultValue: "Principal AI Scientist" },
    ],
    nodes: [],
    duration: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  beforeEach(() => {
    editorCommandSystem.clear();
    selectionEngine.clear();
  });

  // =========================================================================
  // SYSTEM 1: SELECTION ENGINE
  // =========================================================================
  describe("System 1: Selection Engine", () => {
    it("1.1: should support single select, multi-select, and ignore locked nodes", () => {
      const selection = new SelectionEngine();
      const doc = createEmptyDoc();
      const nodeA: PrimitiveShapeNode = { id: "box-a", name: "A", type: "shape", shapeType: "rectangle", x: 100, y: 100, width: 100, height: 100 };
      const nodeB: PrimitiveShapeNode = { id: "box-b", name: "B", type: "shape", shapeType: "rectangle", x: 250, y: 100, width: 100, height: 100 };
      const lockedNode: PrimitiveShapeNode = { id: "box-locked", name: "Locked", type: "shape", shapeType: "rectangle", x: 400, y: 100, width: 100, height: 100, locked: true } as any;
      doc.nodes = [nodeA, nodeB, lockedNode];

      // Single select
      selection.select("box-a", doc);
      expect(selection.getSelectedIds()).toEqual(["box-a"]);
      expect(selection.getFocusedId()).toBe("box-a");

      // Multi-select with toggle
      selection.toggleSelect("box-b", doc);
      expect(selection.getSelectedIds()).toEqual(["box-a", "box-b"]);

      // Attempt select locked node (must be rejected)
      selection.select("box-locked", doc);
      expect(selection.isSelected("box-locked")).toBe(false);

      // Select All (only unlocked nodes)
      selection.selectAll(doc);
      expect(selection.getSelectedIds()).toEqual(["box-a", "box-b"]);
    });

    it("1.2: should drill down into nested containers and generate breadcrumbs", () => {
      const selection = new SelectionEngine();
      const doc = createEmptyDoc();

      const nameText: PrimitiveTextNode = { id: "speaker-name", name: "Name Text", type: "text", text: "Sarah", x: 0, y: 0, width: 100, height: 20 };
      const infoCol: FrameNode = { id: "info-col", name: "Info Col", type: "frame", x: 60, y: 0, width: 120, height: 40, children: [nameText] };
      const card: FrameNode = { id: "card-root", name: "Card Root", type: "frame", x: 100, y: 800, width: 200, height: 60, children: [infoCol] };
      doc.nodes = [card];

      // Select root
      selection.select("card-root", doc);
      expect(selection.getSelectedIds()).toEqual(["card-root"]);

      // Drill down into child
      const drilled = selection.drillDown(doc, "card-root");
      expect(drilled).toBe(true);
      expect(selection.getSelectedIds()).toEqual(["info-col"]);

      // Drill down again to leaf
      selection.drillDown(doc, "info-col");
      expect(selection.getSelectedIds()).toEqual(["speaker-name"]);

      // Breadcrumb path from root down to leaf
      const breadcrumbs = selection.getBreadcrumbs(doc, "speaker-name");
      expect(breadcrumbs.map((b) => b.id)).toEqual(["card-root", "info-col", "speaker-name"]);

      // Select parent step
      selection.selectParent(doc, "speaker-name");
      expect(selection.getSelectedIds()).toEqual(["info-col"]);
    });
  });

  // =========================================================================
  // SYSTEM 2: TRANSFORM ENGINE
  // =========================================================================
  describe("System 2: Transform Engine", () => {
    it("2.1: should translate nodes by delta and direction nudges", () => {
      const node: PrimitiveShapeNode = { id: "box", name: "Box", type: "shape", shapeType: "rectangle", x: 100, y: 100, width: 80, height: 80 };

      const moved = TransformEngine.moveNode(node, 25, -15);
      expect(moved.x).toBe(125);
      expect(moved.y).toBe(85);

      const nudged = TransformEngine.nudgeNode(moved, "right", 10);
      expect(nudged.x).toBe(135);
    });

    it("2.2: should resize from 8 directional handles with aspect ratio locking", () => {
      const node: PrimitiveShapeNode = { id: "box", name: "Box", type: "shape", shapeType: "rectangle", x: 100, y: 100, width: 200, height: 100 }; // 2:1 aspect

      // East handle (expand width +50)
      const rEast = TransformEngine.resizeNode(node, "e", 50, 0);
      expect(rEast.width).toBe(250);
      expect(rEast.height).toBe(100);

      // Southeast handle with aspect-ratio lock (expand width +100 -> height +50)
      const rSELocked = TransformEngine.resizeNode(node, "se", 100, 50, { lockAspectRatio: true });
      expect(rSELocked.width).toBe(300);
      expect(rSELocked.height).toBe(150);

      // Northwest handle (drag top-left corner)
      const rNW = TransformEngine.resizeNode(node, "nw", 20, 30);
      expect(rNW.x).toBe(120);
      expect(rNW.y).toBe(130);
      expect(rNW.width).toBe(180);
      expect(rNW.height).toBe(70);
    });

    it("2.3: should align and distribute multiple nodes", () => {
      const n1: PrimitiveShapeNode = { id: "n1", name: "1", type: "shape", shapeType: "rectangle", x: 50, y: 50, width: 40, height: 40 };
      const n2: PrimitiveShapeNode = { id: "n2", name: "2", type: "shape", shapeType: "rectangle", x: 150, y: 90, width: 40, height: 40 };
      const n3: PrimitiveShapeNode = { id: "n3", name: "3", type: "shape", shapeType: "rectangle", x: 300, y: 30, width: 40, height: 40 };

      // Align Top (minY = 30)
      const alignedTop = TransformEngine.alignNodes([n1, n2, n3], "top");
      expect(alignedTop.every((n) => n.y === 30)).toBe(true);

      // Distribute Horizontally
      const distributed = TransformEngine.distributeNodes([n1, n2, n3], "horizontal");
      // Total span from x=50 to x=340 = 290. Total width = 120. Gap space = 170 / 2 = 85.
      // n1: 50, n2: 50 + 40 + 85 = 175, n3: 300
      expect(distributed[0].x).toBe(50);
      expect(distributed[1].x).toBe(175);
      expect(distributed[2].x).toBe(300);
    });
  });

  // =========================================================================
  // SYSTEM 3: COMMAND SYSTEM & UNDO/REDO
  // =========================================================================
  describe("System 3: Command System & Undo/Redo", () => {
    it("3.1: should execute reversible commands and support complete Undo/Redo cycles", () => {
      const cmdSystem = new EditorCommandSystem();
      let doc = createEmptyDoc();

      const box: PrimitiveShapeNode = { id: "box-1", name: "Box", type: "shape", shapeType: "rectangle", x: 50, y: 50, width: 100, height: 100 };

      // 1. Add Node
      doc = cmdSystem.execute(doc, { type: "ADD_NODE", node: box });
      expect(doc.nodes.length).toBe(1);
      expect(cmdSystem.canUndo()).toBe(true);

      // 2. Move Node
      doc = cmdSystem.execute(doc, {
        type: "MOVE_NODES",
        moves: [{ nodeId: "box-1", fromX: 50, fromY: 50, toX: 200, toY: 150 }],
      });
      expect(doc.nodes[0].x).toBe(200);

      // 3. Update Style
      doc = cmdSystem.execute(doc, {
        type: "UPDATE_STYLE",
        nodeId: "box-1",
        property: "fillColor",
        previousValue: undefined,
        nextValue: "#3B82F6",
      });
      expect(doc.nodes[0].style?.fillColor).toBe("#3B82F6");

      // Undo 1: Style reverted
      doc = cmdSystem.undo(doc);
      expect(doc.nodes[0].style?.fillColor).toBeUndefined();

      // Undo 2: Position reverted
      doc = cmdSystem.undo(doc);
      expect(doc.nodes[0].x).toBe(50);

      // Undo 3: Node deleted (back to empty)
      doc = cmdSystem.undo(doc);
      expect(doc.nodes.length).toBe(0);
      expect(cmdSystem.canUndo()).toBe(false);

      // Redo all 3
      doc = cmdSystem.redo(doc); // Re-add
      doc = cmdSystem.redo(doc); // Re-move
      doc = cmdSystem.redo(doc); // Re-style
      expect(doc.nodes.length).toBe(1);
      expect(doc.nodes[0].x).toBe(200);
      expect(doc.nodes[0].style?.fillColor).toBe("#3B82F6");
    });

    it("3.2: should batch continuous drag interactions into a single atomic undo step", () => {
      const cmdSystem = new EditorCommandSystem();
      let doc = createEmptyDoc();
      const node: PrimitiveShapeNode = { id: "drag-node", name: "Drag", type: "shape", shapeType: "rectangle", x: 100, y: 100, width: 80, height: 80 };
      doc.nodes = [node];

      // Begin drag session at initial (100, 100)
      cmdSystem.beginDragSession([node]);

      // Simulate 50 intermediate mouse drag events
      let current = node;
      for (let i = 1; i <= 50; i++) {
        current = { ...current, x: 100 + i * 2, y: 100 + i };
      }

      // Commit drag session at final (200, 150)
      doc = cmdSystem.commitDragSession(doc, [current]);
      expect(doc.nodes[0].x).toBe(200);
      expect(doc.nodes[0].y).toBe(150);

      // Verify only 1 command was pushed to history (not 50)
      expect(cmdSystem.getUndoCount()).toBe(1);

      // Undo once restores starting position (100, 100)
      doc = cmdSystem.undo(doc);
      expect(doc.nodes[0].x).toBe(100);
      expect(doc.nodes[0].y).toBe(100);
    });
  });

  // =========================================================================
  // SYSTEM 4: PROPERTY INSPECTOR ENGINE
  // =========================================================================
  describe("System 4: Property Inspector Engine", () => {
    it("4.1: should mutate typography, surface styling, and frame layout through reversible commands", () => {
      const cmdSystem = new EditorCommandSystem();
      const inspector = new PropertyInspectorEngine(cmdSystem);
      let doc = createEmptyDoc();

      const card: FrameNode = {
        id: "hero-card",
        name: "Hero Card",
        type: "frame",
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        children: [
          {
            id: "title-text",
            name: "Title",
            type: "text",
            text: "Initial",
            x: 0,
            y: 0,
            width: 100,
            height: 20,
          } as PrimitiveTextNode,
        ],
      };
      doc.nodes = [card];

      // 1. Set Fill & Stroke & Radius
      doc = inspector.setFillColor(doc, "hero-card", "#1E293B");
      doc = inspector.setStroke(doc, "hero-card", "#475569", 2);
      doc = inspector.setCornerRadius(doc, "hero-card", 16);

      expect(doc.nodes[0].style?.fillColor).toBe("#1E293B");
      expect(doc.nodes[0].style?.strokeColor).toBe("#475569");
      expect(doc.nodes[0].style?.strokeWidth).toBe(2);
      expect(doc.nodes[0].style?.borderRadius).toBe(16);

      // 2. Set Typography
      doc = inspector.setTypography(doc, "title-text", {
        text: "Updated Headline",
        fontSize: 28,
        fontWeight: "bold",
        color: "#F8FAFC",
      });

      const child = (doc.nodes[0] as FrameNode).children![0] as PrimitiveTextNode;
      expect(child.text).toBe("Updated Headline");
      expect(child.style?.fontSize).toBe(28);
      expect((child.style as any)?.fontWeight).toBe("bold");

      // 3. Set Frame Flex Layout
      doc = inspector.setFrameLayout(doc, "hero-card", {
        mode: "flex-row",
        gap: 16,
        padding: 20,
        alignItems: "center",
        widthMode: "hug",
      });

      const frameLayout = doc.nodes[0].layout;
      expect(frameLayout?.mode).toBe("flex-row");
      expect(frameLayout?.gap).toBe(16);
      expect(frameLayout?.padding).toBe(20);
      expect(frameLayout?.constraints?.widthMode).toBe("hug");
    });
  });

  // =========================================================================
  // SYSTEM 5: SMART GUIDES & SNAPPING
  // =========================================================================
  describe("System 5: Smart Guides & Snapping", () => {
    it("5.1: should snap to canvas center and sibling node edges with visual guide emission", () => {
      const sibling: PrimitiveShapeNode = {
        id: "sibling-card",
        name: "Sibling",
        type: "shape",
        shapeType: "rectangle",
        x: 400,
        y: 300,
        width: 200,
        height: 100,
      };

      // Moving node near canvas center (1920 / 2 = 960). Node center is at 958 -> should snap to 960
      const movingNearCenter = { x: 908, y: 200, width: 100, height: 60 }; // center X = 958 (2px from 960)
      const snapCenter = SmartGuideEngine.calculateSnap(movingNearCenter, [sibling], 1920, 1080, 6);

      expect(snapCenter.snappedX).toBe(true);
      expect(snapCenter.x).toBe(910); // 960 - 50 = 910
      expect(snapCenter.guides.some((g) => g.position === 960)).toBe(true);

      // Moving node near sibling left edge (400). Node left at 403 (3px away) -> snap to 400
      const movingNearSibling = { x: 403, y: 600, width: 100, height: 60 };
      const snapSibling = SmartGuideEngine.calculateSnap(movingNearSibling, [sibling], 1920, 1080, 6);

      expect(snapSibling.snappedX).toBe(true);
      expect(snapSibling.x).toBe(400);
      expect(snapSibling.guides.some((g) => g.position === 400)).toBe(true);
    });
  });

  // =========================================================================
  // SYSTEM 6: VISUAL DATA BINDING AUTHORING
  // =========================================================================
  describe("System 6: Visual Data Binding Authoring", () => {
    it("6.1: should bind expressions to node properties and maintain full undo fidelity", () => {
      const cmdSystem = new EditorCommandSystem();
      const bindingEngine = new DataBindingAuthoringEngine(cmdSystem);
      let doc = createEmptyDoc();

      const textNode: PrimitiveTextNode = {
        id: "speaker-label",
        name: "Speaker Label",
        type: "text",
        text: "Static Text",
        x: 0,
        y: 0,
        width: 100,
        height: 20,
      };
      doc.nodes = [textNode];

      // Bind text to {{speakerName}}
      doc = bindingEngine.bindProperty(doc, "speaker-label", "text", "{{speakerName}}");
      const boundNode = doc.nodes[0] as PrimitiveTextNode;
      expect(boundNode.text).toBe("{{speakerName}}");
      expect((boundNode as any).bindings).toEqual([{ targetProperty: "text", expression: "{{speakerName}}" }]);

      // Undo binding
      doc = cmdSystem.undo(doc);
      const undoneNode = doc.nodes[0] as PrimitiveTextNode;
      expect(undoneNode.text).toBe("Static Text");
      expect((undoneNode as any).bindings).toBeUndefined();
    });
  });

  // =========================================================================
  // HERO BENCHMARK: The Complete Speaker Overlay Authoring Workflow
  // =========================================================================
  describe("Hero Benchmark: The Complete Speaker Overlay Authoring Workflow", () => {
    it("should execute the full lifecycle from blank canvas to styled, bound, and duplicated overlay with 100% undo/redo parity", () => {
      const cmdSystem = new EditorCommandSystem();
      const inspector = new PropertyInspectorEngine(cmdSystem);
      const bindingEngine = new DataBindingAuthoringEngine(cmdSystem);
      let doc = createEmptyDoc();

      // 1. User adds Speaker Card Container to empty canvas
      const speakerCard: FrameNode = {
        id: "speaker-card",
        name: "Speaker Card",
        type: "frame",
        x: 100,
        y: 850,
        width: 0,
        height: 0,
        style: { fillColor: "#0F172A", borderRadius: 16 },
        layout: {
          mode: "flex-row",
          constraints: { widthMode: "hug", heightMode: "hug" },
          alignItems: "center",
          gap: 16,
          padding: 16,
        },
        children: [
          {
            id: "avatar-circle",
            name: "Avatar",
            type: "shape",
            shapeType: "circle",
            x: 0,
            y: 0,
            width: 48,
            height: 48,
            children: [
              {
                id: "avatar-img",
                name: "Avatar Image",
                type: "media",
                mediaType: "image",
                assetId: "asset://avatars/sarah.jpg",
                x: 0,
                y: 0,
                width: 48,
                height: 48,
              } as PrimitiveMediaNode,
            ],
          } as PrimitiveShapeNode,
          {
            id: "text-stack",
            name: "Text Column",
            type: "frame",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            layout: { mode: "flex-column", gap: 4, constraints: { widthMode: "hug", heightMode: "hug" } },
            children: [
              {
                id: "name-text",
                name: "Speaker Name",
                type: "text",
                text: "Sarah Chen",
                fontSize: 20,
                x: 0,
                y: 0,
                width: 140,
                height: 24,
              } as PrimitiveTextNode,
              {
                id: "role-text",
                name: "Speaker Role",
                type: "text",
                text: "AI Researcher",
                fontSize: 13,
                x: 0,
                y: 0,
                width: 160,
                height: 16,
              } as PrimitiveTextNode,
            ],
          } as FrameNode,
        ],
      };

      // Step A: Add Node
      doc = cmdSystem.execute(doc, { type: "ADD_NODE", node: speakerCard });
      expect(doc.nodes.length).toBe(1);

      // Step B: Move Card & Snap to bottom-left broadcast safe margin (96px, 946px)
      const snapResult = SmartGuideEngine.calculateSnap({ x: 94, y: 944, width: 300, height: 80 }, [], 1920, 1080, 6);
      expect(snapResult.snappedX).toBe(true);
      expect(snapResult.snappedY).toBe(true);

      doc = cmdSystem.execute(doc, {
        type: "MOVE_NODES",
        moves: [{ nodeId: "speaker-card", fromX: 100, fromY: 850, toX: snapResult.x, toY: snapResult.y }],
      });
      expect(doc.nodes[0].x).toBe(96);
      expect(doc.nodes[0].y).toBe(946);

      // Step C: Edit Typography through Inspector
      doc = inspector.setTypography(doc, "name-text", {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFFFFF",
      });

      // Step D: Bind Data Expressions
      doc = bindingEngine.bindProperty(doc, "name-text", "text", "{{speakerName}}");
      doc = bindingEngine.bindProperty(doc, "role-text", "text", "{{speakerRole}}");

      // Step E: Duplicate Card (creates speaker-card-copy)
      const duplicatedCard = JSON.parse(JSON.stringify(doc.nodes[0])) as FrameNode;
      duplicatedCard.id = "speaker-card-copy";
      duplicatedCard.x = 600;
      doc = cmdSystem.execute(doc, {
        type: "DUPLICATE_NODES",
        sourceIds: ["speaker-card"],
        createdNodes: [duplicatedCard],
      });
      expect(doc.nodes.length).toBe(2);

      // Step F: Compute spatial layout on the final authored document
      const layoutResult = layoutEngine.computeLayout(doc, {
        speakerName: "Dr. Sarah Chen, PhD",
        speakerRole: "Principal AI Scientist at Clypra Labs",
      });
      expect(layoutResult.nodes["speaker-card"]).toBeDefined();
      expect(layoutResult.nodes["speaker-card-copy"]).toBeDefined();

      // Step G: Multi-Step Undo back to step A
      const totalUndos = cmdSystem.getUndoCount();
      for (let i = 0; i < totalUndos; i++) {
        doc = cmdSystem.undo(doc);
      }
      // Document is back to pristine empty state
      expect(doc.nodes.length).toBe(0);

      // Step H: Multi-Step Redo all the way back to 2 cards
      for (let i = 0; i < totalUndos; i++) {
        doc = cmdSystem.redo(doc);
      }
      expect(doc.nodes.length).toBe(2);
      expect(doc.nodes[0].x).toBe(96);
      expect(doc.nodes[1].id).toBe("speaker-card-copy");
    });
  });
});
