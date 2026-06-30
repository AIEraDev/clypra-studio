/**
 * GraphInspector Component
 *
 * Visualizes the media processing graph structure.
 * Shows nodes, edges, capabilities, and dependencies.
 */

import React from "react";
import type { MediaProcessingGraph, GraphNode } from "@clypra/runtime/graph";

export interface GraphInspectorProps {
  graph: MediaProcessingGraph;
  selectedNodeId?: string;
  onNodeSelect?: (nodeId: string) => void;
}

export const GraphInspector: React.FC<GraphInspectorProps> = ({ graph, selectedNodeId, onNodeSelect }) => {
  return (
    <div className="graph-inspector" style={{ padding: "16px", fontFamily: "monospace" }}>
      <div style={{ marginBottom: "16px", fontWeight: "bold", fontSize: "14px" }}>Graph Inspector</div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>Graph ID: {graph.id}</div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Nodes: {graph.nodes.length} | Edges: {graph.edges.length}
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Nodes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {graph.nodes.map((node) => (
            <NodeItem key={node.id} node={node} selected={node.id === selectedNodeId} onClick={() => onNodeSelect?.(node.id)} />
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Edges</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {graph.edges.map((edge, idx) => (
            <div
              key={idx}
              style={{
                fontSize: "11px",
                color: "#555",
                padding: "4px 8px",
                backgroundColor: "#f8f8f8",
                borderRadius: "4px",
              }}
            >
              {edge.fromNodeId}.{edge.fromPinId} → {edge.toNodeId}.{edge.toPinId}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface NodeItemProps {
  node: GraphNode;
  selected: boolean;
  onClick: () => void;
}

const NodeItem: React.FC<NodeItemProps> = ({ node, selected, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px",
        backgroundColor: selected ? "#e3f2fd" : "#fafafa",
        border: selected ? "1px solid #2196f3" : "1px solid #e0e0e0",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
      }}
    >
      <div style={{ fontWeight: "600", marginBottom: "4px" }}>
        {node.id} <span style={{ color: "#666", fontWeight: "normal" }}>({node.type})</span>
      </div>
      <div style={{ fontSize: "11px", color: "#777" }}>
        Inputs: {Object.keys(node.inputs).length} | Outputs: {Object.keys(node.outputs).length}
      </div>
      {node.capabilities.temporal && <div style={{ fontSize: "10px", color: "#f57c00", marginTop: "4px" }}>⏱ Temporal</div>}
      {node.capabilities.stateful && <div style={{ fontSize: "10px", color: "#7b1fa2", marginTop: "2px" }}>💾 Stateful</div>}
      {node.requirements.multipass && <div style={{ fontSize: "10px", color: "#d32f2f", marginTop: "2px" }}>🔄 Multi-pass</div>}
    </div>
  );
};
