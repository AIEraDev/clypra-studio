import React, { useState, useRef } from 'react';
import type { OverlayDocument } from '@clypra-studio/engine';

// Gracefully fall back if dataBindingEngine is not yet exported from the engine
let evaluateExpression: (expr: string, ctx: Record<string, any>) => any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const engine = require('@clypra-studio/engine');
  evaluateExpression = engine.dataBindingEngine?.evaluate ?? fallbackEval;
} catch {
  evaluateExpression = fallbackEval;
}

function fallbackEval(expr: string, ctx: Record<string, any>): any {
  try {
    // Simple template {{key}} substitution
    return expr.replace(/\{\{([^}]+)\}\}/g, (_: string, k: string) => {
      const trimmed = k.trim();
      return ctx[trimmed] !== undefined ? String(ctx[trimmed]) : `{{${trimmed}}}`;
    });
  } catch {
    return expr;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BindingEditorProps {
  fieldKey: string;
  value: any;
  doc: OverlayDocument;
  previewContext?: Record<string, any>;
  staticInput: React.ReactNode;
  onChange: (val: any) => void;
}

type BindingMode = 'static' | 'dynamic';

interface DocumentVariable {
  key: string;
  label: string;
  dataType: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseInputCls =
  'bg-[#1C1C22] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 outline-none w-full';

const EXAMPLE_CHIPS = [
  "{{ revenue / 1000000 }}",
  "{{ growth > 0 ? '▲' : '▼' }}",
  "{{ name + ' ' + title }}",
];

// ---------------------------------------------------------------------------
// BindingEditor
// ---------------------------------------------------------------------------

const BindingEditor: React.FC<BindingEditorProps> = ({
  fieldKey,
  value,
  doc,
  previewContext = {},
  staticInput,
  onChange,
}) => {
  const variables: DocumentVariable[] = (doc.variables as any) ?? [];

  // Detect initial mode: if value is a string containing {{ it's dynamic
  const initialMode: BindingMode =
    typeof value === 'string' && /\{\{.+?\}\}/.test(value) ? 'dynamic' : 'static';

  const [mode, setMode] = useState<BindingMode>(initialMode);
  const [expr, setExpr] = useState<string>(
    initialMode === 'dynamic' ? String(value ?? '') : `{{${fieldKey}}}`
  );
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live preview
  let preview: React.ReactNode = null;
  if (mode === 'dynamic') {
    try {
      const result = evaluateExpression(expr, previewContext);
      preview = (
        <span className="text-[10px] text-emerald-400 font-mono truncate max-w-full block">
          ▶ {String(result)}
        </span>
      );
    } catch (err: any) {
      preview = (
        <span className="text-[10px] text-red-400 font-mono truncate max-w-full block">
          ✕ {err?.message ?? 'Error'}
        </span>
      );
    }
  }

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setExpr((prev) => prev + text);
      return;
    }
    const start = ta.selectionStart ?? expr.length;
    const end = ta.selectionEnd ?? expr.length;
    const next = expr.slice(0, start) + text + expr.slice(end);
    setExpr(next);
    onChange(next);
    // Restore cursor after re-render
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
    });
  };

  const handleModeSwitch = (next: BindingMode) => {
    if (next === mode) return;
    setMode(next);
    if (next === 'static') {
      // Clear expression, revert to previous static value
      setExpr(`{{${fieldKey}}}`);
      onChange(typeof value === 'string' && !/\{\{/.test(value) ? value : '');
    } else {
      const newExpr = `{{${fieldKey}}}`;
      setExpr(newExpr);
      onChange(newExpr);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Mode toggle */}
      <div className="flex gap-0 rounded-lg overflow-hidden border border-white/[0.06] self-start">
        {(['static', 'dynamic'] as BindingMode[]).map((m) => (
          <button
            key={m}
            className={`cursor-pointer px-2.5 py-1 text-[11px] font-medium transition-colors capitalize ${
              mode === m
                ? 'bg-violet-600 text-white'
                : 'bg-[#1C1C22] text-gray-400 hover:text-white'
            }`}
            onClick={() => handleModeSwitch(m)}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Static mode: render the passed staticInput */}
      {mode === 'static' && <div>{staticInput}</div>}

      {/* Dynamic mode */}
      {mode === 'dynamic' && (
        <div className="flex flex-col gap-2">
          {/* Variable picker */}
          {variables.length > 0 && (
            <select
              className={`${baseInputCls}`}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) insertAtCursor(`{{${e.target.value}}}`);
                e.target.value = '';
              }}
            >
              <option value="" disabled>Insert variable…</option>
              {variables.map((v) => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </select>
          )}

          {/* Expression textarea */}
          <textarea
            ref={textareaRef}
            rows={3}
            className={`${baseInputCls} font-mono resize-none ${focused ? 'border-violet-500' : ''}`}
            value={expr}
            onChange={(e) => {
              setExpr(e.target.value);
              onChange(e.target.value);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="{{value}} or {{ value * 100 }}"
          />

          {/* Live preview */}
          {preview && (
            <div className="bg-[#151519] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
              {preview}
            </div>
          )}

          {/* Example chips */}
          <div className="flex flex-wrap gap-1">
            {EXAMPLE_CHIPS.map((chip) => (
              <button
                key={chip}
                className="cursor-pointer text-[10px] font-mono bg-[#1C1C22] border border-white/[0.06] rounded px-1.5 py-0.5 text-violet-300 hover:border-violet-500/50 transition-colors"
                onClick={() => insertAtCursor(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { BindingEditor };
export default BindingEditor;

