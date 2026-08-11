/**
 * Phase 4N — Suite 3: Determinism & Multi-Environment Parity Audit Test Suite
 *
 * Verifies strict mathematical and structural determinism across:
 * 1. Pure function evaluation identity: evaluate(t) x 100 iterations.
 * 2. Document pipeline roundtrip: Document -> serialize -> deserialize -> migrate -> evaluate.
 * 3. Studio preview vs. Export frame evaluation state parity.
 * 4. Temporal statelessness: evaluating t1 -> t2 -> t1 produces identical state for t1.
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  animationRuntime,
  layoutEngine,
  documentMigrator,
  serializeTemplate,
  deserializeTemplate,
  evaluateExportFrame,
  assetRegistry,
  type OverlayDocument,
  type FrameNode,
  type PrimitiveTextNode,
  type PrimitiveShapeNode,
} from "../index.js";

function createBaselineDoc(): OverlayDocument {
  const textNode: PrimitiveTextNode = {
    id: "det-text",
    name: "Deterministic Text",
    type: "text",
    x: 20,
    y: 20,
    width: 250,
    height: 45,
    text: "Revenue: ${{revenue}}",
    style: { fontSize: 28, textColor: "#6366F1" },
    animation: { entrance: { type: "pop-in", duration: 0.8, delay: 0.2 } },
  };

  const shapeNode: PrimitiveShapeNode = {
    id: "det-shape",
    name: "Accent Bar",
    type: "shape",
    x: 0,
    y: 0,
    width: 150,
    height: 12,
    shapeType: "rectangle",
    style: { fillColor: "#EC4899" },
  };

  const rootFrame: FrameNode = {
    id: "det-root",
    name: "Root Frame",
    type: "frame",
    x: 0,
    y: 0,
    width: 1280,
    height: 720,
    layout: { mode: "flex-column", padding: { top: 30, right: 30, bottom: 30, left: 30 }, gap: 20 },
    children: [textNode, shapeNode],
  };

  return {
    id: "det-doc-1",
    version: "2.0",
    title: "Determinism Test Document",
    category: "test",
    canvas: { width: 1280, height: 720 },
    variables: [{ key: "revenue", dataType: "number", defaultValue: 1250000, label: "Total Revenue" }],
    nodes: [rootFrame],
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Phase 4N — Suite 3: Determinism & Environmental Parity", () => {
  beforeEach(() => {
    assetRegistry.clear();
  });

  test("3.1: Sequential Pure Evaluation Identity — evaluate(t) x 100 yields identical state", () => {
    const doc = createBaselineDoc();
    const targetTime = 1.25;

    const firstRun = animationRuntime.evaluateScene(doc, { currentTime: targetTime });
    const firstRunJSON = JSON.stringify(firstRun);

    for (let i = 0; i < 100; i++) {
      const currentRun = animationRuntime.evaluateScene(doc, { currentTime: targetTime });
      expect(JSON.stringify(currentRun)).toBe(firstRunJSON);
    }
  });

  test("3.2: Full Roundtrip Identity — Document -> serialize -> deserialize -> migrate -> evaluate(t)", () => {
    const doc = createBaselineDoc();
    const targetTime = 2.0;

    // Direct evaluation
    const directState = animationRuntime.evaluateScene(doc, { currentTime: targetTime });

    // Roundtripped pipeline evaluation
    const templateManifest = serializeTemplate(doc, { id: "det-tmpl", name: "Det Template", category: "test" });
    const restoredDoc = deserializeTemplate(templateManifest);
    const migratedDoc = documentMigrator.migrate(restoredDoc);
    const roundtrippedState = animationRuntime.evaluateScene(migratedDoc, { currentTime: targetTime });

    expect(roundtrippedState.time).toBe(directState.time);
    expect(Object.keys(roundtrippedState.nodes)).toEqual(Object.keys(directState.nodes));

    for (const nodeId of Object.keys(directState.nodes)) {
      const directNode = directState.nodes[nodeId];
      const roundNode = roundtrippedState.nodes[nodeId];

      expect(roundNode.x).toBeCloseTo(directNode.x, 4);
      expect(roundNode.y).toBeCloseTo(directNode.y, 4);
      expect(roundNode.width).toBeCloseTo(directNode.width, 4);
      expect(roundNode.height).toBeCloseTo(directNode.height, 4);
      expect(roundNode.opacity).toBeCloseTo(directNode.opacity, 4);
      expect(roundNode.visible).toBe(directNode.visible);
    }
  });

  test("3.3: Studio Preview vs. Export Frame Evaluation Parity", () => {
    const doc = createBaselineDoc();
    const time = 1.0;

    const previewState = animationRuntime.evaluateScene(doc, { currentTime: time });
    const exportFrame = evaluateExportFrame(doc, time, { customWidth: 1280, customHeight: 720 });

    expect(exportFrame.evaluatedSceneState.time).toBe(previewState.time);

    for (const nodeId of Object.keys(previewState.nodes)) {
      const previewNode = previewState.nodes[nodeId];
      const exportNode = exportFrame.evaluatedSceneState.nodes[nodeId];

      expect(exportNode).toBeDefined();
      expect(exportNode.x).toBeCloseTo(previewNode.x, 4);
      expect(exportNode.y).toBeCloseTo(previewNode.y, 4);
      expect(exportNode.opacity).toBeCloseTo(previewNode.opacity, 4);
      expect(exportNode.visible).toBe(previewNode.visible);
    }
  });

  test("3.4: Temporal Statelessness Invariant — evaluating t1 -> t2 -> t1 yields bit-identical t1 state", () => {
    const doc = createBaselineDoc();
    const t1 = 0.5;
    const t2 = 3.5;

    const stateT1_initial = JSON.stringify(animationRuntime.evaluateScene(doc, { currentTime: t1 }));

    // Evaluate at t2
    animationRuntime.evaluateScene(doc, { currentTime: t2 });

    // Re-evaluate at t1
    const stateT1_reevaluated = JSON.stringify(animationRuntime.evaluateScene(doc, { currentTime: t1 }));

    expect(stateT1_reevaluated).toBe(stateT1_initial);
  });
});
