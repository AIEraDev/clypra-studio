import React from "react";
import { SlidersHorizontal, BarChart4, Sun, Palette, Sliders, ChevronRight, ChevronDown, Zap, Loader2 } from "lucide-react";
import { FilterPreset } from "../types";

interface RightSidebarProps {
  rightTab: "adjust" | "histogram";
  setRightTab: (tab: "adjust" | "histogram") => void;
  selectedFilter: FilterPreset | null;
  setSelectedFilter: (filter: FilterPreset | null) => void;
  intensity: number;
  setIntensity: (intensity: number) => void;
  manualAdjustments: any;
  setManualAdjustments: (adjusts: any) => void;
  syncAdjustmentsUniformsDirect: (filter: FilterPreset | null, inst: number, adjusts: any) => void;
  toggleSection: (section: "light" | "color" | "effects") => void;
  expandedSections: { light: boolean; color: boolean; effects: boolean };
  handleResetSlider: (key: string) => void;
  handleAdjustmentChange: (key: string, val: number) => void;
  histogramData: { r: number[]; g: number[]; b: number[]; l: number[] } | null;
  histogramChannel: "all" | "r" | "g" | "b" | "l";
  setHistogramChannel: (ch: "all" | "r" | "g" | "b" | "l") => void;
  histogramSVGData: { rPath: string; gPath: string; bPath: string; lPath: string };
  previewFrameUrl: string | undefined;
  setShowThumbnailLightbox: (show: boolean) => void;
  creatorName: string;
  setCreatorName: (name: string) => void;
  creatorSocialLink: string;
  setCreatorSocialLink: (link: string) => void;
  isAdmin: boolean;
  publishApproved: boolean;
  setPublishApproved: (approved: boolean) => void;
  uploadStatus: "idle" | "uploading" | "success" | "error";
  uploadMessage: string;
  handleUploadFilter: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  rightTab,
  setRightTab,
  selectedFilter,
  setSelectedFilter,
  intensity,
  setIntensity,
  manualAdjustments,
  syncAdjustmentsUniformsDirect,
  toggleSection,
  expandedSections,
  handleResetSlider,
  handleAdjustmentChange,
  histogramData,
  histogramChannel,
  setHistogramChannel,
  histogramSVGData,
  previewFrameUrl,
  setShowThumbnailLightbox,
  creatorName,
  setCreatorName,
  creatorSocialLink,
  setCreatorSocialLink,
  isAdmin,
  publishApproved,
  setPublishApproved,
  uploadStatus,
  uploadMessage,
  handleUploadFilter,
}) => {
  return (
    <div className="w-[300px] bg-[#111117] border-l border-[#22222F] flex flex-col shrink-0 overflow-hidden">
      {/* Header Tab switches */}
      <div className="flex border-b border-[#22222F] shrink-0 bg-[#0F0F15]/40">
        <button
          onClick={() => setRightTab("adjust")}
          className={`flex-1 py-3 text-[11px] uppercase tracking-wider font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${rightTab === "adjust" ? "border-[#7C6FFF] text-white" : "border-transparent text-[#8A8A99] hover:text-white"}`}
        >
          <SlidersHorizontal size={13} />
          <span>Grading Controls</span>
        </button>

        <button
          onClick={() => setRightTab("histogram")}
          className={`flex-1 py-3 text-[11px] uppercase tracking-wider font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${rightTab === "histogram" ? "border-[#7C6FFF] text-white" : "border-transparent text-[#8A8A99] hover:text-white"}`}
        >
          <BarChart4 size={13} />
          <span>Histogram</span>
        </button>
      </div>

      {/* Tab content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab 1: Grading Controls */}
        {rightTab === "adjust" && (
          <div className="p-2 space-y-2">
            {/* Preset Intensity Slider */}
            {selectedFilter ? (
              <div className="p-3 bg-[#171720] rounded-xl border border-[#252535] space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Preset: {selectedFilter.name}</span>
                  <button
                    onClick={() => {
                      setSelectedFilter(null);
                      setIntensity(100);
                      syncAdjustmentsUniformsDirect(null, 100, manualAdjustments);
                    }}
                    className="text-[10px] text-[#A49BFF] hover:text-white transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#8A8A99]">
                    <span>Look Mix</span>
                    <span className="font-mono text-[#7C6FFF] font-semibold">{intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={intensity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setIntensity(val);
                      syncAdjustmentsUniformsDirect(selectedFilter, val, manualAdjustments);
                    }}
                    className="w-full h-1 bg-[#0F0F15] rounded-md appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#12121A] rounded-xl border border-[#1A1A26] text-center">
                <p className="text-[11px] text-[#8A8A99]">Select a preset filter on the left sidebar to mix and adjust its intensity</p>
              </div>
            )}

            {/* SECTION: LIGHT */}
            <div className="border border-[#22222F] rounded-lg overflow-hidden bg-[#13131B]">
              <button
                onClick={() => toggleSection("light")}
                className="w-full px-3 py-2 bg-[#171723] hover:bg-[#1B1B2C] border-b border-[#22222F] flex justify-between items-center text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sun size={13} className="text-amber-400" />
                  <span>Light Adjustments</span>
                </span>
                {expandedSections.light ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {expandedSections.light && (
                <div className="p-3.5 space-y-4">
                  {/* Exposure */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Exposure</span>
                      <div className="flex gap-2">
                        <button
                          onDoubleClick={() => handleResetSlider("exposure")}
                          className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                          title="Double-click to reset"
                        >
                          {manualAdjustments.exposure > 0 ? `+${manualAdjustments.exposure}` : manualAdjustments.exposure}%
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={manualAdjustments.exposure}
                      onChange={(e) => handleAdjustmentChange("exposure", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Brightness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Brightness</span>
                      <button
                        onDoubleClick={() => handleResetSlider("brightness")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.brightness > 0 ? `+${manualAdjustments.brightness}` : manualAdjustments.brightness}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={manualAdjustments.brightness}
                      onChange={(e) => handleAdjustmentChange("brightness", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Contrast</span>
                      <button
                        onDoubleClick={() => handleResetSlider("contrast")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.contrast > 0 ? `+${manualAdjustments.contrast}` : manualAdjustments.contrast}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={manualAdjustments.contrast}
                      onChange={(e) => handleAdjustmentChange("contrast", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION: COLOR */}
            <div className="border border-[#22222F] rounded-lg overflow-hidden bg-[#13131B]">
              <button
                onClick={() => toggleSection("color")}
                className="w-full px-3 py-2 bg-[#171723] hover:bg-[#1B1B2C] border-b border-[#22222F] flex justify-between items-center text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Palette size={13} className="text-sky-400" />
                  <span>Color & Tone</span>
                </span>
                {expandedSections.color ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {expandedSections.color && (
                <div className="p-3.5 space-y-4">
                  {/* Temperature */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Temperature (Warmth)</span>
                      <button
                        onDoubleClick={() => handleResetSlider("temperature")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.temperature > 0 ? `Warm (${manualAdjustments.temperature})` : manualAdjustments.temperature < 0 ? `Cool (${manualAdjustments.temperature})` : "Neutral"}
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={manualAdjustments.temperature}
                      onChange={(e) => handleAdjustmentChange("temperature", parseInt(e.target.value))}
                      className="w-full h-1 rounded appearance-none bg-linear-to-r from-blue-500 via-[#0F0F15] to-amber-500 accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Tint */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Tint (Magenta/Green)</span>
                      <button
                        onDoubleClick={() => handleResetSlider("tint")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.tint > 0 ? `Magenta (${manualAdjustments.tint})` : manualAdjustments.tint < 0 ? `Green (${manualAdjustments.tint})` : "Neutral"}
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={manualAdjustments.tint}
                      onChange={(e) => handleAdjustmentChange("tint", parseInt(e.target.value))}
                      className="w-full h-1 rounded appearance-none bg-linear-to-r from-emerald-500 via-[#0F0F15] to-pink-500 accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Saturation</span>
                      <button
                        onDoubleClick={() => handleResetSlider("saturation")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.saturation > 0 ? `+${manualAdjustments.saturation}` : manualAdjustments.saturation}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={manualAdjustments.saturation}
                      onChange={(e) => handleAdjustmentChange("saturation", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION: EFFECTS */}
            <div className="border border-[#22222F] rounded-lg overflow-hidden bg-[#13131B]">
              <button
                onClick={() => toggleSection("effects")}
                className="w-full px-3 py-2 bg-[#171723] hover:bg-[#1B1B2C] border-b border-[#22222F] flex justify-between items-center text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders size={13} className="text-purple-400" />
                  <span>Stylized Effects</span>
                </span>
                {expandedSections.effects ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {expandedSections.effects && (
                <div className="p-3.5 space-y-4">
                  {/* Vignette */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Vignette (Dark Corners)</span>
                      <button
                        onDoubleClick={() => handleResetSlider("vignette")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.vignette}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={manualAdjustments.vignette}
                      onChange={(e) => handleAdjustmentChange("vignette", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Sepia */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Vintage Sepia</span>
                      <button
                        onDoubleClick={() => handleResetSlider("sepia")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.sepia}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={manualAdjustments.sepia}
                      onChange={(e) => handleAdjustmentChange("sepia", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Grayscale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Grayscale Mix</span>
                      <button
                        onDoubleClick={() => handleResetSlider("grayscale")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.grayscale}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={manualAdjustments.grayscale}
                      onChange={(e) => handleAdjustmentChange("grayscale", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Lens Defocus (Blur)</span>
                      <button
                        onDoubleClick={() => handleResetSlider("blur")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.blur}px
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={manualAdjustments.blur}
                      onChange={(e) => handleAdjustmentChange("blur", parseFloat(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Invert */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8A8A99] font-medium">Invert Phase</span>
                      <button
                        onDoubleClick={() => handleResetSlider("invert")}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer"
                      >
                        {manualAdjustments.invert}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={manualAdjustments.invert}
                      onChange={(e) => handleAdjustmentChange("invert", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Histogram Visualization */}
        {rightTab === "histogram" && (
          <div className="p-4 space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-white">Live Signal Analysis</span>
              <p className="text-[10px] text-[#8A8A99] leading-relaxed">Calculated dynamically from the viewport composite. Double check color clipping in shadows or highlights.</p>
            </div>

            {/* Histogram Display Box */}
            <div className="bg-[#0A0A0E] rounded-xl border border-[#22222F] p-3 space-y-3 shadow-inner">
              {histogramData ? (
                <div className="relative">
                  {/* SVG Curve */}
                  <svg className="w-full h-[110px]" viewBox="0 0 260 110">
                    <g className="mix-blend-screen opacity-75">
                      {/* Red Channel */}
                      {(histogramChannel === "all" || histogramChannel === "r") && <path d={histogramSVGData.rPath} fill="rgba(239, 68, 68, 0.2)" stroke="rgb(239, 68, 68)" strokeWidth="1" />}

                      {/* Green Channel */}
                      {(histogramChannel === "all" || histogramChannel === "g") && <path d={histogramSVGData.gPath} fill="rgba(34, 197, 94, 0.18)" stroke="rgb(34, 197, 94)" strokeWidth="1" />}

                      {/* Blue Channel */}
                      {(histogramChannel === "all" || histogramChannel === "b") && <path d={histogramSVGData.bPath} fill="rgba(59, 130, 246, 0.25)" stroke="rgb(59, 130, 246)" strokeWidth="1" />}

                      {/* Luminance Channel */}
                      {(histogramChannel === "all" || histogramChannel === "l") && <path d={histogramSVGData.lPath} fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.2" strokeDasharray="2,2" />}
                    </g>
                  </svg>

                  {/* Scale labels */}
                  <div className="flex justify-between items-center text-[9px] font-mono text-[#5B5B6E] mt-1.5 pt-1.5 border-t border-[#22222F]/40 select-none">
                    <span>Shadows (0)</span>
                    <span>Midtones</span>
                    <span>Highlights (255)</span>
                  </div>
                </div>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-[#5B5B6E] text-xs">No signal detected</div>
              )}
            </div>

            {/* Histogram channel filter tabs */}
            <div className="flex flex-wrap gap-1 p-0.5 bg-[#0F0F15] border border-[#22222F]/50 rounded-lg">
              {(["all", "r", "g", "b", "l"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setHistogramChannel(ch)}
                  className={`flex-1 py-1 text-[9px] font-semibold uppercase tracking-wider rounded transition-all cursor-pointer ${histogramChannel === ch ? "bg-[#1E1E2A] text-white" : "text-[#8A8A99] hover:text-white"}`}
                >
                  {ch === "all" ? "RGB" : ch}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload lookup to R2 footer */}
      {selectedFilter && (
        <div className="p-4 border-t border-[#22222F] bg-[#0F0F15] space-y-3 shrink-0">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[#8A8A99] font-bold flex items-center gap-1.5">
              <Zap size={11} className="text-teal-400" />
              Look Deployment
            </span>
            {previewFrameUrl && (
              <div
                onClick={() => setShowThumbnailLightbox(true)}
                className="relative aspect-video w-full rounded border border-[#1A1A24] overflow-hidden bg-black/45 shadow-inner cursor-zoom-in hover:border-[#7C6FFF]/50 transition-colors group"
                title="Click to zoom preview"
              >
                <img
                  src={previewFrameUrl}
                  alt="Current Thumbnail Frame"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  style={{ filter: selectedFilter.cssFilter }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/75 to-transparent flex items-end p-1.5 pointer-events-none">
                  <span className="text-[8px] text-gray-300 uppercase tracking-widest font-mono">Thumbnail Frame</span>
                </div>
              </div>
            )}
            <div className="p-2 bg-[#0A0A0E] rounded border border-[#1A1A24] space-y-1 text-[10px] leading-normal font-mono">
              <div className="flex justify-between text-[#8A8A99]">
                <span className="truncate">NAME:</span> <span className="text-white font-sans font-semibold truncate max-w-[140px]">{selectedFilter.name}</span>
              </div>
              <div className="flex justify-between text-[#8A8A99]">
                <span className="truncate">CAT:</span> <span className="text-white font-sans">{selectedFilter.category}</span>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[#8A8A99] font-bold">Creator Name</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Your Name / Handle"
                  className="w-full px-2.5 py-1.5 bg-[#0A0A0E] border border-[#1A1A24] focus:border-[#7C6FFF] rounded-md text-[11px] text-white placeholder-[#5B5B6E] outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[#8A8A99] font-bold">Social Link</label>
                <input
                  type="url"
                  value={creatorSocialLink}
                  onChange={(e) => setCreatorSocialLink(e.target.value)}
                  placeholder="e.g. instagram.com/handle"
                  className="w-full px-2.5 py-1.5 bg-[#0A0A0E] border border-[#1A1A24] focus:border-[#7C6FFF] rounded-md text-[11px] text-white placeholder-[#5B5B6E] outline-none transition-all"
                />
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 pt-1.5 select-none">
                  <input
                    id="filter-publish-checkbox"
                    type="checkbox"
                    checked={publishApproved}
                    onChange={(e) => setPublishApproved(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[#1A1A24] bg-[#0A0A0E] text-[#10B981] focus:ring-[#10B981] cursor-pointer"
                  />
                  <label htmlFor="filter-publish-checkbox" className="text-[10px] font-semibold text-white cursor-pointer">
                    Approve & Publish immediately
                  </label>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleUploadFilter}
            disabled={uploadStatus === "uploading"}
            className="w-full flex items-center justify-center gap-2 py-2 bg-[#10B981] hover:bg-[#059669] disabled:bg-[#10B981]/50 text-white font-semibold text-xs rounded-lg shadow-lg shadow-[#10B981]/5 transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            {uploadStatus === "uploading" ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Uploading look...
              </>
            ) : (
              <>
                <Zap size={13} />
                Deploy Filter to R2
              </>
            )}
          </button>

          {uploadMessage && (
            <div className={`p-2 rounded text-[10px] leading-normal border ${uploadStatus === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
              {uploadMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
