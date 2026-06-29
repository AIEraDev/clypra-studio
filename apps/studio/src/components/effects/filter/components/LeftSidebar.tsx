import React from "react";
import { Palette, Sparkles, Search, Check, Film, Image as ImageIcon, Loader2 } from "lucide-react";
import { FilterPreset } from "../types";
import { FILTER_CATEGORIES, PROMPT_SUGGESTIONS } from "../FilterPresets";

interface LeftSidebarProps {
  leftTab: "presets" | "ai";
  setLeftTab: (tab: "presets" | "ai") => void;
  presetSearch: string;
  setPresetSearch: (search: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedFilter: FilterPreset | null;
  setSelectedFilter: (filter: FilterPreset | null) => void;
  intensity: number;
  setIntensity: (intensity: number) => void;
  previewFrameUrl: string | undefined;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  aiCategory: string;
  setAiCategory: (cat: string) => void;
  aiStatus: "idle" | "generating" | "success" | "error";
  aiMessage: string;
  filteredPresets: FilterPreset[];
  handleGenerateFilter: () => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mediaMetadata: { width: number; height: number; duration?: number } | null;
  isVideo: boolean;
  syncAdjustmentsUniformsDirect: (filter: FilterPreset | null, inst: number, adjusts: any) => void;
  manualAdjustments: any;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  leftTab,
  setLeftTab,
  presetSearch,
  setPresetSearch,
  selectedCategory,
  setSelectedCategory,
  selectedFilter,
  setSelectedFilter,
  intensity,
  setIntensity,
  previewFrameUrl,
  aiPrompt,
  setAiPrompt,
  aiCategory,
  setAiCategory,
  aiStatus,
  aiMessage,
  filteredPresets,
  handleGenerateFilter,
  handleVideoUpload,
  handleImageUpload,
  mediaMetadata,
  isVideo,
  syncAdjustmentsUniformsDirect,
  manualAdjustments,
}) => {
  return (
    <div className="w-[340px] bg-[#111117] border-r border-[#22222F] flex flex-col shrink-0 overflow-hidden">
      {/* Header Tab Switcher */}
      <div className="p-2 border-b border-[#22222F] space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[#7C6FFF]/10 rounded-lg text-[#7C6FFF]">
            <Palette size={18} />
          </span>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-white">Filter Lab</h1>
            <p className="text-[10px] text-[#8A8A99]">Color grading and look development</p>
          </div>
        </div>

        {/* Glassmorphic Tabs */}
        <div className="flex p-0.5 bg-[#0F0F15] rounded-lg border border-[#22222F]/40">
          <button
            onClick={() => setLeftTab("presets")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${leftTab === "presets" ? "bg-[#1E1E2A] text-white shadow-md border border-[#33334A]/50" : "text-[#8A8A99] hover:text-white"}`}
          >
            Preset Library
          </button>
          <button
            onClick={() => setLeftTab("ai")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${leftTab === "ai" ? "bg-[#1E1E2A] text-white shadow-md border border-[#33334A]/50" : "text-[#8A8A99] hover:text-white"}`}
          >
            <Sparkles size={12} className={leftTab === "ai" ? "text-purple-400" : ""} />
            AI Generator
          </button>
        </div>
      </div>

      {/* Tab 1: Preset Library Content */}
      {leftTab === "presets" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search and Category filters */}
          <div className="p-2 space-y-2.5 border-b border-[#22222F]/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A99]" />
              <input
                type="text"
                placeholder="Search color presets..."
                value={presetSearch}
                onChange={(e) => setPresetSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0F0F15] border border-[#22222F] rounded-md text-xs text-white placeholder-[#5B5B6E] focus:border-[#7C6FFF] focus:ring-1 focus:ring-[#7C6FFF]/30 outline-none transition-all"
              />
            </div>

            {/* Category selector chips */}
            <div className="flex flex-wrap gap-1 items-center max-h-[75px] overflow-y-auto pr-1">
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full transition-all border cursor-pointer ${selectedCategory === cat ? "bg-[#7C6FFF]/15 border-[#7C6FFF]/50 text-white" : "bg-[#1C1C26]/40 border-[#22222F] text-[#8A8A99] hover:text-white hover:bg-[#1E1E2A]"}`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Presets Cards Grid */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredPresets.length > 0 ? (
              filteredPresets.map((preset) => {
                const isSelected = selectedFilter?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedFilter(preset);
                      setIntensity(100);
                      syncAdjustmentsUniformsDirect(preset, 100, manualAdjustments);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer group ${isSelected ? "bg-[#1E1E2A] border-[#7C6FFF] shadow-md shadow-[#7C6FFF]/5" : "bg-[#13131B] border-[#22222F] hover:bg-[#181824] hover:border-[#2C2C3F]"}`}
                  >
                    {/* Mini Preview Square */}
                    <div className="relative w-12 h-12 rounded bg-linear-to-tr from-[#3A3270] to-[#7C6FFF] overflow-hidden shrink-0 border border-[#22222F] group-hover:scale-105 transition-transform duration-300">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: previewFrameUrl ? `url(${previewFrameUrl})` : "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&auto=format&fit=crop')",
                          filter: preset.cssFilter,
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#7C6FFF]/20 flex items-center justify-center text-white">
                          <Check size={14} className="drop-shadow-md" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-white truncate">{preset.name}</span>
                        <span className="text-[9px] uppercase tracking-wider text-[#8A8A99] font-mono shrink-0 scale-90">{preset.category}</span>
                      </div>
                      <p className="text-[10px] text-[#8A8A99] line-clamp-2 mt-1 leading-normal">{preset.description}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-[#8A8A99] text-xs">No presets match your search</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AI Generator Content */}
      {leftTab === "ai" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#B96FFF] flex items-center gap-1.5">
              <Sparkles size={14} className="animate-pulse" />
              Prompt-to-Filter Engine
            </span>
            <p className="text-[10px] text-[#8A8A99] leading-relaxed">Describe a color grading style or movie atmosphere. Our engine will generate a custom color look for you.</p>
          </div>

          {/* AI Prompts Suggestions */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-[#8A8A99] font-semibold">Quick Suggestions</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PROMPT_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiPrompt(sug.prompt);
                    setAiCategory(sug.category);
                  }}
                  className="p-1.5 bg-[#13131B] hover:bg-[#1C1C2A] border border-[#22222F] hover:border-[#33334A] rounded text-[10px] text-[#8A8A99] hover:text-white text-left transition-colors truncate cursor-pointer"
                >
                  ⚡ {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea Prompt */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-[#8A8A99] font-semibold flex justify-between">
              <span>Prompt Description</span>
              <span className="text-[#8A8A99]">{aiPrompt.length} chars</span>
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. vintage warm sunset with golden tones and faded shadows..."
              rows={4}
              className="w-full px-3 py-2 bg-[#0F0F15] border border-[#22222F] focus:border-[#7C6FFF] rounded-md text-xs text-white placeholder-[#5B5B6E] resize-none outline-none focus:ring-1 focus:ring-[#7C6FFF]/30 transition-all leading-normal"
            />
          </div>

          {/* AI Category Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-[#8A8A99] font-semibold">Target Style Category</label>
            <select
              value={aiCategory}
              onChange={(e) => setAiCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F0F15] border border-[#22222F] focus:border-[#7C6FFF] rounded-md text-xs text-white focus:ring-1 focus:ring-[#7C6FFF]/30 outline-none transition-all"
            >
              {FILTER_CATEGORIES.filter((c) => c !== "all").map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Action button */}
          <button
            onClick={handleGenerateFilter}
            disabled={aiStatus === "generating"}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7C6FFF] hover:bg-[#685BEA] disabled:bg-[#7C6FFF]/50 text-white font-semibold text-xs rounded-lg shadow-lg shadow-[#7C6FFF]/10 transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            {aiStatus === "generating" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analyzing look...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate Lookup Look
              </>
            )}
          </button>

          {/* Status alerts */}
          {aiMessage && (
            <div className={`p-2.5 rounded-lg border text-xs leading-normal flex gap-2 items-start ${aiStatus === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
              <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 bg-current" />
              <div>{aiMessage}</div>
            </div>
          )}
        </div>
      )}

      {/* Media Import section footer */}
      <div className="p-4 border-t border-[#22222F] bg-[#0F0F15] space-y-2 shrink-0">
        <div className="flex gap-2">
          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1C1C26] hover:bg-[#252533] border border-[#2E2E3E] hover:border-[#3A3A4E] text-[#C5C5D2] hover:text-white text-[11px] font-semibold rounded-md cursor-pointer transition-colors">
            <Film size={13} className="text-[#8A8A99]" />
            <span>Import Video</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1C1C26] hover:bg-[#252533] border border-[#2E2E3E] hover:border-[#3A3A4E] text-[#C5C5D2] hover:text-white text-[11px] font-semibold rounded-md cursor-pointer transition-colors">
            <ImageIcon size={13} className="text-[#8A8A99]" />
            <span>Import Image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        {mediaMetadata && (
          <div className="p-2 bg-[#0A0A0E] rounded border border-[#1A1A24] text-[9px] font-mono text-[#8A8A99] flex justify-between items-center">
            <span>
              {isVideo ? "VIDEO" : "IMAGE"} &bull; {mediaMetadata.width}x{mediaMetadata.height}
            </span>
            {isVideo && mediaMetadata.duration && <span>{mediaMetadata.duration.toFixed(1)}s</span>}
          </div>
        )}
      </div>
    </div>
  );
};
