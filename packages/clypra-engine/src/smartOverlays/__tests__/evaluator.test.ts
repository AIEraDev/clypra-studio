import { describe, it, expect } from "vitest";
import { evaluateOverlayDocument } from "../runtime/evaluator.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";

describe("Ticket 2: Renderer-Neutral Runtime Evaluator Contract", () => {
  const mockDoc: OverlayDocument = {
    id: "doc-test-001",
    version: "2.0",
    title: "Runtime Evaluator Test Overlay",
    category: "test",
    canvas: {
      width: 1280,
      height: 720,
      backgroundColor: "#0F0F14"
    },
    duration: 5.0,
    createdAt: "2026-08-12T00:00:00Z",
    updatedAt: "2026-08-12T00:00:00Z",
    variables: [
      { key: "userName", type: "string", defaultValue: "Sarah Jenkins" },
      { key: "growthMetric", type: "number", defaultValue: 142 }
    ],
    nodes: [
      {
        id: "text-title",
        name: "Title Text",
        type: "text",
        x: 100,
        y: 120,
        width: 400,
        height: 60,
        text: "Hello {{userName}}",
        style: {
          fontSize: 36,
          textColor: "#FFFFFF",
          fontFamily: "Inter"
        },
        animation: {
          entrance: { type: "fade", duration: 1.0 }
        }
      },
      {
        id: "shape-bg",
        name: "Card Background",
        type: "shape",
        shapeType: "rounded-rectangle",
        x: 120,
        y: 150,
        width: 500,
        height: 200,
        style: {
          fillColor: "#1C1C28",
          strokeColor: "#7C6FFF",
          strokeWidth: 2,
          borderRadius: 16
        }
      },
      {
        id: "chart-growth",
        name: "User Growth Chart",
        type: "chart",
        x: 150,
        y: 200,
        width: 400,
        height: 250,
        chartType: "bar",
        series: [
          {
            id: "s1",
            name: "Revenue",
            color: "#7C6FFF",
            data: [10, 20, 30]
          }
        ]
      }
    ]
  };

  it("should evaluate OverlayDocument into a pure, renderer-neutral EvaluatedScene", () => {
    const scene = evaluateOverlayDocument(mockDoc, {}, 1.5);

    expect(scene).toBeDefined();
    expect(scene.version).toBe("2.0");
    expect(scene.time).toBe(1.5);
    expect(scene.canvas.width).toBe(1280);
    expect(scene.canvas.height).toBe(720);
    expect(scene.nodes).toHaveLength(3);
    expect(scene.metadata.documentId).toBe("doc-test-001");
  });

  it("should enforce pure data representation without PixiJS, DOM, or WebGL instances", () => {
    const scene = evaluateOverlayDocument(mockDoc, {}, 0.5);

    // Deep inspect JSON serializability
    const jsonString = JSON.stringify(scene);
    expect(jsonString).toBeDefined();

    // Verify no DOM, Window, or Pixi objects leaked
    expect(jsonString).not.toContain("HTMLDivElement");
    expect(jsonString).not.toContain("PIXI");
    expect(jsonString).not.toContain("CanvasRenderingContext2D");

    // Verify EvaluatedNode data model
    const textNode = scene.nodeMap["text-title"];
    expect(textNode).toBeDefined();
    expect(textNode.transform.x).toBe(100);
    expect(textNode.transform.y).toBe(120);
    expect(textNode.style.fontSize).toBe(36);
    expect(textNode.content?.text).toBe("Hello Sarah Jenkins");
  });

  it("should be 100% deterministic and pure with respect to time t", () => {
    const sceneA1 = evaluateOverlayDocument(mockDoc, {}, 1.0);
    const sceneA2 = evaluateOverlayDocument(mockDoc, {}, 1.0);

    expect(sceneA1).toEqual(sceneA2);

    const sceneEarly = evaluateOverlayDocument(mockDoc, {}, 0.2);
    const sceneLate = evaluateOverlayDocument(mockDoc, {}, 1.0);
    expect(sceneEarly.time).toBe(0.2);
    expect(sceneLate.time).toBe(1.0);
    expect(sceneEarly.nodes[0].style.opacity).not.toBe(sceneLate.nodes[0].style.opacity);
  });

  it("should resolve dynamic data bindings and variables from RuntimeContext", () => {
    const customContext = {
      variables: {
        userName: "Alex Rivers",
        growthMetric: 250
      }
    };

    const scene = evaluateOverlayDocument(mockDoc, customContext, 0.0);
    const textNode = scene.nodeMap["text-title"];

    expect(textNode.content?.text).toBe("Hello Alex Rivers");
  });

  it("should generate evaluated geometry for metric and chart visualization nodes", () => {
    const scene = evaluateOverlayDocument(mockDoc, {}, 2.0);
    const chartNode = scene.nodeMap["chart-growth"];

    expect(chartNode).toBeDefined();
    expect(chartNode.geometry).toBeDefined();
    expect(chartNode.geometry.bars).toBeDefined();
  });
});
