import React, { useState, useEffect, useRef, useCallback } from "react";
import { Download, Upload, Save, Sparkles, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { TextAnimationPreset, AnimationPhase } from "../../types/animation";
import { STARTER_ANIMATION_PRESETS } from "./data/starterPresets";
import { AnimationPresetBrowser } from "./components/AnimationPresetBrowser";
import { AnimationPreviewStage } from "./components/AnimationPreviewStage";
import { AnimationTimeline } from "./components/AnimationTimeline";
import { AnimationInspector } from "./components/AnimationInspector";

const STORAGE_KEY = "clypra_studio_animation_presets_v1";

export const AnimationLabWorkspace: React.FC = () => {
  // Load custom drafts or initialize with starter presets
  const [presets, setPresets] = useState<TextAnimationPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return STARTER_ANIMATION_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState<string>(
    presets[0]?.id ?? "anim-in-typewriter",
  );
  const [sampleText, setSampleText] = useState("ABC123");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const activePreset =
    presets.find((p) => p.id === activePresetId) ?? presets[0] ?? STARTER_ANIMATION_PRESETS[0];

  const duration = activePreset.defaultDuration || 0.6;

  // ── Animation Playhead Loop ──
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const step = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = (now - lastTimeRef.current) / 1000;
        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          // Auto-loop when duration exceeded
          if (next >= duration) {
            return 0;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, duration]);

  // Persist to local storage on changes
  const handleUpdatePreset = (updated: TextAnimationPreset) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...updated, updatedAt: Date.now() } : p)),
    );
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      toast.success(`Saved "${activePreset.name}" to local drafts!`);
    } catch (err) {
      toast.error("Failed to save drafts to browser storage.");
    }
  };

  const handleNewPreset = (phase: AnimationPhase) => {
    const id = `anim-${phase}-custom-${Date.now().toString(36)}`;
    const newPreset: TextAnimationPreset = {
      id,
      name: `Custom ${phase.toUpperCase()} ${presets.length + 1}`,
      phase,
      category: "Basic",
      tags: ["custom", phase],
      defaultDuration: 0.5,
      minDuration: 0.1,
      maxDuration: 4.0,
      previewLoopDuration: 1.2,
      thumbnailUrl: "",
      version: 1,
      createdAt: Date.now(),
      tracks: [
        {
          property: "opacity",
          keyframes: [
            { progress: 0.0, value: phase === "out" ? 1 : 0 },
            { progress: 1.0, value: phase === "out" ? 0 : 1 },
          ],
        },
      ],
    };

    setPresets((prev) => [newPreset, ...prev]);
    setActivePresetId(id);
    setCurrentTime(0);
    toast.info(`Created new ${phase.toUpperCase()} animation preset.`);
  };

  const handleDuplicatePreset = (target: TextAnimationPreset) => {
    const duplicated: TextAnimationPreset = {
      ...target,
      id: `${target.id}-copy-${Date.now().toString(36)}`,
      name: `${target.name} (Copy)`,
      createdAt: Date.now(),
    };
    setPresets((prev) => [duplicated, ...prev]);
    setActivePresetId(duplicated.id);
    toast.info(`Duplicated "${target.name}".`);
  };

  const handleDeletePreset = (id: string) => {
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
    // Schema validation check
    if (!activePreset.name.trim()) {
      toast.error("Preset name cannot be empty.");
      return;
    }
    if (activePreset.tracks.length === 0) {
      toast.error("Preset must have at least one animated property track.");
      return;
    }

    // Simulate publication
    handleSaveDraft();
    toast.success(`Published "${activePreset.name}" to Clypra Animation Catalog!`, {
      description: "Preset is now validated for Clypra Desktop runtime evaluation.",
    });
  };

  return (
    <div className="flex h-full flex-col bg-[#0B0B10]">
      {/* ── Sub-Header: Studio Actions ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--studio-border)] bg-[var(--studio-panel)] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--studio-active-soft)] px-2.5 py-1 text-xs font-bold text-[var(--studio-accent)]">
            <Sparkles size={13} />
            <span>CapCut Animation Authoring</span>
          </span>
          <span className="text-xs text-[var(--studio-muted)]">
            Active: <strong className="text-white">{activePreset.name}</strong> ({activePreset.phase})
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
            className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-3.5 py-1.5 text-xs font-bold text-black transition-transform hover:scale-105"
          >
            <Check size={14} />
            <span>Publish Preset</span>
          </button>
        </div>
      </div>

      {/* ── Main 3-Pane Body ── */}
      <div className="flex min-h-0 flex-1">
        {/* Left Pane: Preset Browser */}
        <AnimationPresetBrowser
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={(id) => {
            setActivePresetId(id);
            setCurrentTime(0);
          }}
          onNewPreset={handleNewPreset}
          onDuplicatePreset={handleDuplicatePreset}
          onDeletePreset={handleDeletePreset}
        />

        {/* Center Pane: Preview Stage + Keyframe Timeline */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <AnimationPreviewStage
              preset={activePreset}
              sampleText={sampleText}
              onSampleTextChange={setSampleText}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentTime={currentTime}
              onSeek={(t) => setCurrentTime(t)}
              duration={duration}
            />
          </div>

          <AnimationTimeline
            preset={activePreset}
            onUpdatePreset={handleUpdatePreset}
            progress={duration > 0 ? currentTime / duration : 0}
            onSeekProgress={(p) => setCurrentTime(p * duration)}
          />
        </div>

        {/* Right Pane: Property & Motion Inspector */}
        <AnimationInspector
          preset={activePreset}
          onUpdatePreset={handleUpdatePreset}
        />
      </div>
    </div>
  );
};
