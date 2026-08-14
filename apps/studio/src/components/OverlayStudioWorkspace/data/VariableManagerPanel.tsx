import React, { useState } from "react";
import { Plus, Trash2, Database } from "lucide-react";
import type { OverlayDocument, DocumentCommand } from "@clypra-studio/engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VariableType = "string" | "number" | "boolean" | "color" | "array";

export interface VariableManagerPanelProps {
  doc: OverlayDocument;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_PILL_CLASSES: Record<VariableType, string> = {
  number: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  string: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  boolean: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  color: "bg-pink-500/20 text-pink-300 border border-pink-500/30",
  array: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
};

const VARIABLE_TYPES: VariableType[] = [
  "string",
  "number",
  "boolean",
  "color",
  "array",
];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
    {children}
  </span>
);

const baseInputCls =
  "bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 outline-none w-full";

// ---------------------------------------------------------------------------
// TypeBadge
// ---------------------------------------------------------------------------

const TypeBadge: React.FC<{ type: VariableType }> = ({ type }) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${TYPE_PILL_CLASSES[type]}`}
  >
    {type}
  </span>
);

// ---------------------------------------------------------------------------
// VariableRow
// ---------------------------------------------------------------------------

interface VariableRowProps {
  variable: {
    key: string;
    label: string;
    dataType: VariableType;
    defaultValue: any;
  };
  onUpdate: (key: string, patch: Record<string, any>) => void;
  onDelete: (key: string) => void;
}

const VariableRow: React.FC<VariableRowProps> = ({
  variable,
  onUpdate,
  onDelete,
}) => {
  const [arrayError, setArrayError] = useState<string | null>(null);

  const handleArrayChange = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      setArrayError(null);
      onUpdate(variable.key, { defaultValue: parsed });
    } catch {
      setArrayError("Invalid JSON");
    }
  };

  return (
    <div className="group bg-[#151519] border border-white/6 rounded-xl p-3 flex items-start gap-3">
      {/* Left: type badge */}
      <div className="pt-1 shrink-0">
        <TypeBadge type={variable.dataType} />
      </div>

      {/* Center: label + key */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <input
          className={baseInputCls}
          value={variable.label}
          onChange={(e) => onUpdate(variable.key, { label: e.target.value })}
          placeholder="Label"
          aria-label="Variable label"
        />
        <span className="text-[11px] font-mono text-violet-400 truncate">
          {`{{${variable.key}}}`}
        </span>
      </div>

      {/* Right: default value + delete */}
      <div className="flex flex-col gap-1.5 shrink-0 w-[120px]">
        {variable.dataType === "array" ? (
          <div className="flex flex-col gap-1">
            <textarea
              className={`${baseInputCls} resize-none h-[56px]`}
              defaultValue={JSON.stringify(variable.defaultValue ?? [])}
              onChange={(e) => handleArrayChange(e.target.value)}
              placeholder="[]"
              aria-label="Default value (JSON array)"
            />
            {arrayError && (
              <span className="text-[10px] text-red-400">{arrayError}</span>
            )}
          </div>
        ) : variable.dataType === "boolean" ? (
          <select
            className={baseInputCls}
            value={String(variable.defaultValue)}
            onChange={(e) =>
              onUpdate(variable.key, {
                defaultValue: e.target.value === "true",
              })
            }
            aria-label="Default value"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : variable.dataType === "color" ? (
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              className="w-7 h-7 rounded cursor-pointer border border-white/6 bg-[#1C1C22]"
              value={variable.defaultValue ?? "#000000"}
              onChange={(e) =>
                onUpdate(variable.key, { defaultValue: e.target.value })
              }
              aria-label="Default color"
            />
            <input
              className={`${baseInputCls} flex-1`}
              value={variable.defaultValue ?? ""}
              onChange={(e) =>
                onUpdate(variable.key, { defaultValue: e.target.value })
              }
              placeholder="#000000"
              aria-label="Default color hex"
            />
          </div>
        ) : (
          <input
            className={baseInputCls}
            type={variable.dataType === "number" ? "number" : "text"}
            value={variable.defaultValue ?? ""}
            onChange={(e) =>
              onUpdate(variable.key, {
                defaultValue:
                  variable.dataType === "number"
                    ? Number(e.target.value)
                    : e.target.value,
              })
            }
            placeholder="Default"
            aria-label="Default value"
          />
        )}

        {/* Trash — visible on group hover */}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer self-end flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-red-500/10"
          onClick={() => onDelete(variable.key)}
          aria-label={`Delete variable ${variable.label}`}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AddVariableForm
// ---------------------------------------------------------------------------

interface AddVariableFormProps {
  onAdd: (
    key: string,
    dataType: VariableType,
    defaultValue: any,
    label: string,
  ) => void;
  onCancel: () => void;
}

const AddVariableForm: React.FC<AddVariableFormProps> = ({
  onAdd,
  onCancel,
}) => {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [dataType, setDataType] = useState<VariableType>("string");
  const [defaultValue, setDefaultValue] = useState("");

  const handleAdd = () => {
    if (!key.trim()) return;
    let parsed: any = defaultValue;
    if (dataType === "number") parsed = Number(defaultValue) || 0;
    if (dataType === "boolean") parsed = defaultValue === "true";
    if (dataType === "array") {
      try {
        parsed = JSON.parse(defaultValue || "[]");
      } catch {
        parsed = [];
      }
    }
    onAdd(key.trim(), dataType, parsed, label.trim() || key.trim());
  };

  return (
    <div className="bg-[#151519] border border-violet-500/30 rounded-xl p-3 flex flex-col gap-2.5">
      <SectionLabel>New Variable</SectionLabel>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500">Key</span>
          <input
            className={baseInputCls}
            value={key}
            onChange={(e) => setKey(e.target.value.replace(/\s/g, "_"))}
            placeholder="my_variable"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500">Label</span>
          <input
            className={baseInputCls}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My Variable"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500">Type</span>
          <select
            className={baseInputCls}
            value={dataType}
            onChange={(e) => setDataType(e.target.value as VariableType)}
          >
            {VARIABLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500">Default Value</span>
          {dataType === "boolean" ? (
            <select
              className={baseInputCls}
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          ) : (
            <input
              className={baseInputCls}
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder={
                dataType === "array"
                  ? "[]"
                  : dataType === "color"
                  ? "#000000"
                  : ""
              }
            />
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          className="flex-1 cursor-pointer text-[12px] py-1.5 rounded-lg border border-white/6 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="flex-1 cursor-pointer text-[12px] py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors disabled:opacity-40"
          onClick={handleAdd}
          disabled={!key.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// VariableManagerPanel
// ---------------------------------------------------------------------------

const VariableManagerPanel: React.FC<VariableManagerPanelProps> = ({
  doc,
  onExecuteCommand,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const variables: Array<{
    key: string;
    label: string;
    dataType: VariableType;
    defaultValue: any;
  }> = (doc.variables as any) ?? [];

  const handleAdd = (
    key: string,
    dataType: VariableType,
    defaultValue: any,
    label: string,
  ) => {
    onExecuteCommand({
      type: "ADD_VARIABLE",
      key,
      dataType,
      defaultValue,
      label,
    } as any);
    setShowAddForm(false);
  };

  const handleUpdate = (key: string, patch: Record<string, any>) => {
    onExecuteCommand({ type: "UPDATE_VARIABLE", key, patch } as any);
  };

  const handleDelete = (key: string) => {
    onExecuteCommand({ type: "REMOVE_VARIABLE", key } as any);
  };

  return (
    <div className="flex flex-col gap-0 h-full overflow-hidden bg-[#0F0F14]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
        <SectionLabel>Variables</SectionLabel>
        {!showAddForm && (
          <button
            className="cursor-pointer flex items-center gap-1 text-[11px] font-medium bg-violet-600 hover:bg-violet-500 text-white px-2.5 py-1 rounded-full transition-colors"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={11} />
            Add
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {variables.length === 0 && !showAddForm ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#151519] border border-white/6 flex items-center justify-center">
              <Database size={18} className="text-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-gray-400 font-medium">
                No variables yet.
              </span>
              <span className="text-[11px] text-gray-600 max-w-[200px]">
                Add a variable to make this overlay data-driven.
              </span>
            </div>
          </div>
        ) : (
          variables.map((v) => (
            <VariableRow
              key={v.key}
              variable={v}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* Inline add form */}
        {showAddForm && (
          <AddVariableForm
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export { VariableManagerPanel };
export default VariableManagerPanel;
