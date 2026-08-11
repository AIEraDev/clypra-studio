import React from "react";
import { Box, Type, Square, List, Eye, EyeOff, Trash2, GripVertical, ChevronRight, Folder } from "lucide-react";
import type { OverlayDocument, SceneNode, DocumentCommand } from "@clypra-studio/engine";

const NODE_TYPE_ICON: Record<string, React.ReactNode> = {
  component: <Box size={12} className="text-violet-400" />,
  text:      <Type size={12} className="text-emerald-400" />,
  shape:     <Square size={12} className="text-amber-400" />,
  frame:     <Folder size={12} className="text-indigo-400" />,
  repeater:  <List size={12} className="text-sky-400" />,
  media:     <Box size={12} className="text-pink-400" />,
};

interface LayersPanelProps {
  doc: OverlayDocument;
  selectedNodeIds: string[];
  onSelectNodeIds: (ids: string[]) => void;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

export function LayersPanel({ doc, selectedNodeIds, onSelectNodeIds, onExecuteCommand }: LayersPanelProps) {
  if (doc.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-10 w-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
          <List size={18} className="text-gray-600" />
        </div>
        <p className="text-[11px] font-semibold text-gray-500">No layers yet</p>
        <p className="text-[10px] text-gray-700 mt-1">Insert a primitive or component to get started</p>
      </div>
    );
  }

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      if (selectedNodeIds.includes(nodeId)) {
        onSelectNodeIds(selectedNodeIds.filter((id) => id !== nodeId));
      } else {
        onSelectNodeIds([...selectedNodeIds, nodeId]);
      }
    } else {
      onSelectNodeIds([nodeId]);
    }
  };

  const renderNodeRow = (node: SceneNode, depth = 0): React.ReactNode => {
    const isSelected = selectedNodeIds.includes(node.id);
    const hasChildren = "children" in node && Array.isArray(node.children) && node.children.length > 0;

    return (
      <React.Fragment key={node.id}>
        <div
          className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
            isSelected
              ? "bg-violet-500/15 border border-violet-500/30 text-white font-semibold"
              : "border border-transparent text-gray-400 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.05]"
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={(e) => handleNodeClick(e, node.id)}
        >
          {/* Drag Handle */}
          <GripVertical
            size={11}
            className="shrink-0 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          />

          {/* Type Icon */}
          <span className="shrink-0">
            {NODE_TYPE_ICON[node.type] ?? <Box size={12} className="text-gray-500" />}
          </span>

          {/* Name */}
          <span className="flex-1 text-[12px] font-medium truncate min-w-0">
            {node.name || node.id}
          </span>

          {/* Eye Toggle & Delete */}
          <div className={`flex items-center gap-0.5 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <button
              type="button"
              title="Toggle visibility"
              onClick={(e) => {
                e.stopPropagation();
                onExecuteCommand({
                  type: "UPDATE_NODE_PROPERTY",
                  nodeId: node.id,
                  path: "visible",
                  value: (node as any).visible === false ? true : false
                });
              }}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              {(node as any).visible === false ? <EyeOff size={10} /> : <Eye size={10} />}
            </button>
            <button
              type="button"
              title="Delete layer"
              onClick={(e) => {
                e.stopPropagation();
                onExecuteCommand({ type: "DELETE_NODE", nodeId: node.id });
                onSelectNodeIds(selectedNodeIds.filter((id) => id !== node.id));
              }}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>

        {/* Render nested children if present */}
        {hasChildren && node.children.map((child) => renderNodeRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  // Topmost nodes first
  const reversed = [...doc.nodes].reverse();

  return (
    <div className="flex flex-col gap-0.5">
      {reversed.map((node) => renderNodeRow(node, 0))}
    </div>
  );
}
