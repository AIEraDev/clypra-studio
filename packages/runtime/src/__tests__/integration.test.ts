/**
 * Integration Test - Graph → Planner → Renderer Pipeline
 *
 * This test verifies that the complete pipeline works end-to-end.
 */

import { describe, it, expect } from "vitest";
import { GraphBuilder } from "../graph/builder";
import { GraphValidator } from "../graph/validator";
import { FrameGraphPlanner } from "../planner/planner";
import type { MediaProcessingGraph } from "../graph/types";

describe("Integration: Graph → Planner Pipeline", () => {
  it("should build and plan a simple graph", () => {
    // 1. Build a simple graph
    const builder = new GraphBuilder();

    // Create a simple input → effect → output graph
    const graph: MediaProcessingGraph = {
      id: "test-graph",
      nodes: [
        {
          id: "input",
          type: "source",
          version: 1,
          params: {},
          inputs: {},
          outputs: {
            out: { id: "out", name: "output", type: "Texture" },
          },
          capabilities: {
            temporal: false,
            stateful: false,
            spatial: false,
            geometry: false,
            inputsCount: 0,
          },
          requirements: {
            temporalRadius: 0,
            preferredPrecision: "fp16",
            multipass: false,
            supportsHalfResolution: true,
          },
          lifecycle: "Created",
        },
        {
          id: "effect",
          type: "brightness",
          version: 1,
          params: { amount: 1.2 },
          inputs: {
            in: { id: "in", name: "input", type: "Texture" },
          },
          outputs: {
            out: { id: "out", name: "output", type: "Texture" },
          },
          capabilities: {
            temporal: false,
            stateful: false,
            spatial: true,
            geometry: false,
            inputsCount: 1,
          },
          requirements: {
            temporalRadius: 0,
            preferredPrecision: "fp16",
            multipass: false,
            supportsHalfResolution: true,
          },
          lifecycle: "Created",
        },
        {
          id: "output",
          type: "sink",
          version: 1,
          params: {},
          inputs: {
            in: { id: "in", name: "input", type: "Texture" },
          },
          outputs: {},
          capabilities: {
            temporal: false,
            stateful: false,
            spatial: false,
            geometry: false,
            inputsCount: 1,
          },
          requirements: {
            temporalRadius: 0,
            preferredPrecision: "fp16",
            multipass: false,
            supportsHalfResolution: false,
          },
          lifecycle: "Created",
        },
      ],
      edges: [
        {
          fromNodeId: "input",
          fromPinId: "out",
          toNodeId: "effect",
          toPinId: "in",
        },
        {
          fromNodeId: "effect",
          fromPinId: "out",
          toNodeId: "output",
          toPinId: "in",
        },
      ],
    };

    // 2. Validate the graph
    const validator = new GraphValidator();
    const validationResult = validator.validate(graph);

    expect(validationResult.valid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);

    // 3. Plan a frame
    const planner = new FrameGraphPlanner({
      targetWidth: 1920,
      targetHeight: 1080,
    });

    const frameGraph = planner.plan(graph, 0, 0);

    // Verify frame graph structure
    expect(frameGraph).toBeDefined();
    expect(frameGraph.passes).toBeDefined();
    expect(frameGraph.passes.length).toBeGreaterThan(0);
    expect(frameGraph.resourceRequests).toBeDefined();
    expect(frameGraph.resourceRequests.length).toBeGreaterThan(0);

    // Verify source and output resources
    const resourceIds = frameGraph.resourceRequests.map((r) => r.id);

    // Should have source resources
    const hasSource = frameGraph.resourceRequests.some((r) => r.id.includes("source") || r.id.includes("input"));
    expect(hasSource).toBe(true);

    // Should have at least one resource
    expect(frameGraph.resourceRequests.length).toBeGreaterThan(0);

    // Verify passes have required properties
    for (const pass of frameGraph.passes) {
      expect(pass.id).toBeDefined();
      expect(pass.shaderId).toBeDefined();
      expect(pass.output).toBeDefined();
      expect(pass.uniforms).toBeDefined();
    }
  });

  it("should handle multi-pass effects", () => {
    const graph: MediaProcessingGraph = {
      id: "multipass-graph",
      nodes: [
        {
          id: "input",
          type: "source",
          version: 1,
          params: {},
          inputs: {},
          outputs: {
            out: { id: "out", name: "output", type: "Texture" },
          },
          capabilities: {
            temporal: false,
            stateful: false,
            spatial: false,
            geometry: false,
            inputsCount: 0,
          },
          requirements: {
            temporalRadius: 0,
            preferredPrecision: "fp16",
            multipass: true, // Multi-pass effect
            supportsHalfResolution: true,
          },
          lifecycle: "Created",
        },
        {
          id: "blur",
          type: "blur",
          version: 1,
          params: { radius: 10 },
          inputs: {
            in: { id: "in", name: "input", type: "Texture" },
          },
          outputs: {
            out: { id: "out", name: "output", type: "Texture" },
          },
          capabilities: {
            temporal: false,
            stateful: false,
            spatial: true,
            geometry: false,
            inputsCount: 1,
          },
          requirements: {
            temporalRadius: 0,
            preferredPrecision: "fp16",
            multipass: true,
            supportsHalfResolution: true,
          },
          lifecycle: "Created",
        },
        {
          id: "output",
          type: "sink",
          version: 1,
          params: {},
          inputs: {
            in: { id: "in", name: "input", type: "Texture" },
          },
          outputs: {},
          capabilities: {
            temporal: false,
            stateful: false,
            spatial: false,
            geometry: false,
            inputsCount: 1,
          },
          requirements: {
            temporalRadius: 0,
            preferredPrecision: "fp16",
            multipass: false,
            supportsHalfResolution: false,
          },
          lifecycle: "Created",
        },
      ],
      edges: [
        {
          fromNodeId: "input",
          fromPinId: "out",
          toNodeId: "blur",
          toPinId: "in",
        },
        {
          fromNodeId: "blur",
          fromPinId: "out",
          toNodeId: "output",
          toPinId: "in",
        },
      ],
    };

    const planner = new FrameGraphPlanner({
      targetWidth: 1920,
      targetHeight: 1080,
    });

    const frameGraph = planner.plan(graph, 0, 0);

    // Multi-pass effects should generate multiple passes
    expect(frameGraph.passes.length).toBeGreaterThanOrEqual(2);

    // Should have transient resources for intermediate results
    const transientResources = frameGraph.resourceRequests.filter((r) => r.transient);
    expect(transientResources.length).toBeGreaterThan(0);
  });

  it("should detect graph validation errors", () => {
    // Create invalid graph (cycle)
    const invalidGraph: MediaProcessingGraph = {
      id: "invalid-graph",
      nodes: [
        {
          id: "node1",
          type: "effect",
          version: 1,
          params: {},
          inputs: {
            in: { id: "in", name: "input", type: "Texture" },
          },
          outputs: {
            out: { id: "out", name: "output", type: "Texture" },
          },
          capabilities: {
            temporal: false,
            stateful: false,
            spatial: true,
            geometry: false,
            inputsCount: 1,
          },
          requirements: {
            temporalRadius: 0,
            preferredPrecision: "fp16",
            multipass: false,
            supportsHalfResolution: true,
          },
          lifecycle: "Created",
        },
        {
          id: "node2",
          type: "effect",
          version: 1,
          params: {},
          inputs: {
            in: { id: "in", name: "input", type: "Texture" },
          },
          outputs: {
            out: { id: "out", name: "output", type: "Texture" },
          },
          capabilities: {
            temporal: false,
            stateful: false,
            spatial: true,
            geometry: false,
            inputsCount: 1,
          },
          requirements: {
            temporalRadius: 0,
            preferredPrecision: "fp16",
            multipass: false,
            supportsHalfResolution: true,
          },
          lifecycle: "Created",
        },
      ],
      edges: [
        {
          fromNodeId: "node1",
          fromPinId: "out",
          toNodeId: "node2",
          toPinId: "in",
        },
        {
          fromNodeId: "node2",
          fromPinId: "out",
          toNodeId: "node1",
          toPinId: "in",
        },
      ],
    };

    const validator = new GraphValidator();
    const validationResult = validator.validate(invalidGraph);

    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors.length).toBeGreaterThan(0);
    expect(validationResult.errors.some((e) => e.type === "cycle")).toBe(true);
  });
});
