import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { OverlayDocument } from '@clypra-studio/engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConditionalVisibilityControlProps {
  /** Current visibilityExpression — undefined means "Always Visible" */
  value?: string;
  doc: OverlayDocument;
  previewContext?: Record<string, any>;
  onChange: (expr: string | undefined) => void;
}

type VisibilityMode = 'always' | 'conditional';

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
  'growth > 0',
  'items.length > 3',
  "type == 'premium'",
];

function evalExpr(expr: string, ctx: Record<string, any>): boolean {
  try {
    // Build a simple evaluator using Function constructor for sandbox safety note
    const keys = Object.keys(ctx);
    const vals = Object.values(ctx);
    // eslint-disable-next-line no-new-func
    return Boolean(new Function(...keys, `return (${expr})`).apply(null, vals));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// ConditionalVisibilityControl
// ---------------------------------------------------------------------------

const ConditionalVisibilityControl: React.FC<ConditionalVisibilityControlProps> = ({
  value,
  doc,
  previewContext = {},
  onChange,
}) => {
  const variables: DocumentVariable[] = (doc.variables as any) ?? [];
  const mode: VisibilityMode = value !== undefined ? 'conditional' : 'always';
  const [expr, setExpr] = useState<string>(value ?? '');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleModeSwitch = (next: VisibilityMode) => {
    if (next === 'always') {
      onChange(undefined);
    } else {
      const initial = '';
      setExpr(initial);
      onChange(initial);
    }
  };

  const handleExprChange = (raw: string) => {
    setExpr(raw);
    onChange(raw);
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      const next = expr + text;
      setExpr(next);
      onChange(next);
      return;
    }
    const start = ta.selectionStart ?? expr.length;
    const end = ta.selectionEnd ?? expr.length;
    const next = expr.slice(0, start) + text + expr.slice(end);
    setExpr(next);
    onChange(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
    });
  };

  // Evaluate live badge
  let isVisible: boolean | null = null;
  if (mode === 'conditional' && expr.trim()) {
    try { isVisible = evalExpr(expr, previewContext); } catch { isVisible = null; }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Mode toggle */}
      <div className="flex gap-0 rounded-lg overflow-hidden border border-white/[0.06] self-start">
        <button
          className={`cursor-pointer flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
            mode === 'always'
              ? 'bg-violet-600 text-white'
              : 'bg-[#1C1C22] text-gray-400 hover:text-white'
          }`}
          onClick={() => handleModeSwitch('always')}
        >
          <Eye size={11} />
          Always Visible
        </button>
        <button
          className={`cursor-pointer flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
            mode === 'conditional'
              ? 'bg-violet-600 text-white'
              : 'bg-[#1C1C22] text-gray-400 hover:text-white'
          }`}
          onClick={() => handleModeSwitch('conditional')}
        >
          <EyeOff size={11} />
          Conditional
        </button>
      </div>

      {mode === 'conditional' && (
        <div className="flex flex-col gap-2">
          {/* Variable picker */}
          {variables.length > 0 && (
            <select
              className={baseInputCls}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) insertAtCursor(e.target.value);
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
            rows={2}
            className={`${baseInputCls} font-mono resize-none ${focused ? 'border-violet-500' : ''}`}
            value={expr}
            onChange={(e) => handleExprChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="growth > 0"
          />

          {/* Live badge */}
          {isVisible !== null && (
            <div className="flex items-center gap-1.5">
              {isVisible ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[11px] text-emerald-400">Visible</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full border border-red-500 inline-block" />
                  <span className="text-[11px] text-red-400">Hidden</span>
                </>
              )}
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

export { ConditionalVisibilityControl };
export default ConditionalVisibilityControl;

