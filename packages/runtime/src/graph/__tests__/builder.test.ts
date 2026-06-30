/**
 * Unit Tests - Graph Builder
 */

import { describe, it, expect } from "vitest";
import { GraphBuilder } from "../builder";
import type { EffectDefinition, MediaInput } from "../builder";

describe("GraphBuilder", () => {
  describe("constructor", () => {
    it("should create a new GraphBuilder instance", () => {
      const builder = new GraphBuilder();
      expect(builder).toBeDefined();
      expect(builder).toBeInstanceOf(GraphBuilder);
    });

    it("should accept custom graph ID", () => {
      const builder = new GraphBuilder("custom-graph-id");
      const graph = builder.getGraph();
      expect(graph.id).toBe("custom-graph-id");
    });

    it("should generate graph ID if not provided", () => {
      const builder = new GraphBuilder();
      const graph = builder.getGraph();
      expect(graph.id).toMatch(/^graph-\d+$/);
    });
  });

  describe("build", () => {
    it("should build a simple graph with one effect", () => {
      const builder = new GraphBuilder("test-graph");

      const effect: EffectDefinition = {
        id: "brightness-1",
        type: "brightness",
        parameters: { amount: 1.2 },
      };

      const inputs: MediaInput[] = [
        {
          id: "input-1",
          type: "video",
          source: "video.mp4",
        },
      ];

      const graph = builder.build(effect, inputs);

      expect(graph.nodes).toHaveLength(3); // input, effect, output
      expect(graph.edges).toHaveLength(2); // input->effect, effect->output
      expect(graph.nodes.some((n) => n.type === "brightness")).toBe(true);
    });

    it("should create input nodes for all inputs", () => {
      const builder = new GraphBuilder();

      const effect: EffectDefinition = {
        id: "blend",
        type: "blend",
        inputs: [
          { id: "input1", name: "Input 1", type: "Texture" },
          { id: "input2", name: "Input 2", type: "Texture" },
        ],
      };

      const inputs: MediaInput[] = [
        { id: "input-1", type: "video", source: "video1.mp4" },
        { id: "input-2", type: "video", source: "video2.mp4" },
      ];

      const graph = builder.build(effect, inputs);

      const inputNodes = graph.nodes.filter((n) => n.type === "MediaInput");
      expect(inputNodes).toHaveLength(2);
    });

    it("should set effect parameters correctly", () => {
      const builder = new GraphBuilder();

      const effect: EffectDefinition = {
        id: "blur",
        type: "blur",
        parameters: { radius: 10, quality: "high" },
      };

      const inputs: MediaInput[] = [{ id: "input-1", type: "video", source: "video.mp4" }];

      const graph = builder.build(effect, inputs);

      const effectNode = graph.nodes.find((n) => n.type === "blur");
      expect(effectNode).toBeDefined();
      expect(effectNode?.params).toEqual({ radius: 10, quality: "high" });
    });

    it("should set effect capabilities", () => {
      const builder = new GraphBuilder();

      const effect: EffectDefinition = {
        id: "temporal-effect",
        type: "motion-blur",
        capabilities: {
          temporal: true,
          stateful: true,
        },
      };

      const inputs: MediaInput[] = [{ id: "input-1", type: "video", source: "video.mp4" }];

      const graph = builder.build(effect, inputs);

      const effectNode = graph.nodes.find((n) => n.type === "motion-blur");
      expect(effectNode?.capabilities.temporal).toBe(true);
      expect(effectNode?.capabilities.stateful).toBe(true);
    });

    it("should create output node", () => {
      const builder = new GraphBuilder();

      const effect: EffectDefinition = {
        id: "effect-1",
        type: "brightness",
      };

      const inputs: MediaInput[] = [{ id: "input-1", type: "video", source: "video.mp4" }];

      const graph = builder.build(effect, inputs);

      const outputNode = graph.nodes.find((n) => n.type === "Output");
      expect(outputNode).toBeDefined();
      expect(outputNode?.id).toBe("output");
    });
  });

  describe("buildComposite", () => {
    it("should chain multiple effects", () => {
      const builder = new GraphBuilder();

      const effects: EffectDefinition[] = [
        { id: "blur", type: "blur", parameters: { radius: 5 } },
        { id: "brightness", type: "brightness", parameters: { amount: 1.2 } },
        { id: "contrast", type: "contrast", parameters: { amount: 1.1 } },
      ];

      const inputs: MediaInput[] = [{ id: "input-1", type: "video", source: "video.mp4" }];

      const graph = builder.buildComposite(effects, inputs);

      // Should have: 1 input + 3 effects + 1 output = 5 nodes
      expect(graph.nodes).toHaveLength(5);

      // Should have: input->blur, blur->brightness, brightness->contrast, contrast->output = 4 edges
      expect(graph.edges).toHaveLength(4);
    });

    it("should preserve effect order", () => {
      const builder = new GraphBuilder();

      const effects: EffectDefinition[] = [
        { id: "effect-1", type: "blur" },
        { id: "effect-2", type: "brightness" },
      ];

      const inputs: MediaInput[] = [{ id: "input-1", type: "video", source: "video.mp4" }];

      const graph = builder.buildComposite(effects, inputs);

      // Find the edges to verify order
      const blurNode = graph.nodes.find((n) => n.id === "effect-1");
      const brightnessNode = graph.nodes.find((n) => n.id === "effect-2");

      expect(blurNode).toBeDefined();
      expect(brightnessNode).toBeDefined();

      // Verify blur comes before brightness
      const blurToBrightness = graph.edges.find((e) => e.fromNodeId === "effect-1" && e.toNodeId === "effect-2");
      expect(blurToBrightness).toBeDefined();
    });

    it("should handle empty effects array", () => {
      const builder = new GraphBuilder();

      const effects: EffectDefinition[] = [];
      const inputs: MediaInput[] = [{ id: "input-1", type: "video", source: "video.mp4" }];

      const graph = builder.buildComposite(effects, inputs);

      // Should still have input and output
      expect(graph.nodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getGraph", () => {
    it("should return current graph", () => {
      const builder = new GraphBuilder("test-graph");
      const graph = builder.getGraph();

      expect(graph).toBeDefined();
      expect(graph.id).toBe("test-graph");
      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
    });
  });
});
