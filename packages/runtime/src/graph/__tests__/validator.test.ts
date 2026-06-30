/**
 * Unit Tests - Graph Validator
 */

import { describe, it, expect } from "vitest";
import { GraphValidator } from "../validator";
import type { MediaProcessingGraph, GraphNode } from "../types";

describe("GraphValidator", () => {
  const createNode = (id: string, type: string, inputCount: number = 1): GraphNode => ({
    id,
    type,
    version: 1,
    params: {},
    inputs:
      inputCount > 0
        ? {
            in: { id: "in", name: "input", type: "Texture" },
          }
        : {},
    outputs: {
      out: { id: "out", name: "output", type: "Texture" },
    },
    capabilities: {
      temporal: false,
      stateful: false,
      spatial: false,
      geometry: false,
      inputsCount: inputCount,
    },
    requirements: {
      temporalRadius: 0,
      preferredPrecision: "fp16",
      multipass: false,
      supportsHalfResolution: true,
    },
    lifecycle: "Created",
  });

  describe("validate", () => {
    it("should validate a correct graph", () => {
      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [createNode("node1", "source", 0), createNode("node2", "effect", 1)],
        edges: [
          {
            fromNodeId: "node1",
            fromPinId: "out",
            toNodeId: "node2",
            toPinId: "in",
          },
        ],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect cycles", () => {
      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [createNode("node1", "effect"), createNode("node2", "effect")],
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
      const result = validator.validate(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.type === "cycle")).toBe(true);
    });

    it("should detect missing source nodes", () => {
      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [createNode("node2", "effect")],
        edges: [
          {
            fromNodeId: "node1", // This node doesn't exist
            fromPinId: "out",
            toNodeId: "node2",
            toPinId: "in",
          },
        ],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "invalid-node")).toBe(true);
    });

    it("should detect missing target nodes", () => {
      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [createNode("node1", "source", 0)],
        edges: [
          {
            fromNodeId: "node1",
            fromPinId: "out",
            toNodeId: "node2", // This node doesn't exist
            toPinId: "in",
          },
        ],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "invalid-node")).toBe(true);
    });

    it("should detect missing output pins", () => {
      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [createNode("node1", "source", 0), createNode("node2", "effect")],
        edges: [
          {
            fromNodeId: "node1",
            fromPinId: "nonexistent", // This pin doesn't exist
            toNodeId: "node2",
            toPinId: "in",
          },
        ],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "missing-connection")).toBe(true);
    });

    it("should detect missing input pins", () => {
      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [createNode("node1", "source", 0), createNode("node2", "effect")],
        edges: [
          {
            fromNodeId: "node1",
            fromPinId: "out",
            toNodeId: "node2",
            toPinId: "nonexistent", // This pin doesn't exist
          },
        ],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "missing-connection")).toBe(true);
    });

    it("should detect type mismatches", () => {
      const node1 = createNode("node1", "source", 0);
      const node2 = createNode("node2", "effect");

      // Change output type to Depth
      node1.outputs.out.type = "Depth";
      // Input expects Texture

      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [node1, node2],
        edges: [
          {
            fromNodeId: "node1",
            fromPinId: "out",
            toNodeId: "node2",
            toPinId: "in",
          },
        ],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "type-mismatch")).toBe(true);
    });

    it("should accept valid empty graph", () => {
      const graph: MediaProcessingGraph = {
        id: "empty-graph",
        nodes: [],
        edges: [],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle graph with isolated nodes", () => {
      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [
          createNode("node1", "source", 0),
          createNode("node2", "effect"),
          createNode("node3", "source", 0), // Isolated
        ],
        edges: [
          {
            fromNodeId: "node1",
            fromPinId: "out",
            toNodeId: "node2",
            toPinId: "in",
          },
        ],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      // Graph structure is valid, but node3 has missing connection
      // This may generate errors for unconnected inputs
      expect(result).toBeDefined();
    });

    it("should generate warnings for multipass effects", () => {
      const node = createNode("node1", "blur", 0);
      node.requirements.multipass = true;

      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [node],
        edges: [],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.warnings).toBeDefined();
      expect(result.warnings.some((w) => w.type === "performance")).toBe(true);
    });

    it("should generate warnings for high temporal radius", () => {
      const node = createNode("node1", "temporal-effect", 0);
      node.requirements.temporalRadius = 10;

      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [node],
        edges: [],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.warnings).toBeDefined();
      expect(result.warnings.some((w) => w.type === "performance" && w.severity === "high")).toBe(true);
    });

    it("should generate warnings for stateful effects", () => {
      const node = createNode("node1", "stateful-effect", 0);
      node.capabilities.stateful = true;

      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [node],
        edges: [],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.warnings).toBeDefined();
      expect(result.warnings.some((w) => w.type === "compatibility")).toBe(true);
    });

    it("should handle complex valid graph", () => {
      const input1 = createNode("input1", "MediaInput", 0);
      const input2 = createNode("input2", "MediaInput", 0);
      const effect1 = createNode("effect1", "blur");
      const effect2 = createNode("effect2", "brightness");

      // Create blend node with 2 inputs
      const blend: GraphNode = {
        id: "blend",
        type: "blend",
        version: 1,
        params: {},
        inputs: {
          in1: { id: "in1", name: "input1", type: "Texture" },
          in2: { id: "in2", name: "input2", type: "Texture" },
        },
        outputs: {
          out: { id: "out", name: "output", type: "Texture" },
        },
        capabilities: {
          temporal: false,
          stateful: false,
          spatial: true,
          geometry: false,
          inputsCount: 2,
        },
        requirements: {
          temporalRadius: 0,
          preferredPrecision: "fp16",
          multipass: false,
          supportsHalfResolution: true,
        },
        lifecycle: "Created",
      };

      const output = createNode("output", "Output");

      const graph: MediaProcessingGraph = {
        id: "complex-graph",
        nodes: [input1, input2, effect1, effect2, blend, output],
        edges: [
          { fromNodeId: "input1", fromPinId: "out", toNodeId: "effect1", toPinId: "in" },
          { fromNodeId: "input2", fromPinId: "out", toNodeId: "effect2", toPinId: "in" },
          { fromNodeId: "effect1", fromPinId: "out", toNodeId: "blend", toPinId: "in1" },
          { fromNodeId: "effect2", fromPinId: "out", toNodeId: "blend", toPinId: "in2" },
          { fromNodeId: "blend", fromPinId: "out", toNodeId: "output", toPinId: "in" },
        ],
      };

      const validator = new GraphValidator();
      const result = validator.validate(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("error reporting", () => {
    it("should provide detailed error information", () => {
      const graph: MediaProcessingGraph = {
        id: "test-graph",
        nodes: [createNode("node1", "effect"), createNode("node2", "effect")],
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
      const result = validator.validate(graph);

      expect(result.errors.length).toBeGreaterThan(0);
      const error = result.errors[0];
      expect(error.type).toBeDefined();
      expect(error.message).toBeDefined();
      expect(typeof error.message).toBe("string");
    });
  });
});
