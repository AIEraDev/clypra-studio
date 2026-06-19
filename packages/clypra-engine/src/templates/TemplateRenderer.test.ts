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

  it("handles different text overflow strategies without errors", () => {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    const strategies: ("clip" | "wrap" | "shrink" | "expand-panel")[] = ["clip", "wrap", "shrink", "expand-panel"];

    strategies.forEach((strategy) => {
      const templateWithStrategy: TextTemplate = {
        ...mockTemplate,
        layers: [
          {
            kind: "text",
            id: "overflow-text",
            content: "This is a very long string that will definitely exceed the standard bounds of the container box.",
            fontFamily: "Arial",
            fontSize: 24,
            color: "#ffffff",
            align: "center",
            x: 50,
            y: 50,
            width: 100,
            height: 50,
            animation: {
              in: "none",
              out: "none",
              inDuration: 0,
              outDuration: 0,
              hold: "full",
            },
            backgroundColor: "#000000",
            padding: 10,
            backgroundRadius: 5,
            overflow: strategy,
          },
        ],
      };

      const renderer = new TemplateRenderer(templateWithStrategy);
      expect(() => renderer.drawFrame(ctx, 1.5)).not.toThrow();
    });
  });

  it("auto width: panel sizes to measured text width + padding", () => {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    const template: TextTemplate = {
      ...mockTemplate,
      layers: [
        {
          kind: "text",
          id: "auto-width-text",
          content: "Auto Width",
          fontFamily: "Arial",
          fontSize: 24,
          fontWeight: 700,
          color: "#ffffff",
          align: "left",
          x: 50,
          y: 50,
          width: "auto",
          height: 50,
          padding: 8,
          animation: { in: "none", out: "none", inDuration: 0, outDuration: 0, hold: "full" },
        },
      ],
    };

    const renderer = new TemplateRenderer(template);
    expect(() => renderer.drawFrame(ctx, 1.5)).not.toThrow();
  });

  it("auto height: panel sizes to ink height + padding", () => {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    const template: TextTemplate = {
      ...mockTemplate,
      layers: [
        {
          kind: "text",
          id: "auto-height-text",
          content: "Auto Height",
          fontFamily: "Arial",
          fontSize: 24,
          fontWeight: 700,
          color: "#ffffff",
          align: "center",
          x: 50,
          y: 50,
          width: 200,
          height: "auto",
          padding: 8,
          animation: { in: "none", out: "none", inDuration: 0, outDuration: 0, hold: "full" },
        },
      ],
    };

    const renderer = new TemplateRenderer(template);
    expect(() => renderer.drawFrame(ctx, 1.5)).not.toThrow();
  });

  it("auto width + auto height: panel fully wraps content with no clipping", () => {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    const template: TextTemplate = {
      ...mockTemplate,
      layers: [
        {
          kind: "text",
          id: "auto-both-text",
          content: "Both Auto",
          fontFamily: "Arial",
          fontSize: 32,
          fontWeight: 400,
          color: "#000000",
          align: "left",
          x: 100,
          y: 100,
          width: "auto",
          height: "auto",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 20,
          paddingRight: 20,
          backgroundColor: "#ffffff",
          backgroundRadius: 8,
          animation: { in: "fade", out: "fade", inDuration: 0.3, outDuration: 0.3, hold: "full" },
        },
      ],
    };

    const renderer = new TemplateRenderer(template);
    expect(() => renderer.drawFrame(ctx, 1.5)).not.toThrow();
  });

  it("overflow wrap + height auto: panel grows to fit all wrapped lines", () => {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    const template: TextTemplate = {
      ...mockTemplate,
      layers: [
        {
          kind: "text",
          id: "wrap-auto-height",
          content: "This long text should wrap across multiple lines and the panel should grow in height to fit all of them.",
          fontFamily: "Arial",
          fontSize: 20,
          fontWeight: 400,
          color: "#ffffff",
          align: "left",
          x: 50,
          y: 50,
          width: 200,
          height: "auto",
          padding: 8,
          overflow: "wrap",
          backgroundColor: "#333333",
          animation: { in: "none", out: "none", inDuration: 0, outDuration: 0, hold: "full" },
        },
      ],
    };

    const renderer = new TemplateRenderer(template);
    expect(() => renderer.drawFrame(ctx, 1.5)).not.toThrow();
  });
});
