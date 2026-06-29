/**
 * @clypra/engine — Pipeline V2: Frame Graph Builder
 * 
 * Takes a compiled MediaProcessingGraph, evaluates segment activation at a specific time point,
 * resolves dependency execution order, plans texture allocations, and constructs a FrameGraph.
 */

import type { MediaProcessingGraph, GraphNode, GraphEdge } from '../graph/types';
import type { FrameGraph, ResourceRequest, RenderPass } from './types';
import { GraphHelper } from '../graph/types';

export class FrameGraphBuilder {
  /**
   * Builds the FrameGraph for a specific timeline time point.
   */
  static build(
    compiledGraph: MediaProcessingGraph, 
    timelineTimeMs: number, 
    frameNumber: number,
    viewportWidth: number,
    viewportHeight: number
  ): FrameGraph {
    // 1. Identify active nodes.
    // For TrackSourceManagers, evaluate whether they have active clips at this time.
    const activeNodeIds = new Set<string>();
    const nodeById = new Map<string, GraphNode>();
    for (const node of compiledGraph.nodes) {
      nodeById.set(node.id, node);

      if (node.type === 'TrackSourceManager') {
        const clips = node.params.clips || [];
        const hasActiveClip = clips.some((c: any) => 
          c.enabled && timelineTimeMs >= c.timelineStartMs && timelineTimeMs <= c.timelineEndMs
        );
        if (hasActiveClip) {
          activeNodeIds.add(node.id);
        }
      } else if (node.type === 'OutputNode') {
        // Output node is always active
        activeNodeIds.add(node.id);
      }
    }

    // Trace backwards from output node to find all upstream nodes that contribute to it
    const visited = new Set<string>();
    const activeNodesList: GraphNode[] = [];
    const activeEdgesList: GraphEdge[] = [];

    const traceUpstream = (nodeId: string): boolean => {
      const node = nodeById.get(nodeId);
      if (!node) return false;

      // If it's a source manager, check if it's active based on time seek
      if (node.type === 'TrackSourceManager') {
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

      // For other nodes (filters, blend nodes), trace their inputs.
      // A node is active if its inputs contribute active streams, or if it is the root OutputNode.
      const incomingEdges = GraphHelper.getIncomingEdges(compiledGraph, nodeId);
      let anyInputActive = incomingEdges.length === 0; // Generators with 0 inputs are active by default
      const activeEdges: GraphEdge[] = [];

      for (const edge of incomingEdges) {
        const isUpstreamActive = traceUpstream(edge.fromNodeId);
        if (isUpstreamActive) {
          anyInputActive = true;
          activeEdges.push(edge);
        }
      }

      if (anyInputActive || nodeId === 'composite-output') {
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

    // Begin upstream traversal from the composite output
    if (nodeById.has('composite-output')) {
      traceUpstream('composite-output');
    }

    // Reverse list to put upstream nodes first (basic topological sort)
    activeNodesList.reverse();

    // 2. Resource Allocation Planning (ResourceRequests)
    const resourceRequests: ResourceRequest[] = [];
    const renderPasses: RenderPass[] = [];

    // The primary source frame and final composition frame
    resourceRequests.push({
      id: 'res-src-frame',
      type: 'texture',
      width: viewportWidth,
      height: viewportHeight,
      format: 'rgba8',
      transient: false
    });

    resourceRequests.push({
      id: 'res-final-frame',
      type: 'texture',
      width: viewportWidth,
      height: viewportHeight,
      format: 'rgba8',
      transient: false
    });

    // Map to track which node outputs which resource ID
    const nodeOutputResourceMap = new Map<string, string>();
    nodeOutputResourceMap.set('composite-output', 'res-final-frame');

    // 3. Render Pass Generation
    // Translate each active node into a set of GPU rendering passes
    for (const node of activeNodesList) {
      if (node.type === 'TrackSourceManager') {
        // Source manager reads frame from decoders
        const resourceId = `res-${node.id}`;
        resourceRequests.push({
          id: resourceId,
          type: 'texture',
          width: viewportWidth,
          height: viewportHeight,
          format: 'rgba8',
          transient: true
        });
        nodeOutputResourceMap.set(node.id, resourceId);

        renderPasses.push({
          id: `pass-${node.id}`,
          name: `Read Track Source Frame`,
          shaderId: 'blit-source',
          inputs: [],
          output: resourceId,
          uniforms: { timeMs: timelineTimeMs }
        });
      } else if (node.type === 'OutputNode') {
        // Output blits its input resource directly to the final composition output
        const incoming = activeEdgesList.find(e => e.toNodeId === node.id);
        const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : 'res-src-frame';

        renderPasses.push({
          id: `pass-${node.id}`,
          name: `Blit to Output`,
          shaderId: 'copy',
          inputs: [inputResource || 'res-src-frame'],
          output: 'res-final-frame',
          uniforms: {}
        });
      } else if (node.type === 'GaussianBlur') {
        // Gaussian Blur is compiled into a two-pass ping-pong operation (Horizontal & Vertical)
        const incoming = activeEdgesList.find(e => e.toNodeId === node.id);
        const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : 'res-src-frame';

        const blurTempH = `res-temp-h-${node.id}`;
        const blurOut = `res-blur-out-${node.id}`;

        resourceRequests.push(
          { id: blurTempH, type: 'texture', width: viewportWidth, height: viewportHeight, format: 'rgba16f', transient: true },
          { id: blurOut, type: 'texture', width: viewportWidth, height: viewportHeight, format: 'rgba16f', transient: true }
        );

        nodeOutputResourceMap.set(node.id, blurOut);

        // Pass 1: Horizontal Blur
        renderPasses.push({
          id: `pass-${node.id}-h`,
          name: `Gaussian Blur Horizontal`,
          shaderId: 'gaussian-blur-h',
          inputs: [inputResource || 'res-src-frame'],
          output: blurTempH,
          uniforms: { uBlurStrength: node.params.blur || 8.0 }
        });

        // Pass 2: Vertical Blur
        renderPasses.push({
          id: `pass-${node.id}-v`,
          name: `Gaussian Blur Vertical`,
          shaderId: 'gaussian-blur-v',
          inputs: [blurTempH],
          output: blurOut,
          uniforms: { uBlurStrength: node.params.blur || 8.0 }
        });
      } else if (node.type === 'AlphaBlend') {
        // Compositing Blend node
        const edges = activeEdgesList.filter(e => e.toNodeId === node.id);
        const baseEdge = edges.find(e => e.toPinId === 'base');
        const overEdge = edges.find(e => e.toPinId === 'over');

        const baseResource = baseEdge ? nodeOutputResourceMap.get(baseEdge.fromNodeId) : 'res-src-frame';
        const overResource = overEdge ? nodeOutputResourceMap.get(overEdge.fromNodeId) : 'res-src-frame';

        const blendOut = `res-blend-out-${node.id}`;
        resourceRequests.push({
          id: blendOut,
          type: 'texture',
          width: viewportWidth,
          height: viewportHeight,
          format: 'rgba8',
          transient: true
        });
        nodeOutputResourceMap.set(node.id, blendOut);

        renderPasses.push({
          id: `pass-${node.id}`,
          name: `Blend Layers`,
          shaderId: 'blend-normal',
          inputs: [baseResource || 'res-src-frame', overResource || 'res-src-frame'],
          output: blendOut,
          uniforms: { opacity: node.params.opacity ?? 1.0 }
        });
      } else {
        // Generic single-pass pixel adjustments (Brightness, Contrast, Vignette, etc.)
        const incoming = activeEdgesList.find(e => e.toNodeId === node.id);
        const inputResource = incoming ? nodeOutputResourceMap.get(incoming.fromNodeId) : 'res-src-frame';

        const outputResource = `res-out-${node.id}`;
        resourceRequests.push({
          id: outputResource,
          type: 'texture',
          width: viewportWidth,
          height: viewportHeight,
          format: 'rgba8',
          transient: true
        });
        nodeOutputResourceMap.set(node.id, outputResource);

        renderPasses.push({
          id: `pass-${node.id}`,
          name: `Apply ${node.type}`,
          shaderId: node.type.toLowerCase(),
          inputs: [inputResource || 'res-src-frame'],
          output: outputResource,
          uniforms: node.params
        });
      }
    }

    return {
      frameNumber,
      timelineTimeMs,
      nodes: activeNodesList,
      edges: activeEdgesList,
      resourceRequests,
      passes: renderPasses
    };
  }
}
