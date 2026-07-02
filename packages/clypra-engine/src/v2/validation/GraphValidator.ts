/**
 * @clypra/engine — Pipeline V2: Graph Validator
 *
 * @deprecated This implementation should be merged into @clypra/runtime/graph/validator
 * This version has MORE COMPLETE functionality (NodeRegistry integration, detailed error types,
 * cycle path tracking) than the current runtime version and should be used as the canonical implementation.
 * This file will be removed in v3.0.0 after merging into runtime.
 *
 * Separates graph validation into a dedicated compilation pre-pass.
 * Validates pin connection type-safety, performs cycle detection (DAG validation),
 * and enforces capability matches.
 */

import type { MediaProcessingGraph, GraphNode, GraphEdge, GraphDataType } from "../graph/types";
import type { NodeRegistry } from "../graph/NodeRegistry";

export interface ValidationError {
  readonly type: "type_mismatch" | "cycle_detected" | "capability_error" | "missing_node" | "invalid_connection" | "unknown_node_type";
  readonly message: string;
  readonly nodeId?: string;
  readonly edgeIndex?: number;
  readonly details?: Record<string, any>;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings?: readonly string[];
}

export class GraphValidator {
  constructor(private registry: NodeRegistry) {}

  /**
   * Validates the entire MediaProcessingGraph for correctness.
   * Returns a ValidationResult with all detected errors.
   */
  validate(graph: MediaProcessingGraph): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // 1. Validate that all node types are registered
    for (const node of graph.nodes) {
      if (!this.registry.has(node.type)) {
        errors.push({
          type: "unknown_node_type",
          message: `Node type "${node.type}" is not registered in the NodeRegistry`,
          nodeId: node.id,
          details: { nodeType: node.type },
        });
      }
    }

    // 2. Validate pin connections (type-safety)
    const nodeById = new Map<string, GraphNode>();
    for (const node of graph.nodes) {
      nodeById.set(node.id, node);
    }

    for (let i = 0; i < graph.edges.length; i++) {
      const edge = graph.edges[i];
      const fromNode = nodeById.get(edge.fromNodeId);
      const toNode = nodeById.get(edge.toNodeId);

      if (!fromNode) {
        errors.push({
          type: "missing_node",
          message: `Edge references non-existent source node "${edge.fromNodeId}"`,
          edgeIndex: i,
          details: { edge },
        });
        continue;
      }

      if (!toNode) {
        errors.push({
          type: "missing_node",
          message: `Edge references non-existent target node "${edge.toNodeId}"`,
          edgeIndex: i,
          details: { edge },
        });
        continue;
      }

      // Check if output pin exists on source node
      const fromPin = fromNode.outputs[edge.fromPinId];
      if (!fromPin) {
        errors.push({
          type: "invalid_connection",
          message: `Source node "${fromNode.id}" does not have output pin "${edge.fromPinId}"`,
          edgeIndex: i,
          nodeId: fromNode.id,
          details: { edge, availableOutputs: Object.keys(fromNode.outputs) },
        });
        continue;
      }

      // Check if input pin exists on target node
      const toPin = toNode.inputs[edge.toPinId];
      if (!toPin) {
        errors.push({
          type: "invalid_connection",
          message: `Target node "${toNode.id}" does not have input pin "${edge.toPinId}"`,
          edgeIndex: i,
          nodeId: toNode.id,
          details: { edge, availableInputs: Object.keys(toNode.inputs) },
        });
        continue;
      }

      // Check type compatibility
      if (fromPin.type !== toPin.type) {
        errors.push({
          type: "type_mismatch",
          message: `Type mismatch: Cannot connect ${fromPin.type} output to ${toPin.type} input`,
          edgeIndex: i,
          details: {
            edge,
            fromNode: fromNode.id,
            fromPin: edge.fromPinId,
            fromType: fromPin.type,
            toNode: toNode.id,
            toPin: edge.toPinId,
            toType: toPin.type,
          },
        });
      }
    }

