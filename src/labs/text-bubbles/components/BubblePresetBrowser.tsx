import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Copy, Trash2 } from "lucide-react";
import {
  type TextBubblePreset,
  type TextBubbleCategory,
  renderBubbleBackground,
} from "@clypra-studio/engine";

interface BubblePresetBrowserProps {
  presets: TextBubblePreset[];
  activePresetId: string;
  onSelectPreset: (id: string) => void;
  onNewPreset: (category: TextBubbleCategory) => void;
  onDuplicatePreset: (preset: TextBubblePreset) => void;
  onDeletePreset: (id: string) => void;
}

const CATEGORIES: Array<{ id: TextBubbleCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "paper", label: "Paper" },
  { id: "speech", label: "Speech" },
  { id: "comic", label: "Comic" },
  { id: "cute", label: "Cute" },
  { id: "banner", label: "Banner" },
  { id: "labels", label: "Labels" },
  { id: "decorative", label: "Decorative" },
];

/**
 * Miniature HTML5 Canvas preview for preset cards.
 * Uses the exact same renderBubbleBackground helper for 100% rendering parity.
 */
function PresetThumbnailCanvas({
  preset,
  active,
}: {
  preset: TextBubblePreset;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 110;
    const h = 60;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // 1. Draw bubble decoration
    const pad = 6;
    renderBubbleBackground(
      ctx,
      preset.id,
      pad,
      pad,
      w - pad * 2,
      h - pad * 2,
      { color: preset.category === "comic" && preset.id.includes("dark") ? "#18181b" : "#ffffff" },
    );

    // 2. Draw mini text
    ctx.save();
    const style = preset.defaultTextStyle;
    ctx.fillStyle = style?.color || "#111827";
    ctx.font = `${style?.fontStyle === "italic" ? "italic " : ""}${style?.fontWeight || "bold"} 9px ${style?.fontFamily || "Inter, sans-serif"}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const label = preset.sampleText?.slice(0, 14) || preset.name;
    ctx.fillText(label, w / 2, h / 2 - 2);

    if (style?.textDecoration === "underline") {
      const textMetrics = ctx.measureText(label);
      const textW = textMetrics.width;
      ctx.strokeStyle = style.color || "#111827";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - textW / 2, h / 2 + 5);
      ctx.lineTo(w / 2 + textW / 2, h / 2 + 5);
      ctx.stroke();
    }
    ctx.restore();
  }, [preset, active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "60px" }}
      className="rounded bg-black/40"
    />
  );
}

export const BubblePresetBrowser: React.FC<BubblePresetBrowserProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onNewPreset,
  onDuplicatePreset,
  onDeletePreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TextBubbleCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPresets = presets.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full w-80 flex-col border-r border-[var(--studio-border)] bg-[var(--studio-panel)] text-xs text-white">
      {/* ── Search & Category Filter ── */}
      <div className="border-b border-[var(--studio-border)] p-3">
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--studio-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bubble presets..."
            className="h-7 w-full rounded-md border border-[var(--studio-border)] bg-[var(--studio-control)] pl-8 pr-2 text-xs text-white placeholder:text-[var(--studio-muted)] focus:border-[var(--studio-accent)] focus:outline-none"
          />
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[var(--studio-accent)] text-black"
                  : "border border-[var(--studio-border)] bg-[var(--studio-control)] text-[var(--studio-muted)] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Preset Grid ── */}
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
                {/* Canvas Thumbnail Preview */}
                <PresetThumbnailCanvas preset={p} active={isActive} />

                {/* Preset Title */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="truncate text-[11px] font-semibold text-white/90">
                    {p.name}
                  </span>
                  <span className="rounded bg-black/50 px-1 py-0.5 text-[9px] uppercase tracking-wider text-[var(--studio-muted)]">
                    {p.category}
                  </span>
                </div>

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
            No matching bubble presets found.
          </div>
        )}
      </div>

      {/* ── Footer: New Preset ── */}
      <div className="border-t border-[var(--studio-border)] p-3">
        <button
          onClick={() => onNewPreset(selectedCategory === "all" ? "paper" : selectedCategory)}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] font-semibold text-white transition-colors hover:border-[var(--studio-accent)] hover:text-[var(--studio-accent)]"
        >
          <Plus size={14} />
          <span>New Bubble Preset</span>
        </button>
      </div>
    </div>
  );
};
