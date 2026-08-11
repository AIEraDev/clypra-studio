import React, { useState, useEffect } from 'react';
import { Play, Save, ChevronDown } from 'lucide-react';
import type { OverlayDocument, DocumentCommand } from '@clypra-studio/engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataPreviewPanelProps {
  doc: OverlayDocument;
  onApplyPreview: (values: Record<string, any>) => void;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

type VariableType = 'string' | 'number' | 'boolean' | 'color' | 'array';

interface DocumentVariable {
  key: string;
  label: string;
  dataType: VariableType;
  defaultValue: any;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
    {children}
  </span>
);

const baseInputCls =
  'bg-[#1C1C22] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 outline-none w-full';

const TYPE_PILL_CLASSES: Record<VariableType, string> = {
  number: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  string: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  boolean: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  color: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  array: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
};

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function buildDefaults(variables: DocumentVariable[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const v of variables) {
    out[v.key] = v.defaultValue ?? '';
  }
  return out;
}

// ---------------------------------------------------------------------------
// PreviewValueInput
// ---------------------------------------------------------------------------

interface PreviewValueInputProps {
  variable: DocumentVariable;
  value: any;
  onChange: (key: string, value: any) => void;
}

const PreviewValueInput: React.FC<PreviewValueInputProps> = ({ variable, value, onChange }) => {
  if (variable.dataType === 'array') {
    return (
      <textarea
        className={`${baseInputCls} resize-none h-[56px] font-mono`}
        value={typeof value === 'string' ? value : JSON.stringify(value ?? [])}
        onChange={(e) => {
          try { onChange(variable.key, JSON.parse(e.target.value)); }
          catch { onChange(variable.key, e.target.value); }
        }}
        placeholder="[]"
      />
    );
  }
  if (variable.dataType === 'boolean') {
    return (
      <select
        className={baseInputCls}
        value={String(value)}
        onChange={(e) => onChange(variable.key, e.target.value === 'true')}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  if (variable.dataType === 'color') {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          className="w-7 h-7 rounded cursor-pointer border border-white/[0.06] bg-[#1C1C22]"
          value={value ?? '#000000'}
          onChange={(e) => onChange(variable.key, e.target.value)}
        />
        <input
          className={`${baseInputCls} flex-1`}
          value={value ?? ''}
          onChange={(e) => onChange(variable.key, e.target.value)}
          placeholder="#000000"
        />
      </div>
    );
  }
  return (
    <input
      className={baseInputCls}
      type={variable.dataType === 'number' ? 'number' : 'text'}
      value={value ?? ''}
      onChange={(e) =>
        onChange(variable.key, variable.dataType === 'number' ? Number(e.target.value) : e.target.value)
      }
    />
  );
};

// ---------------------------------------------------------------------------
// DataPreviewPanel
// ---------------------------------------------------------------------------

const DataPreviewPanel: React.FC<DataPreviewPanelProps> = ({
  doc,
  onApplyPreview,
  onExecuteCommand,
}) => {
  const variables: DocumentVariable[] = (doc.variables as any) ?? [];
  const previewSets: Array<{ id: string; label: string; values: Record<string, any> }> =
    (doc.dataPreviewSets as any) ?? [];

  const [selectedPreset, setSelectedPreset] = useState<string>('__default__');
  const [previewValues, setPreviewValues] = useState<Record<string, any>>(buildDefaults(variables));
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');

  // When preset selector changes, load that preset's values
  useEffect(() => {
    if (selectedPreset === '__default__') {
      setPreviewValues(buildDefaults(variables));
    } else {
      const found = previewSets.find((s) => s.id === selectedPreset);
      if (found) setPreviewValues({ ...buildDefaults(variables), ...found.values });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset]);

  const handleValueChange = (key: string, value: any) => {
    setPreviewValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    onExecuteCommand({
      type: 'ADD_DATA_PREVIEW_SET',
      set: { id: nanoid(), label: presetName.trim(), values: previewValues },
    } as any);
    setPresetName('');
    setShowSaveForm(false);
  };

  if (variables.length === 0) {
    return (
      <div className="flex flex-col gap-0 h-full overflow-hidden bg-[#0F0F14]">
        <div className="flex items-center px-4 py-3 border-b border-white/[0.06] shrink-0">
          <SectionLabel>Data Preview</SectionLabel>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 py-12">
          <Play size={18} className="text-gray-600" />
          <span className="text-[12px] text-gray-500">
            Add variables first to preview live data.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 h-full overflow-hidden bg-[#0F0F14]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <SectionLabel>Data Preview</SectionLabel>
        {/* Dataset selector */}
        <div className="relative flex items-center">
          <select
            className="appearance-none bg-[#1C1C22] border border-white/[0.06] rounded-lg pl-2.5 pr-6 py-1 text-[11px] text-white focus:border-violet-500 outline-none cursor-pointer"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            <option value="__default__">Default</option>
            {previewSets.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-1.5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Variable rows */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {variables.map((v) => (
          <div
            key={v.key}
            className="bg-[#151519] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-gray-200">{v.label}</span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${TYPE_PILL_CLASSES[v.dataType]}`}
              >
                {v.dataType}
              </span>
            </div>
            <PreviewValueInput
              variable={v}
              value={previewValues[v.key]}
              onChange={handleValueChange}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-3 border-t border-white/[0.06] flex flex-col gap-2">
        <button
          className="cursor-pointer w-full text-[12px] py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors flex items-center justify-center gap-1.5"
          onClick={() => onApplyPreview(previewValues)}
        >
          <Play size={12} />
          Apply Preview
        </button>

        {showSaveForm ? (
          <div className="flex gap-2">
            <input
              className={`${baseInputCls} flex-1`}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
            />
            <button
              className="cursor-pointer text-[12px] px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40"
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
            >
              Save
            </button>
            <button
              className="cursor-pointer text-[12px] px-2 py-1.5 rounded-lg border border-white/[0.06] text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowSaveForm(false)}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            className="cursor-pointer w-full text-[12px] py-1.5 rounded-lg border border-white/[0.06] text-gray-400 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-1.5"
            onClick={() => setShowSaveForm(true)}
          >
            <Save size={12} />
            Save as Preset
          </button>
        )}
      </div>
    </div>
  );
};

export { DataPreviewPanel };
export default DataPreviewPanel;

