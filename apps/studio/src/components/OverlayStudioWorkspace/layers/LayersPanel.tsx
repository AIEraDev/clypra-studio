import React, { useState, useRef } from "react";
import {
  Box,
  Type,
  Square,
  List,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Folder,
} from "lucide-react";
import type { OverlayDocument, SceneNode, DocumentCommand } from "@clypra-studio/engine";

const NODE_TYPE_ICON: Record<string, React.ReactNode> = {
  component: <Box size={12} className="text-violet-400" />,
  text:      <Type size={12} className="text-emerald-400" />,
  shape:     <Square size={12} className="text-amber-400" />,
  frame:     <Folder size={12} className="text-indigo-400" />,
  repeater:  <List size={12} className="text-sky-400" />,
  media:     <Box size={12} className="text-pink-400" />,
  line:      <Box size={12} className="text-red-400" />,
};

interface LayersPanelProps {
  doc: OverlayDocument;
  selectedNodeIds: string[];
  onSelectNodeIds: (ids: string[]) => void;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

export function LayersPanel({ doc, selectedNodeIds, onSelectNodeIds, onExecuteCommand }: LayersPanelProps) {
  const [dropTarget, setDropTarget] = useState<{
    nodeId: string;
    position: "before" | "after" | "inside";
  } | null>(null);

  const draggedNodeRef = useRef<{ id: string; parentId?: string } | null>(null);

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

  const findNodeList = (parentId?: string): SceneNode[] => {
    if (!parentId) return doc.nodes;
    const findInTree = (nodes: SceneNode[]): SceneNode[] | null => {
      for (const n of nodes) {
        if (n.id === parentId && "children" in n && Array.isArray((n as any).children)) {
          return (n as any).children;
        }
        if ("children" in n && Array.isArray((n as any).children)) {
          const res = findInTree((n as any).children);
          if (res) return res;
        }
      }
      return null;
    };
    return findInTree(doc.nodes) || doc.nodes;
  };

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

  const moveNode = (nodeId: string, parentId: string | undefined, direction: "up" | "down") => {
    const list = findNodeList(parentId);
    const srcIdx = list.findIndex((n) => n.id === nodeId);
    if (srcIdx === -1) return;

    // Visual list is rendered top-to-bottom as reversed (topmost z-index first) or natural for flex
    // "up" moves visually upward (towards index +1 in rendering or index - 1)
    const destIdx = direction === "up" ? Math.min(list.length - 1, srcIdx + 1) : Math.max(0, srcIdx - 1);
    if (destIdx !== srcIdx) {
      onExecuteCommand({
        type: "REORDER_NODES",
        sourceIndex: srcIdx,
        destinationIndex: destIdx,
        parentId,
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, node: SceneNode, parentId?: string) => {
    e.stopPropagation();
    draggedNodeRef.current = { id: node.id, parentId };
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, node: SceneNode, parentId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNodeRef.current || draggedNodeRef.current.id === node.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const height = rect.height;

    let position: "before" | "after" | "inside";
    if (node.type === "frame" && relY > height * 0.25 && relY < height * 0.75) {
      position = "inside";
    } else if (relY < height * 0.5) {
      position = "before";
    } else {
      position = "after";
    }

    setDropTarget({ nodeId: node.id, position });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetNode: SceneNode, targetParentId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const src = draggedNodeRef.current;
    setDropTarget(null);
    if (!src || src.id === targetNode.id) return;

    const position = dropTarget?.position || "after";

    if (position === "inside" && targetNode.type === "frame") {
      onExecuteCommand({
        type: "REPARENT_NODE",
        nodeId: src.id,
        targetParentId: targetNode.id,
      });
      return;
    }

    if (src.parentId === targetParentId) {
      const list = findNodeList(targetParentId);
      const srcIdx = list.findIndex((n) => n.id === src.id);
      const targetIdx = list.findIndex((n) => n.id === targetNode.id);
      if (srcIdx === -1 || targetIdx === -1) return;

      let destIdx = targetIdx;
      if (position === "after") {
        destIdx = srcIdx < targetIdx ? targetIdx : targetIdx + 1;
      } else {
        destIdx = srcIdx < targetIdx ? targetIdx - 1 : targetIdx;
      }
      destIdx = Math.max(0, Math.min(list.length - 1, destIdx));

      if (destIdx !== srcIdx) {
        onExecuteCommand({
          type: "REORDER_NODES",
          sourceIndex: srcIdx,
          destinationIndex: destIdx,
          parentId: targetParentId,
        });
      }
    } else {
      const targetList = findNodeList(targetParentId);
      const targetIdx = targetList.findIndex((n) => n.id === targetNode.id);
      const destIdx = position === "after" ? targetIdx + 1 : targetIdx;
      onExecuteCommand({
        type: "REPARENT_NODE",
        nodeId: src.id,
        targetParentId,
      });
    }
  };

  const renderNodeRow = (node: SceneNode, depth = 0, parentId?: string): React.ReactNode => {
    const isSelected = selectedNodeIds.includes(node.id);
    const hasChildren = "children" in node && Array.isArray(node.children) && node.children.length > 0;
    const isDrop = dropTarget?.nodeId === node.id;

    let dropClasses = "";
    if (isDrop) {
      if (dropTarget.position === "before") {
        dropClasses = "border-t-2 border-t-violet-500";
      } else if (dropTarget.position === "after") {
        dropClasses = "border-b-2 border-b-violet-500";
      } else if (dropTarget.position === "inside") {
        dropClasses = "bg-violet-500/20 border-2 border-dashed border-violet-400";
      }
    }

    return (
      <React.Fragment key={node.id}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node, parentId)}
          onDragOver={(e) => handleDragOver(e, node, parentId)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node, parentId)}
          className={`group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all select-none ${
            isSelected
              ? "bg-violet-500/15 border border-violet-500/30 text-white font-semibold"
              : "border border-transparent text-gray-400 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.05]"
          } ${dropClasses}`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={(e) => handleNodeClick(e, node.id)}
        >
          {/* Drag Handle */}
          <GripVertical
            size={12}
            className="shrink-0 text-gray-600 opacity-60 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          />

          {/* Type Icon */}
          <span className="shrink-0">
            {NODE_TYPE_ICON[node.type] ?? <Box size={12} className="text-gray-500" />}
          </span>

          {/* Name */}
          <span className="flex-1 text-[12px] font-medium truncate min-w-0">
            {node.name || node.id}
          </span>

          {/* Reorder Buttons (Move Up / Move Down) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              title="Move layer up"
              onClick={(e) => {
                e.stopPropagation();
                moveNode(node.id, parentId, "up");
              }}
              className="flex h-4 w-4 items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronUp size={11} />
            </button>
            <button
              type="button"
              title="Move layer down"
              onClick={(e) => {
                e.stopPropagation();
                moveNode(node.id, parentId, "down");
              }}
              className="flex h-4 w-4 items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronDown size={11} />
            </button>
          </div>

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
        {hasChildren && node.children.map((child) => renderNodeRow(child, depth + 1, node.id))}
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
