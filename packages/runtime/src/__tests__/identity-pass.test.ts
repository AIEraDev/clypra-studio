/**
 * Identity Pass Test
 *
 * Validates the most fundamental capability:
 * - Texture upload
 * - Pass-through rendering
 * - Frame synchronization
 * - Output correctness
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GraphBuilder } from "../graph/builder";
import { FrameGraphPlanner } from "../planner/planner";
import { PixiRenderer } from "../pixi/renderer";

describe("Runtime Capability: Identity Pass", () => {
  let renderer: PixiRenderer;
  let builder: GraphBuilder;
  let planner: FrameGraphPlanner;
  let canvas: HTMLCanvasElement;

  beforeAll(async () => {
    // Setup canvas
    canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    // Initialize runtime
    renderer = new PixiRenderer();
    await renderer.initialize({
      canvas,
      width: 256,
      height: 256,
    });

    builder = new GraphBuilder("identity-test");
    planner = new FrameGraphPlanner({
      targetWidth: 256,
      targetHeight: 256,
    });
  });

  afterAll(() => {
    if (renderer) {
      renderer.dispose();
    }
  });

  it("should upload texture to GPU", async () => {
    // Create test image
    const testCanvas = document.createElement("canvas");
    testCanvas.width = 256;
    testCanvas.height = 256;
    const ctx = testCanvas.getContext("2d")!;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 256, 256);

    // Build identity graph
    const graph = builder.build(
      {
        id: "identity",
        type: "identity",
        parameters: {},
      },
      [{ id: "test-image", type: "image", source: "test" }],
    );

    // Plan frame
    const frameGraph = planner.plan(graph, 0, 0);

    // Upload texture
    const inputResourceIds = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);

    renderer.uploadSourceImage(testCanvas, inputResourceIds);

    // Verify resource was created
    const resource = renderer.getResource(inputResourceIds[0]);
    expect(resource).toBeDefined();
    expect(resource?.width).toBe(256);
    expect(resource?.height).toBe(256);
  });

  it("should render identity pass (pass-through)", async () => {
    // Create test image with known pattern
    const testCanvas = document.createElement("canvas");
    testCanvas.width = 256;
    testCanvas.height = 256;
    const ctx = testCanvas.getContext("2d")!;

    // Red square
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 128, 128);

    // Green square
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(128, 0, 128, 128);

    // Blue square
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 128, 128, 128);

    // White square
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(128, 128, 128, 128);

    // Build identity graph
    const graph = builder.build(
      {
        id: "identity",
        type: "identity",
        parameters: {},
      },
      [{ id: "test-image", type: "image", source: "test" }],
    );

    // Plan and render
    const frameGraph = planner.plan(graph, 0, 0);

    const inputResourceIds = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);

    renderer.uploadSourceImage(testCanvas, inputResourceIds);

    const result = await renderer.render(frameGraph);

    // Verify output exists
    expect(result.outputTexture).toBeDefined();
    expect(result.stats.passCount).toBeGreaterThan(0);

    // Read pixels from output
    const pixels = await renderer.readPixels("output");
    expect(pixels.length).toBe(256 * 256 * 4);

    // Sample known pixels (accounting for RGBA layout)
    // Top-left should be red
    const topLeft = [pixels[0], pixels[1], pixels[2], pixels[3]];
    expect(topLeft[0]).toBeGreaterThan(200); // R
    expect(topLeft[1]).toBeLessThan(50); // G
    expect(topLeft[2]).toBeLessThan(50); // B
    expect(topLeft[3]).toBeGreaterThan(200); // A
  });

  it("should maintain pixel accuracy", async () => {
    // Test that identity pass doesn't modify pixels
    const testCanvas = document.createElement("canvas");
    testCanvas.width = 256;
    testCanvas.height = 256;
    const ctx = testCanvas.getContext("2d")!;

    // Create gradient pattern
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, "#000000");
    gradient.addColorStop(1, "#ffffff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Get source pixels
    const sourcePixels = ctx.getImageData(0, 0, 256, 256).data;

    // Render through identity pass
    const graph = builder.build(
      {
        id: "identity",
        type: "identity",
        parameters: {},
      },
      [{ id: "test-image", type: "image", source: "test" }],
    );

    const frameGraph = planner.plan(graph, 0, 0);
    const inputResourceIds = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);

    renderer.uploadSourceImage(testCanvas, inputResourceIds);
    await renderer.render(frameGraph);

    const outputPixels = await renderer.readPixels("output");

    // Compare samples (allow for small GPU precision differences)
    const tolerance = 2;
    let matchingPixels = 0;
    const totalPixels = 256 * 256;

    for (let i = 0; i < totalPixels * 4; i += 4) {
      const rDiff = Math.abs(sourcePixels[i] - outputPixels[i]);
      const gDiff = Math.abs(sourcePixels[i + 1] - outputPixels[i + 1]);
      const bDiff = Math.abs(sourcePixels[i + 2] - outputPixels[i + 2]);

      if (rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance) {
        matchingPixels++;
      }
    }

    const matchRate = matchingPixels / totalPixels;
    expect(matchRate).toBeGreaterThan(0.99); // 99% pixels should match
  });

  it("should handle multiple frames (frame synchronization)", async () => {
    // Render 10 frames to test stability
    const testCanvas = document.createElement("canvas");
    testCanvas.width = 256;
    testCanvas.height = 256;
    const ctx = testCanvas.getContext("2d")!;

    const graph = builder.build(
      {
        id: "identity",
        type: "identity",
        parameters: {},
      },
      [{ id: "test-image", type: "image", source: "test" }],
    );

    for (let frame = 0; frame < 10; frame++) {
      // Update canvas with frame number
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#ffffff";
      ctx.font = "48px monospace";
      ctx.fillText(`${frame}`, 100, 140);

      // Render
      const frameGraph = planner.plan(graph, frame, frame * 16.67);
      const inputResourceIds = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);

      renderer.uploadSourceImage(testCanvas, inputResourceIds);
      const result = await renderer.render(frameGraph);

      expect(result.outputTexture).toBeDefined();
      expect(result.stats.passCount).toBeGreaterThan(0);
    }
  });

  it("should handle resize", async () => {
    // Test rendering at different resolutions
    const sizes = [
      { width: 128, height: 128 },
      { width: 512, height: 512 },
      { width: 256, height: 256 },
    ];

    for (const size of sizes) {
      // Recreate planner with new size
      const testPlanner = new FrameGraphPlanner({
        targetWidth: size.width,
        targetHeight: size.height,
      });

      const testCanvas = document.createElement("canvas");
      testCanvas.width = size.width;
      testCanvas.height = size.height;
      const ctx = testCanvas.getContext("2d")!;
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, size.width, size.height);

      const graph = builder.build(
        {
          id: "identity",
          type: "identity",
          parameters: {},
        },
        [{ id: "test-image", type: "image", source: "test" }],
      );

      const frameGraph = testPlanner.plan(graph, 0, 0);
      const inputResourceIds = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);

      renderer.uploadSourceImage(testCanvas, inputResourceIds);
      const result = await renderer.render(frameGraph);

      expect(result.outputTexture).toBeDefined();
    }
  });

  it("should report accurate stats", async () => {
    const testCanvas = document.createElement("canvas");
    testCanvas.width = 256;
    testCanvas.height = 256;
    const ctx = testCanvas.getContext("2d")!;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 256, 256);

    const graph = builder.build(
      {
        id: "identity",
        type: "identity",
        parameters: {},
      },
      [{ id: "test-image", type: "image", source: "test" }],
    );

    const frameGraph = planner.plan(graph, 0, 0);
    const inputResourceIds = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);

    renderer.uploadSourceImage(testCanvas, inputResourceIds);
    const result = await renderer.render(frameGraph);

    // Verify stats structure
    expect(result.stats.passCount).toBeGreaterThan(0);
    expect(result.stats.totalGpuTime).toBeGreaterThanOrEqual(0);
    expect(result.stats.totalCpuTime).toBeGreaterThanOrEqual(0);
    expect(result.stats.resourceCount).toBeGreaterThan(0);
    expect(result.stats.textureMemory).toBeGreaterThan(0);

    // GPU and CPU time should be reasonable (< 100ms for this simple test)
    expect(result.stats.totalGpuTime).toBeLessThan(100);
    expect(result.stats.totalCpuTime).toBeLessThan(100);
  });
});
