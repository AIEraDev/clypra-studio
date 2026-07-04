import React from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { NodeRegistry } from "@clypra-studio/engine";
import type { StackNode } from "../types";
import { moveStackNode, removeStackNode } from "../stackUtils";

const NODE_GROUPS: { label: string; types: readonly string[] }[] = [
  { label: "Light", types: ["Brightness", "Contrast"] },
  { label: "Color", types: ["Saturation", "Temperature", "Tint", "HueRotate", "Sepia", "Grayscale"] },
  { label: "Style", types: ["Vignette", "GaussianBlur"] },
];

interface EffectStackEditorProps {
  stack: StackNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onStackChange: (stack: StackNode[]) => void;
  onAddNode: (type: string) => void;
}

export const EffectStackEditor: React.FC<EffectStackEditorProps> = ({
  stack,
  selectedNodeId,
  onSelectNode,
  onStackChange,
  onAddNode,
}) => {
  const registry = NodeRegistry.createDefault();

  const moveUp = (index: number) => {
    onStackChange(moveStackNode(stack, index, index - 1));
  };

  const moveDown = (index: number) => {
    onStackChange(moveStackNode(stack, index, index + 1));
  };

  const remove = (id: string) => {
    onStackChange(removeStackNode(stack, id));
    if (selectedNodeId === id) onSelectNode(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Effect Stack</label>
        <span className="text-[10px] text-gray-500">{stack.length} node{stack.length !== 1 ? "s" : ""}</span>
      </div>

      {stack.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#33334A] p-6 text-center text-xs text-gray-500">
          Add nodes to build your filter pipeline
        </div>
      ) : (
        <div className="space-y-2">
          {stack.map((node, index) => {
            const def = registry.getDefinition(node.type);
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`group rounded-lg border p-3 cursor-pointer transition-all ${
                  isSelected ? "bg-[#7C6FFF]/15 border-[#7C6FFF]" : "bg-[#1E1E24]/60 border-[#22222E] hover:border-[#3A3A4A]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical size={14} className="text-gray-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{def?.name ?? node.type}</div>
                    <div className="text-[10px] font-mono text-gray-500">{node.type}</div>
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveUp(index); }}
                      disabled={index === 0}
                      className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveDown(index); }}
                      disabled={index === stack.length - 1}
                      className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(node.id); }}
                    className="p-1 text-gray-500 hover:text-[#FF3366] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {NODE_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">{group.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {group.types.map((type) => {
                const def = registry.getDefinition(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAddNode(type)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#1E1E24] border border-[#33334A] text-gray-300 hover:text-white hover:border-[#7C6FFF]/50 transition-colors"
                  >
                    <Plus size={11} />
                    {def?.name ?? type}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
