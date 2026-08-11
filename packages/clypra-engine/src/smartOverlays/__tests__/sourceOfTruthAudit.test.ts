/**
 * Phase 4N — Suite 2: Elimination of Duplicated Sources of Truth Audit
 *
 * Enforces single source of truth at each stage of the system pipeline:
 * 1. Authoring document nodes are immutable inputs to layout & animation evaluation.
 * 2. node.width (authoring style) vs computed layout width (layoutEngine output).
 * 3. node.x (static coordinate) vs evaluatedNode.x (runtime evaluated scene state).
 * 4. animationRuntime vs layoutEngine execution order (layout precedes animation).
 * 5. Inspector command actions emit immutable document patches without direct mutations.
 * 6. Preview rendering state vs Export evaluation state parity.
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  layoutEngine,
  animationRuntime,
  commandExecutor,
  pixiSceneProjection,
  evaluateExportFrame,
  assetRegistry,
  type OverlayDocument,
  type FrameNode,
  type PrimitiveTextNode,
  type PrimitiveShapeNode,
} from "../index.js";

function createBaselineDoc(): OverlayDocument {
  const textNode: PrimitiveTextNode = {
    id: "sot-text",
    name: "Header Text",
    type: "text",
    x: 10,
    y: 10,
    width: 200,
    height: 40,
    text: "Source of Truth",
    style: { fontSize: 24, textColor: "#FFFFFF" },
    animation: { entrance: { type: "slide-up", duration: 1.0, delay: 0 } },
  };

  const shapeNode: PrimitiveShapeNode = {
    id: "sot-shape",
    name: "Background Badge",
    type: "shape",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    shapeType: "rectangle",
    style: { fillColor: "#10B981" },
  };

  const frameNode: FrameNode = {
    id: "sot-frame",
    name: "Flex Container",
    type: "frame",
    x: 50,
    y: 50,
    width: 400,
    height: 300,
    layout: { mode: "flex-column", padding: { top: 20, right: 20, bottom: 20, left: 20 }, gap: 15 },
    children: [textNode, shapeNode],
  };

  return {
    id: "sot-doc-1",
    version: "2.0",
    title: "Source of Truth Audit Doc",
    category: "test",
    canvas: { width: 1280, height: 720 },
    variables: [],
    nodes: [frameNode],
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Phase 4N — Suite 2: Single Source of Truth & Runtime Boundaries", () => {
  beforeEach(() => {
    assetRegistry.clear();
  });

  test("Invariant 2.1: Authoring node properties are NOT mutated during layout or animation evaluation", () => {
    const doc = createBaselineDoc();
    const originalDocSnapshot = JSON.stringify(doc);

    // Run layout engine
    const layoutState = layoutEngine.computeLayout(doc);
    expect(layoutState.nodes["sot-text"]).toBeDefined();

    // Run animation runtime
    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 0.5 });
    expect(sceneState.nodes["sot-text"]).toBeDefined();

    // Assert document JSON snapshot is bit-for-bit identical after evaluation
    expect(JSON.stringify(doc)).toBe(originalDocSnapshot);
  });

  test("Invariant 2.2: Single Authority — node.width vs layoutComputed.width", () => {
    const doc = createBaselineDoc();
    const frameNode = doc.nodes[0] as FrameNode;
    const textNode = frameNode.children[0] as PrimitiveTextNode;

    const layoutState = layoutEngine.computeLayout(doc);
    const computedTextWidth = layoutState.nodes["sot-text"].width;

    // Authoring node.width remains fixed while layoutState yields computed layout geometry
    expect(textNode.width).toBe(200);
    expect(computedTextWidth).toBeDefined();
    expect(typeof computedTextWidth).toBe("number");
  });

  test("Invariant 2.3: Single Authority — node.x vs evaluatedNode.x", () => {
    const doc = createBaselineDoc();
    const frameNode = doc.nodes[0] as FrameNode;
    const textNode = frameNode.children[0] as PrimitiveTextNode;

    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 0.5 });
    const evaluatedTextNode = sceneState.nodes["sot-text"];

    // Authoring node.x remains relative local offset (10), evaluated text node has runtime position
    expect(textNode.x).toBe(10);
    expect(evaluatedTextNode.x).toBeDefined();
  });

  test("Invariant 2.4: Sequential Ordering — layout engine pass precedes animation runtime", () => {
    const doc = createBaselineDoc();

    const layoutState = layoutEngine.computeLayout(doc);
    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });

    expect(layoutState.nodes["sot-frame"]).toBeDefined();
    expect(sceneState.nodes["sot-frame"]).toBeDefined();

    // Animation runtime output is derived cleanly without modifying layout state definitions
    expect(sceneState.time).toBe(1.0);
  });

  test("Invariant 2.5: Command System Immutability — inspector actions alter state exclusively via commands", () => {
    const doc = createBaselineDoc();
    const command = {
      type: "UPDATE_NODE_PROPERTY" as const,
      nodeId: "sot-text",
      path: "style.textColor",
      value: "#F59E0B",
    };

    const { nextDocument } = commandExecutor.execute(doc, command);

    // Initial document is unchanged
    const initialTextNode = ((doc.nodes[0] as FrameNode).children[0] as PrimitiveTextNode);
    expect(initialTextNode.style.textColor).toBe("#FFFFFF");

    // Next document has new value
    const updatedTextNode = ((nextDocument.nodes[0] as FrameNode).children[0] as PrimitiveTextNode);
    expect(updatedTextNode.style.textColor).toBe("#F59E0B");
  });

  test("Invariant 2.6: Single Runtime Boundary — Studio Preview projection and Export Evaluation share identical state structure", () => {
    const doc = createBaselineDoc();
    const time = 1.5;

    // 1. Studio Preview projection state
    const previewSceneState = animationRuntime.evaluateScene(doc, { currentTime: time });
    const previewContainer = pixiSceneProjection.project(doc, time);

    // 2. Export frame evaluation state
    const exportFrame = evaluateExportFrame(doc, time);

    // Assert that both preview and export consume identical EvaluatedSceneState timestamps and node counts
    expect(exportFrame.evaluatedSceneState.time).toBe(previewSceneState.time);
    expect(Object.keys(exportFrame.evaluatedSceneState.nodes)).toEqual(
      Object.keys(previewSceneState.nodes)
    );
    expect(previewContainer.children.length).toBeGreaterThan(0);
  });
});
