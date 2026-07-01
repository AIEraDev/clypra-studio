/**
 * @clypra/runtime — Graph Types
 *
 * Defines immutable node, value, capability, and lifecycle schemas for the Media Processing Graph.
 * These types are shared across all Labs (Video, Transition, Body).
 */

export type NodeLifecycleState = "Created" | "Validated" | "Compiled" | "Prepared" | "Executing" | "Completed" | "Disposed";

export type GraphDataType = "Texture" | "Depth" | "MotionField" | "BoundingBoxes" | "Mask" | "Pose" | "FaceMesh" | "Particles" | "AudioSpectrum" | "Metadata";

export interface GraphValue<T = any> {
  readonly type: GraphDataType;
  readonly payload: T;
}

export interface NodeCapabilities {
  readonly temporal: boolean;
  readonly stateful: boolean;
  readonly spatial: boolean;
  readonly geometry: boolean;
  readonly inputsCount: number;
}

export interface NodeRequirements {
  readonly temporalRadius: number;
  readonly preferredPrecision: "fp8" | "fp16" | "fp32";
  readonly multipass: boolean;
  readonly supportsHalfResolution: boolean;
}

export interface GraphPin {
  readonly id: string;
  readonly name: string;
  readonly type: GraphDataType;
}

export interface GraphNode {
  readonly id: string;
  readonly type: string;
  readonly version: number; // Current parameter version for dirty propagation
  readonly params: Readonly<Record<string, any>>;
  readonly inputs: Readonly<Record<string, GraphPin>>;
  readonly outputs: Readonly<Record<string, GraphPin>>;
  readonly capabilities: NodeCapabilities;
  readonly requirements: NodeRequirements;
  readonly lifecycle: NodeLifecycleState;
}

export interface GraphEdge {
  readonly fromNodeId: string;
  readonly fromPinId: string;
  readonly toNodeId: string;
  readonly toPinId: string;
}

export interface MediaProcessingGraph {
  readonly id: string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

/**
 * Immutable graph helper functions
 */
export class GraphHelper {
  static create(id: string): MediaProcessingGraph {
    return { id, nodes: [], edges: [] };
  }

  static withNode(graph: MediaProcessingGraph, node: GraphNode): MediaProcessingGraph {
    return {
      ...graph,
      nodes: [...graph.nodes.filter((n) => n.id !== node.id), node],
    };
  }

  static withEdge(graph: MediaProcessingGraph, fromNodeId: string, fromPinId: string, toNodeId: string, toPinId: string): MediaProcessingGraph {
    const edge: GraphEdge = { fromNodeId, fromPinId, toNodeId, toPinId };
    return {
      ...graph,
      edges: [...graph.edges, edge],
    };
  }

  static getIncomingEdges(graph: MediaProcessingGraph, nodeId: string): GraphEdge[] {
    return graph.edges.filter((e) => e.toNodeId === nodeId);
  }

  static getOutgoingEdges(graph: MediaProcessingGraph, nodeId: string): GraphEdge[] {
    return graph.edges.filter((e) => e.fromNodeId === nodeId);
  }

  static findNode(graph: MediaProcessingGraph, nodeId: string): GraphNode | undefined {
    return graph.nodes.find((n) => n.id === nodeId);
  }

  static getDependencies(graph: MediaProcessingGraph, nodeId: string): GraphNode[] {
    const incoming = this.getIncomingEdges(graph, nodeId);
    return incoming.map((edge) => this.findNode(graph, edge.fromNodeId)).filter((node): node is GraphNode => node !== undefined);
  }

  static hasCycles(graph: MediaProcessingGraph): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoing = this.getOutgoingEdges(graph, nodeId);
      for (const edge of outgoing) {
        if (!visited.has(edge.toNodeId)) {
          if (dfs(edge.toNodeId)) return true;
        } else if (recursionStack.has(edge.toNodeId)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }

  static topologicalSort(graph: MediaProcessingGraph): GraphNode[] {
    const inDegree = new Map<string, number>();
    const sorted: GraphNode[] = [];
    const queue: GraphNode[] = [];

    // Initialize in-degrees
    for (const node of graph.nodes) {
      inDegree.set(node.id, 0);
    }

    // Calculate in-degrees
    for (const edge of graph.edges) {
      inDegree.set(edge.toNodeId, (inDegree.get(edge.toNodeId) || 0) + 1);
    }

    // Find nodes with no incoming edges
    for (const node of graph.nodes) {
      if (inDegree.get(node.id) === 0) {
        queue.push(node);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);

      const outgoing = this.getOutgoingEdges(graph, node.id);
      for (const edge of outgoing) {
        const targetNode = this.findNode(graph, edge.toNodeId);
        if (!targetNode) continue;

        const newInDegree = (inDegree.get(edge.toNodeId) || 0) - 1;
        inDegree.set(edge.toNodeId, newInDegree);

        if (newInDegree === 0) {
          queue.push(targetNode);
        }
      }
    }

    return sorted;
  }
}
