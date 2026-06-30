/**
 * @clypra/runtime — Graph Builder
 *
 * Constructs media processing graphs from effect definitions.
 * Used by all Labs to build execution graphs.
 */

import type { GraphNode, GraphEdge, MediaProcessingGraph, EffectCapabilities, EffectRequirements, GraphDataType } from "./types";
import { GraphHelper } from "./types";

export interface EffectDefinition {
  id: string;
  type: string;
  parameters?: Record<string, any>;
  inputs?: Array<{
    id: string;
    name: string;
    type: GraphDataType;
  }>;
  outputs?: Array<{
    id: string;
    name: string;
    type: GraphDataType;
  }>;
  capabilities?: Partial<EffectCapabilities>;
  requirements?: Partial<EffectRequirements>;
}

export interface MediaInput {
  id: string;
  type: "video" | "image" | "feature-map";
  source: string;
}

/**
 * GraphBuilder - Constructs media processing graphs
 */
export class GraphBuilder {
  private graphId: string;
  private graph: MediaProcessingGraph;

  constructor(graphId: string = "graph-" + Date.now()) {
    this.graphId = graphId;
    this.graph = GraphHelper.create(graphId);
  }

  /**
   * Build graph from effect definition and inputs
   */
  build(effect: EffectDefinition, inputs: MediaInput[]): MediaProcessingGraph {
    // Reset graph
    this.graph = GraphHelper.create(this.graphId);

    // Add input nodes
    const inputNodes = this.createInputNodes(inputs);
    for (const node of inputNodes) {
      this.graph = GraphHelper.withNode(this.graph, node);
    }

    // Add effect node
    const effectNode = this.createEffectNode(effect);
    this.graph = GraphHelper.withNode(this.graph, effectNode);

    // Connect inputs to effect
    for (let i = 0; i < inputNodes.length; i++) {
      const inputNode = inputNodes[i];
      const inputPin = effect.inputs?.[i] || { id: "input", name: "Input", type: "Texture" };

      this.graph = GraphHelper.withEdge(this.graph, inputNode.id, "output", effectNode.id, inputPin.id);
    }

    // Add output node
    const outputNode = this.createOutputNode();
    this.graph = GraphHelper.withNode(this.graph, outputNode);

    // Connect effect to output
    const outputPin = effect.outputs?.[0] || { id: "output", name: "Output", type: "Texture" };
    this.graph = GraphHelper.withEdge(this.graph, effectNode.id, outputPin.id, outputNode.id, "input");

    return this.graph;
  }

  /**
   * Build graph from multiple effects (composition)
   */
  buildComposite(effects: EffectDefinition[], inputs: MediaInput[]): MediaProcessingGraph {
    this.graph = GraphHelper.create(this.graphId);

    // Add input nodes
    const inputNodes = this.createInputNodes(inputs);
    for (const node of inputNodes) {
      this.graph = GraphHelper.withNode(this.graph, node);
    }

    // Chain effects
    let previousNodes = inputNodes;
    for (const effect of effects) {
      const effectNode = this.createEffectNode(effect);
      this.graph = GraphHelper.withNode(this.graph, effectNode);

      // Connect previous nodes to this effect
      for (let i = 0; i < previousNodes.length && i < (effect.inputs?.length || 1); i++) {
        const inputPin = effect.inputs?.[i] || { id: "input", name: "Input", type: "Texture" };
        this.graph = GraphHelper.withEdge(this.graph, previousNodes[i].id, "output", effectNode.id, inputPin.id);
      }

      previousNodes = [effectNode];
    }

    // Add output node
    const outputNode = this.createOutputNode();
    this.graph = GraphHelper.withNode(this.graph, outputNode);

    // Connect last effect to output
    if (previousNodes.length > 0) {
      this.graph = GraphHelper.withEdge(this.graph, previousNodes[0].id, "output", outputNode.id, "input");
    }

    return this.graph;
  }

  /**
   * Get the current graph
   */
  getGraph(): MediaProcessingGraph {
    return this.graph;
  }

  /**
   * Create input nodes from media inputs
   */
  private createInputNodes(inputs: MediaInput[]): GraphNode[] {
    return inputs.map((input, index) => ({
      id: `input-${index}`,
      type: "MediaInput",
      version: 0,
      params: {
        source: input.source,
        mediaType: input.type,
      },
      inputs: {},
      outputs: {
        output: {
          id: "output",
          name: "Output",
          type: "Texture",
        },
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
    }));
  }

  /**
   * Create effect node from definition
   */
  private createEffectNode(effect: EffectDefinition): GraphNode {
    const inputs: Record<string, any> = {};
    if (effect.inputs) {
      for (const input of effect.inputs) {
        inputs[input.id] = {
          id: input.id,
          name: input.name,
          type: input.type,
        };
      }
    } else {
      // Default single input
      inputs.input = {
        id: "input",
        name: "Input",
        type: "Texture",
      };
    }

    const outputs: Record<string, any> = {};
    if (effect.outputs) {
      for (const output of effect.outputs) {
        outputs[output.id] = {
          id: output.id,
          name: output.name,
          type: output.type,
        };
      }
    } else {
      // Default single output
      outputs.output = {
        id: "output",
        name: "Output",
        type: "Texture",
      };
    }

    return {
      id: effect.id,
      type: effect.type,
      version: 0,
      params: effect.parameters || {},
      inputs,
      outputs,
      capabilities: {
        temporal: effect.capabilities?.temporal || false,
        stateful: effect.capabilities?.stateful || false,
        spatial: effect.capabilities?.spatial || true,
        geometry: effect.capabilities?.geometry || false,
        inputsCount: effect.inputs?.length || 1,
      },
      requirements: {
        temporalRadius: effect.requirements?.temporalRadius || 0,
        preferredPrecision: effect.requirements?.preferredPrecision || "fp16",
        multipass: effect.requirements?.multipass || false,
        supportsHalfResolution: effect.requirements?.supportsHalfResolution || true,
      },
      lifecycle: "Created",
    };
  }

  /**
   * Create output node
   */
  private createOutputNode(): GraphNode {
    return {
      id: "output",
      type: "Output",
      version: 0,
      params: {},
      inputs: {
        input: {
          id: "input",
          name: "Input",
          type: "Texture",
        },
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
        supportsHalfResolution: true,
      },
      lifecycle: "Created",
    };
  }
}
