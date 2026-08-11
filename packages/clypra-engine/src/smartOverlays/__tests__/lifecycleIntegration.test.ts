import { describe, test, expect } from "vitest";
import {
  commandExecutor,
  CommandHistory,
  documentValidator,
  documentMigrator,
  serializeTemplate,
  deserializeTemplate,
  componentRegistry,
  dataBindingEngine,
  layoutEngine,
  animationRuntime,
  pixiSceneProjection,
  type OverlayDocument,
  type SceneNode,
  type ComponentNode
} from "../index.js";

function makeDoc(nodes: SceneNode[] = [], variables: any[] = [], canvas = { width: 1280, height: 720 }, duration = 5): OverlayDocument {
  return {
    id: "lifecycle-doc-1",
    version: "2.0",
    title: "Lifecycle Integration Test Doc",
    category: "test",
    canvas,
    variables,
    nodes,
    duration,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe("Phase 4H.Stabilization — Full Lifecycle Integration Suites", () => {
  // ── SUITE 1: DOCUMENT LIFECYCLE ──────────────────────────────────────────
  test("Lifecycle 1: Document Lifecycle (Create -> 10 Commands -> Undo 5 -> Redo 3 -> Serialize -> Deserialize -> Migrate -> Validate)", () => {
    const history = new CommandHistory({ maxSize: 50 });
    let doc = makeDoc([]);

    // Step A: 10 sequential commands
    const node1: SceneNode = { id: "node-1", name: "Text Node", type: "text", x: 10, y: 10, width: 200, height: 40, text: "Initial" } as any;
    doc = history.execute(doc, { type: "ADD_NODE", node: node1 });

    const node2: SceneNode = { id: "node-2", name: "Shape Node", type: "shape", shapeType: "rectangle", x: 50, y: 50, width: 100, height: 100 } as any;
    doc = history.execute(doc, { type: "ADD_NODE", node: node2 });

    doc = history.execute(doc, { type: "UPDATE_NODE_PROPERTY", nodeId: "node-1", path: "text", value: "Updated Step 3" });
    doc = history.execute(doc, { type: "UPDATE_NODE_STYLE", nodeId: "node-2", stylePath: "fillColor", value: "#7C6FFF" });
    doc = history.execute(doc, { type: "ADD_VARIABLE", key: "revenue", dataType: "number", defaultValue: 1000000, label: "Total Revenue" });
    doc = history.execute(doc, { type: "SET_BINDING", nodeId: "node-1", targetProperty: "text", expression: "{{revenue}}" });
    doc = history.execute(doc, { type: "UPDATE_CANVAS_SIZE", width: 1080, height: 1920 });
    doc = history.execute(doc, { type: "ADD_TIMELINE_MARKER", marker: { id: "m1", time: 1.5, label: "Intro", type: "keyword" } });
    doc = history.execute(doc, { type: "UPDATE_NODE_PROPERTY", nodeId: "node-2", path: "rotation", value: 45 });
    doc = history.execute(doc, { type: "UPDATE_VARIABLE", key: "revenue", patch: { defaultValue: 2500000 } });

    expect(doc.nodes).toHaveLength(2);
    expect(doc.canvas.width).toBe(1080);
    expect(doc.variables[0].defaultValue).toBe(2500000);

    // Step B: Undo 5 steps
    for (let i = 0; i < 5; i++) {
      doc = history.undo(doc);
    }
    // After 5 undos: rotation reverted, m1 marker removed, canvas back to 1280x720, etc.
    expect(doc.canvas.width).toBe(1280);

    // Step C: Redo 3 steps
    for (let i = 0; i < 3; i++) {
      doc = history.redo(doc);
    }

    // Step D: Serialize -> Deserialize -> Migrate -> Validate
    const manifest = serializeTemplate(doc, {
      id: "tmpl-lifecycle",
      name: "Lifecycle Template",
      category: "metrics",
      tags: ["lifecycle", "test"]
    });

    const restoredDoc = deserializeTemplate(manifest);
    const migratedDoc = documentMigrator.migrate(restoredDoc);
    const validationErrors = documentValidator.validate(migratedDoc);
    const errors = validationErrors.filter((e) => e.severity === "error");
    expect(errors).toHaveLength(0);
    expect(migratedDoc.nodes).toHaveLength(2);
    expect(migratedDoc.variables[0].key).toBe("revenue");
  });

  // ── SUITE 2: AUTHORING LIFECYCLE ─────────────────────────────────────────
  test("Lifecycle 2: Authoring Lifecycle (Primitives -> Group -> Component -> Detach -> Parity)", () => {
    const textNode: SceneNode = { id: "p-text", name: "Label", type: "text", x: 10, y: 10, width: 150, height: 30, text: "Stat Label" } as any;
    const valNode: SceneNode = { id: "p-val", name: "Value", type: "text", x: 10, y: 50, width: 150, height: 50, text: "$99,000" } as any;
    let doc = makeDoc([textNode, valNode]);

    // Step A: GROUP_NODES into a parent Frame
    const groupRes = commandExecutor.execute(doc, { type: "GROUP_NODES", nodeIds: ["p-text", "p-val"], frameName: "Stat Group" });
    doc = groupRes.nextDocument;
    expect(doc.nodes).toHaveLength(1);
    const frame = doc.nodes[0];
    expect(frame.type).toBe("frame");
    expect((frame as any).children).toHaveLength(2);

    // Step B: Instantiate a StatCard Component
    const statDef = componentRegistry.get("stat-card")!;
    const compNode = statDef.createDefaultNode();
    doc.nodes.push(compNode);

    // Evaluate geometry before detach
    const sceneBefore = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });
    const compStateBefore = sceneBefore.nodes[compNode.id];

    // Step C: DETACH_COMPONENT back to plain Frame
    const detachRes = commandExecutor.execute(doc, { type: "DETACH_COMPONENT", nodeId: compNode.id });
    doc = detachRes.nextDocument;

    const detachedNode = doc.nodes.find((n) => n.id === compNode.id);
    expect(detachedNode?.type).toBe("frame");

    const sceneAfter = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });
    const compStateAfter = sceneAfter.nodes[compNode.id];

    // Assert exact spatial parity
    expect(compStateAfter.x).toBe(compStateBefore.x);
    expect(compStateAfter.y).toBe(compStateBefore.y);
    expect(compStateAfter.width).toBe(compStateBefore.width);
    expect(compStateAfter.height).toBe(compStateBefore.height);
  });

  // ── SUITE 3: GEOMETRY LIFECYCLE ──────────────────────────────────────────
  test("Lifecycle 3: Geometry & Auto-Layout Lifecycle (Nested Flex -> Text Update -> Canvas Resize)", () => {
    const textChild: SceneNode = {
      id: "geo-txt", name: "Dynamic Title", type: "text", x: 0, y: 0, width: 100, height: 30,
      text: "{{title}}", style: { fontSize: 24 }, layout: { constraints: { widthMode: "hug" } }
    } as any;

    const rowContainer: SceneNode = {
      id: "geo-row", name: "Flex Row", type: "frame", x: 0, y: 0, width: 100, height: 50,
      layout: { mode: "flex-row", gap: 10, padding: { top: 10, right: 10, bottom: 10, left: 10 }, constraints: { widthMode: "hug" } },
      children: [textChild]
    } as any;

    const rootCol: SceneNode = {
      id: "geo-root", name: "Root Col", type: "frame", x: 20, y: 20, width: 100, height: 100,
      layout: { mode: "flex-column", gap: 16, padding: { top: 20, right: 20, bottom: 20, left: 20 }, constraints: { widthMode: "hug" } },
      children: [rowContainer]
    } as any;

    let doc = makeDoc([rootCol], [{ key: "title", type: "string", defaultValue: "Short" }]);

    // Initial layout
    const layout1 = layoutEngine.computeLayout(doc);
    const width1 = layout1.nodes["geo-root"].width;

    // Update text data binding string to a much longer string
    doc.variables[0].defaultValue = "Super Long Executive Headline Title That Expands Container";
    const layout2 = layoutEngine.computeLayout(doc);
    const width2 = layout2.nodes["geo-root"].width;

    // Assert container hugged new expanded text width
    expect(width2).toBeGreaterThan(width1);

    // Resize Canvas from 1280x720 -> 1080x1920
    doc.canvas = { width: 1080, height: 1920 };
    const layout3 = layoutEngine.computeLayout(doc);
    expect(layout3.nodes["geo-root"]).toBeDefined();
  });

  // ── SUITE 4: RUNTIME PIPELINE LIFECYCLE ──────────────────────────────────
  test("Lifecycle 4: Full Runtime Pipeline (Variables -> DataBinding -> LayoutEngine -> AnimationRuntime -> PixiSceneProjection)", () => {
    const textNode: SceneNode = {
      id: "rt-txt", name: "Revenue Text", type: "text", x: 10, y: 10, width: 200, height: 40,
      text: "{{revenue}}",
      style: { fontSize: 32, textColor: "#7C6FFF" },
      animation: { entrance: { type: "fade", duration: 0.5, delay: 0 } }
    } as any;

    const doc = makeDoc([textNode], [{ key: "revenue", type: "number", defaultValue: 5000000 }]);

    // 1. Data Binding Pass
    const boundText = dataBindingEngine.evaluateExpression(textNode.text, { revenue: 5000000 });
    expect(boundText).toBe(5000000);

    // 2. Layout Engine Pass
    const layoutState = layoutEngine.computeLayout(doc);
    expect(layoutState.nodes["rt-txt"]).toBeDefined();

    // 3. Animation Runtime Pass
    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });
    const evaluatedNode = sceneState.nodes["rt-txt"];
    expect(evaluatedNode.opacity).toBe(1);
    expect(evaluatedNode.visible).toBe(true);

    // 4. Pixi Projection Pass
    const projection = pixiSceneProjection;
    const container = projection.project(doc, 1.0);
    expect(container).toBeDefined();
  });
});
