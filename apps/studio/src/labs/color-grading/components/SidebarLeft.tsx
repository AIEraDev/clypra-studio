import React from "react";
import { FILTER_CATEGORIES, PROMPT_SUGGESTIONS } from "../../../components/effects/filter/FilterPresets";

interface SidebarLeftProps {
  mediaFile: File | null;
  isVideo: boolean;
  fitMode: "stretch" | "fit" | "crop";
  onMediaImport: (e: React.ChangeEvent<HTMLInputElement>, type: "video" | "image") => void;
  onSetFitMode: (mode: "stretch" | "fit" | "crop") => void;
  leftTab: "presets" | "ai";
  onSetLeftTab: (tab: "presets" | "ai") => void;
  presetSearch: string;
  onPresetSearchChange: (val: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  filteredPresets: any[];
  selectedFilterId: string;
  onSelectFilter: (presetId: string) => void;
  intensity: number;
  onIntensityChange: (val: number) => void;
  aiPrompt: string;
  onAiPromptChange: (val: string) => void;
  aiCategory: string;
  onAiCategoryChange: (val: string) => void;
  aiStatus: "idle" | "generating" | "success" | "error";
  aiMessage: string;
  onGenerateFilter: () => void;
}

export function SidebarLeft({
  mediaFile,
  isVideo,
  fitMode,
  onMediaImport,
  onSetFitMode,
  leftTab,
  onSetLeftTab,
  presetSearch,
  onPresetSearchChange,
  selectedCategory,
  onSelectCategory,
  filteredPresets,
  selectedFilterId,
  onSelectFilter,
  intensity,
  onIntensityChange,
  aiPrompt,
  onAiPromptChange,
  aiCategory,
  onAiCategoryChange,
  aiStatus,
  aiMessage,
  onGenerateFilter,
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
            palette
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-label-sm font-bold text-on-surface truncate font-sans">PRJ_02_COLOR_GRADING</h2>
          <p className="text-[9px] font-mono-data text-on-surface-variant uppercase">
            pixi_glsl_color_grading
          </p>
        </div>
      </div>

      {/* Source input */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded space-y-1.5">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase flex justify-between">
          Source <span className="text-primary font-mono-data">LIVE</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-1">
          <label className="border border-dashed border-outline-variant rounded p-1.5 text-center cursor-pointer hover:border-primary group transition-colors block">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onMediaImport(e, "video")}
            />
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-0.5" style={{ fontSize: 16 }}>
              movie
            </span>
            <p className="text-[8px] text-on-surface-variant group-hover:text-on-surface truncate">
              {isVideo && mediaFile ? mediaFile.name : "LOAD_VIDEO.bin"}
            </p>
          </label>

          <label className="border border-dashed border-outline-variant rounded p-1.5 text-center cursor-pointer hover:border-primary group transition-colors block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onMediaImport(e, "image")}
            />
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-0.5" style={{ fontSize: 16 }}>
              image
            </span>
            <p className="text-[8px] text-on-surface-variant group-hover:text-on-surface truncate">
              {!isVideo && mediaFile ? mediaFile.name : "LOAD_IMAGE.bin"}
            </p>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {(["stretch", "fit", "crop"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onSetFitMode(mode)}
              className={`py-0.5 rounded text-[8px] font-bold transition-all border ${
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

      {/* Tabs */}
      <div className="flex p-0.5 bg-surface-container-lowest rounded border border-outline-variant/30">
        <button
          onClick={() => onSetLeftTab("presets")}
          className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
            leftTab === "presets"
              ? "bg-surface-container-highest text-white shadow border border-outline-variant/50"
              : "text-on-surface-variant hover:text-white"
          }`}
        >
          PRESETS
        </button>
        <button
          onClick={() => onSetLeftTab("ai")}
          className={`flex-1 py-1 text-[10px] font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
            leftTab === "ai"
              ? "bg-surface-container-highest text-white shadow border border-outline-variant/50"
              : "text-on-surface-variant hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-purple-400" style={{ fontSize: 11 }}>
            cognition
          </span>
          AI LOOKS
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-0.5 min-h-0">
        {leftTab === "presets" ? (
          <div className="space-y-1.5">
            {/* Search & Category Filter */}
            <div className="space-y-1 pt-1">
              <input
                type="text"
                placeholder="Search presets..."
                value={presetSearch}
                onChange={(e) => onPresetSearchChange(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-primary placeholder-on-surface-variant"
              />
              
              <div className="flex flex-wrap gap-1">
                {FILTER_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-colors border ${
                      selectedCategory === cat
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-highest text-on-surface-variant border-transparent hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets List */}
            <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-0.5">
              <button
                onClick={() => onSelectFilter("__identity__")}
                className={`w-full text-left p-1.5 rounded border transition-all flex justify-between items-center cursor-pointer ${
                  selectedFilterId === "__identity__"
                    ? "bg-primary-container/20 border-primary text-white"
                    : "bg-surface-container border-transparent hover:bg-surface-container-highest hover:text-white text-on-surface-variant"
                }`}
              >
                <div>
                  <h4 className="text-[10px] font-bold">Neutral / Bypass</h4>
                  <p className="text-[8px] text-outline leading-tight">No preset grading applied.</p>
                </div>
                {selectedFilterId === "__identity__" && (
                  <span className="material-symbols-outlined text-[12px] text-primary">check_circle</span>
                )}
              </button>

              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectFilter(preset.id)}
                  className={`w-full text-left p-1.5 rounded border transition-all flex justify-between items-center cursor-pointer ${
                    selectedFilterId === preset.id
                      ? "bg-primary-container/20 border-primary text-white"
                      : "bg-surface-container border-transparent hover:bg-surface-container-highest hover:text-white text-on-surface-variant"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-[10px] font-bold truncate">{preset.name}</h4>
                    <p className="text-[8px] text-outline leading-tight truncate">{preset.description}</p>
                  </div>
                  {selectedFilterId === preset.id && (
                    <span className="material-symbols-outlined text-[12px] text-primary">check_circle</span>
                  )}
                </button>
              ))}
            </div>

            {/* Preset Intensity override */}
            {selectedFilterId !== "__identity__" && (
              <div className="bg-surface-container border border-outline-variant p-2 rounded space-y-1 mt-1">
                <div className="flex justify-between text-[9px] font-mono-data text-outline">
                  <span>Preset Intensity</span>
                  <span>{intensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intensity}
                  onChange={(e) => onIntensityChange(parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <div className="bg-surface-container border border-outline-variant p-2 rounded space-y-1.5">
              <h4 className="text-[10px] font-bold text-outline-variant uppercase">Prompt Look Generator</h4>
              <textarea
                placeholder="e.g. moody cyberpunk alley with blue and neon pink split tone..."
                value={aiPrompt}
                onChange={(e) => onAiPromptChange(e.target.value)}
                className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded p-1.5 text-[9px] text-white focus:outline-none focus:border-primary resize-none placeholder-on-surface-variant"
              />

              <div className="space-y-1">
                <label className="text-[8px] text-outline font-bold uppercase block">Category Intent</label>
                <select
                  value={aiCategory}
                  onChange={(e) => onAiCategoryChange(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-1 text-[9px] text-white focus:outline-none focus:border-primary"
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="vintage">Vintage</option>
                  <option value="utility">Utility</option>
                  <option value="creative">Creative</option>
                </select>
              </div>

              <button
                onClick={onGenerateFilter}
                disabled={aiStatus === "generating" || !aiPrompt.trim()}
                className="w-full py-1.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded text-[10px] font-bold hover:shadow-[0_0_8px_rgba(124,111,255,0.4)] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {aiStatus === "generating" ? (
                  <>
                    <span className="animate-spin text-[10px]">⌛</span>
                    <span>GENERATING...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    <span>GENERATE COLOR PROFILE</span>
                  </>
                )}
              </button>

              {aiStatus !== "idle" && (
                <div className={`p-1.5 rounded border text-[8px] leading-normal ${
                  aiStatus === "success"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : aiStatus === "error"
                    ? "bg-error/10 border-error/30 text-error"
                    : "bg-surface-container-highest border-outline-variant text-outline"
                }`}>
                  {aiMessage}
                </div>
              )}
            </div>

            {/* AI Prompts suggestions list */}
            <div className="space-y-1">
              <h5 className="text-[8px] text-outline font-bold uppercase tracking-wider pl-1">Try Suggestions</h5>
              {PROMPT_SUGGESTIONS.map((sugg, idx) => (
                <button
                  key={idx}
                  onClick={() => onAiPromptChange(sugg.prompt)}
                  className="w-full text-left p-1.5 rounded bg-surface-container/60 hover:bg-surface-container border border-outline-variant/30 text-[8px] text-outline hover:text-white truncate cursor-pointer"
                >
                  {sugg.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
