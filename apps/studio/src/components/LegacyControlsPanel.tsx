import React from "react";
import { Brush, ChevronDown, ChevronUp, Compass, Flame, Layers, Layout, Loader2, Monitor, Moon, Plus, Snowflake, Sparkles, Trash2, Type } from "lucide-react";
import type { TextEffectConfig } from "@clypra/engine";
import { SYSTEM_FONTS, GOOGLE_FONTS } from "../constants";
import { COMPOSITION_PRESETS } from "@clypra/engine";
import { resizeCharFillColors } from "@clypra/engine";
import { PerCharColorEditor } from "./PerCharColorEditor";

type ConfigUpdater = Partial<TextEffectConfig> | ((config: TextEffectConfig) => TextEffectConfig);

interface LegacyControlsPanelProps {
  visible: boolean;
  config: TextEffectConfig;
  activeEffectId: string;
  collapsedSections: Record<string, boolean>;
  isGeneratingName: boolean;
  modifyConfig: (updater: ConfigUpdater) => void;
  toggleSection: (section: string) => void;
  handleGenerateAiEffectName: () => void;
  applyCompositionPreset: (presetId: string) => void;
  fitTextToComposition: () => void;
}

export function LegacyControlsPanel({ visible, config, activeEffectId, collapsedSections, isGeneratingName, modifyConfig, toggleSection, handleGenerateAiEffectName, applyCompositionPreset, fitTextToComposition }: LegacyControlsPanelProps) {
  return (
    <div className={visible ? "p-4 flex flex-col gap-4" : "hidden"}>
      {/* ──────────────────────────────────────────────────────
          Section 1 — Text
          ────────────────────────────────────────────────────── */}
      <div id="section-card-text" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("text")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Type size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">1. Text Configuration</span>
          </div>
          {collapsedSections.text ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.text && (
          <div className="p-3.5 flex flex-col gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Preview Label Text</label>
              <textarea
                id="input-text-val"
                rows={2}
                value={config.text}
                onChange={(e) => {
                  const text = e.target.value;
                  modifyConfig({
                    text,
                    charFillColors: config.perCharFillEnabled ? resizeCharFillColors(text, config.charFillColors, config.fillColor || "#ffffff") : config.charFillColors,
                  });
                }}
                className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] resize-none font-sans"
                placeholder="Insert preview label..."
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Clypra Class Name</label>
              <div className="flex gap-1.5">
                <input id="input-effect-name" type="text" value={config.effectName} onChange={(e) => modifyConfig({ effectName: e.target.value })} className="flex-1 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] font-sans min-w-0" />
                <button type="button" onClick={handleGenerateAiEffectName} disabled={isGeneratingName} className="px-2.5 bg-[#7C6FFF]/10 hover:bg-[#7C6FFF]/20 active:bg-[#7C6FFF]/30 border border-[#7C6FFF]/30 rounded-lg text-[#7C6FFF] font-sans text-xs flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0" title="Generate Class Name with Gemini AI">
                  {isGeneratingName ? (
                    <Loader2 size={13} className="animate-spin text-[#7C6FFF]" />
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span className="text-[10px] font-semibold">AI Name</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-0.5">Effect Registration ID</label>
              <span className="text-[10px] font-mono text-gray-500 bg-[#0E0E12] px-2 py-1 rounded block border border-dashed border-[#2A2A38] truncate select-all">{activeEffectId}</span>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 2 — Font
          ────────────────────────────────────────────────────── */}
      <div id="section-card-font" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("font")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Type size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">2. Font Specimen</span>
          </div>
          {collapsedSections.font ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.font && (
          <div className="p-3.5 flex flex-col gap-3">
            {/* Font dropdown */}
            <div>
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Typography Family</label>
              <select id="select-font-family" value={config.fontFamily} onChange={(e) => modifyConfig({ fontFamily: e.target.value })} className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] cursor-pointer">
                <optgroup label="System Fonts">
                  {SYSTEM_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Google Web Fonts">
                  {GOOGLE_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Weight segmented */}
            <div>
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Font Weight</label>
              <div className="grid grid-cols-6 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg select-none">
                {[400, 500, 600, 700, 800, 900].map((w) => (
                  <button key={w} type="button" onClick={() => modifyConfig({ fontWeight: w })} className={`py-1 text-[10px] rounded font-mono cursor-pointer transition-all ${config.fontWeight === w ? "bg-[#7C6FFF] text-white font-semibold" : "text-clypra-muted hover:text-white"}`}>
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Font style */}
            <div>
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Font Decoration Style</label>
              <div className="grid grid-cols-2 gap-1 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg select-none">
                {["normal", "italic"].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      const updates: any = { fontStyle: style };
                      if (style === "italic") {
                        updates.skewX = -0.2;
                      } else {
                        updates.skewX = 0;
                      }
                      modifyConfig(updates);
                    }}
                    className={`py-1 text-[10px] rounded font-mono capitalize cursor-pointer transition-all ${config.fontStyle === style ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* font size */}
            <div className="flex items-center justify-between gap-3 mt-1">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">Size</label>
                  <span className="text-[10px] font-mono text-white">{config.fontSize}px</span>
                </div>
                <input type="range" min="24" max="200" value={config.fontSize} onChange={(e) => modifyConfig({ fontSize: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize py-1" />
              </div>
              <input type="number" min="24" max="200" value={config.fontSize} onChange={(e) => modifyConfig({ fontSize: Math.max(24, Math.min(200, parseInt(e.target.value) || 24)) })} className="w-[50px] bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-1.5 text-center text-[10px] font-mono mt-3 focus:outline-none" />
            </div>

            {/* spacing */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">Letter Spacing</label>
                <span className="text-[10px] font-mono text-white">{config.letterSpacing}px</span>
              </div>
              <input type="range" min="-10" max="30" value={config.letterSpacing} onChange={(e) => modifyConfig({ letterSpacing: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
            </div>

            {/* line height */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">Line Height Ratio</label>
                <span className="text-[10px] font-mono text-white">{config.lineHeight}x</span>
              </div>
              <input type="range" min="0.8" max="2.5" step="0.1" value={config.lineHeight} onChange={(e) => modifyConfig({ lineHeight: parseFloat(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 3 — Ink Brush Engine (Custom procedural controls)
          ────────────────────────────────────────────────────── */}
      <div id="section-card-inkbrush" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden mb-3">
        <div onClick={() => toggleSection("inkBrush")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Brush size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">3. Ink Brush Engine</span>
            {config.customRenderer === "InkBrushEngine" && <span className="text-[9px] bg-teal-500/20 text-teal-400 font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">Active</span>}
          </div>
          {collapsedSections.inkBrush ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.inkBrush && (
          <div className="p-3.5 flex flex-col gap-4">
            {/* Active Engine Toggle */}
            <div className="flex items-center justify-between p-2 rounded bg-[#0E0E12] border border-[#2A2A38]/50 flex-wrap gap-1">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#7C6FFF] font-bold block">Enable Ink Brush Engine</span>
                <span className="text-[8px] text-gray-500 font-mono block">When on, overrides standard fill modes</span>
              </div>
              <input type="checkbox" checked={config.customRenderer === "InkBrushEngine"} onChange={(e) => modifyConfig({ customRenderer: e.target.checked ? "InkBrushEngine" : undefined })} className="accent-[#7C6FFF] w-4 h-4 cursor-pointer" />
            </div>

            {/* Ink Color */}
            <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Ink Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={config.inkColor || "#FFFFFF"} onChange={(e) => modifyConfig({ inkColor: e.target.value, fillColor: e.target.value, customRenderer: "InkBrushEngine" })} className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0" />
                <input type="text" value={config.inkColor || "#FFFFFF"} onChange={(e) => modifyConfig({ inkColor: e.target.value, fillColor: e.target.value, customRenderer: "InkBrushEngine" })} className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#7C6FFF] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none" />
              </div>
            </div>

            {/* Bristle Density */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">Bristle Density (Coverage)</label>
                <span className="text-[10px] font-mono text-white">{config.bristleDensity ?? 0.8}</span>
              </div>
              <input type="range" min="0.1" max="2.0" step="0.05" value={config.bristleDensity ?? 0.8} onChange={(e) => modifyConfig({ bristleDensity: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
            </div>

            {/* Bristle Skip Rate */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">Skip Rate (Dryness/Holes)</label>
                <span className="text-[10px] font-mono text-white">{Math.round((config.bristleSkipRate ?? 0.2) * 100)}%</span>
              </div>
              <input type="range" min="0.0" max="1.0" step="0.05" value={config.bristleSkipRate ?? 0.2} onChange={(e) => modifyConfig({ bristleSkipRate: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
            </div>

            {/* Drip Rate */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">Drip Rate (Drip Probability)</label>
                <span className="text-[10px] font-mono text-white">{Math.round((config.dripRate ?? 0.3) * 100)}%</span>
              </div>
              <input type="range" min="0.0" max="1.0" step="0.05" value={config.dripRate ?? 0.3} onChange={(e) => modifyConfig({ dripRate: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
            </div>

            {/* Drip Max Length */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">Drip Max Length</label>
                <span className="text-[10px] font-mono text-white">{config.dripMaxLength ?? 40}px</span>
              </div>
              <input type="range" min="5" max="120" step="1" value={config.dripMaxLength ?? 40} onChange={(e) => modifyConfig({ dripMaxLength: parseInt(e.target.value), customRenderer: "InkBrushEngine" })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
            </div>

            {/* Grain Density */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">Grain Density (Paper Noise)</label>
                <span className="text-[10px] font-mono text-white">{Math.round((config.grainDensity ?? 0.15) * 100)}%</span>
              </div>
              <input type="range" min="0.0" max="1.0" step="0.05" value={config.grainDensity ?? 0.15} onChange={(e) => modifyConfig({ grainDensity: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
            </div>

            {/* Font Slant SkewX */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">Font Slant (Skew X)</label>
                <span className="text-[10px] font-mono text-white">{config.skewX ?? -0.2}</span>
              </div>
              <input type="range" min="-1.0" max="1.0" step="0.05" value={config.skewX ?? -0.2} onChange={(e) => modifyConfig({ skewX: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 3 — Fill
          ────────────────────────────────────────────────────── */}
      <div id="section-card-fill" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden mb-3">
        <div onClick={() => toggleSection("fill")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">3. Text Fill Color</span>
            {!config.customRenderer && <span className="text-[9px] bg-[#7C6FFF]/20 text-white font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>}
          </div>
          {collapsedSections.fill ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.fill && (
          <div className="p-3.5 flex flex-col gap-3">
            {/* Fill Radio Select */}
            <div>
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1.5 animate-pulse">Fill Rendering Mode</label>
              <div className="flex flex-wrap gap-1 select-none">
                {["solid", "linear", "radial", "pattern", "none"].map((type) => (
                  <button key={type} type="button" onClick={() => modifyConfig({ fillType: type as any, customRenderer: undefined })} className={`flex-1 min-w-[55px] py-1 rounded text-[10px] font-mono cursor-pointer uppercase border transition-all ${config.fillType === type ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white font-semibold" : "bg-[#0E0E12] border-[#2A2A38] text-clypra-muted hover:text-white"}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* SOLID */}
            {config.fillType === "solid" && (
              <div className="flex flex-col gap-2">
                <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Color Palette</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.fillColor.startsWith("#") ? config.fillColor : "#ffffff"}
                      onChange={(e) => {
                        const fillColor = e.target.value;
                        modifyConfig({
                          fillColor,
                          customRenderer: undefined,
                          charFillColors: config.perCharFillEnabled ? resizeCharFillColors(config.text || "", config.charFillColors, fillColor) : config.charFillColors,
                        });
                      }}
                      className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={config.fillColor}
                      onChange={(e) => {
                        const fillColor = e.target.value;
                        modifyConfig({
                          fillColor,
                          customRenderer: undefined,
                          charFillColors: config.perCharFillEnabled ? resizeCharFillColors(config.text || "", config.charFillColors, fillColor) : config.charFillColors,
                        });
                      }}
                      className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#7C6FFF] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
                    />
                  </div>
                </div>
                {!config.customRenderer && <PerCharColorEditor config={config} onChange={modifyConfig} />}
              </div>
            )}

            {/* GRADIENT (Linear & Radial) */}
            {(config.fillType === "linear" || config.fillType === "radial") && (
              <div className="p-3 rounded-lg bg-[#0E0E12] border border-[#2A2A38] flex flex-col gap-3.5">
                {config.fillType === "linear" && (
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-clypra-muted">Radial / Angle</label>
                      <span className="text-[10px] font-mono text-white">{config.fillGradientAngle}°</span>
                    </div>
                    <input type="range" min="0" max="360" value={config.fillGradientAngle} onChange={(e) => modifyConfig({ fillGradientAngle: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                  </div>
                )}

                {/* Stops list */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-[#2A2A38]/60 pb-1">
                    <span className="text-[10px] uppercase font-mono text-clypra-muted">Stops ({config.fillGradientStops.length})</span>
                    {config.fillGradientStops.length < 6 && (
                      <button
                        type="button"
                        onClick={() => {
                          modifyConfig((prev) => {
                            const offsets = prev.fillGradientStops.map((s) => s.offset);
                            const maxOffset = Math.max(...offsets, 0);
                            const newOffset = Math.min(100, maxOffset + 15);
                            return {
                              ...prev,
                              fillGradientStops: [...prev.fillGradientStops, { color: "#ffffff", offset: newOffset }],
                            };
                          });
                        }}
                        className="text-[9px] font-mono text-[#7C6FFF] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus size={10} /> Add Stop
                      </button>
                    )}
                  </div>

                  {config.fillGradientStops.map((stop, sidx) => (
                    <div key={sidx} className="flex items-center gap-2 bg-[#15151C] p-2 rounded-md border border-[#2A2A38]/50">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => {
                          modifyConfig((prev) => {
                            const stops = [...prev.fillGradientStops];
                            stops[sidx] = { ...stops[sidx], color: e.target.value };
                            return { ...prev, fillGradientStops: stops };
                          });
                        }}
                        className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                      />

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stop.offset}
                        onChange={(e) => {
                          modifyConfig((prev) => {
                            const stops = [...prev.fillGradientStops];
                            stops[sidx] = { ...stops[sidx], offset: parseInt(e.target.value) };
                            return { ...prev, fillGradientStops: stops };
                          });
                        }}
                        className="flex-1 accent-[#7C6FFF] cursor-ew-resize h-1"
                      />

                      <span className="text-[9px] font-mono text-clypra-muted w-[22px] text-right shrink-0">{stop.offset}%</span>

                      {config.fillGradientStops.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            modifyConfig((prev) => ({
                              ...prev,
                              fillGradientStops: prev.fillGradientStops.filter((_, i) => i !== sidx),
                            }));
                          }}
                          className="p-0.5 text-clypra-muted hover:text-red-500 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PATTERN */}
            {config.fillType === "pattern" && (
              <div className="p-3 rounded-lg bg-[#0E0E12] border border-[#2A2A38] flex flex-col gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Pattern Color Accent</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={config.fillColor.startsWith("#") ? config.fillColor : "#ffffff"} onChange={(e) => modifyConfig({ fillColor: e.target.value, customRenderer: undefined })} className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0" />
                    <input type="text" value={config.fillColor} onChange={(e) => modifyConfig({ fillColor: e.target.value, customRenderer: undefined })} className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#7C6FFF] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Canvas Texture Selection</label>
                  <div className="grid grid-cols-2 gap-1 select-none">
                    {[
                      { key: "chalk", label: "Chalk Brush" },
                      { key: "noise", label: "Sand Grain" },
                      { key: "grunge", label: "Grunge Weathered" },
                      { key: "carbon", label: "Carbon Grid" },
                      { key: "stripes", label: "Stripes Hatch" },
                      { key: "film", label: "Analog Film" },
                      { key: "brushed", label: "Brushed Metal" },
                      { key: "marble", label: "Stone Marble" },
                      { key: "halftone", label: "Comics Halftone" },
                      { key: "paper", label: "Craft Paper" },
                    ].map((item) => (
                      <button key={item.key} type="button" onClick={() => modifyConfig({ patternType: item.key as any })} className={`py-1 rounded text-[9px] font-mono cursor-pointer uppercase border transition-all ${(config.patternType || "chalk") === item.key ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white font-semibold" : "bg-[#0E0E12] border-[#2A2A38] text-clypra-muted hover:text-white"}`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* NONE NOTE */}
            {config.fillType === "none" && (
              <div className="p-2.5 rounded-lg border border-dashed border-[#2A2A38] bg-transparent text-center">
                <p className="text-xs text-clypra-muted font-sans">Hollow Core — No Fill layer active. Render relies entirely on Stroke settings below.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 4 — Stroke
          ────────────────────────────────────────────────────── */}
      <div id="section-card-stroke" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("stroke")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">4. Stroke Border</span>
          </div>
          {collapsedSections.stroke ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.stroke && (
          <div className="p-3.5 flex flex-col gap-3.5">
            {/* Enable */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">Enable stroke outline</span>
              <input type="checkbox" checked={config.strokeEnabled} onChange={(e) => modifyConfig({ strokeEnabled: e.target.checked })} className="accent-[#7C6FFF] w-4 h-4 rounded border-[#2A2A38] cursor-pointer" />
            </div>

            <div className="flex flex-col gap-3 border-t border-[#2A2A38]/60 pt-3 select-none">
              {/* Color */}
              <div className="flex items-center gap-3 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2">
                <input type="color" value={config.strokeColor.startsWith("#") ? config.strokeColor : "#7c6fff"} onChange={(e) => modifyConfig({ strokeColor: e.target.value, strokeEnabled: true })} className="w-7 h-7 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                <input type="text" value={config.strokeColor} onChange={(e) => modifyConfig({ strokeColor: e.target.value, strokeEnabled: true })} className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none" />
              </div>

              {/* Width */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">Stroke Width</label>
                  <span className="text-[10px] font-mono text-white">{config.strokeWidth}px</span>
                </div>
                <input type="range" min="0" max="30" value={config.strokeWidth} onChange={(e) => modifyConfig({ strokeWidth: parseInt(e.target.value), strokeEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
              </div>

              {/* Position */}
              <div>
                <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Rendering Alignment</label>
                <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none">
                  {["outside", "center", "inside"].map((pos) => (
                    <button key={pos} type="button" onClick={() => modifyConfig({ strokePosition: pos as any, strokeEnabled: true })} className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${config.strokePosition === pos ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">Opacity Level</label>
                  <span className="text-[10px] font-mono text-white">{config.strokeOpacity}%</span>
                </div>
                <input type="range" min="0" max="100" value={config.strokeOpacity} onChange={(e) => modifyConfig({ strokeOpacity: parseInt(e.target.value), strokeEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
              </div>

              {/* Line join */}
              <div>
                <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Line Joins Edge</label>
                <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none">
                  {["round", "miter", "bevel"].map((join) => (
                    <button key={join} type="button" onClick={() => modifyConfig({ strokeLineJoin: join as any, strokeEnabled: true })} className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${config.strokeLineJoin === join ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`}>
                      {join}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stroke Model Type Selector */}
              <div>
                <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Stroke Model Type</label>
                <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none">
                  {[
                    { key: "single", label: "Single" },
                    { key: "double", label: "Double" },
                    { key: "neon", label: "Neon Glow" },
                  ].map((item) => (
                    <button key={item.key} type="button" onClick={() => modifyConfig({ strokeType: item.key as any, strokeEnabled: true })} className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${(config.strokeType || "single") === item.key ? "bg-[#7C6FFF] text-white font-semibold" : "text-clypra-muted hover:text-white"}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stroke Blur Radius */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">Stroke Blur Radius</label>
                  <span className="text-[10px] font-mono text-white">{config.strokeBlur || 0}px</span>
                </div>
                <input type="range" min="0" max="30" value={config.strokeBlur || 0} onChange={(e) => modifyConfig({ strokeBlur: parseInt(e.target.value), strokeEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
              </div>

              {/* Stroke Vertical Fade */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">Vertical Fade Out</label>
                  <span className="text-[10px] font-mono text-white">{config.strokeFadeRange || 0}%</span>
                </div>
                <input type="range" min="0" max="100" value={config.strokeFadeRange || 0} onChange={(e) => modifyConfig({ strokeFadeRange: parseInt(e.target.value), strokeEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
              </div>

              {/* Double Stroke Settings */}
              {config.strokeType === "double" && (
                <div className="flex flex-col gap-3.5 bg-[#15151C] border border-[#2A2A38]/50 rounded-lg p-3 mt-1 animation-fade-in text-left">
                  <div className="text-[9px] uppercase font-mono tracking-wider text-[#7C6FFF] font-bold">Double Stroke Outline Config</div>
                  {/* Secondary Color Selector */}
                  <div>
                    <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-1">Outer Secondary Color</label>
                    <div className="flex items-center gap-2 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-1.5">
                      <input type="color" value={(config.strokeColorSecondary || "#FFFFFF").startsWith("#") ? config.strokeColorSecondary : "#ffffff"} onChange={(e) => modifyConfig({ strokeColorSecondary: e.target.value, strokeEnabled: true })} className="w-6 h-6 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                      <input type="text" value={config.strokeColorSecondary || "#FFFFFF"} onChange={(e) => modifyConfig({ strokeColorSecondary: e.target.value, strokeEnabled: true })} className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none" />
                    </div>
                  </div>

                  {/* Secondary Width Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[9px] uppercase font-mono text-clypra-muted">Outer Expansion Width</label>
                      <span className="text-[10px] font-mono text-white">+{config.strokeWidthSecondary !== undefined ? config.strokeWidthSecondary : 4}px</span>
                    </div>
                    <input type="range" min="1" max="30" value={config.strokeWidthSecondary !== undefined ? config.strokeWidthSecondary : 4} onChange={(e) => modifyConfig({ strokeWidthSecondary: parseInt(e.target.value), strokeEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 5 — Glow Layers
          ────────────────────────────────────────────────────── */}
      <div id="section-card-glow" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("glow")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">5. Outer / Inner Glows</span>
          </div>
          {collapsedSections.glow ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.glow && (
          <div className="p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between hover:underline select-none">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">Glow Specifiers ({config.glowLayers.length})</span>
              {config.glowLayers.length < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    modifyConfig((p) => ({
                      ...p,
                      glowLayers: [...p.glowLayers, { enabled: true, color: "#FFE600", blur: 30, opacity: 90, type: "outer", strength: 3, spread: 4 }],
                    }));
                  }}
                  className="text-[9px] font-mono text-[#7C6FFF] flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={10} /> Add Layer
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-1 select-none">
              {config.glowLayers.length === 0 && <div className="p-2 border border-dashed border-[#2A2A38] rounded-md text-center text-xs text-clypra-muted">No active glow channels configured.</div>}

              {config.glowLayers.map((layer, lidx) => (
                <div key={lidx} className="bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-3 flex flex-col gap-2.5 relative">
                  <div className="flex items-center justify-between border-b border-[#2A2A38]/60 pb-1.5 mb-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={layer.enabled}
                        onChange={(e) => {
                          modifyConfig((p) => {
                            const layers = [...p.glowLayers];
                            layers[lidx] = { ...layers[lidx], enabled: e.target.checked };
                            return { ...p, glowLayers: layers };
                          });
                        }}
                        className="accent-[#7C6FFF] cursor-pointer"
                      />
                      <span className="text-[10px] font-mono font-medium text-white">Layer #{lidx + 1}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        modifyConfig((p) => ({
                          ...p,
                          glowLayers: p.glowLayers.filter((_, i) => i !== lidx),
                        }));
                      }}
                      className="p-0.5 text-clypra-muted hover:text-red-500 rounded cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {layer.enabled && (
                    <div className="flex flex-col gap-2.5">
                      {/* Color */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layer.color.startsWith("#") ? layer.color : "#7c6fff"}
                          onChange={(e) => {
                            modifyConfig((p) => {
                              const layers = [...p.glowLayers];
                              layers[lidx] = { ...layers[lidx], color: e.target.value };
                              return { ...p, glowLayers: layers };
                            });
                          }}
                          className="w-6 h-6 bg-transparent border-none cursor-pointer p-0 shrink-0"
                        />
                        <input
                          type="text"
                          value={layer.color}
                          onChange={(e) => {
                            modifyConfig((p) => {
                              const layers = [...p.glowLayers];
                              layers[lidx] = { ...layers[lidx], color: e.target.value };
                              return { ...p, glowLayers: layers };
                            });
                          }}
                          className="flex-1 bg-[#15151C] border border-[#2A2A38] p-1 text-[10px] text-white font-mono rounded"
                        />
                      </div>

                      {/* Blur & Opacity */}
                      <div className="grid grid-cols-2 gap-3.5 mt-1">
                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[9px] font-mono text-clypra-muted">Blur</span>
                            <span className="text-[9px] font-mono text-white">{layer.blur}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="150"
                            value={layer.blur}
                            onChange={(e) => {
                              modifyConfig((p) => {
                                const layers = [...p.glowLayers];
                                layers[lidx] = { ...layers[lidx], blur: parseInt(e.target.value) };
                                return { ...p, glowLayers: layers };
                              });
                            }}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[9px] font-mono text-clypra-muted">Opacity</span>
                            <span className="text-[9px] font-mono text-white">{layer.opacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={layer.opacity}
                            onChange={(e) => {
                              modifyConfig((p) => {
                                const layers = [...p.glowLayers];
                                layers[lidx] = { ...layers[lidx], opacity: parseInt(e.target.value) };
                                return { ...p, glowLayers: layers };
                              });
                            }}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                          />
                        </div>
                      </div>

                      {/* Inner / Outer Segmented */}
                      <div className="grid grid-cols-2 gap-0.5 bg-[#15151C] border border-[#2A2A38]/80 p-0.5 rounded-lg text-center mt-1">
                        {["outer", "inner"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              modifyConfig((p) => {
                                const layers = [...p.glowLayers];
                                layers[lidx] = { ...layers[lidx], type: t as any };
                                return { ...p, glowLayers: layers };
                              });
                            }}
                            className={`py-0.5 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${layer.type === t ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      {/* Strength & Spread Sliders */}
                      <div className="grid grid-cols-2 gap-3.5 mt-1 border-t border-[#2A2A38]/50 pt-2.5">
                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[9px] font-mono text-clypra-muted">Strength</span>
                            <span className="text-[9px] font-mono text-white">{layer.strength ?? 1}x</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={layer.strength ?? 1}
                            onChange={(e) => {
                              modifyConfig((p) => {
                                const layers = [...p.glowLayers];
                                layers[lidx] = { ...layers[lidx], strength: parseInt(e.target.value) };
                                return { ...p, glowLayers: layers };
                              });
                            }}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[9px] font-mono text-clypra-muted">Spread</span>
                            <span className="text-[9px] font-mono text-white">{layer.spread ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={layer.spread ?? 0}
                            onChange={(e) => {
                              modifyConfig((p) => {
                                const layers = [...p.glowLayers];
                                layers[lidx] = { ...layers[lidx], spread: parseInt(e.target.value) };
                                return { ...p, glowLayers: layers };
                              });
                            }}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 6 — Shadow
          ────────────────────────────────────────────────────── */}
      <div id="section-card-shadow" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("shadow")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Moon size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">6. Back Shadow</span>
          </div>
          {collapsedSections.shadow ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.shadow && (
          <div className="p-3.5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">Enable Shadow</span>
              <input type="checkbox" checked={config.shadowEnabled} onChange={(e) => modifyConfig({ shadowEnabled: e.target.checked })} className="accent-[#7C6FFF] w-4 h-4 cursor-pointer" />
            </div>

            <div className="flex flex-col gap-3 border-t border-[#2A2A38]/50 pt-3 select-none">
              {/* Color */}
              <div className="flex items-center gap-3 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2">
                <input type="color" value={config.shadowColor.startsWith("#") ? config.shadowColor : "#000000"} onChange={(e) => modifyConfig({ shadowColor: e.target.value, shadowEnabled: true })} className="w-7 h-7 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                <input type="text" value={config.shadowColor} onChange={(e) => modifyConfig({ shadowColor: e.target.value, shadowEnabled: true })} className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none" />
              </div>

              {/* Blur */}
              <div>
                <div className="flex justify-between mb-0.5">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">Shadow Blur</label>
                  <span className="text-[10px] font-mono text-white">{config.shadowBlur}px</span>
                </div>
                <input type="range" min="0" max="60" value={config.shadowBlur} onChange={(e) => modifyConfig({ shadowBlur: parseInt(e.target.value), shadowEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
              </div>

              {/* Offsets */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px] uppercase font-mono text-clypra-muted">Offset X</span>
                    <span className="text-[10px] font-mono text-white">{config.shadowOffsetX}px</span>
                  </div>
                  <input type="range" min="-50" max="50" value={config.shadowOffsetX} onChange={(e) => modifyConfig({ shadowOffsetX: parseInt(e.target.value), shadowEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                </div>

                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px] uppercase font-mono text-clypra-muted">Offset Y</span>
                    <span className="text-[10px] font-mono text-white">{config.shadowOffsetY}px</span>
                  </div>
                  <input type="range" min="-50" max="50" value={config.shadowOffsetY} onChange={(e) => modifyConfig({ shadowOffsetY: parseInt(e.target.value), shadowEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                </div>
              </div>

              {/* Opacity */}
              <div>
                <div className="flex justify-between mb-0.5">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">Shadow Opacity</label>
                  <span className="text-[10px] font-mono text-white">{config.shadowOpacity}%</span>
                </div>
                <input type="range" min="0" max="100" value={config.shadowOpacity} onChange={(e) => modifyConfig({ shadowOpacity: parseInt(e.target.value), shadowEnabled: true })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
              </div>

              {/* Drop / Inner Type */}
              <div>
                <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Projection Model</label>
                <div className="grid grid-cols-2 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center font-semibold select-none">
                  {["drop", "inner"].map((t) => (
                    <button key={t} type="button" onClick={() => modifyConfig({ shadowType: t as any, shadowEnabled: true })} className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${config.shadowType === t ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`}>
                      {t} shadow
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 7 — 3D Bevel
          ────────────────────────────────────────────────────── */}
      <div id="section-card-bevel" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("bevel")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Compass size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">7. 3D Extrusion Bevel</span>
          </div>
          {collapsedSections.bevel ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.bevel && (
          <div className="p-3.5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">Enable 3D Depth</span>
              <input type="checkbox" checked={config.bevelEnabled} onChange={(e) => modifyConfig({ bevelEnabled: e.target.checked })} className="accent-[#7C6FFF] w-4 h-4 cursor-pointer" />
            </div>

            <div className="flex flex-col gap-3 border-t border-[#2A2A38]/50 pt-3 select-none">
              {/* Depth */}
              <div>
                <div className="flex justify-between mb-0.5">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">Extrusion Depth</label>
                  <span className="text-[10px] font-mono text-white">{config.bevelDepth}px</span>
                </div>
                <input type="range" min="1" max="60" value={config.bevelDepth} onChange={(e) => modifyConfig({ bevelDepth: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
              </div>

              {/* Projection Mode */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase font-mono text-clypra-muted">3D Projection Type</label>
                  <span className="text-[10px] uppercase font-bold text-[#7C6FFF]">{config.bevelPerspectiveEnabled ? "Perspective" : "Parallel"}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none font-semibold">
                  <button type="button" onClick={() => modifyConfig({ bevelPerspectiveEnabled: false })} className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${!config.bevelPerspectiveEnabled ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-[#888899]"}`}>
                    Parallel (Isometric)
                  </button>
                  <button type="button" onClick={() => modifyConfig({ bevelPerspectiveEnabled: true })} className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${config.bevelPerspectiveEnabled ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-[#888899]"}`}>
                    Perspective (V.P.)
                  </button>
                </div>
              </div>

              {/* Parallel / Perspective Controls */}
              {!config.bevelPerspectiveEnabled ? (
                /* Direction for Parallel type */
                <div>
                  <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Depth Angle Direction</label>
                  <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none font-semibold">
                    {["bottom-right", "bottom", "right"].map((dir) => (
                      <button key={dir} type="button" onClick={() => modifyConfig({ bevelDirection: dir as any })} className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${config.bevelDirection === dir ? "bg-[#7C6FFF] text-white" : "text-clypra-muted pr-0.5"}`}>
                        {dir.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Sliders for Perspective type */
                <div className="flex flex-col gap-2.5 bg-[#0E0E12] border border-[#2A2A38]/50 p-2.5 rounded-lg select-none">
                  <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">Vanishing Point & Projection Settings</span>

                  {/* Vanishing Point X */}
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[8px] uppercase font-mono text-clypra-muted">Vanishing Point X</label>
                      <span className="text-[9px] font-mono text-white">{config.bevelVanishingPointX !== undefined ? config.bevelVanishingPointX : 40}%</span>
                    </div>
                    <input type="range" min="-200" max="200" value={config.bevelVanishingPointX !== undefined ? config.bevelVanishingPointX : 40} onChange={(e) => modifyConfig({ bevelVanishingPointX: parseInt(e.target.value) })} className="w-full accent-teal-400 cursor-ew-resize" />
                  </div>

                  {/* Vanishing Point Y */}
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[8px] uppercase font-mono text-clypra-muted">Vanishing Point Y</label>
                      <span className="text-[9px] font-mono text-white">{config.bevelVanishingPointY !== undefined ? config.bevelVanishingPointY : 80}%</span>
                    </div>
                    <input type="range" min="-200" max="200" value={config.bevelVanishingPointY !== undefined ? config.bevelVanishingPointY : 80} onChange={(e) => modifyConfig({ bevelVanishingPointY: parseInt(e.target.value) })} className="w-full accent-teal-400 cursor-ew-resize" />
                  </div>

                  {/* Focal Length */}
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[8px] uppercase font-mono text-clypra-muted font-semibold">Focal Tension (Scale Recess)</label>
                      <span className="text-[9px] font-mono text-white">{config.bevelFocalLength !== undefined ? config.bevelFocalLength : 400}px</span>
                    </div>
                    <input type="range" min="100" max="1500" step="20" value={config.bevelFocalLength !== undefined ? config.bevelFocalLength : 400} onChange={(e) => modifyConfig({ bevelFocalLength: parseInt(e.target.value) })} className="w-full accent-teal-400 cursor-ew-resize" />
                  </div>
                </div>
              )}

              {/* Colors */}
              <div className="flex flex-col gap-3 bg-[#0E0E12] border border-[#2A2A38] p-3 rounded-lg">
                {/* 1. Highlight / Front Face */}
                <div>
                  <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5" title="The topmost highlight layer of the 3D block">
                    Front Face Highlight
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.bevelHighlight.startsWith("#") ? config.bevelHighlight : "#ffffff"} onChange={(e) => modifyConfig({ bevelHighlight: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                    <input type="text" value={config.bevelHighlight} onChange={(e) => modifyConfig({ bevelHighlight: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono" />
                  </div>
                </div>

                {/* 2. Core Body Color */}
                <div>
                  <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5" title="Main body filler color between front and back">
                    Core Extrusion Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={(config.bevelCoreColor || "#000000").startsWith("#") ? config.bevelCoreColor || "#000000" : "#000000"} onChange={(e) => modifyConfig({ bevelCoreColor: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                    <input type="text" value={config.bevelCoreColor || ""} placeholder="e.g. #FF5500" onChange={(e) => modifyConfig({ bevelCoreColor: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700" />
                  </div>
                </div>

                {/* 3. Deep Extrusion Anchor Shadow */}
                <div>
                  <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5" title="The deepest back shadow of the 3D block">
                    Deep Anchor Shadow (Base)
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.bevelShadow.startsWith("#") ? config.bevelShadow : "#000000"} onChange={(e) => modifyConfig({ bevelShadow: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                    <input type="text" value={config.bevelShadow} onChange={(e) => modifyConfig({ bevelShadow: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono" />
                  </div>
                </div>

                {/* 4. Slice Edge Outline Stroke */}
                <div className="border-t border-[#2A2A38]/50 pt-2.5 mt-1 space-y-2">
                  <label className="text-[9px] uppercase font-mono text-teal-400 font-bold tracking-wider block">Slice Edge Outlines</label>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <label className="text-[8px] uppercase font-mono text-clypra-muted">Edge Width</label>
                        <span className="text-[9px] font-mono text-white">{config.bevelEdgeWidth || 0}px</span>
                      </div>
                      <input type="range" min="0" max="10" step="0.5" value={config.bevelEdgeWidth || 0} onChange={(e) => modifyConfig({ bevelEdgeWidth: parseFloat(e.target.value) })} className="w-full accent-teal-400 cursor-ew-resize" />
                    </div>

                    <div>
                      <label className="text-[8px] uppercase font-mono text-clypra-muted block mb-0.5">Edge Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={(config.bevelEdgeColor || "#1e1e26").startsWith("#") ? config.bevelEdgeColor || "#1e1e26" : "#000000"} onChange={(e) => modifyConfig({ bevelEdgeColor: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                        <input type="text" value={config.bevelEdgeColor || ""} placeholder="#2A2A38" onChange={(e) => modifyConfig({ bevelEdgeColor: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700 w-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Extrusion Ambient Blur Glow */}
                <div className="border-t border-[#2A2A38]/50 pt-2.5 mt-1 space-y-2">
                  <label className="text-[9px] uppercase font-mono text-[#7C6FFF] font-bold tracking-wider block">Extrusion Blur (Ambient Glow)</label>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <label className="text-[8px] uppercase font-mono text-clypra-muted">Blur Radius</label>
                        <span className="text-[9px] font-mono text-white">{config.bevelBlur || 0}px</span>
                      </div>
                      <input type="range" min="0" max="30" value={config.bevelBlur || 0} onChange={(e) => modifyConfig({ bevelBlur: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                    </div>

                    <div>
                      <label className="text-[8px] uppercase font-mono text-clypra-muted block mb-0.5">Glow Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={(config.bevelBlurColor || "#000000").startsWith("#") ? config.bevelBlurColor || "#000000" : "#000000"} onChange={(e) => modifyConfig({ bevelBlurColor: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                        <input type="text" value={config.bevelBlurColor || ""} placeholder="#000000" onChange={(e) => modifyConfig({ bevelBlurColor: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 7.5 — Custom Text Multi-Stack Extrusion
          ────────────────────────────────────────────────────── */}
      <div id="section-card-stack" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("stack")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">7.5. Multi-Stack Layers</span>
          </div>
          {collapsedSections.stack ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.stack && (
          <div className="p-3.5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">Enable Stacking</span>
              <input type="checkbox" checked={config.stackEnabled || false} onChange={(e) => modifyConfig({ stackEnabled: e.target.checked })} className="accent-[#7C6FFF] w-4 h-4 cursor-pointer" />
            </div>

            {config.stackEnabled && (
              <div className="flex flex-col gap-3.5 border-t border-[#2A2A38]/50 pt-3 select-none">
                {/* Stack Count */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <label className="text-[10px] uppercase font-mono text-clypra-muted">Stack Count</label>
                    <span className="text-[10px] font-mono text-white">{config.stackCount || 3} layers</span>
                  </div>
                  <input type="range" min="1" max="6" value={config.stackCount || 1} onChange={(e) => modifyConfig({ stackCount: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                </div>

                {/* Stack Offsets */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[9px] uppercase font-mono text-clypra-muted">Offset X</label>
                      <span className="text-[9px] font-mono text-white">{config.stackOffsetX === undefined ? 10 : config.stackOffsetX}px</span>
                    </div>
                    <input type="range" min="-80" max="80" value={config.stackOffsetX === undefined ? 10 : config.stackOffsetX} onChange={(e) => modifyConfig({ stackOffsetX: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[9px] uppercase font-mono text-clypra-muted">Offset Y</label>
                      <span className="text-[9px] font-mono text-white">{config.stackOffsetY === undefined ? -10 : config.stackOffsetY}px</span>
                    </div>
                    <input type="range" min="-80" max="80" value={config.stackOffsetY === undefined ? -10 : config.stackOffsetY} onChange={(e) => modifyConfig({ stackOffsetY: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                  </div>
                </div>

                {/* Opacity Decay */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <label className="text-[10px] uppercase font-mono text-clypra-muted">Opacity Decay / Layer</label>
                    <span className="text-[10px] font-mono text-white">{config.stackOpacityDecay === undefined ? 20 : config.stackOpacityDecay}%</span>
                  </div>
                  <input type="range" min="0" max="90" value={config.stackOpacityDecay === undefined ? 20 : config.stackOpacityDecay} onChange={(e) => modifyConfig({ stackOpacityDecay: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                </div>

                {/* Stack Colors Repeat Palette */}
                <div className="border-t border-[#2A2A38]/50 pt-3 mt-1 flex flex-col gap-2.5">
                  <label className="text-[9px] uppercase font-mono text-teal-400 font-bold tracking-wider">Layer Repeat Colors</label>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5">Layer Color 1</label>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={(config.stackColor1 || "#FF7C00").startsWith("#") ? config.stackColor1 || "#FF7C00" : "#000000"} onChange={(e) => modifyConfig({ stackColor1: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                        <input type="text" value={config.stackColor1 || ""} placeholder="#FF7C00" onChange={(e) => modifyConfig({ stackColor1: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5">Layer Color 2</label>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={(config.stackColor2 || "#00FFDD").startsWith("#") ? config.stackColor2 || "#00FFDD" : "#000000"} onChange={(e) => modifyConfig({ stackColor2: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                        <input type="text" value={config.stackColor2 || ""} placeholder="#00FFDD" onChange={(e) => modifyConfig({ stackColor2: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5">Layer Color 3</label>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={(config.stackColor3 || "#FF00AA").startsWith("#") ? config.stackColor3 || "#FF00AA" : "#000000"} onChange={(e) => modifyConfig({ stackColor3: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                        <input type="text" value={config.stackColor3 || ""} placeholder="#FF00AA" onChange={(e) => modifyConfig({ stackColor3: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5">Layer Color 4</label>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={(config.stackColor4 || "#AA00FF").startsWith("#") ? config.stackColor4 || "#AA00FF" : "#000000"} onChange={(e) => modifyConfig({ stackColor4: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                        <input type="text" value={config.stackColor4 || ""} placeholder="#AA00FF" onChange={(e) => modifyConfig({ stackColor4: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 8 — Background Panel
          ────────────────────────────────────────────────────── */}
      <div id="section-card-panel" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("panel")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Layout size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">8. Bounding Plate</span>
          </div>
          {collapsedSections.panel ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.panel && (
          <div className="p-3.5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">Enable Bounding Plate</span>
              <input type="checkbox" checked={config.panelEnabled} onChange={(e) => modifyConfig({ panelEnabled: e.target.checked })} className="accent-[#7C6FFF] w-4 h-4 cursor-pointer" />
            </div>

            {config.panelEnabled && (
              <div className="flex flex-col gap-3.5 border-t border-[#2A2A38]/50 pt-3 select-none">
                {/* Color */}
                <div className="flex items-center gap-3 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2">
                  <input type="color" value={config.panelColor.startsWith("#") ? config.panelColor : "#1e1e26"} onChange={(e) => modifyConfig({ panelColor: e.target.value })} className="w-7 h-7 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                  <input type="text" value={config.panelColor} onChange={(e) => modifyConfig({ panelColor: e.target.value })} className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none" />
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <label className="text-[10px] uppercase font-mono text-clypra-muted">Plate Opacity</label>
                    <span className="text-[10px] font-mono text-white">{config.panelOpacity}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={config.panelOpacity} onChange={(e) => modifyConfig({ panelOpacity: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                </div>

                {/* Radius */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <label className="text-[10px] uppercase font-mono text-clypra-muted">Corner Radius</label>
                    <span className="text-[10px] font-mono text-white">{config.panelRadius}px</span>
                  </div>
                  <input type="range" min="0" max="60" value={config.panelRadius} onChange={(e) => modifyConfig({ panelRadius: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                </div>

                {/* Paddings */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] uppercase font-mono text-clypra-muted">Padding Horiz</span>
                      <span className="text-[10px] font-mono text-white">{config.panelPaddingX}px</span>
                    </div>
                    <input type="range" min="0" max="80" value={config.panelPaddingX} onChange={(e) => modifyConfig({ panelPaddingX: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] uppercase font-mono text-clypra-muted">Padding Vert</span>
                      <span className="text-[10px] font-mono text-white">{config.panelPaddingY}px</span>
                    </div>
                    <input type="range" min="0" max="40" value={config.panelPaddingY} onChange={(e) => modifyConfig({ panelPaddingY: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize" />
                  </div>
                </div>

                {/* Plate Stroke outline */}
                <div className="border-t border-[#2A2A38]/50 pt-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-mono text-clypra-muted">Border stroke outline</span>
                    <input type="checkbox" checked={config.panelStrokeEnabled} onChange={(e) => modifyConfig({ panelStrokeEnabled: e.target.checked })} className="accent-[#7C6FFF] w-4 h-4 cursor-pointer" />
                  </div>

                  {config.panelStrokeEnabled && (
                    <div className="flex flex-col gap-3 bg-[#0E0E12] border border-[#2A2A38]/80 rounded p-2.5">
                      {/* color */}
                      <div className="flex items-center gap-2">
                        <input type="color" value={config.panelStrokeColor.startsWith("#") ? config.panelStrokeColor : "#2a2a38"} onChange={(e) => modifyConfig({ panelStrokeColor: e.target.value })} className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0" />
                        <input type="text" value={config.panelStrokeColor} onChange={(e) => modifyConfig({ panelStrokeColor: e.target.value })} className="flex-1 bg-[#15151C] border border-[#2A2A38]/50 p-1 text-[10px] text-white font-mono rounded" />
                      </div>

                      {/* width */}
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[8px] uppercase font-mono text-clypra-muted">Border Width</span>
                          <span className="text-[9px] font-mono text-white">{config.panelStrokeWidth}px</span>
                        </div>
                        <input type="range" min="1" max="10" value={config.panelStrokeWidth} onChange={(e) => modifyConfig({ panelStrokeWidth: parseInt(e.target.value) })} className="w-full accent-[#7C6FFF] cursor-ew-resize h-1" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
          Section 9 — Canvas
          ────────────────────────────────────────────────────── */}
      <div id="section-card-canvas" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
        <div onClick={() => toggleSection("canvas")} className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer">
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-[#7C6FFF]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">9. Studio Canvas Layout</span>
          </div>
          {collapsedSections.canvas ? <ChevronDown size={14} className="text-clypra-muted" /> : <ChevronUp size={14} className="text-clypra-muted" />}
        </div>

        {!collapsedSections.canvas && (
          <div className="p-3.5 flex flex-col gap-3.5 select-none animate-fade-in">
            <div>
              <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1.5">Composition size</label>
              <div className="grid grid-cols-3 gap-1">
                {COMPOSITION_PRESETS.map((p) => (
                  <button key={p.id} type="button" title={p.description} onClick={() => applyCompositionPreset(p.id)} className="py-1.5 px-1 text-[9px] font-mono rounded border border-[#2A2A38] bg-[#0E0E12] text-clypra-muted hover:text-white hover:border-[#7C6FFF] cursor-pointer transition-all">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                <input type="checkbox" checked={config.wrapText !== false} onChange={(e) => modifyConfig({ wrapText: e.target.checked })} className="accent-[#7C6FFF]" />
                Wrap text to safe area
              </label>
              <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                <input type="checkbox" checked={!!config.autoFitText} onChange={(e) => modifyConfig({ autoFitText: e.target.checked })} className="accent-[#7C6FFF]" />
                Auto-fit while editing
              </label>
              <button type="button" onClick={fitTextToComposition} className="w-full py-1.5 text-[10px] font-mono uppercase tracking-wide rounded-lg border border-[#7C6FFF]/40 bg-[#7C6FFF]/10 text-[#7C6FFF] hover:bg-[#7C6FFF]/20 cursor-pointer transition-all">
                Fit text to composition now
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-0.5">Width px</label>
                <input type="number" min="200" max="2400" value={config.canvasWidth} onChange={(e) => modifyConfig({ canvasWidth: Math.max(200, Math.min(2400, parseInt(e.target.value) || 800)) })} className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-1.5 p text-xs text-white font-mono text-center focus:outline-none focus:border-[#7C6FFF]" />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-0.5">Height px</label>
                <input type="number" min="100" max="1200" value={config.canvasHeight} onChange={(e) => modifyConfig({ canvasHeight: Math.max(100, Math.min(1200, parseInt(e.target.value) || 200)) })} className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-[#7C6FFF]" />
              </div>
            </div>

            {/* Horizontal and vertical alignment segmented */}
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Horizontal Anchor</label>
                <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none font-semibold">
                  {["left", "center", "right"].map((align) => (
                    <button key={align} type="button" onClick={() => modifyConfig({ textPosX: align as any })} className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${config.textPosX === align ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`}>
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">Vertical Anchor</label>
                <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none font-semibold">
                  {["top", "middle", "bottom"].map((align) => (
                    <button key={align} type="button" onClick={() => modifyConfig({ textPosY: align as any })} className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${config.textPosY === align ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`}>
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
