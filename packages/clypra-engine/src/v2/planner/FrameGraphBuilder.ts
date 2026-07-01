/**
 * @clypra/engine — Pipeline V2: Frame Graph Builder
 *
 * Takes a compiled MediaProcessingGraph, evaluates segment activation at a specific time point,
 * resolves dependency execution order, plans texture allocations, and constructs a FrameGraph.
 */

import type { MediaProcessingGraph, GraphNode, GraphEdge } from "@clypra/types";
import { GraphHelper } from "@clypra/types";
import { NodeRegistry } from "../graph/NodeRegistry";
import type { FrameGraph, ResourceRequest, RenderPass } from "./types";

export class FrameGraphBuilder {
  /**
   * Builds the FrameGraph for a specific timeline time point.
   */
  static build(compiledGraph: MediaProcessingGraph, timelineTimeMs: number, frameNumber: number, viewportWidth: number, viewportHeight: number, registry: NodeRegistry = NodeRegistry.createDefault()): FrameGraph {
    const activeNodeIds = new Set<string>();
    const nodeById = new Map<string, GraphNode>();
    for (const node of compiledGraph.nodes) {
      nodeById.set(node.id, node);

      if (node.type === "TrackSourceManager") {
        const clips = node.params.clips || [];
        const hasActiveClip = clips.some((c: { enabled: boolean; timelineStartMs: number; timelineEndMs: number }) => c.enabled && timelineTimeMs >= c.timelineStartMs && timelineTimeMs <= c.timelineEndMs);
        if (hasActiveClip) {
          activeNodeIds.add(node.id);
        }
      } else if (node.type === "OutputNode") {
        activeNodeIds.add(node.id);
      }
    }

    const visited = new Set<string>();
    const activeNodesList: GraphNode[] = [];
    const activeEdgesList: GraphEdge[] = [];

    const traceUpstream = (nodeId: string): boolean => {
      const node = nodeById.get(nodeId);
      if (!node) return false;

      if (node.type === "TrackSourceManager") {
        const isActive = activeNodeIds.has(nodeId);
        if (isActive) {
          if (!visited.has(nodeId)) {
            visited.add(nodeId);
            activeNodesList.push(node);
          }
          return true;
        }
        return false;
      }

      const incomingEdges = GraphHelper.getIncomingEdges(compiledGraph, nodeId);
      let anyInputActive = incomingEdges.length === 0;
      const activeEdges: GraphEdge[] = [];

      for (const edge of incomingEdges) {
        const isUpstreamActive = traceUpstream(edge.fromNodeId);
        if (isUpstreamActive) {
          anyInputActive = true;
          activeEdges.push(edge);
        }
      }

      if (anyInputActive || nodeId === "composite-output") {
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          activeNodesList.push(node);
          for (const edge of activeEdges) {
            activeEdgesList.push(edge);
          }
        }
        return true;
      }

      return false;
    };

    if (nodeById.has("composite-output")) {
      traceUpstream("composite-output");
    }

    const resourceRequests: ResourceRequest[] = [];
    const renderPasses: RenderPass[] = [];

    resourceRequests.push({
      id: "res-src-frame",
      type: "texture",
      width: viewportWidth,
      height: viewportHeight,
      format: "rgba8",
      transient: false,
    });

    resourceRequests.push({
      id: "res-final-frame",
      type: "texture",
      width: viewportWidth,
      height: viewportHeight,
      format: "rgba8",
      transient: false,
    });

    const nodeOutputResourceMap = new Map<string, string>();
    nodeOutputResourceMap.set("composite-output", "res-final-frame");

    for (const node of activeNodesList) {
      FrameGraphBuilder.planNodePasses(node, activeEdgesList, nodeOutputResourceMap, resourceRequests, renderPasses, registry, timelineTimeMs, viewportWidth, viewportHeight);
    }

