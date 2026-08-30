import React, { useState } from "react";
import { TemplateVariableDefinition, TemplateVariableType } from "@clypra-studio/engine";
import { Variable, Plus, Trash2, Tag, Play, Check } from "lucide-react";

interface TemplateVariableManagerProps {
  variables?: Record<string, TemplateVariableDefinition>;
  onChange: (variables: Record<string, TemplateVariableDefinition>) => void;
  onInsertVariable?: (varToken: string) => void;
  variableValues?: Record<string, any>;
  onVariableValueChange?: (key: string, val: any) => void;
}

export const TemplateVariableManager: React.FC<TemplateVariableManagerProps> = ({
  variables = {},
  onChange,
  onInsertVariable,
  variableValues = {},
  onVariableValueChange,
}) => {
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<TemplateVariableType>("string");
  const [newDefault, setNewDefault] = useState("");

  const variableList = Object.values(variables);

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    const sanitizedKey = newKey.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedKey) return;

    let parsedDefault: any = newDefault;
    if (newType === "number") parsedDefault = parseFloat(newDefault) || 0;
    if (newType === "boolean") parsedDefault = newDefault === "true";

    const updated = {
      ...variables,
      [sanitizedKey]: {
        key: sanitizedKey,
        label: newLabel.trim() || sanitizedKey,
        type: newType,
        defaultValue: parsedDefault,
      },
    };

    onChange(updated);
    setNewKey("");
    setNewLabel("");
    setNewDefault("");
  };

  const handleRemoveVariable = (key: string) => {
    const updated = { ...variables };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Variable className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-zinc-200">Dynamic Variables & Data Binding</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          {variableList.length} defined
        </span>
      </div>

      {/* List of existing variables */}
      {variableList.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {variableList.map((v) => {
            const currentValue = variableValues[v.key] ?? v.defaultValue;
            return (
              <div
                key={v.key}
                className="flex items-center justify-between gap-2 p-2 bg-zinc-950 rounded border border-zinc-800/80"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-200 truncate">{v.label}</span>
                    <span className="text-[9px] px-1 bg-zinc-800 text-zinc-400 rounded">
                      {v.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 truncate">
                    {`{{${v.key}}}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onInsertVariable && (
                    <button
                      type="button"
                      title="Insert {{token}} into selected text"
                      onClick={() => onInsertVariable(`{{${v.key}}}`)}
                      className="px-1.5 py-0.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-700/40 rounded text-[10px] transition-colors"
                    >
                      + Insert
                    </button>
                  )}

                  {onVariableValueChange && (
                    <input
                      type={v.type === "number" ? "number" : "text"}
                      value={currentValue ?? ""}
                      onChange={(e) => onVariableValueChange(v.key, e.target.value)}
                      placeholder="Live test"
                      className="w-20 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-100"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveVariable(v.key)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Variable Form */}
      <form onSubmit={handleAddVariable} className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
        <span className="text-[11px] font-medium text-zinc-400">Add New Variable</span>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="text"
            placeholder="Variable Key (e.g. title)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Label (e.g. Main Title)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as TemplateVariableType)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="string">Text (String)</option>
            <option value="number">Number</option>
            <option value="color">Color</option>
            <option value="boolean">Boolean</option>
          </select>
          <input
            type="text"
            placeholder="Default Value"
            value={newDefault}
            onChange={(e) => setNewDefault(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={!newKey.trim()}
          className="flex items-center justify-center gap-1 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors text-[11px]"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Variable
        </button>
      </form>
    </div>
  );
};
