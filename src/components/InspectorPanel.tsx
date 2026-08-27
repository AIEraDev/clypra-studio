import React, { useState } from "react";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import type { TextEffectConfig } from "@clypra-studio/engine";
import type { SceneDocument } from "@clypra-studio/engine";
import { TextEffectControls } from "./text-effects/controls/TextEffectControls";

type ConfigPatch =
  | Partial<TextEffectConfig>
  | ((config: TextEffectConfig) => TextEffectConfig);

interface InspectorPanelProps {
  config: TextEffectConfig;
  scene?: SceneDocument;
  selectedLayerId?: string | null;
  onSelectLayer?: (layerId: string | null) => void;
  onConfigChange: (patch: ConfigPatch) => void;
  onSceneChange?: (
    scene: SceneDocument | ((prev: SceneDocument) => SceneDocument),
  ) => void;
  onSavePreset: () => void;
  onStartFromScratch: () => void;
  onFitText: () => void;
  onOpenFontCompare: () => void;
  activeEffectId: string;
  collapsedSections: Record<string, boolean>;
  isGeneratingName: boolean;
  onToggleSection: (section: string) => void;
  onGenerateEffectName: () => void;
  onApplyCompositionPreset: (presetId: string) => void;
}

// ── Collapsible Section ──────────────────────────────────────────────────────
function Section({
  id,
  title,
  accent = false,
  defaultOpen = true,
  headerRight,
  children,
}: {
  id: string;
  title: string;
  accent?: boolean;
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="inspector-section"
      style={accent ? { borderLeft: "3px solid var(--studio-accent)" } : {}}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`sec-${id}`}
        onClick={() => setOpen((v) => !v)}
        className="inspector-section-header w-full"
      >
        <span className="inspector-section-title">{title}</span>
        <span className="flex items-center gap-2">
          {headerRight}
          {open ? (
            <ChevronDown size={13} style={{ color: "var(--studio-muted)" }} />
          ) : (
            <ChevronRight size={13} style={{ color: "var(--studio-muted)" }} />
          )}
        </span>
      </button>
      {open && (
        <div id={`sec-${id}`} className="inspector-section-body space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function InspectorPanel({
  config,
  onConfigChange,
  onSavePreset,
  onStartFromScratch,
  onFitText,
  onOpenFontCompare,
  activeEffectId,
  collapsedSections,
  isGeneratingName,
  onToggleSection,
  onGenerateEffectName,
  onApplyCompositionPreset,
}: InspectorPanelProps) {
  return (
    <aside
      id="studio-inspector-panel"
      className="flex w-full flex-col border-l"
      style={{
        background: "var(--studio-shell)",
        borderColor: "var(--studio-border)",
        minWidth: 0,
      }}
      aria-label="Inspector"
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-3 p-2 border-b shrink-0"
        style={{
          borderColor: "var(--studio-border)",
          background: "var(--studio-panel)",
        }}
      >
        <div className="min-w-0 flex-1">
          <p
            className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "var(--studio-muted)" }}
          >
            INSPECTOR
          </p>
          <h2 className="truncate text-[13px] font-bold text-white">
            {config.effectName || "Untitled style"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onSavePreset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shrink-0"
          style={{
            background: "var(--studio-active)",
            border: "1px solid var(--studio-active-strong)",
          }}
        >
          <Save size={11} />
          Save
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Quick Tools */}
        <Section id="selection" title="Quick Actions" defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenFontCompare}
              className="rounded-lg py-2 text-[11px] font-bold transition-colors"
              style={{
                background: "var(--studio-control)",
                border: "1px solid var(--studio-border)",
                color: "var(--studio-text)",
              }}
            >
              Compare fonts
            </button>
            <button
              type="button"
              onClick={onStartFromScratch}
              className="rounded-lg py-2 text-[11px] font-bold transition-colors"
              style={{
                background: "var(--studio-control)",
                border: "1px solid var(--studio-border)",
                color: "var(--studio-text)",
              }}
            >
              Blank slate
            </button>
          </div>
        </Section>

        {/* Text effect configuration controls */}
        <TextEffectControls
          visible
          config={config}
          activeEffectId={activeEffectId}
          collapsedSections={collapsedSections}
          isGeneratingName={isGeneratingName}
          modifyConfig={onConfigChange}
          toggleSection={onToggleSection}
          handleGenerateAiEffectName={onGenerateEffectName}
          applyCompositionPreset={onApplyCompositionPreset}
          fitTextToComposition={onFitText}
        />
      </div>
    </aside>
  );
}
