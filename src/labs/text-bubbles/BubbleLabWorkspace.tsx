import React, { useState } from "react";
import { Download, Save, Check, Shield } from "lucide-react";
import { toast } from "sonner";
import type { TextBubblePreset, TextBubbleCategory } from "@clypra-studio/engine";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import {
  loadBubblePresets,
  saveBubblePresets,
  createCustomPreset,
  duplicatePreset,
  validateBubblePreset,
} from "./services/bubblePresetService";
import { BubblePresetBrowser } from "./components/BubblePresetBrowser";
import { BubbleStagePreview } from "./components/BubbleStagePreview";
import { BubbleLayoutInspector } from "./components/BubbleLayoutInspector";

export const BubbleLabWorkspace: React.FC = () => {
  const isAdmin = useIsAdmin();

  const [presets, setPresets] = useState<TextBubblePreset[]>(() => loadBubblePresets());
  const [activePresetId, setActivePresetId] = useState<string>(
    presets[0]?.id ?? "bubble-paper-torn",
  );
  const [sampleText, setSampleText] = useState(
    "Hey Man, I don't care about what you doing",
  );

  const activePreset =
    presets.find((p) => p.id === activePresetId) ?? presets[0];

  const handleUpdatePreset = (updated: TextBubblePreset) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  };

  const handleSaveDraft = () => {
    const ok = saveBubblePresets(presets);
    if (ok) {
      toast.success(`Saved "${activePreset.name}" and presets to local drafts!`);
    } else {
      toast.error("Failed to save drafts to browser storage.");
    }
  };

  const handleNewPreset = (category: TextBubbleCategory) => {
    const newPreset = createCustomPreset(category, presets.length + 1);
    setPresets((prev) => [newPreset, ...prev]);
    setActivePresetId(newPreset.id);
    toast.info(`Created new ${category.toUpperCase()} bubble preset.`);
  };

  const handleDuplicate = (target: TextBubblePreset) => {
    const dup = duplicatePreset(target);
    setPresets((prev) => [dup, ...prev]);
    setActivePresetId(dup.id);
    toast.info(`Duplicated "${target.name}".`);
  };

  const handleDelete = (id: string) => {
    if (presets.length <= 1) {
      toast.error("Cannot delete the only remaining preset.");
      return;
    }
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (activePresetId === id) {
      const remaining = presets.filter((p) => p.id !== id);
      setActivePresetId(remaining[0]?.id ?? "");
    }
    toast.info("Preset deleted.");
  };

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(activePreset, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${activePreset.id}.json`);
    dlAnchor.click();
    toast.success(`Exported ${activePreset.name} as JSON.`);
  };

  const handlePublish = () => {
    if (!isAdmin) {
      toast.error(
        "Admin access required. Only administrators can publish bubble presets.",
      );
      return;
    }

    const { valid, errors } = validateBubblePreset(activePreset);
    if (!valid) {
      toast.error(`Validation failed: ${errors.join(", ")}`);
      return;
    }

    handleSaveDraft();
    toast.success(`Published "${activePreset.name}" to Clypra Bubble Catalog!`, {
      description: "Preset is now validated for Clypra Desktop runtime evaluation.",
    });
  };

  return (
    <div className="flex h-full flex-col bg-[#0B0B10]">
      {/* ── Sub-Header: Studio Actions ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--studio-border)] bg-[var(--studio-panel)] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-400">
            <Shield size={12} />
            <span>Admin Only</span>
          </span>
          <span className="text-xs text-[var(--studio-muted)]">
            Active: <strong className="text-white">{activePreset.name}</strong>{" "}
            ({activePreset.category})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-[var(--studio-accent)]"
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-[var(--studio-accent)]"
          >
            <Save size={13} />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={!isAdmin}
            title={
              !isAdmin
                ? "Administrator access required to publish presets"
                : undefined
            }
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-transform ${
              isAdmin
                ? "bg-[var(--studio-accent)] text-black hover:scale-105"
                : "cursor-not-allowed bg-gray-800 text-gray-500"
            }`}
          >
            <Check size={14} />
            <span>Publish Preset</span>
          </button>
        </div>
      </div>

      {/* ── Main 3-Pane Body ── */}
      <div className="flex min-h-0 flex-1">
        {/* Left Pane: Preset Browser */}
        <BubblePresetBrowser
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={(id) => setActivePresetId(id)}
          onNewPreset={handleNewPreset}
          onDuplicatePreset={handleDuplicate}
          onDeletePreset={handleDelete}
        />

        {/* Center Pane: Interactive Stage Preview */}
        <div className="flex min-w-0 flex-1 flex-col">
          <BubbleStagePreview
            preset={activePreset}
            sampleText={sampleText}
            onSampleTextChange={setSampleText}
            onUpdatePreset={handleUpdatePreset}
          />
        </div>

        {/* Right Pane: Layout & Bounds Inspector */}
        <BubbleLayoutInspector
          preset={activePreset}
          onUpdatePreset={handleUpdatePreset}
        />
      </div>
    </div>
  );
};
