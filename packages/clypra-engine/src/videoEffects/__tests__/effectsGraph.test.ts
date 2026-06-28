import { describe, it, expect } from "vitest";
import { EffectGraph, GraphDefinition } from "../EffectGraph.js";
import { EffectEngine } from "../EffectEngine.js";

describe("EffectGraph & EffectEngine Unit Tests", () => {
  describe("EffectGraph Topological Sort", () => {
    it("should sort linear connections correctly", () => {
      const def: GraphDefinition = {
        schemaVersion: "2.0.0",
        graphId: "test-graph-1",
        name: "Linear Graph",
        nodes: [
          { id: "node-a", type: "source", params: {} },
          { id: "node-b", type: "glitch", params: {} },
          { id: "node-c", type: "vignette", params: {} }
        ],
        connections: [
          { fromNode: "node-a", fromOutput: "output", toNode: "node-b", toInput: "input" },
          { fromNode: "node-b", fromOutput: "output", toNode: "node-c", toInput: "input" }
        ]
      };

      const graph = new EffectGraph(def);
      const execOrder = graph.getExecutionOrder();

      expect(execOrder).toEqual(["node-a", "node-b", "node-c"]);
    });

    it("should sort complex branch graphs correctly", () => {
      const def: GraphDefinition = {
        schemaVersion: "2.0.0",
        graphId: "test-graph-2",
        name: "Branching Graph",
        nodes: [
          { id: "input-1", type: "source", params: {} },
          { id: "mask-2", type: "body_segmentation", params: {} },
          { id: "glow-3", type: "body_glow", params: {} },
          { id: "blend-4", type: "compositor", params: {} }
        ],
        connections: [
          { fromNode: "input-1", fromOutput: "output", toNode: "mask-2", toInput: "input" },
          { fromNode: "mask-2", fromOutput: "mask", toNode: "glow-3", toInput: "mask" },
          { fromNode: "input-1", fromOutput: "output", toNode: "blend-4", toInput: "background" },
          { fromNode: "glow-3", fromOutput: "output", toNode: "blend-4", toInput: "foreground" }
        ]
      };

      const graph = new EffectGraph(def);
      const execOrder = graph.getExecutionOrder();

      // input-1 has 0 in-degree and must execute first
      expect(execOrder[0]).toBe("input-1");
      // blend-4 depends on input-1 and glow-3, so it must run last
      expect(execOrder[3]).toBe("blend-4");
      // mask-2 and glow-3 should be in order
      expect(execOrder.indexOf("mask-2")).toBeLessThan(execOrder.indexOf("glow-3"));
    });

    it("should throw error when a circular dependency is detected", () => {
      const def: GraphDefinition = {
        schemaVersion: "2.0.0",
        graphId: "cycle-graph",
        name: "Cyclic Graph",
        nodes: [
          { id: "node-1", type: "source", params: {} },
          { id: "node-2", type: "glitch", params: {} }
        ],
        connections: [
          { fromNode: "node-1", fromOutput: "output", toNode: "node-2", toInput: "input" },
          { fromNode: "node-2", fromOutput: "output", toNode: "node-1", toInput: "input" }
        ]
      };

      const graph = new EffectGraph(def);
      expect(() => graph.getExecutionOrder()).toThrow("Circular dependency detected");
    });
  });

  describe("EffectEngine Keyframe Interpolation", () => {
    it("should interpolate numeric parameters linear scale", () => {
      const engine = new EffectEngine();
      const node = {
        id: "glow-node",
        type: "glow",
        params: { color: "#ffffff", radius: 5 },
        keyframes: {
          radius: [
            { time: 0.0, value: 10, easing: "linear" as const },
            { time: 2.0, value: 30, easing: "linear" as const }
          ]
        }
      };

      // Exactly halfway
      const paramsHalf = engine.evaluateParameters(node, 1.0);
      expect(paramsHalf.radius).toBe(20);

      // Start boundary
      const paramsStart = engine.evaluateParameters(node, -0.5);
      expect(paramsStart.radius).toBe(10);

      // End boundary
      const paramsEnd = engine.evaluateParameters(node, 3.0);
      expect(paramsEnd.radius).toBe(30);
    });

    it("should respect quadratic easing calculations", () => {
      const engine = new EffectEngine();
      const node = {
        id: "fade-node",
        type: "vignette",
        params: { opacity: 0.5 },
        keyframes: {
          opacity: [
            { time: 0.0, value: 0.0, easing: "ease-in" as const },
            { time: 1.0, value: 1.0, easing: "ease-in" as const }
          ]
        }
      };

      // y = t^2. At t = 0.5, y = 0.25
      const paramsMid = engine.evaluateParameters(node, 0.5);
      expect(paramsMid.opacity).toBe(0.25);
    });
  });
});
