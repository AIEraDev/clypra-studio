/**
 * @clypra/engine — Pipeline V2: Graph Definitions
 * 
 * Defines immutable node, value, capability, and lifecycle schemas for the Media Processing Graph.
 */

export type NodeLifecycleState =
  | 'Created'
  | 'Validated'
  | 'Compiled'
  | 'Prepared'
  | 'Executing'
  | 'Completed'
  | 'Disposed';

export type GraphDataType =
  | 'Texture'
  | 'Depth'
  | 'MotionField'
  | 'BoundingBoxes'
  | 'Mask'
  | 'Particles'
  | 'AudioSpectrum'
  | 'Metadata';

export interface GraphValue<T = any> {
  readonly type: GraphDataType;
  readonly payload: T;
}

export interface EffectCapabilities {
  readonly temporal: boolean;
  readonly stateful: boolean;
  readonly spatial: boolean;
  readonly geometry: boolean;
  readonly inputsCount: number;
}

export interface EffectRequirements {
  readonly temporalRadius: number;
  readonly preferredPrecision: 'fp8' | 'fp16' | 'fp32';
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
  readonly capabilities: EffectCapabilities;
  readonly requirements: EffectRequirements;
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

export class GraphHelper {
  static create(id: string): MediaProcessingGraph {
    return { id, nodes: [], edges: [] };
  }

  static withNode(graph: MediaProcessingGraph, node: GraphNode): MediaProcessingGraph {
    return {
      ...graph,
      nodes: [...graph.nodes.filter(n => n.id !== node.id), node]
    };
  }

  static withEdge(
    graph: MediaProcessingGraph, 
    fromNodeId: string, 
    fromPinId: string, 
    toNodeId: string, 
    toPinId: string
  ): MediaProcessingGraph {
    const edge: GraphEdge = { fromNodeId, fromPinId, toNodeId, toPinId };
    return {
      ...graph,
      edges: [...graph.edges, edge]
    };
  }

  static getIncomingEdges(graph: MediaProcessingGraph, nodeId: string): GraphEdge[] {
    return graph.edges.filter(e => e.toNodeId === nodeId);
  }

  static getOutgoingEdges(graph: MediaProcessingGraph, nodeId: string): GraphEdge[] {
    return graph.edges.filter(e => e.fromNodeId === nodeId);
  }
}