    // 3. Cycle detection (DAG validation)
    const cycleErrors = this.detectCycles(graph, nodeById);
    errors.push(...cycleErrors);

    // 4. Capability validation
    const capabilityErrors = this.validateCapabilities(graph, nodeById);
    errors.push(...capabilityErrors);

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Detects cycles in the graph using depth-first search.
   * A valid media processing graph must be a DAG (Directed Acyclic Graph).
   */
  private detectCycles(graph: MediaProcessingGraph, nodeById: Map<string, GraphNode>): ValidationError[] {
    const errors: ValidationError[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        // Cycle detected
        const cycleStart = path.indexOf(nodeId);
        const cyclePath = [...path.slice(cycleStart), nodeId];
        errors.push({
          type: "cycle_detected",
          message: `Cycle detected in graph: ${cyclePath.join(" -> ")}`,
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
   * For example, temporal nodes should have access to history frames.
   */
  private validateCapabilities(graph: MediaProcessingGraph, nodeById: Map<string, GraphNode>): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const node of graph.nodes) {
      const definition = this.registry.getDefinition(node.type);
      if (!definition) {
        continue; // Already reported as unknown_node_type
      }

      // Validate temporal capability requirements
      if (node.capabilities.temporal && node.requirements.temporalRadius > 0) {
        // Check if upstream nodes can provide temporal history
        // For now, just issue a warning if temporal nodes are not connected to appropriate sources
        // In a full implementation, you'd trace back to ensure temporal history is available
        const incomingEdges = graph.edges.filter((e) => e.toNodeId === node.id);
        if (incomingEdges.length === 0) {
          errors.push({
            type: "capability_error",
            message: `Temporal node "${node.id}" requires ${node.requirements.temporalRadius} frames of history but has no inputs`,
            nodeId: node.id,
            details: {
              temporalRadius: node.requirements.temporalRadius,
              capabilities: node.capabilities,
            },
          });
        }
      }

      // Validate input count matches expectations
      const expectedInputCount = node.capabilities.inputsCount;
      const actualInputCount = Object.keys(node.inputs).length;

      if (actualInputCount !== expectedInputCount) {
        errors.push({
          type: "capability_error",
          message: `Node "${node.id}" expects ${expectedInputCount} inputs but has ${actualInputCount} defined`,
          nodeId: node.id,
          details: {
            expected: expectedInputCount,
            actual: actualInputCount,
            inputs: Object.keys(node.inputs),
          },
        });
      }

      // Validate that all inputs are connected (if required)
      const connectedInputs = new Set(graph.edges.filter((e) => e.toNodeId === node.id).map((e) => e.toPinId));

      for (const [pinId, pin] of Object.entries(node.inputs)) {
        if (!connectedInputs.has(pinId)) {
          // Not all inputs need to be connected for some node types (optional inputs)
          // For now, we just track this for potential warnings
          // You could extend this with required vs optional pin metadata
        }
      }
    }

    return errors;
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
        type: "missing_node",
        message: `Source node "${fromNodeId}" does not exist in graph`,
        details: { fromNodeId },
      };
    }

    if (!toNode) {
      return {
        type: "missing_node",
        message: `Target node "${toNodeId}" does not exist in graph`,
        details: { toNodeId },
      };
    }

    const fromPin = fromNode.outputs[fromPinId];
    if (!fromPin) {
      return {
        type: "invalid_connection",
        message: `Source node "${fromNodeId}" does not have output pin "${fromPinId}"`,
        nodeId: fromNodeId,
        details: { fromPinId, availableOutputs: Object.keys(fromNode.outputs) },
      };
    }

    const toPin = toNode.inputs[toPinId];
    if (!toPin) {
      return {
        type: "invalid_connection",
        message: `Target node "${toNodeId}" does not have input pin "${toPinId}"`,
        nodeId: toNodeId,
        details: { toPinId, availableInputs: Object.keys(toNode.inputs) },
      };
    }

    if (fromPin.type !== toPin.type) {
      return {
        type: "type_mismatch",
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
}
