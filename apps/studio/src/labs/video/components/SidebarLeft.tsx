import React from "react";
import type { EffectMetadata } from "@clypra-studio/engine";

interface SidebarLeftProps {
  videoFile: File | null;
  fitMode: "stretch" | "fit" | "crop";
  selectedEffectId: string;
  searchQuery: string;
  activeCategory: string;
  onVideoImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetFitMode: (mode: "stretch" | "fit" | "crop") => void;
  onSelectEffect: (effectId: string) => void;
  onSearchQueryChange: (val: string) => void;
  onActiveCategoryChange: (cat: string) => void;
  filteredEffects: EffectMetadata[];
  totalEffectsCount: number;
  availableCategories: string[];
  categoryLabels: Record<string, string>;
  identityEffectId: string;
  onLoadModule: () => void;
}

export function SidebarLeft({
  videoFile,
  fitMode,
  selectedEffectId,
  searchQuery,
  activeCategory,
  onVideoImport,
  onSetFitMode,
  onSelectEffect,
  onSearchQueryChange,
  onActiveCategoryChange,
  filteredEffects,
  totalEffectsCount,
  availableCategories,
  categoryLabels,
  identityEffectId,
  onLoadModule,
}: SidebarLeftProps) {
  return (
    <aside className="flex flex-col h-full w-[280px] min-w-[280px] bg-surface-container-low border-r border-outline-variant p-1 gap-1 overflow-hidden select-none">
      {/* Project header */}
      <div className="flex items-center gap-2 p-1 border-b border-outline-variant pb-2 mb-1">
        <div className="w-7 h-7 rounded bg-primary-container flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-on-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            dataset
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-label-sm font-bold text-on-surface truncate">PRJ_01_RENDER</h2>
          <p className="text-[9px] font-mono-data text-on-surface-variant uppercase">
            1080p60_h264_master
          </p>
        </div>
      </div>

      {/* Source input */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1 flex justify-between">
          Source <span className="text-primary">LIVE</span>
        </h3>
        <label className="border border-dashed border-outline-variant rounded p-2 text-center cursor-pointer hover:border-primary group transition-colors block">
          <input type="file" accept="video/*" className="hidden" onChange={onVideoImport} />
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1">
            file_upload
          </span>
          <p className="text-[10px] text-on-surface-variant group-hover:text-on-surface truncate">
            {videoFile ? videoFile.name : "LOAD_MEDIA.bin"}
          </p>
        </label>
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          {(["stretch", "fit", "crop"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onSetFitMode(mode)}
              className={`py-0.5 rounded text-[9px] font-bold transition-all border ${
                fitMode === mode
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-surface-container-highest text-on-surface-variant border-transparent"
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Effect Library */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1 px-1 flex justify-between items-center">
          Proc_Library
          <span className="text-secondary font-mono-data">
            {filteredEffects.length}/{totalEffectsCount}
          </span>
        </h3>

        {/* Search */}
        <div className="relative mb-1">
          <span
            className="material-symbols-outlined absolute left-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            style={{ fontSize: 13 }}
          >
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search effects..."
            className="w-full bg-surface-container border border-outline-variant rounded text-[10px] text-on-surface pl-6 pr-2 py-1 outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onActiveCategoryChange(cat)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all border ${
                activeCategory === cat
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-surface-container text-on-surface-variant border-transparent hover:border-outline-variant"
              }`}
            >
              {categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Identity pass-through entry */}
        <div
          onClick={() => onSelectEffect(identityEffectId)}
          className={`p-1.5 cursor-pointer border-l-2 mb-1 rounded-r ${
            selectedEffectId === identityEffectId
              ? "bg-surface-container-high border-primary text-primary"
              : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
          } transition-all`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold">IDENTITY</span>
            <span className="text-[9px] font-mono-data text-outline">pass-through</span>
          </div>
          <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
            Direct buffer pass-through
          </p>
        </div>

        {/* Effect list */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-0.5 effect-list">
          {filteredEffects.length === 0 ? (
            <div className="text-center text-on-surface-variant text-[10px] py-4">
              No effects match "{searchQuery}"
            </div>
          ) : (
            filteredEffects.map((effect) => (
              <div
                key={effect.id}
                onClick={() => onSelectEffect(effect.id)}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffectId === effect.id
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold truncate pr-1">{effect.name}</span>
                  <span
                    className={`text-[8px] font-mono-data shrink-0 px-1 rounded ${
                      effect.category === "body"
                        ? "text-tertiary bg-tertiary/10"
                        : effect.category === "light"
                          ? "text-yellow-400 bg-yellow-400/10"
                          : effect.category === "glitch"
                            ? "text-error bg-error/10"
                            : "text-outline bg-outline/10"
                    }`}
                  >
                    {effect.category}
                  </span>
                </div>
                <p className="text-[9px] text-on-surface-variant leading-tight mt-0.5 truncate">
                  {effect.description}
                </p>
                {effect.premium && (
                  <span className="text-[8px] text-tertiary font-bold">★ PREMIUM</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={onLoadModule}
        className="bg-primary text-on-primary py-1 rounded font-bold text-label-sm flex items-center justify-center gap-1 mt-1 hover:bg-[#c8daff] transition-all"
      >
        <span className="material-symbols-outlined">add_box</span>
        LOAD_MODULE
      </button>
    </aside>
  );
}
