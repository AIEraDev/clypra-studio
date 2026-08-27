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
            filter_hdr
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-label-sm font-bold text-on-surface truncate font-sans">PRJ_01_GRADING</h2>
          <p className="text-[9px] font-mono-data text-on-surface-variant uppercase">
            native_gpu_color_grade
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
            auto_awesome
          </span>
          AI LOOKS
        </button>
      </div>

      {/* Preset Library tab */}
      {leftTab === "presets" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden gap-1.5">
          {/* Search bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[12px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search looks..."
              value={presetSearch}
              onChange={(e) => onPresetSearchChange(e.target.value)}
              className="w-full pl-6 pr-2 py-1 bg-surface-container border border-outline-variant rounded text-[10px] text-white placeholder-on-surface-variant/40 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1 pr-1 max-h-[60px] overflow-y-auto">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary/10 border-primary/50 text-white"
                    : "bg-surface-container border-outline-variant/40 text-on-surface-variant hover:text-white"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Preset list */}
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-1">
            {filteredPresets.map((preset) => {
              const isSelected = selectedFilterId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectFilter(preset.id)}
                  className={`w-full text-left p-1.5 rounded border transition-all ${
                    isSelected
                      ? "bg-primary/15 border-primary text-white"
                      : "bg-surface-container hover:bg-surface-container-highest border-outline-variant/30 text-on-surface-variant hover:text-white"
                  }`}
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-bold truncate pr-1">{preset.name}</span>
                    <span className="text-[8px] font-mono-data text-outline/80 bg-surface-container-lowest px-1 rounded uppercase">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[9px] text-outline leading-tight truncate">
                    {preset.description}
                  </p>
                </button>
              );
            })}
            {filteredPresets.length === 0 && (
              <p className="text-center text-[10px] text-outline py-4 font-mono-data">NO_PRESETS_FOUND</p>
            )}
          </div>

          {/* Intensity slider if preset is selected */}
          {selectedFilterId !== "__identity__" && (
            <div className="bg-surface-container border border-outline-variant p-1.5 rounded space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-outline-variant uppercase">
                <span>Preset Intensity</span>
                <span className="text-primary font-mono-data">{intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => onIntensityChange(parseInt(e.target.value))}
                className="w-full accent-primary h-1 bg-surface-container-highest rounded"
              />
            </div>
          )}
        </div>
      )}

      {/* AI generator tab */}
      {leftTab === "ai" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden gap-1.5">
          <div className="flex-1 flex flex-col min-h-0 gap-1.5 overflow-y-auto pr-0.5">
            <div className="bg-surface-container border border-outline-variant p-1.5 rounded space-y-1.5">
              <h4 className="text-[10px] font-bold text-outline-variant uppercase">AI Look Prompt</h4>
              <textarea
                value={aiPrompt}
                onChange={(e) => onAiPromptChange(e.target.value)}
                placeholder="e.g. moody dark green forest, muted highlights, film contrast"
                className="w-full h-16 p-1 bg-surface-container-lowest border border-outline-variant rounded text-[9px] text-white placeholder-on-surface-variant/40 resize-none outline-none focus:border-primary transition-all font-mono-data leading-normal"
              />
              
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-outline uppercase block">Category Target</span>
                <div className="grid grid-cols-3 gap-1">
                  {["cinematic", "vintage", "vibrant", "mono"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => onAiCategoryChange(cat)}
                      className={`py-0.5 rounded text-[8px] font-bold transition-all border ${
                        aiCategory === cat
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-surface-container-highest text-on-surface-variant border-transparent"
                      }`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={onGenerateFilter}
                disabled={aiStatus === "generating" || !aiPrompt.trim()}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-[10px] font-bold transition-all uppercase flex items-center justify-center gap-1 cursor-pointer"
              >
                {aiStatus === "generating" ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                    Synthesize Look
                  </>
                )}
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-1.5 p-1 bg-surface-container/50 rounded border border-outline-variant/30">
              <span className="text-[8px] font-bold text-outline uppercase px-0.5">Prompt Presets</span>
              <div className="flex flex-wrap gap-1 p-0.5">
                {PROMPT_SUGGESTIONS.slice(0, 8).map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onAiPromptChange(sug.prompt);
                      onAiCategoryChange(sug.category);
                    }}
                    className="px-1.5 py-0.5 rounded bg-surface-container-highest hover:bg-outline-variant border border-outline-variant/20 hover:text-white text-[8px] text-outline text-left transition-colors font-mono-data truncate max-w-[120px]"
                    title={sug.prompt}
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status message */}
            {aiMessage && (
              <div className={`p-1.5 rounded text-[9px] font-mono-data leading-normal border ${
                aiStatus === "success" 
                  ? "bg-secondary/15 border-secondary/30 text-secondary" 
                  : aiStatus === "error"
                  ? "bg-error/15 border-error/30 text-error"
                  : "bg-surface-container border-outline-variant/30 text-on-surface-variant"
              }`}>
                {aiMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
