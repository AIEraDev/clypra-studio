/**
 * @clypra/runtime — Project Compiler
 *
 * Compiles an NLE ProjectManifestV2 into a connected, dependency-resolved MediaProcessingGraph.
 * Handles clip segments alignment, active source generation, and effect stack chaining.
 */

import type { ProjectManifestV2 } from "../project/types";
import type { MediaProcessingGraph, GraphNode } from "@clypra/types";
import { GraphHelper } from "@clypra/types";
import { NodeRegistry } from "../graph/NodeRegistry";

export class ProjectCompiler {
  /**
   * Compiles the ProjectManifestV2 timeline into a single master MediaProcessingGraph.
   * For the vertical slice, this links clips and their effect stacks into serial tracks,
   * then composites them together.
   *
   * @param manifest - The project manifest to compile
   * @param registry - Optional NodeRegistry instance. If not provided, uses default registry.
   */
  static compile(manifest: ProjectManifestV2, registry?: NodeRegistry): MediaProcessingGraph {
    const nodeRegistry = registry || NodeRegistry.createDefault();
    let graph = GraphHelper.create(`compiled-graph-${manifest.id}`);
    let trackOutPins: { trackId: string; pinId: string; nodeId: string }[] = [];

    // 1. Process each track
    for (const track of manifest.tracks) {
      if (!track.enabled) continue;

      // Create a unified track source manager node that orchestrates clip activation
      const trackSourceId = `track-source-${track.id}`;
      const trackSourceNode: GraphNode = {
        id: trackSourceId,
        type: "TrackSourceManager",
        version: manifest.version,
        params: {
          clips: track.clips,
        },
        inputs: {},
        outputs: {
          output: { id: "output", name: "Color Out", type: "Texture" },
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

      graph = GraphHelper.withNode(graph, trackSourceNode);
      let activeNodeId = trackSourceId;
      let activePinId = "output";

      // 2. Chain the track-level effect stack sequentially
      for (let i = 0; i < track.effectStack.length; i++) {
        const effect = track.effectStack[i];
        const effectNodeId = `track-${track.id}-effect-${effect.id}`;

        // Lookup capacities and requirements dynamically from registry
        const definition = nodeRegistry.getDefinition(effect.type);
        if (!definition) {
          throw new Error(`Unknown effect type: ${effect.type}. Ensure it is registered in NodeRegistry.`);
        }

        const { capabilities, requirements } = definition;

        const effectNode: GraphNode = {
          id: effectNodeId,
          type: effect.type,
          version: 1,
          params: effect.params,
          inputs: {
            input: { id: "input", name: "Color Input", type: "Texture" },
          },
          outputs: {
            output: { id: "output", name: "Color Output", type: "Texture" },
          },
          capabilities,
          requirements,
          lifecycle: "Created",
        };

        // Add node and link it to the previous step in the pipeline
        graph = GraphHelper.withNode(graph, effectNode);
        graph = GraphHelper.withEdge(graph, activeNodeId, activePinId, effectNodeId, "input");

        activeNodeId = effectNodeId;
        activePinId = "output";
      }

      // Record final output pin of this track
      trackOutPins.push({ trackId: track.id, nodeId: activeNodeId, pinId: activePinId });
    }

    // 3. Composite all tracks together
    if (trackOutPins.length === 0) {
      return graph;
    } else if (trackOutPins.length === 1) {
      // Single track output is the final composition output
      const finalOut: GraphNode = {
        id: "composite-output",
        type: "OutputNode",
        version: 1,
        params: {},
        inputs: {
          input: { id: "input", name: "Final Color", type: "Texture" },
        },
        outputs: {},
        capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 1 },
        requirements: { temporalRadius: 0, preferredPrecision: "fp16", multipass: false, supportsHalfResolution: true },
        lifecycle: "Created",
      };
      graph = GraphHelper.withNode(graph, finalOut);
      graph = GraphHelper.withEdge(graph, trackOutPins[0].nodeId, trackOutPins[0].pinId, "composite-output", "input");
    } else {
      // Multiple tracks require a compositer tree/chain
      let currentOutNode = trackOutPins[0].nodeId;
      let currentOutPin = trackOutPins[0].pinId;

      for (let i = 1; i < trackOutPins.length; i++) {
        const mixNodeId = `composite-mix-step-${i}`;
        const mixNode: GraphNode = {
          id: mixNodeId,
          type: "AlphaBlend",
          version: 1,
          params: { blendMode: "normal" },
          inputs: {
            base: { id: "base", name: "Base layer", type: "Texture" },
            over: { id: "over", name: "Overlay layer", type: "Texture" },
          },
          outputs: {
            output: { id: "output", name: "Blended Output", type: "Texture" },
          },
          capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 2 },
          requirements: { temporalRadius: 0, preferredPrecision: "fp16", multipass: false, supportsHalfResolution: true },
          lifecycle: "Created",
        };

        graph = GraphHelper.withNode(graph, mixNode);
        graph = GraphHelper.withEdge(graph, currentOutNode, currentOutPin, mixNodeId, "base");
        graph = GraphHelper.withEdge(graph, trackOutPins[i].nodeId, trackOutPins[i].pinId, mixNodeId, "over");

        currentOutNode = mixNodeId;
        currentOutPin = "output";
      }

      // Link final blend step to output
      const finalOut: GraphNode = {
        id: "composite-output",
        type: "OutputNode",
        version: 1,
        params: {},
        inputs: {
          input: { id: "input", name: "Final Color", type: "Texture" },
        },
        outputs: {},
        capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 1 },
        requirements: { temporalRadius: 0, preferredPrecision: "fp16", multipass: false, supportsHalfResolution: true },
        lifecycle: "Created",
      };
      graph = GraphHelper.withNode(graph, finalOut);
      graph = GraphHelper.withEdge(graph, currentOutNode, currentOutPin, "composite-output", "input");
    }

    return graph;
  }
}
