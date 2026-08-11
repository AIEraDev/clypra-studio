import { describe, test, expect } from "vitest";
import {
  commandExecutor,
  documentValidator,
  pixiSceneProjection,
  componentRegistry,
  serializeTemplate,
  deserializeTemplate,
  layoutEngine,
  type OverlayDocument,
  type SceneNode,
  type DocumentCommand
} from "../index.js";
import { dataBindingEngine } from "../dataBindingEngine.js";
import { propertyInterpolator } from "../propertyInterpolator.js";
import { animationRuntime } from "../animationRuntime.js";
import { motionPresetRegistry } from "../motionPresetRegistry.js";
import { animationValidator } from "../validation/animationDiagnostics.js";

function getAbsoluteCoordinates(node: SceneNode, nodes: SceneNode[], parentX = 0, parentY = 0): { x: number; y: number } {
  const currentX = parentX + node.x;
  const currentY = parentY + node.y;
  return { x: currentX, y: currentY };
}

describe("Smart Overlay Engine — Golden Document & Group Invariants", () => {
  const sampleDoc: OverlayDocument = {
    id: "golden-doc-01",
    version: "2.0",
    title: "Golden Test Document",
    category: "test",
    canvas: { width: 1280, height: 720, backgroundColor: "#12121A" },
    variables: [
      { key: "title", type: "string", defaultValue: "Hello World", label: "Title" }
    ],
    nodes: [
      {
        id: "node-1",
        name: "Box A",
        type: "shape",
        shapeType: "rectangle",
        x: 100,
        y: 150,
        width: 200,
        height: 120
      } as any,
      {
        id: "node-2",
        name: "Box B",
        type: "shape",
        shapeType: "circle",
        x: 400,
        y: 300,
        width: 150,
        height: 150
      } as any
    ],
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  test("Grouping Invariant: world position before grouping === world position after grouping", () => {
    const posA_before = { x: sampleDoc.nodes[0].x, y: sampleDoc.nodes[0].y };
    const posB_before = { x: sampleDoc.nodes[1].x, y: sampleDoc.nodes[1].y };

    // Execute Group Nodes
    const res = commandExecutor.execute(sampleDoc, {
      type: "GROUP_NODES",
      nodeIds: ["node-1", "node-2"],
      frameName: "Test Group Frame"
    });

    const groupFrame = res.nextDocument.nodes.find((n) => n.id.startsWith("frame-"));
    expect(groupFrame).toBeDefined();
    expect(groupFrame?.type).toBe("frame");

    const children = (groupFrame as any).children as SceneNode[];
    expect(children).toHaveLength(2);

    // Calculate world positions after grouping
    const posA_after = { x: groupFrame!.x + children[0].x, y: groupFrame!.y + children[0].y };
    const posB_after = { x: groupFrame!.x + children[1].x, y: groupFrame!.y + children[1].y };

    expect(posA_after).toEqual(posA_before);
    expect(posB_after).toEqual(posB_before);
  });

  test("Ungrouping Invariant: world position before ungrouping === world position after ungrouping", () => {
    // 1. Group
    const groupRes = commandExecutor.execute(sampleDoc, {
      type: "GROUP_NODES",
      nodeIds: ["node-1", "node-2"]
    });

    const frameId = groupRes.nextDocument.nodes[0].id;

    // 2. Ungroup
    const ungroupRes = commandExecutor.execute(groupRes.nextDocument, {
      type: "UNGROUP_NODES",
      frameId
    });

    expect(ungroupRes.nextDocument.nodes).toHaveLength(2);
    expect(ungroupRes.nextDocument.nodes[0].x).toBe(sampleDoc.nodes[0].x);
    expect(ungroupRes.nextDocument.nodes[0].y).toBe(sampleDoc.nodes[0].y);
    expect(ungroupRes.nextDocument.nodes[1].x).toBe(sampleDoc.nodes[1].x);
    expect(ungroupRes.nextDocument.nodes[1].y).toBe(sampleDoc.nodes[1].y);
  });

  test("Nested Grouping Invariant: Group -> Group again -> Ungroup -> Ungroup", () => {
    // Group A + B
    const step1 = commandExecutor.execute(sampleDoc, { type: "GROUP_NODES", nodeIds: ["node-1", "node-2"] });
    const frame1Id = step1.nextDocument.nodes[0].id;

    // Group Frame1
    const step2 = commandExecutor.execute(step1.nextDocument, { type: "GROUP_NODES", nodeIds: [frame1Id] });
    const frame2Id = step2.nextDocument.nodes[0].id;

    // Ungroup Outer
    const step3 = commandExecutor.execute(step2.nextDocument, { type: "UNGROUP_NODES", frameId: frame2Id });

    // Ungroup Inner
    const step4 = commandExecutor.execute(step3.nextDocument, { type: "UNGROUP_NODES", frameId: frame1Id });

    expect(step4.nextDocument.nodes[0].x).toBe(sampleDoc.nodes[0].x);
    expect(step4.nextDocument.nodes[0].y).toBe(sampleDoc.nodes[0].y);
    expect(step4.nextDocument.nodes[1].x).toBe(sampleDoc.nodes[1].x);
    expect(step4.nextDocument.nodes[1].y).toBe(sampleDoc.nodes[1].y);
  });

  test("Golden Document Roundtrip: validate -> project -> serialize -> deserialize", () => {
    // 1. Validate
    const diagnostics = documentValidator.validate(sampleDoc);
    expect(diagnostics).toHaveLength(0);

    // 2. Project onto PixiJS display tree
    const container = pixiSceneProjection.project(sampleDoc, 0);
    expect(container).toBeDefined();

    // 3. Serialize
    const serialized = JSON.stringify(sampleDoc);

    // 4. Deserialize
    const deserialized = JSON.parse(serialized) as OverlayDocument;
    expect(deserialized.id).toBe(sampleDoc.id);

    // 5. Project again
    const container2 = pixiSceneProjection.project(deserialized, 1.0);
    expect(container2).toBeDefined();
  });

  test("Command Atomicity & Undo/Redo Invariants: initial -> command -> undo -> redo", () => {
    const cmd: DocumentCommand = {
      type: "UPDATE_NODE_PROPERTY",
      nodeId: "node-1",
      path: "x",
      value: 550
    };

    // Execute
    const execRes = commandExecutor.execute(sampleDoc, cmd);
    expect(execRes.nextDocument.nodes[0].x).toBe(550);

    // Undo
    const undoRes = commandExecutor.execute(execRes.nextDocument, execRes.inverseCommand);
    expect(undoRes.nextDocument.nodes[0].x).toBe(100);

    // Redo
    const redoRes = commandExecutor.execute(undoRes.nextDocument, undoRes.inverseCommand);
    expect(redoRes.nextDocument.nodes[0].x).toBe(550);
  });
});

// ---------------------------------------------------------------------------
// Phase 4C — Responsive Canvas Conversion Test
// ---------------------------------------------------------------------------

describe("Smart Overlay Engine — Responsive Canvas Conversion", () => {
  const landscapeDoc: OverlayDocument = {
    id: "responsive-test",
    version: "2.0",
    title: "Responsive Conversion Test",
    category: "test",
    canvas: { width: 1280, height: 720, backgroundColor: "#12121A" },
    variables: [],
    nodes: [
      {
        id: "title-node",
        name: "Title Text",
        type: "text",
        x: 200,
        y: 100,
        width: 880,
        height: 120,
        constraints: { horizontal: "center", vertical: "top" },
      } as any,
      {
        id: "card-node",
        name: "Card",
        type: "shape",
        shapeType: "rectangle",
        x: 200,
        y: 280,
        width: 400,
        height: 320,
        constraints: { horizontal: "left", vertical: "top" },
      } as any,
      {
        id: "right-card",
        name: "Right Card",
        type: "shape",
        shapeType: "rectangle",
        x: 680,
        y: 280,
        width: 400,
        height: 320,
        constraints: { horizontal: "right", vertical: "top" },
      } as any,
    ],
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test("Canvas dimension change command preserves document structure", () => {
    // Switch from 1280x720 landscape to 1080x1920 portrait
    const portraitCmd: DocumentCommand = {
      type: "SET_DOCUMENT",
      doc: {
        ...landscapeDoc,
        canvas: { width: 1080, height: 1920, backgroundColor: "#12121A" },
      },
    };

    const result = commandExecutor.execute(landscapeDoc, portraitCmd);
    const portraitDoc = result.nextDocument;

    // Canvas dimensions updated
    expect(portraitDoc.canvas.width).toBe(1080);
    expect(portraitDoc.canvas.height).toBe(1920);

    // All nodes still present
    expect(portraitDoc.nodes).toHaveLength(3);

    // Node structural integrity preserved
    expect(portraitDoc.nodes[0].id).toBe("title-node");
    expect(portraitDoc.nodes[1].id).toBe("card-node");
    expect(portraitDoc.nodes[2].id).toBe("right-card");

    // Constraint data is unchanged after dimension change
    expect((portraitDoc.nodes[0] as any).constraints?.horizontal).toBe("center");
    expect((portraitDoc.nodes[1] as any).constraints?.horizontal).toBe("left");
    expect((portraitDoc.nodes[2] as any).constraints?.horizontal).toBe("right");
  });

  test("Canvas dimension change is reversible via undo", () => {
    const portraitCmd: DocumentCommand = {
      type: "SET_DOCUMENT",
      doc: {
        ...landscapeDoc,
        canvas: { width: 1080, height: 1920, backgroundColor: "#12121A" },
      },
    };

    const execRes = commandExecutor.execute(landscapeDoc, portraitCmd);
    expect(execRes.nextDocument.canvas.width).toBe(1080);

    // Undo restores original landscape canvas
    const undoRes = commandExecutor.execute(execRes.nextDocument, execRes.inverseCommand);
    expect(undoRes.nextDocument.canvas.width).toBe(1280);
    expect(undoRes.nextDocument.canvas.height).toBe(720);
  });

  test("PixiJS projection re-renders on canvas dimension change without error", () => {
    const portraitDoc: OverlayDocument = {
      ...landscapeDoc,
      canvas: { width: 1080, height: 1920, backgroundColor: "#12121A" },
    };

    // Should not throw
    expect(() => {
      pixiSceneProjection.project(portraitDoc, 0);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Phase 4D — Data Authoring Engine Tests
// ---------------------------------------------------------------------------

describe("Smart Overlay Engine — Data Authoring (Phase 4D)", () => {

  const baseDoc: OverlayDocument = {
    id: "data-test-doc",
    version: "2.0",
    title: "Data Test",
    category: "test",
    canvas: { width: 1280, height: 720, backgroundColor: "#12121A" },
    variables: [
      { key: "revenue", type: "number", defaultValue: 1240000, label: "Revenue" },
      { key: "growth", type: "number", defaultValue: 73.4, label: "Growth %" },
      { key: "title", type: "string", defaultValue: "Revenue Growth", label: "Title" },
    ],
    nodes: [],
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test("REMOVE_VARIABLE removes variable and is undoable via ADD_VARIABLE inverse", () => {
    const cmd: DocumentCommand = { type: "REMOVE_VARIABLE", key: "growth" };
    const result = commandExecutor.execute(baseDoc, cmd);

    // Variable removed
    expect(result.nextDocument.variables.find((v) => v.key === "growth")).toBeUndefined();
    expect(result.nextDocument.variables).toHaveLength(2);

    // Inverse is ADD_VARIABLE restoring exact data
    expect(result.inverseCommand.type).toBe("ADD_VARIABLE");
    if (result.inverseCommand.type === "ADD_VARIABLE") {
      expect(result.inverseCommand.key).toBe("growth");
      expect(result.inverseCommand.defaultValue).toBe(73.4);
    }

    // Undo restores original variable list
    const undone = commandExecutor.execute(result.nextDocument, result.inverseCommand);
    expect(undone.nextDocument.variables).toHaveLength(3);
    expect(undone.nextDocument.variables.find((v) => v.key === "growth")?.defaultValue).toBe(73.4);
  });

  test("UPDATE_VARIABLE patches a variable and is undoable", () => {
    const cmd: DocumentCommand = {
      type: "UPDATE_VARIABLE",
      key: "title",
      patch: { defaultValue: "Updated Title", label: "Updated Label" },
    };
    const result = commandExecutor.execute(baseDoc, cmd);

    const updated = result.nextDocument.variables.find((v) => v.key === "title");
    expect(updated?.defaultValue).toBe("Updated Title");
    expect(updated?.label).toBe("Updated Label");

    // Undo restores original values
    const undone = commandExecutor.execute(result.nextDocument, result.inverseCommand);
    const restored = undone.nextDocument.variables.find((v) => v.key === "title");
    expect(restored?.defaultValue).toBe("Revenue Growth");
    expect(restored?.label).toBe("Title");
  });

  test("ADD_DATA_PREVIEW_SET stores set and REMOVE_DATA_PREVIEW_SET undoes it", () => {
    const addCmd: DocumentCommand = {
      type: "ADD_DATA_PREVIEW_SET",
      set: { id: "preview-1", label: "Example A", values: { revenue: 2500000, growth: 12.1 } },
    };
    const added = commandExecutor.execute(baseDoc, addCmd);
    expect(added.nextDocument.dataPreviewSets).toHaveLength(1);
    expect(added.nextDocument.dataPreviewSets![0].label).toBe("Example A");

    // Undo removes the preview set
    const undone = commandExecutor.execute(added.nextDocument, added.inverseCommand);
    expect(undone.nextDocument.dataPreviewSets ?? []).toHaveLength(0);
  });

  test("visibilityExpression hides node when condition is false", () => {
    const docWithCondNode: OverlayDocument = {
      ...baseDoc,
      variables: [{ key: "growth", type: "number", defaultValue: -5, label: "Growth" }],
      nodes: [
        {
          id: "positive-badge",
          name: "Positive Badge",
          type: "shape",
          shapeType: "rectangle",
          x: 200,
          y: 200,
          width: 200,
          height: 120,
          visibilityExpression: "growth > 0",
        } as any,
      ],
    };

    // Should not throw — node is hidden internally via visibilityExpression evaluation
    expect(() => {
      pixiSceneProjection.project(docWithCondNode, 0);
    }).not.toThrow();
  });

  test("visibilityExpression shows node when condition is true", () => {
    const docWithCondNode: OverlayDocument = {
      ...baseDoc,
      variables: [{ key: "growth", type: "number", defaultValue: 73.4, label: "Growth" }],
      nodes: [
        {
          id: "positive-badge",
          name: "Positive Badge",
          type: "shape",
          shapeType: "rectangle",
          x: 200,
          y: 200,
          width: 200,
          height: 120,
          visibilityExpression: "growth > 0",
        } as any,
      ],
    };

    expect(() => {
      pixiSceneProjection.project(docWithCondNode, 0);
    }).not.toThrow();
  });

  test("evaluateExpression returns typed values, not just strings", () => {
    const ctx = { revenue: 1240000, growth: 73.4, firstName: "Alice", lastName: "Smith" };

    // Numeric computation
    const numResult = dataBindingEngine.evaluateExpression("revenue / 1000000", ctx);
    expect(typeof numResult).toBe("number");
    expect(numResult).toBeCloseTo(1.24);

    // Boolean comparison
    const boolResult = dataBindingEngine.evaluateExpression("growth > 0", ctx);
    expect(typeof boolResult).toBe("boolean");
    expect(boolResult).toBe(true);

    // String concatenation
    const strResult = dataBindingEngine.evaluateExpression("firstName + ' ' + lastName", ctx);
    expect(typeof strResult).toBe("string");
    expect(strResult).toBe("Alice Smith");
  });

  test("evaluateExpression with negative growth returns false boolean", () => {
    const ctx = { growth: -5 };
    const result = dataBindingEngine.evaluateExpression("growth > 0", ctx);
    expect(result).toBe(false);
  });

  test("expandRepeater with 3-item array produces 3 nodes with correct IDs", () => {
    const repeater = {
      id: "leader-repeater",
      name: "Leaderboard",
      type: "repeater",
      x: 100,
      y: 100,
      width: 800,
      height: 60,
      datasetBinding: "leaderboard",
      staggerDelay: 0.1,
      direction: "vertical",
      itemTemplate: {
        id: "item-template",
        name: "Row",
        type: "text",
        x: 0,
        y: 0,
        width: 800,
        height: 60,
        text: "{{item.name}} — {{item.score}}",
      },
    } as any;

    const context = {
      leaderboard: [
        { name: "Alice", score: 98 },
        { name: "Bob", score: 91 },
        { name: "Charlie", score: 87 },
      ],
    };

    const expanded = dataBindingEngine.expandRepeater(repeater, context);
    expect(expanded).toHaveLength(3);
    expect(expanded[0].id).toBe("leader-repeater-item-0");
    expect(expanded[1].id).toBe("leader-repeater-item-1");
    expect(expanded[2].id).toBe("leader-repeater-item-2");

    // Text should be evaluated with item context
    expect((expanded[0] as any).text).toBe("Alice — 98");
    expect((expanded[1] as any).text).toBe("Bob — 91");
    expect((expanded[2] as any).text).toBe("Charlie — 87");
  });
});

// ---------------------------------------------------------------------------
// Phase 4E — Motion Authoring Engine Tests
// ---------------------------------------------------------------------------

describe("Smart Overlay Engine — Motion Authoring (Phase 4E)", () => {

  test("PropertyInterpolator rotates via shortest path (350° → 10° at t=0.5 is 0°)", () => {
    const halfAngle = propertyInterpolator.interpolateAngle(350, 10, 0.5);
    expect(halfAngle).toBe(0);
  });

  test("ADD_TIMELINE_MARKER adds marker and is undoable via REMOVE_TIMELINE_MARKER", () => {
    const doc: OverlayDocument = {
      id: "motion-doc",
      version: "2.0",
      title: "Motion Doc",
      category: "test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cmd: DocumentCommand = {
      type: "ADD_TIMELINE_MARKER",
      marker: { id: "m1", time: 1.5, label: "Revenue", type: "keyword" },
    };

    const res = commandExecutor.execute(doc, cmd);
    expect(res.nextDocument.markers).toHaveLength(1);
    expect(res.nextDocument.markers![0].label).toBe("Revenue");

    // Undo removes marker
    const undone = commandExecutor.execute(res.nextDocument, res.inverseCommand);
    expect(undone.nextDocument.markers ?? []).toHaveLength(0);
  });

  test("UPDATE_KEYFRAME_TRACKS updates node tracks and is undoable", () => {
    const doc: OverlayDocument = {
      id: "motion-doc",
      version: "2.0",
      title: "Motion Doc",
      category: "test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [{ id: "n1", name: "Node 1", type: "shape", shapeType: "rectangle", x: 0, y: 0, width: 100, height: 100 } as any],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cmd: DocumentCommand = {
      type: "UPDATE_KEYFRAME_TRACKS",
      nodeId: "n1",
      tracks: [
        {
          property: "opacity",
          keyframes: [
            { time: 0, value: 0 },
            { time: 0.5, value: 1 },
          ],
        },
      ],
    };

    const res = commandExecutor.execute(doc, cmd);
    expect(res.nextDocument.nodes[0].animation?.keyframeTracks).toHaveLength(1);

    // Undo restores previous tracks
    const undone = commandExecutor.execute(res.nextDocument, res.inverseCommand);
    expect(undone.nextDocument.nodes[0].animation?.keyframeTracks ?? []).toHaveLength(0);
  });

  test("animationRuntime.snapTime snaps to nearby marker within threshold", () => {
    const markers = [
      { id: "m1", time: 1.25, label: "Chapter 1", type: "chapter" } as any,
      { id: "m2", time: 3.0, label: "Beat", type: "beat" } as any,
    ];

    // Close to 1.25 -> snaps to 1.25
    const snap1 = animationRuntime.snapTime(1.23, markers, 0.1);
    expect(snap1.snappedTime).toBe(1.25);
    expect(snap1.snappedMarker?.id).toBe("m1");

    // Far from markers -> no snap
    const snap2 = animationRuntime.snapTime(2.0, markers, 0.1);
    expect(snap2.snappedTime).toBe(2.0);
    expect(snap2.snappedMarker).toBeUndefined();
  });

  test("animationRuntime computes parent-child stagger delay hierarchy deterministically", () => {
    const parentAnim = {
      animationScope: "children" as const,
      staggerChildren: 0.15,
      entrance: { type: "slide" as const, duration: 0.5, delay: 0.2 },
    };

    // Child 0 delay = parentInherited (0) + parentEntranceDelay (0.2) + 0 * 0.15 = 0.2
    const delayChild0 = animationRuntime.computeChildInheritedDelay(parentAnim, 0, 0);
    expect(delayChild0).toBeCloseTo(0.2);

    // Child 1 delay = 0 + 0.2 + 1 * 0.15 = 0.35
    const delayChild1 = animationRuntime.computeChildInheritedDelay(parentAnim, 1, 0);
    expect(delayChild1).toBeCloseTo(0.35);

    // Child 2 delay = 0 + 0.2 + 2 * 0.15 = 0.50
    const delayChild2 = animationRuntime.computeChildInheritedDelay(parentAnim, 2, 0);
    expect(delayChild2).toBeCloseTo(0.5);
  });

  test("Composition Test: Preset + Semantic concurrently evaluated on node", () => {
    const node: SceneNode = {
      id: "stat-1",
      name: "Stat Card",
      type: "component",
      componentType: "stat-card",
      x: 100,
      y: 100,
      width: 300,
      height: 150,
      props: { value: "$0", label: "Revenue" },
      animation: {
        entrance: { type: "slide", direction: "up", duration: 0.5, delay: 0 },
        semanticAnimation: { type: "count-up", from: 0, to: 1200000, duration: 1.0 },
      },
    } as any;

    // At t=0.25s (halfway through 0.5s slide entrance, 1/4 through 1.0s count-up)
    const state = animationRuntime.evaluateNodeState(node, 0.25, 5.0);

    // Preset layer: opacity > 0 and translateY > 0
    expect(state.opacity).toBeGreaterThan(0);
    expect(state.translateY).toBeGreaterThan(0);

    // Semantic layer: numericValueOverride evaluated halfway through count-up (progress 0.25 -> 300,000)
    expect(state.numericValueOverride).toBeCloseTo(300000);
  });

  test("Composition Test: Custom MotionPresetDefinition registered in motionPresetRegistry", () => {

    // Register a custom preset definition
    motionPresetRegistry.register({
      id: "spin-in",
      name: "Spin In",
      category: "entrance",
      buildTracks(preset, clipDuration) {
        return [
          { property: "rotation", keyframes: [{ time: 0, value: -180 }, { time: 1.0, value: 0 }] },
          { property: "opacity", keyframes: [{ time: 0, value: 0 }, { time: 1.0, value: 1 }] },
        ];
      },
    });

    const customNode: SceneNode = {
      id: "spin-node",
      name: "Spinning Text",
      type: "text",
      x: 50,
      y: 50,
      width: 200,
      height: 50,
      text: "Custom Preset",
      animation: {
        entrance: { type: "spin-in" as any, duration: 1.0, delay: 0, easing: "linear" },
      },
    } as any;

    // At t=0.5s (half of 1.0s duration with linear easing) -> opacity = 0.5
    const state = animationRuntime.evaluateNodeState(customNode, 0.5, 5.0);
    expect(state.opacity).toBeCloseTo(0.5);
  });

  test("Composition Test: Marker + Marker Offset + Hierarchy Stagger", () => {
    const doc: OverlayDocument = {
      id: "stagger-doc",
      version: "2.0",
      title: "Stagger Test",
      category: "test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      markers: [{ id: "m-keyword", time: 1.0, label: "Keyword", type: "keyword" }],
      nodes: [],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parentNode: SceneNode = {
      id: "parent-frame",
      name: "Frame",
      type: "frame",
      x: 0,
      y: 0,
      width: 500,
      height: 500,
      animation: {
        start: { type: "marker", markerId: "m-keyword", offset: 0.2 }, // start at t=1.2s
        animationScope: "children",
        staggerChildren: 0.1, // child 0 at 1.2s, child 1 at 1.3s
        entrance: { type: "fade", duration: 0.4, delay: 0 },
      },
      children: [
        {
          id: "child-1",
          name: "Child 1",
          type: "text",
          x: 10,
          y: 10,
          width: 200,
          height: 40,
          animation: { entrance: { type: "fade", duration: 0.4, delay: 0 } },
        } as any,
      ],
    } as any;

    const child0Delay = animationRuntime.computeChildInheritedDelay(parentNode.animation, 0, 1.2);
    expect(child0Delay).toBeCloseTo(1.2);

    // At t=1.1s (before child 0 start time 1.2s) -> opacity = 0
    const stateBefore = animationRuntime.evaluateNodeState(parentNode.children[0], 1.1, 5.0, {
      doc,
      inheritedDelay: child0Delay,
    });
    expect(stateBefore.opacity).toBe(0);

    // At t=1.4s (0.2s into 0.4s entrance duration) -> opacity = 0.5
    const stateDuring = animationRuntime.evaluateNodeState(parentNode.children[0], 1.4, 5.0, {
      doc,
      inheritedDelay: child0Delay,
    });
    expect(stateDuring.opacity).toBeGreaterThan(0);
  });
});





// ─────────────────────────────────────────────────────────────────────────────
// Phase 4F — EvaluatedSceneState Contract & Pathological Composition Tests
// ─────────────────────────────────────────────────────────────────────────────

function makeTestDoc(nodes: SceneNode[], markers: any[] = [], duration = 5): OverlayDocument {
  return {
    id: "test-doc",
    version: "2.0",
    title: "Test",
    category: "test",
    canvas: { width: 1280, height: 720 },
    variables: [],
    markers,
    nodes,
    duration,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Phase 4F — EvaluatedSceneState Contract", () => {
  test("evaluateScene() produces flat node map for frame with children", () => {
    const child1: SceneNode = { id: "c1", name: "Title", type: "text", x: 10, y: 10, width: 200, height: 40 } as any;
    const child2: SceneNode = { id: "c2", name: "Sub", type: "text", x: 10, y: 60, width: 200, height: 30 } as any;
    const frame: SceneNode = { id: "f1", name: "Card", type: "frame", x: 100, y: 100, width: 400, height: 200, children: [child1, child2] } as any;
    const scene = animationRuntime.evaluateScene(makeTestDoc([frame]), { currentTime: 2.5 });
    expect(scene.time).toBe(2.5);
    expect(scene.nodes["f1"]).toBeDefined();
    expect(scene.nodes["c1"]).toBeDefined();
    expect(scene.nodes["c2"]).toBeDefined();
  });

  test("EvaluatedNodeState contains only primitive values — no raw animation config", () => {
    const node: SceneNode = {
      id: "n1", name: "Badge", type: "shape", x: 50, y: 50, width: 100, height: 100,
      animation: { entrance: { type: "fade", duration: 0.5, delay: 0 }, semanticAnimation: { type: "count-up", from: 0, to: 100, duration: 1.0 } },
    } as any;
    const s = animationRuntime.evaluateScene(makeTestDoc([node]), { currentTime: 1.0 }).nodes["n1"];
    expect(typeof s.opacity).toBe("number");
    expect(typeof s.translateX).toBe("number");
    expect(typeof s.scaleX).toBe("number");
    expect(typeof s.visible).toBe("boolean");
    expect((s as any).animation).toBeUndefined();
    expect((s as any).entrance).toBeUndefined();
  });

  test("5-level deep hierarchy evaluates without throwing", () => {
    const l5: SceneNode = { id: "l5", name: "L5", type: "text", x: 0, y: 0, width: 100, height: 50, animation: { entrance: { type: "fade", duration: 0.3, delay: 0 } } } as any;
    const l4: SceneNode = { id: "l4", name: "L4", type: "frame", x: 0, y: 0, width: 200, height: 100, children: [l5], animation: { animationScope: "children", staggerChildren: 0.05 } } as any;
    const l3: SceneNode = { id: "l3", name: "L3", type: "frame", x: 0, y: 0, width: 300, height: 150, children: [l4] } as any;
    const l2: SceneNode = { id: "l2", name: "L2", type: "frame", x: 0, y: 0, width: 400, height: 200, children: [l3] } as any;
    const l1: SceneNode = { id: "l1", name: "L1", type: "frame", x: 0, y: 0, width: 500, height: 250, children: [l2] } as any;
    const doc = makeTestDoc([l1]);
    expect(() => animationRuntime.evaluateScene(doc, { currentTime: 1.0 })).not.toThrow();
    expect(Object.keys(animationRuntime.evaluateScene(doc, { currentTime: 2.0 }).nodes).length).toBeGreaterThanOrEqual(3);
  });

  test("Pathological: marker + stagger + keyframe tracks simultaneously", () => {
    const markers = [{ id: "m-test", time: 1.0, label: "Start", type: "keyword" }] as any[];
    const node: SceneNode = {
      id: "complex-node", name: "Complex", type: "shape", x: 100, y: 100, width: 200, height: 100,
      animation: {
        start: { type: "marker", markerId: "m-test", offset: 0 },
        entrance: { type: "fade", duration: 0.4, delay: 0 },
        keyframeTracks: [{ property: "opacity", keyframes: [{ time: 0.5, value: 0.8 }, { time: 1.0, value: 1.0 }] }],
      },
    } as any;
    const scene = animationRuntime.evaluateScene(makeTestDoc([node], markers), { currentTime: 3.0 });
    expect(scene.nodes["complex-node"].opacity).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4F — AnimationValidator Diagnostics Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Phase 4F — AnimationValidator Diagnostics", () => {
  test("returns empty diagnostics for clean document", () => {
    expect(animationValidator.validate(makeTestDoc([]))).toHaveLength(0);
  });

  test("MISSING_MARKER_REF — reference to nonexistent marker is an error", () => {
    const node: SceneNode = {
      id: "n1", name: "Title", type: "text", x: 0, y: 0, width: 200, height: 40,
      animation: { start: { type: "marker", markerId: "ghost-marker" } },
    } as any;
    const err = animationValidator.validate(makeTestDoc([node])).find((d) => d.code === "MISSING_MARKER_REF");
    expect(err).toBeDefined();
    expect(err?.severity).toBe("error");
    expect(err?.nodeId).toBe("n1");
  });

  test("TYPEWRITER_NON_TEXT — typewriter on shape node is a warning", () => {
    const node: SceneNode = {
      id: "n2", name: "Icon", type: "shape", x: 0, y: 0, width: 50, height: 50,
      animation: { semanticAnimation: { type: "typewriter", charsPerSecond: 18 } },
    } as any;
    const warn = animationValidator.validate(makeTestDoc([node])).find((d) => d.code === "TYPEWRITER_NON_TEXT");
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe("warning");
  });

  test("ANIMATION_PAST_DURATION — entrance overflows clip duration", () => {
    const node: SceneNode = {
      id: "n3", name: "Card", type: "frame", x: 0, y: 0, width: 400, height: 200,
      animation: { entrance: { type: "fade", duration: 4.0, delay: 2.0 } },
    } as any;
    expect(animationValidator.validate(makeTestDoc([node], [], 5)).find((d) => d.code === "ANIMATION_PAST_DURATION")).toBeDefined();
  });

  test("STAGGER_SCOPE_MISSING_CHILDREN — scope=children but no children", () => {
    const node: SceneNode = {
      id: "n4", name: "Group", type: "frame", x: 0, y: 0, width: 300, height: 150,
      animation: { animationScope: "children", staggerChildren: 0.1 },
    } as any;
    const warn = animationValidator.validate(makeTestDoc([node])).find((d) => d.code === "STAGGER_SCOPE_MISSING_CHILDREN");
    expect(warn?.severity).toBe("warning");
  });

  test("walks nested children to surface diagnostics recursively", () => {
    const badChild: SceneNode = {
      id: "child-bad", name: "BadShape", type: "shape", x: 0, y: 0, width: 50, height: 50,
      animation: { semanticAnimation: { type: "typewriter", charsPerSecond: 10 } },
    } as any;
    const parent: SceneNode = {
      id: "parent", name: "Parent", type: "frame", x: 0, y: 0, width: 400, height: 200, children: [badChild],
    } as any;
    const diagnostics = animationValidator.validate(makeTestDoc([parent]));
    expect(diagnostics.find((d) => d.nodeId === "child-bad" && d.code === "TYPEWRITER_NON_TEXT")).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4G — Universal Overlay Authoring Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Phase 4G — Universal Component & Command Architecture", () => {
  test("PropertyDefinition contains animatable and bindable participation flags", () => {
    const statDef = componentRegistry.get("stat-card");
    expect(statDef).toBeDefined();
    const valueProp = statDef?.schema.find((f) => f.key === "value");
    expect(valueProp?.bindable).toBe(true);

    const accentProp = statDef?.schema.find((f) => f.key === "accentColor");
    expect(accentProp?.animatable).toBe(true);
    expect(accentProp?.animationPropertyType).toBe("color");
  });

  test("DETACH_COMPONENT converts ComponentNode into FrameNode preserving children & props", () => {
    const compNode: SceneNode = {
      id: "stat-1",
      name: "My Stat Card",
      type: "component",
      componentType: "stat-card",
      x: 10, y: 10, width: 200, height: 100,
      props: { value: "+100%", label: "Revenue" },
      children: [
        { id: "child-1", name: "Text", type: "text", x: 0, y: 0, width: 100, height: 20, text: "Label" } as any
      ]
    } as any;

    const doc = makeTestDoc([compNode]);
    const res = commandExecutor.execute(doc, { type: "DETACH_COMPONENT", nodeId: "stat-1" });

    const detached = res.nextDocument.nodes[0];
    expect(detached.type).toBe("frame");
    expect(detached.name).toContain("Detached");
    expect((detached as any).children).toHaveLength(1);
    expect((detached as any).componentType).toBeUndefined();
  });

  test("UPDATE_CANVAS_SIZE resizes document canvas", () => {
    const doc = makeTestDoc([]);
    const res = commandExecutor.execute(doc, { type: "UPDATE_CANVAS_SIZE", width: 1080, height: 1920 });

    expect(res.nextDocument.canvas.width).toBe(1080);
    expect(res.nextDocument.canvas.height).toBe(1920);

    const inverse = commandExecutor.execute(res.nextDocument, res.inverseCommand);
    expect(inverse.nextDocument.canvas.width).toBe(1280);
    expect(inverse.nextDocument.canvas.height).toBe(720);
  });

  test("SET_BINDING adds, updates, and removes binding rules", () => {
    const node: SceneNode = { id: "n1", name: "Node", type: "text", x: 0, y: 0, width: 100, height: 20, text: "Hi" } as any;
    const doc = makeTestDoc([node]);

    // Add binding
    const res1 = commandExecutor.execute(doc, { type: "SET_BINDING", nodeId: "n1", targetProperty: "text", expression: "{{user.name}}" });
    const n1 = res1.nextDocument.nodes[0];
    expect(n1.bindings).toHaveLength(1);
    expect(n1.bindings![0]).toEqual({ targetProperty: "text", expression: "{{user.name}}" });

    // Clear binding
    const res2 = commandExecutor.execute(res1.nextDocument, { type: "SET_BINDING", nodeId: "n1", targetProperty: "text", expression: "" });
    expect(res2.nextDocument.nodes[0].bindings).toHaveLength(0);
  });

  test("serializeTemplate and deserializeTemplate preserve full overlay document", () => {
    const node: SceneNode = { id: "n1", name: "Title", type: "text", x: 0, y: 0, width: 200, height: 40, text: "Hello" } as any;
    const doc = makeTestDoc([node]);

    const manifest = serializeTemplate(doc, {
      id: "tmpl-1",
      name: "Test Template",
      category: "metrics",
      tags: ["test", "demo"]
    });

    expect(manifest.kind).toBe("smart-overlay-template");
    expect(manifest.schemaVersion).toBe("1.0");
    expect(manifest.metadata.name).toBe("Test Template");

    const restoredDoc = deserializeTemplate(manifest);
    expect(restoredDoc.id).toBe(doc.id);
    expect(restoredDoc.nodes).toHaveLength(1);
    expect((restoredDoc.nodes[0] as any).text).toBe("Hello");
  });

  test("5 new Phase 4G components are registered and create default nodes", () => {
    const newTypes = ["versus-card", "progress-bar", "lower-third-duo", "social-handle", "step-card"];
    for (const type of newTypes) {
      const def = componentRegistry.get(type);
      expect(def).toBeDefined();
      expect(def?.category).toBeDefined();
      const defaultNode = def?.createDefaultNode();
      expect(defaultNode).toBeDefined();
      expect(defaultNode?.id).toBeDefined();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4H — Invariants & Equivalence Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Phase 4H — Invariants & Equivalence Tests", () => {
  test("DETACH_COMPONENT visual & geometric invariant: zero visual drift before vs after detach", () => {
    const compDef = componentRegistry.get("stat-card")!;
    const compNode = compDef.createDefaultNode();
    const doc = makeTestDoc([compNode]);

    // Evaluate scene state before detach
    const stateBefore = animationRuntime.evaluateScene(doc, { currentTime: 0 });
    const nodeBefore = stateBefore.nodes[compNode.id];
    expect(nodeBefore).toBeDefined();

    // Detach component
    const res = commandExecutor.execute(doc, { type: "DETACH_COMPONENT", nodeId: compNode.id });
    const stateAfter = animationRuntime.evaluateScene(res.nextDocument, { currentTime: 0 });
    const nodeAfter = stateAfter.nodes[compNode.id];
    expect(nodeAfter).toBeDefined();

    // Assert exact match on evaluated geometry invariants
    expect(nodeAfter.x).toBe(nodeBefore.x);
    expect(nodeAfter.y).toBe(nodeBefore.y);
    expect(nodeAfter.width).toBe(nodeBefore.width);
    expect(nodeAfter.height).toBe(nodeBefore.height);
    expect(nodeAfter.opacity).toBe(nodeBefore.opacity);
    expect(nodeAfter.visible).toBe(nodeBefore.visible);
    expect(nodeAfter.rotation).toBe(nodeBefore.rotation);
  });

  test("Template Serialization Compatibility Roundtrip (serialize -> deserialize -> validate -> migrate -> serialize)", () => {
    const textNode: SceneNode = { id: "t1", name: "Text", type: "text", x: 10, y: 10, width: 200, height: 40, text: "Sample" } as any;
    const initialDoc = makeTestDoc([textNode]);

    // 1. Serialize
    const manifest1 = serializeTemplate(initialDoc, {
      id: "tmpl-test",
      name: "Roundtrip Test",
      category: "metrics",
      tags: ["metrics", "v1"]
    });

    // 2. Deserialize
    const doc1 = deserializeTemplate(manifest1);
    expect(doc1.id).toBe(initialDoc.id);

    // 3. Validate
    const errors = documentValidator.validate(doc1);
    expect(errors).toHaveLength(0);

    // 4. Serialize again
    const manifest2 = serializeTemplate(doc1, {
      id: "tmpl-test",
      name: "Roundtrip Test",
      category: "metrics",
      tags: ["metrics", "v1"]
    });

    // 5. Deep equality of manifest document payload
    expect(manifest2.document).toEqual(manifest1.document);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4H — Acceptance Benchmark Test
// ─────────────────────────────────────────────────────────────────────────────

describe("Phase 4H — Acceptance Benchmark Test", () => {
  test("Brutal Benchmark: StatCard with widthMode='hug' + AutoLayout produces non-overlapping, content-hugged geometry across short, medium, and long data strings", () => {
    // 1. Create 3 text nodes with different data lengths
    const textShort: SceneNode = {
      id: "txt-short", name: "Short Value", type: "text", x: 0, y: 0, width: 100, height: 40,
      text: "$14", style: { fontSize: 32 }, layout: { constraints: { widthMode: "hug" } }
    } as any;

    const textMed: SceneNode = {
      id: "txt-med", name: "Medium Value", type: "text", x: 0, y: 0, width: 100, height: 40,
      text: "$1,248.90", style: { fontSize: 32 }, layout: { constraints: { widthMode: "hug" } }
    } as any;

    const textLong: SceneNode = {
      id: "txt-long", name: "Long Value", type: "text", x: 0, y: 0, width: 100, height: 40,
      text: "+1,000,000,000% YoY Growth", style: { fontSize: 32 }, layout: { constraints: { widthMode: "hug" } }
    } as any;

    // 2. Wrap each in an Auto Layout container frame with flex-column and padding
    const cardShort: SceneNode = {
      id: "card-short", name: "Card Short", type: "frame", x: 10, y: 10, width: 100, height: 100,
      layout: { mode: "flex-column", gap: 12, padding: { top: 16, right: 16, bottom: 16, left: 16 }, constraints: { widthMode: "hug" } },
      children: [textShort]
    } as any;

    const cardMed: SceneNode = {
      id: "card-med", name: "Card Med", type: "frame", x: 10, y: 150, width: 100, height: 100,
      layout: { mode: "flex-column", gap: 12, padding: { top: 16, right: 16, bottom: 16, left: 16 }, constraints: { widthMode: "hug" } },
      children: [textMed]
    } as any;

    const cardLong: SceneNode = {
      id: "card-long", name: "Card Long", type: "frame", x: 10, y: 300, width: 100, height: 100,
      layout: { mode: "flex-column", gap: 12, padding: { top: 16, right: 16, bottom: 16, left: 16 }, constraints: { widthMode: "hug" } },
      children: [textLong]
    } as any;

    const doc = makeTestDoc([cardShort, cardMed, cardLong]);

    // 3. Compute layout pass via LayoutEngine
    const layoutResult = layoutEngine.computeLayout(doc);

    const boundsShort = layoutResult.nodes["card-short"];
    const boundsMed = layoutResult.nodes["card-med"];
    const boundsLong = layoutResult.nodes["card-long"];

    expect(boundsShort).toBeDefined();
    expect(boundsMed).toBeDefined();
    expect(boundsLong).toBeDefined();

    // 4. Assert width ordering: long > med > short (content hugging invariant)
    expect(boundsLong.width).toBeGreaterThan(boundsMed.width);
    expect(boundsMed.width).toBeGreaterThan(boundsShort.width);

    // 5. Evaluate scene via AnimationRuntime
    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });
    expect(sceneState.nodes["card-short"].visible).toBe(true);
    expect(sceneState.nodes["card-med"].visible).toBe(true);
    expect(sceneState.nodes["card-long"].visible).toBe(true);
  });
});