    return {
      frameNumber,
      timelineTimeMs,
      nodes: activeNodesList,
      edges: activeEdgesList,
      resourceRequests,
      passes: renderPasses,
    };
  }

  private static planNodePasses(node: GraphNode, activeEdgesList: GraphEdge[], nodeOutputResourceMap: Map<string, string>, resourceRequests: ResourceRequest[], renderPasses: RenderPass[], registry: NodeRegistry, timelineTimeMs: number, viewportWidth: number, viewportHeight: number): void {
    const planner = registry.getPlanner(node.type);

    if (node.type === "TrackSourceManager") {
      const resourceId = `res-${node.id}`;
      resourceRequests.push({
        id: resourceId,
        type: "texture",
        width: viewportWidth,
        height: viewportHeight,
        format: "rgba8",
        transient: true,
      });
      nodeOutputResourceMap.set(node.id, resourceId);

      if (planner) {
        FrameGraphBuilder.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, { ...node.params, timeMs: timelineTimeMs }, [], resourceId, viewportWidth, viewportHeight), resourceRequests, renderPasses);
      }
      return;
    }

    if (node.type === "OutputNode") {
      const incoming = activeEdgesList.find((e) => e.toNodeId === node.id);
      const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : "res-src-frame";
      const inputIds = [inputResource || "res-src-frame"];

      if (planner) {
        FrameGraphBuilder.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, node.params, inputIds, "res-final-frame", viewportWidth, viewportHeight), resourceRequests, renderPasses);
      }
      return;
    }

    if (node.type === "AlphaBlend") {
      const edges = activeEdgesList.filter((e) => e.toNodeId === node.id);
      const baseEdge = edges.find((e) => e.toPinId === "base");
      const overEdge = edges.find((e) => e.toPinId === "over");
      const baseResource = baseEdge ? nodeOutputResourceMap.get(baseEdge.fromNodeId) : "res-src-frame";
      const overResource = overEdge ? nodeOutputResourceMap.get(overEdge.fromNodeId) : "res-src-frame";
      const inputIds = [baseResource || "res-src-frame", overResource || "res-src-frame"];
      const outputResource = `res-blend-out-${node.id}`;

      resourceRequests.push({
        id: outputResource,
        type: "texture",
        width: viewportWidth,
        height: viewportHeight,
        format: "rgba8",
        transient: true,
      });
      nodeOutputResourceMap.set(node.id, outputResource);

      if (planner) {
        FrameGraphBuilder.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, node.params, inputIds, outputResource, viewportWidth, viewportHeight), resourceRequests, renderPasses);
      }
      return;
    }

    if (node.type === "GaussianBlur") {
      const incoming = activeEdgesList.find((e) => e.toNodeId === node.id);
      const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : "res-src-frame";
      const inputIds = [inputResource || "res-src-frame"];
      const outputResource = `res-blur-out-${node.id}`;

      resourceRequests.push({
        id: outputResource,
        type: "texture",
        width: viewportWidth,
        height: viewportHeight,
        format: "rgba16f",
        transient: true,
      });
      nodeOutputResourceMap.set(node.id, outputResource);

      if (planner) {
        FrameGraphBuilder.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, node.params, inputIds, outputResource, viewportWidth, viewportHeight), resourceRequests, renderPasses);
      }
      return;
    }

    const incoming = activeEdgesList.find((e) => e.toNodeId === node.id);
    const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : "res-src-frame";
    const inputIds = [inputResource || "res-src-frame"];
    const outputResource = `res-out-${node.id}`;

    resourceRequests.push({
      id: outputResource,
      type: "texture",
      width: viewportWidth,
      height: viewportHeight,
      format: "rgba8",
      transient: true,
    });
    nodeOutputResourceMap.set(node.id, outputResource);

    if (planner) {
      FrameGraphBuilder.appendPlannedPasses(node.id, planner.planExecution(node.id, node.type, node.params, inputIds, outputResource, viewportWidth, viewportHeight), resourceRequests, renderPasses);
    } else {
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

  private static appendPlannedPasses(nodeId: string, planned: ReturnType<NonNullable<ReturnType<NodeRegistry["getPlanner"]>>["planExecution"]>, resourceRequests: ResourceRequest[], renderPasses: RenderPass[]): void {
    planned.forEach((p, index) => {
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
}
