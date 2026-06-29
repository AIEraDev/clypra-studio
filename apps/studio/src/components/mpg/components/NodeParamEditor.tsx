import React from "react";
import { NodeRegistry } from "@clypra/engine";
import type { StackNode } from "../types";

interface NodeParamEditorProps {
  node: StackNode | null;
  onParamsChange: (nodeId: string, params: Record<string, unknown>) => void;
}

export const NodeParamEditor: React.FC<NodeParamEditorProps> = ({ node, onParamsChange }) => {
  if (!node) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        Select a node in the stack to edit its parameters
      </div>
    );
  }

  const registry = NodeRegistry.createDefault();
  const def = registry.getDefinition(node.type);
  const schema = def?.paramSchema ?? {};
  const keys = Object.keys(schema);

  if (keys.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        <div className="font-medium text-white mb-1">{def?.name ?? node.type}</div>
        <p>No adjustable parameters for this node.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium text-white">{def?.name ?? node.type}</div>
        <div className="text-[10px] font-mono text-gray-500">{node.type}</div>
      </div>

      {keys.map((key) => {
        const field = schema[key];
        const value = Number(node.params[key] ?? field.default ?? 0);
        const min = field.min ?? 0;
        const max = field.max ?? 1;
        const step =
          key === "hueRotate"
            ? 0.05
            : Math.abs(max - min) > 10
              ? 0.5
              : 0.01;

        return (
          <div key={key} className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              <span className="text-white font-mono">{value.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onParamsChange(node.id, { [key]: parseFloat(e.target.value) })}
              className="w-full accent-[#7C6FFF]"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
