/**
 * @clypra/runtime — Graph Validator
 *
 * Validates media processing graphs for correctness.
 * Checks for cycles, type mismatches, missing connections, etc.
 */

import type { MediaProcessingGraph, GraphNode, GraphEdge } from "./types";
import { GraphHelper } from "./types";

export interface ValidationError {
  type: "cycle" | "type-mismatch" | "missing-connection" | "invalid-node";
  message: string;
  nodeId?: string;
  edgeFrom?: string;
  edgeTo?: string;
}

export interface GraphValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationWarning {
  type: "performance" | "compatibility" | "best-practice";
  message: string;
  severity: "low" | "medium" | "high";
  nodeId?: string;
}

/**
 * GraphValidator - Validates graph structure and semantics
 */
export class GraphValidator {
  /**
   * Validate a media processing graph
   */
  validate(graph: MediaProcessingGraph): GraphValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for cycles
    if (GraphHelper.hasCycles(graph)) {
      errors.push({
        type: "cycle",
        message: "Graph contains cycles",
      });
    }

    // Validate each node
    for (const node of graph.nodes) {
      const nodeErrors = this.validateNode(graph, node);
      errors.push(...nodeErrors);

      const nodeWarnings = this.generateWarnings(graph, node);
      warnings.push(...nodeWarnings);
    }

    // Validate each edge
    for (const edge of graph.edges) {
      const edgeErrors = this.validateEdge(graph, edge);
      errors.push(...edgeErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single node
   */
  private validateNode(graph: MediaProcessingGraph, node: GraphNode): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if node type is valid
    if (!node.type) {
      errors.push({
        type: "invalid-node",
        message: `Node ${node.id} has no type`,
        nodeId: node.id,
      });
    }

    // Check if required inputs are connected
    const inputKeys = Object.keys(node.inputs);
    const incomingEdges = GraphHelper.getIncomingEdges(graph, node.id);

    for (const inputKey of inputKeys) {
      const hasConnection = incomingEdges.some((edge) => edge.toPinId === inputKey);
      if (!hasConnection && node.type !== "MediaInput") {
        errors.push({
          type: "missing-connection",
          message: `Node ${node.id} input '${inputKey}' is not connected`,
          nodeId: node.id,
        });
      }
    }

    return errors;
  }

  /**
   * Validate a single edge
   */
  private validateEdge(graph: MediaProcessingGraph, edge: GraphEdge): ValidationError[] {
    const errors: ValidationError[] = [];

    const fromNode = GraphHelper.findNode(graph, edge.fromNodeId);
    const toNode = GraphHelper.findNode(graph, edge.toNodeId);

    if (!fromNode) {
      errors.push({
        type: "invalid-node",
        message: `Edge references non-existent source node: ${edge.fromNodeId}`,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
      });
      return errors;
    }

    if (!toNode) {
      errors.push({
        type: "invalid-node",
        message: `Edge references non-existent target node: ${edge.toNodeId}`,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
      });
      return errors;
    }

    // Check if pins exist
    const fromPin = fromNode.outputs[edge.fromPinId];
    const toPin = toNode.inputs[edge.toPinId];

    if (!fromPin) {
      errors.push({
        type: "missing-connection",
        message: `Source node ${edge.fromNodeId} has no output pin '${edge.fromPinId}'`,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
      });
    }

    if (!toPin) {
      errors.push({
        type: "missing-connection",
        message: `Target node ${edge.toNodeId} has no input pin '${edge.toPinId}'`,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
      });
    }

    // Check type compatibility
    if (fromPin && toPin && fromPin.type !== toPin.type) {
      errors.push({
        type: "type-mismatch",
        message: `Type mismatch: ${edge.fromNodeId}.${edge.fromPinId} (${fromPin.type}) → ${edge.toNodeId}.${edge.toPinId} (${toPin.type})`,
        edgeFrom: edge.fromNodeId,
        edgeTo: edge.toNodeId,
      });
    }

    return errors;
  }

  /**
   * Generate performance and best-practice warnings
   */
  private generateWarnings(graph: MediaProcessingGraph, node: GraphNode): ValidationWarning[] {
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
}
