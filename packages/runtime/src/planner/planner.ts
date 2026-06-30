/**
 * @clypra/runtime — Frame Graph Planner
 *
 * Converts media processing graphs into executable frame graphs.
 */

import type { MediaProcessingGraph, GraphNode } from "../graph/types";
import { GraphHelper } from "../graph/types";
import type { FrameGraph, ResourceRequest, RenderPass, PlannerConfig } from "./types";

/**
 * FrameGraphPlanner - Plans frame execution from media processing graphs
 */
export class FrameGraphPlanner {
  private config: PlannerConfig;

  constructor(config: Partial<PlannerConfig> = {}) {
    this.config = {
      targetWidth: config.targetWidth || 1920,
      targetHeight: config.targetHeight || 1080,
      enableOptimizations: config.enableOptimizations ?? true,
      allowHalfResolution: config.allowHalfResolution ?? true,
      maxTransientResources: config.maxTransientResources || 8,
    };
  }

  /**
   * Plan frame execution for a specific frame number
   */
  plan(graph: MediaProcessingGraph, frameNumber: number, timeMs: number): FrameGraph {
    // Get topologically sorted nodes
    const sortedNodes = GraphHelper.topologicalSort(graph);

    // Filter active nodes (for now, all nodes are active)
    const activeNodes = this.filterActiveNodes(sortedNodes, frameNumber);

    // Generate resource requests
    const resourceRequests = this.generateResourceRequests(activeNodes);

    // Generate render passes
    const passes = this.generateRenderPasses(graph, activeNodes);

    return {
      frameNumber,
      timelineTimeMs: timeMs,
      nodes: activeNodes,
      edges: graph.edges,
      resourceRequests,
      passes,
    };
  }

  /**
   * Filter nodes that contribute to the current frame
   */
  private filterActiveNodes(nodes: readonly GraphNode[], frameNumber: number): readonly GraphNode[] {
    // For now, all nodes are active
    // In the future, we can skip nodes based on temporal properties, conditions, etc.
    return nodes.filter((node) => {
      // Skip nodes that are disabled or culled
      if (node.lifecycle === "Disposed") return false;

      // Include all other nodes
      return true;
    });
  }

  /**
   * Generate resource requests for active nodes
   */
  private generateResourceRequests(nodes: readonly GraphNode[]): readonly ResourceRequest[] {
    const requests: ResourceRequest[] = [];

    // Find the Output node position
    const outputNodeIndex = nodes.findIndex((n) => n.type === "Output");

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Input resources (from MediaInput nodes)
      if (node.type === "MediaInput") {
        requests.push({
          id: `${node.id}-output`,
          type: "texture",
          width: this.config.targetWidth,
          height: this.config.targetHeight,
          format: "rgba8",
          transient: false,
        });
      }

      // Output resources for effect nodes
      // Skip creating intermediate resource if this is the last effect node (writes to "output" directly)
      if (node.type !== "MediaInput" && node.type !== "Output") {
        const isLastEffectNode = i === outputNodeIndex - 1;

        if (!isLastEffectNode) {
          // Create intermediate resource for non-final effect nodes
          const outputKeys = Object.keys(node.outputs);
          for (const outputKey of outputKeys) {
            const output = node.outputs[outputKey];
            const format = this.getFormatForType(output.type);

            requests.push({
              id: `${node.id}-${outputKey}`,
              type: "texture",
              width: this.config.targetWidth,
              height: this.config.targetHeight,
              format,
              transient: true,
            });
          }
        }
      }

      // Final output resource (non-transient)
      if (node.type === "Output") {
        requests.push({
          id: "output",
          type: "texture",
          width: this.config.targetWidth,
          height: this.config.targetHeight,
          format: "rgba8",
          transient: false,
        });
      }

      // Temporary resources for multipass effects
      if (node.requirements.multipass) {
        requests.push({
          id: `${node.id}-temp`,
          type: "texture",
          width: this.config.targetWidth,
          height: this.config.targetHeight,
          format: "rgba16f",
          transient: true,
        });
      }
    }

    return requests;
  }

  /**
   * Generate render passes from nodes
   */
  private generateRenderPasses(graph: MediaProcessingGraph, nodes: readonly GraphNode[]): readonly RenderPass[] {
    const passes: RenderPass[] = [];

    // Find the Output node position
    const outputNodeIndex = nodes.findIndex((n) => n.type === "Output");

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Skip input and output nodes (they don't have shaders)
      if (node.type === "MediaInput" || node.type === "Output") {
        continue;
      }

      // Get input resources
      const inputResourceIds: string[] = [];
      const incomingEdges = GraphHelper.getIncomingEdges(graph, node.id);
      for (const edge of incomingEdges) {
        // Find the resource ID for this edge
        // For now, use a simple naming scheme
        inputResourceIds.push(`${edge.fromNodeId}-${edge.fromPinId}`);
      }

      // Determine output resource
      // If this is the last effect node before Output, write to "output"
      const isLastEffectNode = i === outputNodeIndex - 1;
      const outputResourceId = isLastEffectNode ? "output" : `${node.id}-output`;

      // Create pass
      const pass: RenderPass = {
        id: `pass-${node.id}`,
        name: node.type,
        shaderId: node.type,
        inputs: inputResourceIds,
        output: outputResourceId,
        uniforms: node.params,
      };

      passes.push(pass);

      // If multipass, add additional passes
      if (node.requirements.multipass) {
        // Add a second pass (e.g., for blur, we'd do horizontal then vertical)
        passes.push({
          id: `pass-${node.id}-2`,
          name: `${node.type}-pass2`,
          shaderId: `${node.type}-pass2`,
          inputs: [outputResourceId],
          output: isLastEffectNode ? "output" : `${node.id}-output-final`,
          uniforms: node.params,
        });
      }
    }

    return passes;
  }

  /**
   * Get texture format based on data type
   */
  private getFormatForType(type: string): "rgba8" | "rgba16f" | "rgba32f" | "r8" | "depth24" {
    switch (type) {
      case "Depth":
        return "depth24";
      case "Mask":
        return "r8";
      case "Texture":
      default:
        return "rgba8";
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PlannerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PlannerConfig {
    return { ...this.config };
  }
}
