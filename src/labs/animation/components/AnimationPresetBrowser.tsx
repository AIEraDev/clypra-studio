import React, { useState } from "react";
import { Plus, Search, Sparkles, Copy, Trash2 } from "lucide-react";
import type { TextAnimationPreset, AnimationPhase } from "../../../types/animation";

interface AnimationPresetBrowserProps {
  presets: TextAnimationPreset[];
  activePresetId: string;
  onSelectPreset: (id: string) => void;
  onNewPreset: (phase: AnimationPhase) => void;
  onDuplicatePreset: (preset: TextAnimationPreset) => void;
  onDeletePreset: (id: string) => void;
}

export const AnimationPresetBrowser: React.FC<AnimationPresetBrowserProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onNewPreset,
  onDuplicatePreset,
  onDeletePreset,
}) => {
  const [activePhase, setActivePhase] = useState<AnimationPhase>("in");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Basic", "Motion", "3D", "Glitch", "VFX"];

  // Filter presets by phase, category, and search query
  const filteredPresets = presets.filter((p) => {
    if (p.phase !== activePhase) return false;
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full w-72 flex-col border-r border-[var(--studio-border)] bg-[var(--studio-panel)] text-xs text-white">
      {/* ── Header: Phase Segmented Tabs ── */}
      <div className="border-b border-[var(--studio-border)] p-3">
        <div className="grid grid-cols-3 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] p-0.5">
          {(["in", "out", "loop"] as AnimationPhase[]).map((phase) => (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              className={`rounded-md py-1 text-center font-bold capitalize transition-colors ${
                activePhase === phase
                  ? "bg-[var(--studio-active)] text-white shadow"
                  : "text-[var(--studio-muted)] hover:text-white"
              }`}
            >
              {phase}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mt-2.5">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--studio-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activePhase} animations...`}
            className="h-7 w-full rounded-md border border-[var(--studio-border)] bg-[var(--studio-control)] pl-8 pr-2 text-xs text-white placeholder:text-[var(--studio-muted)] focus:border-[var(--studio-accent)] focus:outline-none"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                selectedCategory === cat
                  ? "bg-[var(--studio-accent)] text-black"
                  : "border border-[var(--studio-border)] bg-[var(--studio-control)] text-[var(--studio-muted)] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Preset Grid List ── */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2.5">
          {filteredPresets.map((p) => {
            const isActive = p.id === activePresetId;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPreset(p.id)}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-[#111118] p-2 transition-all hover:border-[var(--studio-accent)]/60 ${
                  isActive
                    ? "border-[var(--studio-accent)] ring-1 ring-[var(--studio-accent)]"
                    : "border-[var(--studio-border)]"
                }`}
              >
                {/* Preset Card Viewport Preview */}
                <div
                  className="flex h-14 w-full items-center justify-center rounded text-sm font-bold text-white/90"
                  style={{
                    background: p.procedural?.type === "flame"
                      ? "radial-gradient(circle, #6f250e, #161014 68%)"
                      : p.procedural?.type === "water" || p.procedural?.type === "chromatic"
                        ? "linear-gradient(115deg, #142445, #352151, #12111d)"
                        : p.procedural?.type === "neon"
                          ? "radial-gradient(circle, #312060, #101018 70%)"
                          : "rgba(0,0,0,.4)",
                  }}
                >
                  <span
                    style={p.procedural?.type === "neon" ? { textShadow: "0 0 10px #bc70ff" } : undefined}
                  >
                    ABC
                  </span>
                </div>

                {/* Preset Title */}
                <span className="mt-1.5 truncate text-[11px] font-semibold text-white/90">
                  {p.name}
                </span>

                {/* Quick actions hover overlay */}
                <div className="absolute top-1 right-1 hidden items-center gap-1 rounded bg-black/80 p-0.5 group-hover:flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePreset(p);
                    }}
                    title="Duplicate preset"
                    className="p-1 text-[var(--studio-muted)] hover:text-white"
                  >
                    <Copy size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePreset(p.id);
                    }}
                    title="Delete preset"
                    className="p-1 text-[var(--studio-muted)] hover:text-red-400"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPresets.length === 0 && (
          <div className="mt-8 text-center text-xs text-[var(--studio-muted)]">
            No matching animations found.
          </div>
        )}
      </div>

      {/* ── Footer: Create New Preset ── */}
      <div className="border-t border-[var(--studio-border)] p-3">
        <button
          onClick={() => onNewPreset(activePhase)}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] font-semibold text-white transition-colors hover:border-[var(--studio-accent)] hover:text-[var(--studio-accent)]"
        >
          <Plus size={14} />
          <span>New {activePhase.toUpperCase()} Animation</span>
        </button>
      </div>
    </div>
  );
};
