/**
 * @clypra/runtime — Graph Validator
 *
 * Validates media processing graphs for correctness.
 * Merged implementation combining the best features from engine/v2 and runtime.
 *
 * Features:
 * - NodeRegistry integration for validating registered node types
 * - Detailed error types with cycle path tracking
 * - Type safety validation for pin connections
 * - Capability validation (temporal radius, input counts)
 * - validateEdge() helper for interactive graph editors
 * - Performance and compatibility warnings
 */

import type { MediaProcessingGraph, GraphNode, GraphEdge } from "./types";
import { GraphHelper } from "./types";
import type { NodeRegistry } from "./NodeRegistry";

export interface ValidationError {
  readonly type: "type-mismatch" | "cycle" | "capability-error" | "missing-node" | "invalid-connection" | "unknown-node-type" | "missing-connection" | "invalid-node";
  readonly message: string;
  readonly nodeId?: string;
  readonly edgeIndex?: number;
  readonly edgeFrom?: string;
  readonly edgeTo?: string;
  readonly details?: Record<string, any>;
}

export interface ValidationWarning {
  readonly type: "performance" | "compatibility" | "best-practice";
  readonly message: string;
  readonly severity: "low" | "medium" | "high";
  readonly nodeId?: string;
}

export interface GraphValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
}

/**
 * GraphValidator - Validates graph structure and semantics
 */
export class GraphValidator {
  private registry?: NodeRegistry;

  constructor(registry?: NodeRegistry) {
    this.registry = registry;
  }

  /**
   * Validate a media processing graph for correctness.
   * Returns detailed errors and warnings.
   */
  validate(graph: MediaProcessingGraph): GraphValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Build node lookup map
    const nodeById = new Map<string, GraphNode>();
    for (const node of graph.nodes) {
      nodeById.set(node.id, node);
    }

    // 1. Validate that all node types are registered (if registry provided)
    if (this.registry) {
      for (const node of graph.nodes) {
        if (!this.registry.has(node.type)) {
          errors.push({
            type: "unknown-node-type",
            message: `Node type "${node.type}" is not registered in the NodeRegistry`,
            nodeId: node.id,
            details: { nodeType: node.type },
          });
        }
      }
    }

    // 2. Validate each node
    for (const node of graph.nodes) {
      const nodeErrors = this.validateNode(graph, node, nodeById);
      errors.push(...nodeErrors);

      const nodeWarnings = this.generateWarnings(node);
      warnings.push(...nodeWarnings);
    }

    // 3. Validate each edge (pin connections and type safety)
    for (let i = 0; i < graph.edges.length; i++) {
      const edge = graph.edges[i];
      const edgeErrors = this.validateEdgeInternal(edge, nodeById, i);
      errors.push(...edgeErrors);
    }

    // 4. Cycle detection (DAG validation)
    const cycleErrors = this.detectCycles(graph, nodeById);
    errors.push(...cycleErrors);

