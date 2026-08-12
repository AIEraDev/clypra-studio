import { describe, it, expect } from "vitest";
import { compileSemanticOverlay } from "../semantic/semanticCompiler.js";
import { evaluateOverlayDocument } from "../runtime/evaluator.js";
import type { SemanticOverlayDefinition, SemanticContent } from "../semantic/semanticTypes.js";

describe("Ticket 3: Semantic Overlay Layer & Compiler", () => {
  const mockComparisonDef: SemanticOverlayDefinition = {
    id: "semantic-compare-01",
    name: "Framework Comparison",
    intent: "compare",
    slots: [
      { id: "title", name: "Comparison Title", type: "text" },
      { id: "leftItem", name: "Left Option", type: "comparison-pair" },
      { id: "rightItem", name: "Right Option", type: "comparison-pair" }
    ],
    canvasDefaults: {
      width: 1280,
      height: 720,
      backgroundColor: "#0A0A0F"
    }
  };

  const mockComparisonContent: SemanticContent = {
    templateId: "semantic-compare-01",
    values: {
      title: "React vs Svelte Architecture",
      leftItem: { label: "React", value: "Virtual DOM + Runtime reconciler" },
      rightItem: { label: "Svelte", value: "Compiler + Zero-runtime JS bundle" }
    },
    theme: {
      primaryColor: "#FF4141",
      textColor: "#FFFFFF"
    }
  };

  it("should compile a high-level comparison intent into a v2.0 OverlayDocument scene graph", () => {
    const doc = compileSemanticOverlay(mockComparisonDef, mockComparisonContent);

    expect(doc).toBeDefined();
    expect(doc.version).toBe("2.0");
    expect(doc.canvas.width).toBe(1280);
    expect(doc.canvas.height).toBe(720);
    expect(doc.nodes).toHaveLength(1);

    const container = doc.nodes[0] as any;
    expect(container.id).toBe("container-comparison");
    expect(container.children).toHaveLength(2); // Title text + Cards row frame
  });

  it("should compile high-level inform intent into a structured card graph", () => {
    const informDef: SemanticOverlayDefinition = {
      id: "semantic-inform-01",
      name: "Feature Spotlight",
      intent: "inform",
      slots: [
        { id: "title", name: "Header", type: "text" },
        { id: "body", name: "Description", type: "text" }
      ]
    };

    const informContent: SemanticContent = {
      templateId: "semantic-inform-01",
      values: {
        title: "Hardware GPU Export Pipeline",
        body: "All Smart Overlays render natively via Rust wgpu shaders during FFmpeg export passes."
      }
    };

    const doc = compileSemanticOverlay(informDef, informContent);
    expect(doc).toBeDefined();
    expect(doc.title).toBe("Feature Spotlight");
    expect(doc.nodes[0].type).toBe("frame");
  });

  it("should seamlessly evaluate compiled semantic overlays into EvaluatedScene without errors", () => {
    const doc = compileSemanticOverlay(mockComparisonDef, mockComparisonContent);
    const scene = evaluateOverlayDocument(doc, {}, 1.0);

    expect(scene).toBeDefined();
    expect(scene.canvas.width).toBe(1280);
    expect(scene.nodes).toBeDefined();
    const errorDiagnostics = scene.diagnostics.filter((d) => d.level === "error");
    expect(errorDiagnostics).toHaveLength(0);
  });
});
