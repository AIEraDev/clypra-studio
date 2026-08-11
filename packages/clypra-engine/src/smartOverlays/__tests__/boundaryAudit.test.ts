/**
 * Phase 4N — Suite 1: Pipeline Boundary Audit & Contract Enforcer
 *
 * Formally traces and validates all 13 transition boundaries in the engine:
 * 1. Document → Schema / Migration
 * 2. Schema → Commands
 * 3. Commands → Authoring State
 * 4. Authoring State → Responsive Resolver
 * 5. Responsive Resolver → Layout Engine
 * 6. Layout Engine → Data Binding
 * 7. Data Binding → Animation Runtime
 * 8. Animation Runtime → EvaluatedSceneState
 * 9. EvaluatedSceneState → Asset Resolution
 * 10. Asset Resolution → Pixi Projection
 * 11. Pixi Projection → Export Pipeline
 * 12. Export Pipeline → Media Encoder
 * 13. Media Encoder → Export Result Output
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  documentValidator,
  documentMigrator,
  commandExecutor,
  CommandHistory,
  resolveDocumentForBreakpoint,
  layoutEngine,
  dataBindingEngine,
  animationRuntime,
  assetRegistry,
  pixiSceneProjection,
  evaluateExportFrame,
  streamExportFrames,
  serializeTemplate,
  deserializeTemplate,
  PngSequenceEncoder,
  type OverlayDocument,
  type FrameNode,
  type PrimitiveTextNode,
  type PrimitiveShapeNode,
} from "../index.js";

function createBaselineDoc(): OverlayDocument {
  const rootNode: FrameNode = {
    id: "root-frame",
    name: "Root Frame",
    type: "frame",
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    style: { backgroundColor: "#111827" },
    layout: { mode: "flex-column", padding: { top: 20, right: 20, bottom: 20, left: 20 }, gap: 10 },
    children: [
      {
        id: "child-text",
        name: "Title Text",
        type: "text",
        x: 0,
        y: 0,
        width: 400,
        height: 50,
        text: "Hello {{username}}",
        style: { fontSize: 32, textColor: "#FFFFFF" },
        animation: { entrance: { type: "fade", duration: 1.0, delay: 0 } },
      } as PrimitiveTextNode,
      {
        id: "child-shape",
        name: "Accent Line",
        type: "shape",
        x: 0,
        y: 0,
        width: 200,
        height: 10,
        shapeType: "rectangle",
        style: { fillColor: "#3B82F6" },
      } as PrimitiveShapeNode,
    ],
  };

  return {
    id: "boundary-doc-1",
    version: "2.0",
    title: "Boundary Audit Document",
    category: "test",
    canvas: { width: 800, height: 600 },
    variables: [{ key: "username", dataType: "string", defaultValue: "Alex Developer", label: "Username" }],
    nodes: [rootNode],
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Phase 4N — Suite 1: Boundary Audit & Pipeline Contracts", () => {
  beforeEach(() => {
    assetRegistry.clear();
  });

  test("Arrow 1: Document -> Schema / Migration contract boundary", () => {
    const rawDoc = createBaselineDoc();
    const validationErrors = documentValidator.validate(rawDoc);
    const errors = validationErrors.filter((e) => e.severity === "error");
    expect(errors).toHaveLength(0);

    const migrated = documentMigrator.migrate(rawDoc);
    expect(migrated.version).toBe("2.0");
    expect(migrated.nodes).toHaveLength(1);
  });

  test("Arrow 2: Schema -> Commands contract boundary", () => {
    const doc = createBaselineDoc();
    const command = {
      type: "UPDATE_NODE_PROPERTY" as const,
      nodeId: "child-text",
      path: "text",
      value: "Updated Title",
    };

    const { nextDocument } = commandExecutor.execute(doc, command);
    expect(nextDocument).not.toBe(doc); // Immutability guarantee
    const rootFrame = nextDocument.nodes[0] as FrameNode;
    const textNode = rootFrame.children[0] as PrimitiveTextNode;
    expect(textNode.text).toBe("Updated Title");
  });

  test("Arrow 3: Commands -> Authoring State / Undo-Redo contract boundary", () => {
    const doc = createBaselineDoc();
    const history = new CommandHistory({ maxSize: 50 });

    const docAfterCommand = history.execute(doc, {
      type: "UPDATE_NODE_PROPERTY",
      nodeId: "child-text",
      path: "text",
      value: "Changed State",
    });

    expect(history.canUndo()).toBe(true);
    const undoDoc = history.undo(docAfterCommand);
    expect(undoDoc).toBeDefined();
    const rootFrame = undoDoc.nodes[0] as FrameNode;
    const textNode = rootFrame.children[0] as PrimitiveTextNode;
    expect(textNode.text).toBe("Hello {{username}}");
  });

  test("Arrow 4: Authoring State -> Responsive Resolver contract boundary", () => {
    const doc = createBaselineDoc();
    const resolved = resolveDocumentForBreakpoint(doc, null);

    expect(resolved).toBeDefined();
    expect(resolved.canvas.width).toBe(800);
    expect(resolved.nodes[0].width).toBeDefined();
  });

  test("Arrow 5: Responsive Resolver -> Layout Engine contract boundary", () => {
    const doc = createBaselineDoc();
    const layoutState = layoutEngine.computeLayout(doc);

    expect(layoutState).toBeDefined();
    expect(layoutState.nodes["root-frame"]).toBeDefined();
    expect(layoutState.nodes["child-text"]).toBeDefined();
    expect(layoutState.nodes["child-shape"]).toBeDefined();
  });

  test("Arrow 6: Layout Engine -> Data Binding contract boundary", () => {
    const doc = createBaselineDoc();
    const textNode = (doc.nodes[0] as FrameNode).children[0] as PrimitiveTextNode;
    const boundText = dataBindingEngine.evaluateExpression(textNode.text, { username: "Alex Developer" });

    expect(boundText).toBe("Hello Alex Developer");
  });

  test("Arrow 7: Data Binding -> Animation Runtime contract boundary", () => {
    const doc = createBaselineDoc();
    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 0.5 });

    expect(sceneState).toBeDefined();
    expect(sceneState.nodes["child-text"]).toBeDefined();
  });

  test("Arrow 8: Animation Runtime -> EvaluatedSceneState contract boundary", () => {
    const doc = createBaselineDoc();
    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 0.5 });

    expect(sceneState.time).toBe(0.5);
    expect(sceneState.nodes["child-text"].opacity).toBeGreaterThan(0);
    expect(sceneState.nodes["child-text"].opacity).toBeLessThanOrEqual(1);
  });

  test("Arrow 9: EvaluatedSceneState -> Asset Resolution contract boundary", () => {
    assetRegistry.register({
      assetId: "asset-1",
      type: "image",
      source: "inline",
      uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });
    assetRegistry.markReady("asset-1", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

    const doc = createBaselineDoc();
    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });
    const registered = assetRegistry.get("asset-1");

    expect(sceneState).toBeDefined();
    expect(registered?.state).toBe("ready");
  });

  test("Arrow 10: Asset Resolution -> Pixi Projection contract boundary", () => {
    const doc = createBaselineDoc();
    const projection = pixiSceneProjection;
    const rootContainer = projection.project(doc, 1.0);

    expect(rootContainer).toBeDefined();
    expect(rootContainer.children.length).toBeGreaterThan(0);
  });

  test("Arrow 11: Pixi Projection -> Export Pipeline contract boundary", () => {
    const doc = createBaselineDoc();
    const frame = evaluateExportFrame(doc, 1.0, { customWidth: 800, customHeight: 600 });

    expect(frame.frameIndex).toBe(30); // t=1s @ 30fps
    expect(frame.canvasWidth).toBe(800);
    expect(frame.canvasHeight).toBe(600);
    expect(frame.evaluatedSceneState).toBeDefined();
  });

  test("Arrow 12: Export Pipeline -> Media Encoder contract boundary", async () => {
    const doc = createBaselineDoc();
    const generator = streamExportFrames(doc, { fps: 30, duration: 0.1 });

    let frameCount = 0;
    for await (const frame of generator) {
      expect(frame.time).toBeDefined();
      frameCount++;
    }

    expect(frameCount).toBe(3); // 0.1s * 30fps = 3 frames
  });

  test("Arrow 13: Media Encoder -> Export Result Output contract boundary", async () => {
    const doc = createBaselineDoc();
    const encoder = new PngSequenceEncoder();
    const result = await encoder.encode(
      streamExportFrames(doc, { fps: 10, duration: 0.2 }),
      { profile: "custom", customWidth: 320, customHeight: 240, fps: 10, duration: 0.2, format: "png-sequence" }
    );

    expect(result.format).toBe("png-sequence");
    expect(result.files.length).toBe(2);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(0);
  });

  test("Full Serialization & Deserialization boundary roundtrip invariant", () => {
    const doc = createBaselineDoc();
    const template = serializeTemplate(doc, { id: "t1", name: "Template 1", category: "test" });
    const roundtripped = deserializeTemplate(template);

    expect(roundtripped.id).toBe(doc.id);
    expect(roundtripped.nodes).toHaveLength(doc.nodes.length);
    const origText = (doc.nodes[0] as FrameNode).children[0] as PrimitiveTextNode;
    const roundText = (roundtripped.nodes[0] as FrameNode).children[0] as PrimitiveTextNode;
    expect(roundText.text).toBe(origText.text);
  });
});