    // 5. Capability validation (if registry provided)
    if (this.registry) {
      const capabilityErrors = this.validateCapabilities(graph, nodeById);
      errors.push(...capabilityErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Quick validation check that only returns true/false without detailed errors.
   */
  isValid(graph: MediaProcessingGraph): boolean {
    return this.validate(graph).valid;
  }

  /**
   * Validates a specific edge before adding it to the graph.
   * Useful for interactive graph editors.
   */
  validateEdge(graph: MediaProcessingGraph, fromNodeId: string, fromPinId: string, toNodeId: string, toPinId: string): ValidationError | null {
    const nodeById = new Map<string, GraphNode>();
    for (const node of graph.nodes) {
      nodeById.set(node.id, node);
    }

    const fromNode = nodeById.get(fromNodeId);
    const toNode = nodeById.get(toNodeId);

    if (!fromNode) {
      return {
        type: "missing-node",
        message: `Source node "${fromNodeId}" does not exist in graph`,
        details: { fromNodeId },
      };
    }

    if (!toNode) {
      return {
        type: "missing-node",
        message: `Target node "${toNodeId}" does not exist in graph`,
        details: { toNodeId },
      };
    }

    const fromPin = fromNode.outputs[fromPinId];
    if (!fromPin) {
      return {
        type: "invalid-connection",
        message: `Source node "${fromNodeId}" does not have output pin "${fromPinId}"`,
        nodeId: fromNodeId,
        details: { fromPinId, availableOutputs: Object.keys(fromNode.outputs) },
      };
    }

    const toPin = toNode.inputs[toPinId];
    if (!toPin) {
      return {
        type: "invalid-connection",
        message: `Target node "${toNodeId}" does not have input pin "${toPinId}"`,
        nodeId: toNodeId,
        details: { toPinId, availableInputs: Object.keys(toNode.inputs) },
      };
    }

    if (fromPin.type !== toPin.type) {
      return {
        type: "type-mismatch",
        message: `Type mismatch: Cannot connect ${fromPin.type} output to ${toPin.type} input`,
        details: {
          fromNode: fromNodeId,
          fromPin: fromPinId,
          fromType: fromPin.type,
          toNode: toNodeId,
          toPin: toPinId,
          toType: toPin.type,
        },
      };
    }

    return null; // Edge is valid
  }

  /**
   * Validate a single node
   */
  private validateNode(graph: MediaProcessingGraph, node: GraphNode, nodeById: Map<string, GraphNode>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if node type is valid
    if (!node.type) {
      errors.push({
        type: "invalid-node",
        message: `Node ${node.id} has no type`,
        nodeId: node.id,
      });
      return errors;
    }

    // Validate input count matches expectations (if registry provided)
    if (this.registry) {
      const definition = this.registry.getDefinition(node.type);
      if (definition) {
        const expectedInputCount = definition.capabilities.inputsCount;
        const actualInputCount = Object.keys(node.inputs).length;

        if (actualInputCount !== expectedInputCount) {
          errors.push({
            type: "capability-error",
            message: `Node "${node.id}" expects ${expectedInputCount} inputs but has ${actualInputCount} defined`,
            nodeId: node.id,
            details: {
              expected: expectedInputCount,
              actual: actualInputCount,
              inputs: Object.keys(node.inputs),
            },
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate a single edge (internal method with edge index)
   */
  private validateEdgeInternal(edge: GraphEdge, nodeById: Map<string, GraphNode>, edgeIndex: number): ValidationError[] {
    const errors: ValidationError[] = [];

    const fromNode = nodeById.get(edge.fromNodeId);
    const toNode = nodeById.get(edge.toNodeId);

    if (!fromNode) {
      errors.push({
        type: "invalid-node",
        message: `Edge references non-existent source node: ${edge.fromNodeId}`,
        edgeIndex,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
        details: { edge },
      });
      return errors;
    }

    if (!toNode) {
      errors.push({
        type: "invalid-node",
        message: `Edge references non-existent target node: ${edge.toNodeId}`,
        edgeIndex,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
        details: { edge },
      });
      return errors;
    }

    // Check if pins exist
    const fromPin = fromNode.outputs[edge.fromPinId];
    const toPin = toNode.inputs[edge.toPinId];

    if (!fromPin) {
      errors.push({
        type: "missing-connection",
        message: `Source node ${edge.fromNodeId} does not have output pin '${edge.fromPinId}'`,
        edgeIndex,
        nodeId: fromNode.id,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
        details: { edge, availableOutputs: Object.keys(fromNode.outputs) },
      });
    }

    if (!toPin) {
      errors.push({
        type: "missing-connection",
        message: `Target node ${edge.toNodeId} does not have input pin '${edge.toPinId}'`,
        edgeIndex,
        nodeId: toNode.id,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
        details: { edge, availableInputs: Object.keys(toNode.inputs) },
      });
    }

    // Check type compatibility
    if (fromPin && toPin && fromPin.type !== toPin.type) {
      errors.push({
        type: "type-mismatch",
        message: `Type mismatch: Cannot connect ${fromPin.type} output to ${toPin.type} input (${edge.fromNodeId}.${edge.fromPinId} → ${edge.toNodeId}.${edge.toPinId})`,
        edgeIndex,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
        details: {
          edge,
          fromNode: edge.fromNodeId,
          fromPin: edge.fromPinId,
          fromType: fromPin.type,
          toNode: edge.toNodeId,
          toPin: edge.toPinId,
          toType: toPin.type,
        },
      });
    }

    return errors;
  }

  /**
   * Detects cycles in the graph using depth-first search.
   * A valid media processing graph must be a DAG (Directed Acyclic Graph).
   * Returns errors with the full cycle path for debugging.
   */
  private detectCycles(graph: MediaProcessingGraph, nodeById: Map<string, GraphNode>): ValidationError[] {
    const errors: ValidationError[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        // Cycle detected - build the cycle path
        const cycleStart = path.indexOf(nodeId);
        const cyclePath = [...path.slice(cycleStart), nodeId];
        errors.push({
          type: "cycle",
          message: `Cycle detected in graph: ${cyclePath.join(" → ")}`,
          nodeId,
          details: { cyclePath },
        });
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      // Visit all outgoing edges
      const outgoingEdges = graph.edges.filter((e) => e.fromNodeId === nodeId);
      for (const edge of outgoingEdges) {
        if (dfs(edge.toNodeId)) {
          return true; // Propagate cycle detection
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
      return false;
    };

    // Check all nodes (handle disconnected components)
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return errors;
  }

  /**
   * Validates capability requirements are met.
   * Uses NodeRegistry if provided for detailed validation.
   */
  private validateCapabilities(graph: MediaProcessingGraph, nodeById: Map<string, GraphNode>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!this.registry) return errors;

    for (const node of graph.nodes) {
      const definition = this.registry.getDefinition(node.type);
      if (!definition) {
        continue; // Already reported as unknown_node_type
      }

      // Validate temporal capability requirements
      if (node.capabilities.temporal && node.requirements.temporalRadius > 0) {
        const incomingEdges = graph.edges.filter((e) => e.toNodeId === node.id);
        if (incomingEdges.length === 0) {
          errors.push({
            type: "capability-error",
            message: `Temporal node "${node.id}" requires ${node.requirements.temporalRadius} frames of history but has no inputs`,
            nodeId: node.id,
            details: {
              temporalRadius: node.requirements.temporalRadius,
              capabilities: node.capabilities,
            },
          });
        }
      }
    }

    return errors;
  }

  /**
   * Generate performance and best-practice warnings
   */
  private generateWarnings(node: GraphNode): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Warn about multipass effects
    if (node.requirements.multipass) {
      warnings.push({
        type: "performance",
        message: `Node ${node.id} requires multiple render passes`,
        severity: "medium",
        nodeId: node.id,
      });
    }

    // Warn about high temporal radius
    if (node.requirements.temporalRadius > 5) {
      warnings.push({
        type: "performance",
        message: `Node ${node.id} has high temporal radius (${node.requirements.temporalRadius} frames)`,
        severity: "high",
        nodeId: node.id,
      });
    }

    // Warn about stateful effects
    if (node.capabilities.stateful) {
      warnings.push({
        type: "compatibility",
        message: `Node ${node.id} is stateful - may not work well with random access`,
        severity: "low",
        nodeId: node.id,
      });
    }

    return warnings;
  }

  /**
   * Update or set the NodeRegistry for enhanced validation
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
