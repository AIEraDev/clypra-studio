import React from "react";
import {
  componentRegistry,
  type ComponentNode,
  type DocumentCommand,
} from "@clypra-studio/engine";
import { Box, Layers, Scissors, Edit3 } from "lucide-react";

interface ComponentHeaderBarProps {
  node: ComponentNode;
  onExecuteCommand: (cmd: DocumentCommand) => void;
  onEditTemplate?: (nodeId: string) => void;
}

export function ComponentHeaderBar({
  node,
  onExecuteCommand,
  onEditTemplate,
}: ComponentHeaderBarProps) {
  const def = componentRegistry.get(node.componentType);

  const handleVariantChange = (variant: string) => {
    onExecuteCommand({
      type: "UPDATE_NODE_PROPERTY",
      nodeId: node.id,
      path: "variant",
      value: variant,
    });
  };

  const handleDetach = () => {
    onExecuteCommand({
      type: "DETACH_COMPONENT",
      nodeId: node.id,
    });
  };

  return (
    <div className="bg-[#151519] border-b border-white/6 p-3 space-y-2.5 font-sans">
      {/* Title & Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-violet-500/20 text-violet-300">
            <Box size={13} />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-white leading-none">
              {node.name || def?.name || node.componentType}
            </h4>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
              {node.componentType}
            </span>
          </div>
        </div>

        {/* Variant Selector */}
        {def?.variants && def.variants.length > 0 && (
          <select
            value={node.variant || def.variants[0]}
            onChange={(e) => handleVariantChange(e.target.value)}
            className="bg-[#1C1C22] border border-white/[0.08] rounded px-2 py-0.5 text-[10px] text-violet-200 font-medium outline-none cursor-pointer"
          >
            {def.variants.map((v) => (
              <option key={v} value={v}>
                {def.variantLabels?.[v] || v}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Action Buttons: Edit Template & Detach */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEditTemplate?.(node.id)}
          className="flex-1 flex items-center justify-center gap-1.5 h-6 rounded bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-[10px] font-bold transition-all cursor-pointer"
        >
          <Edit3 size={11} />
          <span>Edit Template</span>
        </button>
        <button
          type="button"
          onClick={handleDetach}
          className="flex items-center justify-center gap-1 h-6 px-2.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/6 text-gray-400 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
          title="Detach instance into plain scene nodes"
        >
          <Scissors size={11} />
          <span>Detach</span>
        </button>
      </div>
    </div>
  );
}
