/**
 * @clypra/runtime — Frame Graph Planner
 *
 * Converts media processing graphs into executable frame graphs.
 * Merged implementation combining the best features from engine/v2 and runtime.
 *
 * Features:
 * - NodeRegistry integration for dynamic shader planning
 * - Clip activation logic for timeline management
 * - ExecutionPlanner interface for per-node planning
 * - Multipass support with intermediate resources
 * - PlannerConfig for configuration management
 */

import type { MediaProcessingGraph, GraphNode, GraphEdge } from "@clypra/types";
import { GraphHelper } from "@clypra/types";
import type { NodeRegistry } from "../graph/NodeRegistry";
import type { FrameGraph, ResourceRequest, RenderPass, PlannerConfig } from "./types";

/**
 * FrameGraphPlanner - Plans frame execution from media processing graphs
 */
export class FrameGraphPlanner {
  private config: PlannerConfig;
  private registry?: NodeRegistry;

  constructor(config: Partial<PlannerConfig> = {}, registry?: NodeRegistry) {
    this.config = {
      targetWidth: config.targetWidth || 1920,
      targetHeight: config.targetHeight || 1080,
      enableOptimizations: config.enableOptimizations ?? true,
      allowHalfResolution: config.allowHalfResolution ?? true,
      maxTransientResources: config.maxTransientResources || 8,
    };
    this.registry = registry;
  }

  /**
   * Plan frame execution for a specific frame number and timeline time.
   * Evaluates clip activation, traces active nodes upstream, and plans resources/passes.
   */
  plan(graph: MediaProcessingGraph, frameNumber: number, timeMs: number): FrameGraph {
    const { targetWidth, targetHeight } = this.config;

    // Phase 1: Determine active nodes based on timeline time
    const activeNodeIds = new Set<string>();
    const nodeById = new Map<string, GraphNode>();

    for (const node of graph.nodes) {
      nodeById.set(node.id, node);

      // TrackSourceManager nodes are active if they have enabled clips in range
      if (node.type === "TrackSourceManager") {
        const clips = node.params.clips || [];
        const hasActiveClip = clips.some((c: { enabled: boolean; timelineStartMs: number; timelineEndMs: number }) => c.enabled && timeMs >= c.timelineStartMs && timeMs <= c.timelineEndMs);
        if (hasActiveClip) {
          activeNodeIds.add(node.id);
        }
      } else if (node.type === "OutputNode" || node.type === "Output") {
        activeNodeIds.add(node.id);
      }
    }

    // Phase 2: Trace upstream from output to find all contributing nodes
    const visited = new Set<string>();
    const activeNodesList: GraphNode[] = [];
    const activeEdgesList: GraphEdge[] = [];

    const traceUpstream = (nodeId: string): boolean => {
      const node = nodeById.get(nodeId);
      if (!node) return false;

      // TrackSourceManager is a leaf - check if it's active
      if (node.type === "TrackSourceManager") {
        const isActive = activeNodeIds.has(nodeId);
        if (isActive && !visited.has(nodeId)) {
          visited.add(nodeId);
          activeNodesList.push(node);
        }
        return isActive;
      }

      // For other nodes, check if any input is active
      const incomingEdges = GraphHelper.getIncomingEdges(graph, nodeId);
      let anyInputActive = incomingEdges.length === 0;
      const activeEdges: GraphEdge[] = [];

      for (const edge of incomingEdges) {
        if (traceUpstream(edge.fromNodeId)) {
          anyInputActive = true;
          activeEdges.push(edge);
        }
      }

      // Include output nodes and nodes with active inputs
      if (anyInputActive || nodeId === "composite-output" || node.type === "OutputNode" || node.type === "Output") {
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          activeNodesList.push(node);
          activeEdges.forEach((e) => activeEdgesList.push(e));
        }
        return true;
      }

      return false;
    };

    // Start tracing from output node
    const outputNode = Array.from(nodeById.values()).find((n) => n.type === "OutputNode" || n.type === "Output" || n.id === "composite-output");
    if (outputNode) {
      traceUpstream(outputNode.id);
    }

    // Phase 3: Plan resources and passes
    const resourceRequests: ResourceRequest[] = [];
    const renderPasses: RenderPass[] = [];

    // Standard source and final frame resources
    resourceRequests.push({
      id: "res-src-frame",
      type: "texture",
      width: targetWidth,
      height: targetHeight,
      format: "rgba8",
      transient: false,
    });

    resourceRequests.push({
      id: "output",
      type: "texture",
      width: targetWidth,
      height: targetHeight,
      format: "rgba8",
      transient: false,
    });

    // Map node IDs to their output resource IDs
    const nodeOutputResourceMap = new Map<string, string>();
    nodeOutputResourceMap.set("composite-output", "output");
    if (outputNode) {
      nodeOutputResourceMap.set(outputNode.id, "output");
    }

    // Plan each active node
    for (const node of activeNodesList) {
      this.planNodePasses(node, activeEdgesList, nodeOutputResourceMap, resourceRequests, renderPasses, timeMs, targetWidth, targetHeight);
    }

