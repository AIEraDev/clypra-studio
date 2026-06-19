import { describe, it, expect } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { TemplateRenderer } from "./TemplateRenderer";
import { TextTemplate } from "../types";

// Register napi-rs canvas for the engine's platform-agnostic createCanvas helper
(globalThis as any).__clypraCreateCanvas = createCanvas;

describe("TemplateRenderer", () => {
  const mockTemplate: TextTemplate = {
    id: "test-template",
    label: "Test Template",
    category: "lower-third",
    duration: 3,
    canvasWidth: 800,
    canvasHeight: 600,
    layers: [
      {
        kind: "shape",
        id: "bg-shape",
        shape: "rect",
        fill: "#ff0000",
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        animation: {
          in: "fade",
          out: "fade",
          inDuration: 1,
          outDuration: 1,
          hold: "full",
        },
      },
      {
        kind: "text",
        id: "title-text",
        content: "Hello World",
        fontFamily: "Arial",
        fontSize: 24,
        color: "#ffffff",
        align: "left",
        x: 20,
        y: 20,
        width: 200,
        height: 50,
        animation: {
          in: "typewriter",
          out: "fade",
          inDuration: 1,
          outDuration: 1,
          hold: "full",
        },
        role: "primary",
      },
    ],
  };

  it("can be instantiated successfully", () => {
    const renderer = new TemplateRenderer(mockTemplate);
    expect(renderer).toBeDefined();
  });

  it("renders layers and processes overrides correctly", () => {
    const renderer = new TemplateRenderer(mockTemplate);
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    // Run drawFrame without errors
    expect(() => renderer.drawFrame(ctx, 1.5)).not.toThrow();

    // Verify updating a layer's properties
    renderer.updateLayer("title-text", { content: "Updated Title", color: "#00ff00" });
    expect(() => renderer.drawFrame(ctx, 1.5)).not.toThrow();
  });

  it("handles typewriter animation slicing", () => {
    const renderer = new TemplateRenderer(mockTemplate);
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    // At t=0, typewriter has progress 0, drawing 0 chars
    // At t=0.5, typewriter has progress >0, drawing partial chars
    expect(() => renderer.drawFrame(ctx, 0)).not.toThrow();
    expect(() => renderer.drawFrame(ctx, 0.5)).not.toThrow();
  });

  it("safely handles templates with no layers or undefined layers", () => {
    const emptyTemplate: TextTemplate = {
      id: "empty",
      label: "Empty",
      category: "lower-third",
      duration: 3,
      canvasWidth: 800,
      canvasHeight: 600,
      layers: undefined as any,
    };

    const renderer = new TemplateRenderer(emptyTemplate);
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    expect(() => renderer.drawFrame(ctx, 1.5)).not.toThrow();
  });
});
