/**
 * @clypra-studio/engine — EffectGraph
 *
 * Directed Acyclic Graph evaluator for effect chains.
 * Uses Kahn's algorithm for topological ordering.
 * Supports native effect metadata and explicit Canvas2D source-preview nodes.
 */

import { EasingFunction } from "./types.js";

export interface KeyframePoint {
  time: number; // relative to node start
  value: number | string | number[];
  easing: EasingFunction;
}

export interface GraphNode {
  id: string;
  /** Native effect metadata attached by the Studio graph editor. */
  effect?: { backend?: "native" | "canvas2d"; id?: string; [key: string]: unknown };
  type?: string;
  params?: Record<string, any>;
  keyframes?: Record<string, KeyframePoint[]>;
  /** IDs of nodes this node depends on (must render before this one) */
  dependencies?: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphConnection {
  fromNode: string;
  fromOutput: string;
  toNode: string;
  toInput: string;
}

export interface GraphDefinition {
  schemaVersion: string;
  graphId: string;
  name: string;
  nodes: GraphNode[];
  connections: GraphConnection[];
}

export class EffectGraph {
  public schemaVersion?: string;
  public graphId?: string;
  public name?: string;
  public nodes = new Map<string, GraphNode>();
  public edges: GraphEdge[] = [];
  public connections: GraphConnection[] = [];

  constructor(definition?: GraphDefinition) {
    if (definition) {
      this.schemaVersion = definition.schemaVersion;
      this.graphId = definition.graphId;
      this.name = definition.name;
      for (const node of definition.nodes) {
        this.nodes.set(node.id, node);
      }
      this.connections = [...definition.connections];
    }
  }

  addNode(node: GraphNode): this {
    if (this.nodes.has(node.id)) {
      throw new Error(`[EffectGraph] Node "${node.id}" already exists`);
    }
    this.nodes.set(node.id, node);
    return this;
  }

  addEdge(from: string, to: string): this {
    if (!this.nodes.has(from)) throw new Error(`[EffectGraph] Unknown node "${from}"`);
    if (!this.nodes.has(to)) throw new Error(`[EffectGraph] Unknown node "${to}"`);
    this.edges.push({ from, to });
    return this;
  }

  removeNode(id: string): this {
    this.nodes.delete(id);
    this.edges = this.edges.filter((e) => e.from !== id && e.to !== id);
    this.connections = this.connections.filter((c) => c.fromNode !== id && c.toNode !== id);
    return this;
  }

  /**
   * Topological sort via Kahn's algorithm.
   * Returns nodes in render order or throws on circular dependency.
   */
  resolve(): GraphNode[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize
    for (const id of this.nodes.keys()) {
      inDegree.set(id, 0);
      adjList.set(id, []);
    }

    // Process explicit edges
    for (const edge of this.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
      adjList.get(edge.from)!.push(edge.to);
    }

    // Process connections (compatibility mode)
    for (const conn of this.connections) {
      if (this.nodes.has(conn.fromNode) && this.nodes.has(conn.toNode)) {
        // Only add if not already present
        const neighbors = adjList.get(conn.fromNode) || [];
        if (!neighbors.includes(conn.toNode)) {
          neighbors.push(conn.toNode);
          adjList.set(conn.fromNode, neighbors);
          inDegree.set(conn.toNode, (inDegree.get(conn.toNode) ?? 0) + 1);
        }
      }
    }

    // Process node.dependencies (compatibility mode)
    for (const [id, node] of this.nodes.entries()) {
      if (node.dependencies) {
        for (const depId of node.dependencies) {
          if (this.nodes.has(depId)) {
            // Note: depId is rendered BEFORE node.id, so edge goes from depId -> node.id
            const neighbors = adjList.get(depId) || [];
            if (!neighbors.includes(id)) {
              neighbors.push(id);
              adjList.set(depId, neighbors);
              inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
            }
          }
        }
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    const sorted: GraphNode[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      sorted.push(this.nodes.get(id)!);
      for (const neighbour of adjList.get(id) ?? []) {
        const deg = (inDegree.get(neighbour) ?? 1) - 1;
        inDegree.set(neighbour, deg);
        if (deg === 0) queue.push(neighbour);
      }
    }

    if (sorted.length !== this.nodes.size) {
      const cycle = [...this.nodes.keys()].filter((id) => (inDegree.get(id) ?? 0) > 0);
      throw new Error(`[EffectGraph] Circular dependency detected in nodes: ${cycle.join(", ")}`);
    }

    return sorted;
  }

  public getExecutionOrder(): string[] {
    return this.resolve().map((node) => node.id);
  }

  public getUpstreamNodes(nodeId: string): string[] {
    const node = this.nodes.get(nodeId);
    const deps = node?.dependencies || [];
    const connected = this.connections.filter((conn) => conn.toNode === nodeId).map((conn) => conn.fromNode);

    return Array.from(new Set([...deps, ...connected]));
  }

  /** Returns nodes that can execute in the browser-side authoring raster path. */
  resolveCanvas2D(): GraphNode[] {
    return this.resolve().filter((n) => n.effect?.backend !== "native");
  }

  get size(): number {
    return this.nodes.size;
  }

  clear(): this {
    this.nodes.clear();
    this.edges = [];
    this.connections = [];
    return this;
  }
}
