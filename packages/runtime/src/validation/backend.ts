/**
 * @clypra/runtime — Validation Backend
 *
 * Validates frame graphs before GPU execution.
 * Catches planning errors, resource lifetime issues, and dependency problems
 * without requiring GPU hardware.
 */

import type { FrameGraph, RenderPass, ResourceRequest } from "../planner/types";
import type { MediaProcessingGraph, GraphNode } from "../graph/types";
import { GraphHelper } from "../graph/types";

export interface FrameGraphValidationResult {
  readonly valid: boolean;
  readonly errors: readonly GraphValidationError[];
  readonly warnings: readonly GraphValidationWarning[];
}

export interface GraphValidationError {
  readonly category: "graph" | "planner" | "resources" | "passes";
  readonly message: string;
  readonly context?: Record<string, any>;
}

export interface GraphValidationWarning {
  readonly category: "performance" | "optimization" | "best-practice";
  readonly message: string;
  readonly context?: Record<string, any>;
}

/**
 * Validation Backend
 *
 * Validates graphs and frame graphs without GPU execution.
 */
export class ValidationBackend {
  /**
   * Validate a media processing graph
   */
  validateGraph(graph: MediaProcessingGraph): FrameGraphValidationResult {
    const errors: GraphValidationError[] = [];
    const warnings: GraphValidationWarning[] = [];

    // Graph Assertions: Structure
    if (graph.nodes.length === 0) {
      errors.push({
        category: "graph",
        message: "Graph must contain at least one node",
      });
    }

    // Graph Assertions: DAG (no cycles)
    if (this.hasCycles(graph)) {
      errors.push({
        category: "graph",
        message: "Graph contains cycles",
      });
    }

    // Graph Assertions: Output reachability
    const hasOutput = graph.nodes.some((n) => n.type === "Output");
    if (!hasOutput) {
      errors.push({
        category: "graph",
        message: "Graph must have an Output node",
      });
    }

    // Graph Assertions: Connected nodes
    const disconnected = this.findDisconnectedNodes(graph);
    if (disconnected.length > 0) {
      errors.push({
        category: "graph",
        message: "Graph contains disconnected nodes",
        context: { nodes: disconnected },
      });
    }

    // Performance Warnings
    if (graph.nodes.length > 20) {
      warnings.push({
        category: "performance",
        message: "Graph has many nodes - consider optimization",
        context: { nodeCount: graph.nodes.length },
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a frame graph
   */
  validateFrameGraph(frameGraph: FrameGraph): FrameGraphValidationResult {
    const errors: GraphValidationError[] = [];
    const warnings: GraphValidationWarning[] = [];

    // Planner Assertions: Passes
    if (frameGraph.passes.length === 0) {
      errors.push({
        category: "planner",
        message: "FrameGraph must have at least one pass",
      });
    }

    // Planner Assertions: Resources
    if (frameGraph.resourceRequests.length === 0) {
      errors.push({
        category: "planner",
        message: "FrameGraph must have at least one resource",
      });
    }

    // Planner Assertions: Output resource
    const hasOutputResource = frameGraph.resourceRequests.some((r) => r.id === "output");
    if (!hasOutputResource) {
      errors.push({
        category: "planner",
        message: 'FrameGraph must have an "output" resource',
      });
    }

    // Resource Assertions: All resources referenced by passes must exist
    const resourceIds = new Set(frameGraph.resourceRequests.map((r) => r.id));
    for (const pass of frameGraph.passes) {
      // Check inputs
      for (const inputId of pass.inputs) {
        if (!resourceIds.has(inputId)) {
          errors.push({
            category: "resources",
            message: `Pass "${pass.id}" references non-existent input resource "${inputId}"`,
          });
        }
      }

      // Check output
      if (!resourceIds.has(pass.output)) {
        errors.push({
          category: "resources",
          message: `Pass "${pass.id}" references non-existent output resource "${pass.output}"`,
        });
      }
    }

    // Pass Assertions: Dependency ordering
    const orderingErrors = this.validatePassOrdering(frameGraph.passes, frameGraph.resourceRequests);
    errors.push(...orderingErrors);

    // Resource Lifetime Warnings
    const lifetimeWarnings = this.analyzeResourceLifetimes(frameGraph.passes, frameGraph.resourceRequests);
    warnings.push(...lifetimeWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if graph contains cycles
   */
  private hasCycles(graph: MediaProcessingGraph): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const visit = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true; // Cycle detected
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // Visit all outgoing edges
      const outgoing = graph.edges.filter((e) => e.fromNodeId === nodeId);
      for (const edge of outgoing) {
        if (visit(edge.toNodeId)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of graph.nodes) {
      if (visit(node.id)) return true;
    }

    return false;
  }

  /**
   * Find disconnected nodes
   */
  private findDisconnectedNodes(graph: MediaProcessingGraph): string[] {
    const connected = new Set<string>();

    // Start from inputs
    const inputs = graph.nodes.filter((n) => n.type === "MediaInput");
    const queue = [...inputs.map((n) => n.id)];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (connected.has(nodeId)) continue;

      connected.add(nodeId);

      // Add downstream nodes
      const outgoing = graph.edges.filter((e) => e.fromNodeId === nodeId);
      for (const edge of outgoing) {
        queue.push(edge.toNodeId);
      }
    }

    // Find nodes not connected
    return graph.nodes.filter((n) => !connected.has(n.id)).map((n) => n.id);
  }

  /**
   * Validate pass ordering
   */
  private validatePassOrdering(passes: readonly RenderPass[], resources: readonly ResourceRequest[]): GraphValidationError[] {
    const errors: GraphValidationError[] = [];
    const written = new Set<string>();

    for (const pass of passes) {
      // Check if inputs have been written
      for (const inputId of pass.inputs) {
        const resource = resources.find((r) => r.id === inputId);
        if (resource && resource.transient && !written.has(inputId)) {
          errors.push({
            category: "passes",
            message: `Pass "${pass.id}" reads from "${inputId}" before it's written`,
          });
        }
      }

      // Mark output as written
      written.add(pass.output);
    }

    return errors;
  }

  /**
   * Analyze resource lifetimes for optimization opportunities
   */
  private analyzeResourceLifetimes(passes: readonly RenderPass[], resources: readonly ResourceRequest[]): GraphValidationWarning[] {
    const warnings: GraphValidationWarning[] = [];
    const lastUse = new Map<string, number>();
    const firstUse = new Map<string, number>();

    // Track resource usage
    for (let i = 0; i < passes.length; i++) {
      const pass = passes[i];

      for (const inputId of pass.inputs) {
        if (!firstUse.has(inputId)) firstUse.set(inputId, i);
        lastUse.set(inputId, i);
      }

      if (!firstUse.has(pass.output)) firstUse.set(pass.output, i);
      lastUse.set(pass.output, i);
    }

    // Check for resources that could be aliased
    const transientResources = resources.filter((r) => r.transient);
    for (let i = 0; i < transientResources.length; i++) {
      for (let j = i + 1; j < transientResources.length; j++) {
        const res1 = transientResources[i];
        const res2 = transientResources[j];

        const last1 = lastUse.get(res1.id);
        const first2 = firstUse.get(res2.id);

        // If res1's last use is before res2's first use, they could be aliased
        if (last1 !== undefined && first2 !== undefined && last1 < first2) {
          if (res1.width === res2.width && res1.height === res2.height && res1.format === res2.format) {
            warnings.push({
              category: "optimization",
              message: `Resources "${res1.id}" and "${res2.id}" could be aliased`,
              context: { resource1: res1.id, resource2: res2.id },
            });
          }
        }
      }
    }

    return warnings;
  }
}