    return {
      frameNumber,
      timelineTimeMs: timeMs,
      nodes: activeNodesList,
      edges: activeEdgesList,
      resourceRequests,
      passes: renderPasses,
    };
  }

  /**
   * Plan resources and passes for a single node.
   * Uses NodeRegistry for dynamic planning if available.
   */
  private planNodePasses(node: GraphNode, activeEdges: GraphEdge[], nodeOutputResourceMap: Map<string, string>, resourceRequests: ResourceRequest[], renderPasses: RenderPass[], timeMs: number, width: number, height: number): void {
    const planner = this.registry?.getPlanner(node.type);

    // TrackSourceManager: source frame reading
    if (node.type === "TrackSourceManager") {
      const resourceId = `res-${node.id}`;
      resourceRequests.push({
        id: resourceId,
        type: "texture",
        width,
        height,
        format: "rgba8",
        transient: true,
      });
      nodeOutputResourceMap.set(node.id, resourceId);

      if (planner) {
        this.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, { ...node.params, timeMs }, [], resourceId, width, height), resourceRequests, renderPasses);
      }
      return;
    }

    // OutputNode: final blit to output
    if (node.type === "OutputNode" || node.type === "Output") {
      const incoming = activeEdges.find((e) => e.toNodeId === node.id);
      const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : "res-src-frame";
      const inputIds = [inputResource || "res-src-frame"];

      if (planner) {
        this.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, node.params, inputIds, "output", width, height), resourceRequests, renderPasses);
      }
      return;
    }

    // AlphaBlend: two-input compositing
    if (node.type === "AlphaBlend") {
      const edges = activeEdges.filter((e) => e.toNodeId === node.id);
      const baseEdge = edges.find((e) => e.toPinId === "base");
      const overEdge = edges.find((e) => e.toPinId === "over");
      const baseResource = baseEdge ? nodeOutputResourceMap.get(baseEdge.fromNodeId) : "res-src-frame";
      const overResource = overEdge ? nodeOutputResourceMap.get(overEdge.fromNodeId) : "res-src-frame";
      const inputIds = [baseResource || "res-src-frame", overResource || "res-src-frame"];
      const outputResource = `res-blend-out-${node.id}`;

      resourceRequests.push({
        id: outputResource,
        type: "texture",
        width,
        height,
        format: "rgba8",
        transient: true,
      });
      nodeOutputResourceMap.set(node.id, outputResource);

      if (planner) {
        this.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, node.params, inputIds, outputResource, width, height), resourceRequests, renderPasses);
      }
      return;
    }

    // GaussianBlur: multipass with fp16 intermediate
    if (node.type === "GaussianBlur") {
      const incoming = activeEdges.find((e) => e.toNodeId === node.id);
      const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : "res-src-frame";
      const inputIds = [inputResource || "res-src-frame"];
      const outputResource = `res-blur-out-${node.id}`;

      resourceRequests.push({
        id: outputResource,
        type: "texture",
        width,
        height,
        format: "rgba16f",
        transient: true,
      });
      nodeOutputResourceMap.set(node.id, outputResource);

      if (planner) {
        this.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, node.params, inputIds, outputResource, width, height), resourceRequests, renderPasses);
      }
      return;
    }

    // Generic single-input effect
    const incoming = activeEdges.find((e) => e.toNodeId === node.id);
    const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : "res-src-frame";
    const inputIds = [inputResource || "res-src-frame"];
    const outputResource = `res-out-${node.id}`;

    resourceRequests.push({
      id: outputResource,
      type: "texture",
      width,
      height,
      format: "rgba8",
      transient: true,
    });
    nodeOutputResourceMap.set(node.id, outputResource);

    if (planner) {
      this.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, node.params, inputIds, outputResource, width, height), resourceRequests, renderPasses);
    } else {
      // Fallback: simple pass without registry
      renderPasses.push({
        id: `pass-${node.id}`,
        name: `Apply ${node.type}`,
        shaderId: node.type.toLowerCase(),
        inputs: inputIds,
        output: outputResource,
        uniforms: node.params,
      });
    }
  }

  /**
   * Append passes planned by ExecutionPlanner, including intermediate resources.
   */
  private appendPlannedPasses(
    nodeId: string,
    planned: Array<{
      shaderId: string;
      name: string;
      inputs: readonly string[];
      output: string;
      uniforms: Readonly<Record<string, any>>;
      intermediateResources?: Array<{
        id: string;
        type: "texture" | "buffer";
        width: number;
        height: number;
        format: string;
        transient: boolean;
      }>;
    }>,
    resourceRequests: ResourceRequest[],
    renderPasses: RenderPass[],
  ): void {
    planned.forEach((p, index) => {
      // Register intermediate resources
      if (p.intermediateResources) {
        for (const ir of p.intermediateResources) {
          if (!resourceRequests.some((r) => r.id === ir.id)) {
            resourceRequests.push({
              ...ir,
              format: ir.format as ResourceRequest["format"],
            });
          }
        }
      }

      // Add render pass
      renderPasses.push({
        id: planned.length > 1 ? `pass-${nodeId}-${index}` : `pass-${nodeId}`,
        name: p.name,
        shaderId: p.shaderId,
        inputs: [...p.inputs],
        output: p.output,
        uniforms: p.uniforms,
      });
    });
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

  /**
   * Update or set the NodeRegistry
   */
  setRegistry(registry: NodeRegistry): void {
    this.registry = registry;
  }

  /**
   * Get the current NodeRegistry
   */
  getRegistry(): NodeRegistry | undefined {
    return this.registry;
  }
}
