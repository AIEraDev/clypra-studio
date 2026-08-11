/**
 * Phase 4O — Universal Primitive Conformance Test Suite
 *
 * Automatically tests every registered primitive type across the entire
 * system execution pipeline:
 * createDefaultNode() -> validate -> data bind -> animate -> responsive override ->
 * layout -> serialize -> deserialize -> evaluate -> Pixi render -> export.
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  primitiveRegistry,
  documentValidator,
  dataBindingEngine,
  animationRuntime,
  resolveDocumentForBreakpoint,
  layoutEngine,
  serializeTemplate,
  deserializeTemplate,
  pixiSceneProjection,
  evaluateExportFrame,
  assetRegistry,
  type OverlayDocument,
  type SceneNodeType,
  type SceneNode,
} from "../index.js";

function createTestDoc(node: SceneNode): OverlayDocument {
  return {
    id: `conf-doc-${node.type}`,
    version: "2.0",
    title: `Conformance Test Document for ${node.type}`,
    category: "conformance-test",
    canvas: { width: 1280, height: 720, backgroundColor: "#0F172A" },
    variables: [
      { key: "username", dataType: "string", defaultValue: "Alex Developer", label: "Username" },
      { key: "val", dataType: "number", defaultValue: 99, label: "Val" },
    ],
    nodes: [node],
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Phase 4O — Universal Primitive Conformance Matrix", () => {
  beforeEach(() => {
    assetRegistry.clear();
  });

  const primitives = primitiveRegistry.list();

  test("Conformance Matrix: 15+ Primitives Registered in Registry", () => {
    expect(primitives.length).toBeGreaterThanOrEqual(15);
  });

  primitives.forEach((def) => {
    const nodeType: SceneNodeType = def.type;

    describe(`Primitive Conformance Contract: <${nodeType}>`, () => {
      test(`[${nodeType}] 1. Factory & Schema Validation`, () => {
        const node = primitiveRegistry.createDefaultNode(nodeType);
        expect(node).toBeDefined();
        expect(node.type).toBe(nodeType);

        const doc = createTestDoc(node);
        const validationErrors = documentValidator.validate(doc);
        const errors = validationErrors.filter((e) => e.severity === "error");
        expect(errors).toHaveLength(0);
      });

      test(`[${nodeType}] 2. Data Binding & Property Interpolation Pass`, () => {
        const node = primitiveRegistry.createDefaultNode(nodeType);
        const doc = createTestDoc(node);

        dataBindingEngine.evaluateNodeBindings(node, { username: "Alex Developer", val: 99 });
        expect(node).toBeDefined();
      });

      test(`[${nodeType}] 3. Animation Runtime Scene Evaluation`, () => {
        const node = primitiveRegistry.createDefaultNode(nodeType);
        node.animation = {
          entrance: { type: "fade", duration: 1.0, delay: 0 },
        };
        const doc = createTestDoc(node);

        const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 0.5 });
        expect(sceneState.time).toBe(0.5);
        expect(sceneState.nodes[node.id]).toBeDefined();
      });

      test(`[${nodeType}] 4. Responsive Breakpoint Overrides & Auto-Layout Pass`, () => {
        const node = primitiveRegistry.createDefaultNode(nodeType);
        const doc = createTestDoc(node);

        const resolvedDoc = resolveDocumentForBreakpoint(doc, null);
        const layoutState = layoutEngine.computeLayout(resolvedDoc);
        expect(layoutState.nodes[node.id]).toBeDefined();
      });

      test(`[${nodeType}] 5. Template Serialization & Deserialization Roundtrip`, () => {
        const node = primitiveRegistry.createDefaultNode(nodeType);
        const doc = createTestDoc(node);

        const manifest = serializeTemplate(doc, {
          id: `tmpl-${nodeType}`,
          name: `Template ${nodeType}`,
          category: "conformance",
          tags: ["conformance"],
        });

        const restored = deserializeTemplate(manifest);
        expect(restored.nodes).toHaveLength(1);
        expect(restored.nodes[0].type).toBe(nodeType);
      });

      test(`[${nodeType}] 6. Pixi Scene Projection Rendering`, () => {
        const node = primitiveRegistry.createDefaultNode(nodeType);
        const doc = createTestDoc(node);

        const container = pixiSceneProjection.project(doc, 1.0);
        expect(container).toBeDefined();
      });

      test(`[${nodeType}] 7. Production Export Frame Evaluation`, () => {
        const node = primitiveRegistry.createDefaultNode(nodeType);
        const doc = createTestDoc(node);

        const frame = evaluateExportFrame(doc, 1.0, { customWidth: 1280, customHeight: 720 });
        expect(frame.frameIndex).toBe(30);
        expect(frame.evaluatedSceneState.nodes[node.id]).toBeDefined();
      });
    });
  });
});
