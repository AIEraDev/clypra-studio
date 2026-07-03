/**
 * @clypra/runtime — Effect Graph Compiler
 *
 * Compiles video effect definitions (with internal .nodes structure)
 * into MediaProcessingGraphs that the planner can execute.
 */

import type { MediaProcessingGraph, GraphNode } from "../graph/types";
import { GraphHelper } from "../graph/types";

export interface VideoEffectDefinition {
  id: string;
  name: string;
  nodes: Array<{
    id: string;
    type: string;
    params?: any;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
  }>;
  edges: Array<{
    from: string;
    fromPin: string;
    to: string;
    toPin: string;
  }>;
  schema: {
    parameters: Record<string, any>;
  };
  capabilities?: any;
  requirements?: any;
}

/**
 * EffectGraphCompiler
 *
 * Converts video effect definitions into executable MediaProcessingGraphs.
 * Handles parameter resolution and uniform binding.
 */
export class EffectGraphCompiler {
  /**
   * Compile a video effect definition into a MediaProcessingGraph
   */
  compile(effect: VideoEffectDefinition, parameters: Record<string, any>): MediaProcessingGraph {
    const graph = GraphHelper.create(`effect-${effect.id}`);

    console.log(`[EffectGraphCompiler] Compiling effect: ${effect.id}`);
    console.log(`[EffectGraphCompiler] Parameters:`, parameters);
    console.log(`[EffectGraphCompiler] Nodes:`, effect.nodes.length);

    // Convert effect nodes to graph nodes
    const nodeMap = new Map<string, GraphNode>();

    for (const effectNode of effect.nodes) {
      const graphNode: GraphNode = {
        id: effectNode.id,
        type: effectNode.type,
        version: 0,
        params: this.resolveParams(effectNode.params, parameters),
        inputs: effectNode.inputs || {},
        outputs: effectNode.outputs || {},
        capabilities: effect.capabilities || {
          temporal: false,
          stateful: false,
          spatial: false,
          geometry: false,
          inputsCount: 1,
        },
        requirements: effect.requirements || {
          temporalRadius: 0,
          preferredPrecision: "fp16",
          multipass: false,
          supportsHalfResolution: true,
        },
        lifecycle: "Created",
      };

      nodeMap.set(effectNode.id, graphNode);
    }

    // Add nodes to graph
    let graphWithNodes = graph;
    for (const node of nodeMap.values()) {
      graphWithNodes = GraphHelper.withNode(graphWithNodes, node);
    }

    // Add edges to graph
    let graphWithEdges = graphWithNodes;
    for (const edge of effect.edges) {
      graphWithEdges = GraphHelper.withEdge(graphWithEdges, edge.from, edge.fromPin, edge.to, edge.toPin);
    }

    console.log(`[EffectGraphCompiler] ✓ Compiled graph with ${graphWithEdges.nodes.length} nodes and ${graphWithEdges.edges.length} edges`);

    return graphWithEdges;
  }

  /**
   * Resolve parameter references in node params
   */
  private resolveParams(params: any, parameters: Record<string, any>): any {
    if (!params) return {};

    const resolved = { ...params };

    // Handle uniforms with parameter references
    if (resolved.uniforms) {
      resolved.uniforms = this.resolveUniforms(resolved.uniforms, parameters);
    }

    return resolved;
  }

  /**
   * Resolve uniform references like @params.intensity
   */
  private resolveUniforms(uniforms: Record<string, any>, parameters: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, uniform] of Object.entries(uniforms)) {
      if (typeof uniform.value === "string" && uniform.value.startsWith("@params.")) {
        // Resolve parameter reference
        const paramName = uniform.value.substring(8);
        const paramValue = parameters[paramName];

        resolved[key] = {
          ...uniform,
          value: paramValue !== undefined ? paramValue : uniform.default,
        };

        console.log(`[EffectGraphCompiler] Resolved ${key}: @params.${paramName} → ${resolved[key].value}`);
      } else {
        // Keep as-is (will be resolved later for @input.*, time, resolution)
        resolved[key] = uniform;
      }
    }

    return resolved;
  }

  /**
   * Create a simple identity effect graph
   */
  createIdentityGraph(): MediaProcessingGraph {
    const graph = GraphHelper.create("identity-graph");

    const inputNode: GraphNode = {
      id: "input",
      type: "Input",
      version: 0,
      params: {},
      inputs: {},
      outputs: {
        source: { id: "source", name: "Source", type: "Texture" },
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
    };

    const passNode: GraphNode = {
      id: "pass",
      type: "copy",
      version: 0,
      params: {},
      inputs: {
        source: { id: "source", name: "Source", type: "Texture" },
      },
      outputs: {
        result: { id: "result", name: "Result", type: "Texture" },
      },
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

    const outputNode: GraphNode = {
      id: "output",
      type: "Output",
      version: 0,
      params: {},
      inputs: {
        result: { id: "result", name: "Result", type: "Texture" },
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

    let graphWithNodes = GraphHelper.withNode(graph, inputNode);
    graphWithNodes = GraphHelper.withNode(graphWithNodes, passNode);
    graphWithNodes = GraphHelper.withNode(graphWithNodes, outputNode);

    let graphWithEdges = GraphHelper.withEdge(graphWithNodes, "input", "source", "pass", "source");
    graphWithEdges = GraphHelper.withEdge(graphWithEdges, "pass", "result", "output", "result");

    return graphWithEdges;
  }
}
