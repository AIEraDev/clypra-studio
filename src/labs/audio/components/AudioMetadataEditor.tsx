import React from "react";
import {
  Sparkles,
  Loader2,
  Tag,
  Hash,
  Activity,
  Repeat,
  Info,
} from "lucide-react";
import { AUDIO_CATEGORIES, type AudioCategory } from "../types";

interface AudioMetadataEditorProps {
  id: string;
  name: string;
  category: AudioCategory;
  description: string;
  tagsInput: string;
  bpm: string;
  loopable: boolean;
  aiStatus: "idle" | "generating" | "failed";
  hasAudioSource: boolean;
  onIdChange: (id: string) => void;
  onNameChange: (name: string) => void;
  onCategoryChange: (category: AudioCategory) => void;
  onDescriptionChange: (desc: string) => void;
  onTagsInputChange: (tags: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onBpmChange: (bpm: string) => void;
  onLoopableChange: (loopable: boolean) => void;
  onGenerateAiInfo: () => void;
}

const POPULAR_TAG_SUGGESTIONS = [
  "cinematic",
  "trailer",
  "lo-fi",
  "beats",
  "upbeat",
  "ambient",
  "impact",
  "transition",
  "sfx",
  "chill",
  "foley",
  "synth",
];

export function AudioMetadataEditor({
  id,
  name,
  category,
  description,
  tagsInput,
  bpm,
  loopable,
  aiStatus,
  hasAudioSource,
  onIdChange,
  onNameChange,
  onCategoryChange,
  onDescriptionChange,
  onTagsInputChange,
  onAddTag,
  onRemoveTag,
  onBpmChange,
  onLoopableChange,
  onGenerateAiInfo,
}: AudioMetadataEditorProps) {
  const currentTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <section className="space-y-4 rounded-xl border border-[#222232] bg-[#0E0E18] p-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#1E1E2C] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-500/20 text-[11px] font-bold text-teal-300">
            2
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Metadata & Classification
          </h3>
        </div>

        {/* AI Generator Button */}
        <button
          type="button"
          onClick={onGenerateAiInfo}
          disabled={!hasAudioSource || aiStatus === "generating"}
          className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-200 transition-all hover:bg-purple-500/25 hover:border-purple-500/50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Synthesize audio title, tags, category, and BPM using Gemini"
        >
          {aiStatus === "generating" ? (
            <Loader2 size={13} className="animate-spin text-purple-300" />
          ) : (
            <Sparkles size={13} className="text-purple-400" />
          )}
          <span>{aiStatus === "generating" ? "Enriching..." : "Auto-Enrich with AI"}</span>
        </button>
      </div>

      {/* Title & Asset ID */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
            Display Name <span className="text-teal-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Deep Cinematic Riser"
            className="w-full rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
            Asset Slug ID <span className="text-teal-400">*</span>
          </label>
          <div className="relative">
            <Hash size={13} className="absolute left-2.5 top-2.5 text-[#505064]" />
            <input
              type="text"
              value={id}
              onChange={(e) => onIdChange(e.target.value)}
              placeholder="auto-generated-slug-id"
              className="w-full rounded-lg border border-[#262638] bg-[#090910] pl-7 pr-3 py-2 font-mono text-xs text-teal-300 placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
          Category <span className="text-teal-400">*</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {AUDIO_CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                  isSelected
                    ? "border-teal-500/50 bg-teal-500/15 text-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.2)]"
                    : "border-[#222232] bg-[#0A0A12] text-[#808096] hover:border-[#353548] hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
            Description
          </label>
          <span className="text-[10px] text-[#55556E]">{description.length}/300</span>
        </div>
        <textarea
          rows={2}
          maxLength={300}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief description of the audio feel, ideal use cases, and instrumentation..."
          className="w-full resize-none rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* Tags Input & Suggestion Chips */}
      <div>
        <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
          <Tag size={12} />
          <span>Keywords & Tags</span>
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => onTagsInputChange(e.target.value)}
          placeholder="e.g., cinematic, trailer, bass, action (comma separated)"
          className="w-full rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
        />

        {/* Quick add suggestion chips */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[#505064]">Quick add:</span>
          {POPULAR_TAG_SUGGESTIONS.map((tag) => {
            const hasTag = currentTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => (hasTag ? onRemoveTag(tag) : onAddTag(tag))}
                className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  hasTag
                    ? "border-teal-500/40 bg-teal-500/20 text-teal-300"
                    : "border-[#20202E] bg-[#0A0A10] text-[#707086] hover:border-teal-500/30 hover:text-white"
                }`}
              >
                {hasTag ? `✓ ${tag}` : `+ ${tag}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* BPM and Loopable toggle */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1 border-t border-[#1C1C28]">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
            <Activity size={12} className="text-amber-400" />
            <span>Tempo / BPM</span>
          </label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => onBpmChange(e.target.value)}
            placeholder="e.g. 120"
            className="w-full rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
            Seamless Loop
          </label>
          <label className="flex h-9.5 cursor-pointer items-center justify-between rounded-lg border border-[#262638] bg-[#090910] px-3 transition-colors hover:border-teal-500/40">
            <div className="flex items-center gap-2">
              <Repeat size={14} className={loopable ? "text-teal-400" : "text-gray-500"} />
              <span className="text-xs text-gray-200">Loop-friendly audio</span>
            </div>
            <input
              type="checkbox"
              checked={loopable}
              onChange={(e) => onLoopableChange(e.target.checked)}
              className="h-4 w-4 rounded border-[#303046] bg-[#141420] text-teal-500 focus:ring-teal-500"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
