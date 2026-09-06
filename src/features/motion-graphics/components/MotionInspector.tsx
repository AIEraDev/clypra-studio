import React from "react";
import { Sliders, Type, Sparkles, Clock, Layers } from "lucide-react";
import type {
  MotionGraphicTemplate,
  MotionLayer,
  BlendMode,
  TextLayerProps,
  VectorBurstLayerProps,
  LightningArcsLayerProps,
  FireStreaksLayerProps,
} from "../types";
import { SUPPORTED_FONT_FAMILIES } from "../../../constants/fonts";

interface MotionInspectorProps {
  template: MotionGraphicTemplate;
  selectedLayerId: string | null;
  onUpdateTemplate: (updater: (prev: MotionGraphicTemplate) => MotionGraphicTemplate) => void;
  onUpdateLayer: (layerId: string, updater: (layer: MotionLayer) => MotionLayer) => void;
}

export function MotionInspector({
  template,
  selectedLayerId,
  onUpdateTemplate,
  onUpdateLayer,
}: MotionInspectorProps) {
  const selectedLayer = template.layers.find((l) => l.id === selectedLayerId) ?? template.layers[0];

  const handleUpdatePhaseTiming = (field: keyof MotionGraphicTemplate["phaseTiming"], value: number) => {
    onUpdateTemplate((prev) => ({
      ...prev,
      phaseTiming: {
        ...prev.phaseTiming,
        [field]: Math.max(0.1, Math.round(value * 100) / 100),
      },
    }));
  };

  const updateTextConfig = (patch: Partial<TextLayerProps["config"]>) => {
    if (!selectedLayer) return;
    onUpdateLayer(selectedLayer.id, (l) =>
      l.type === "text" ? { ...l, config: { ...l.config, ...patch } } : l,
    );
  };

  const updateBurstConfig = (patch: Partial<VectorBurstLayerProps["config"]>) => {
    if (!selectedLayer) return;
    onUpdateLayer(selectedLayer.id, (l) =>
      l.type === "vector-burst" ? { ...l, config: { ...l.config, ...patch } } : l,
    );
  };

  const updateLightningConfig = (patch: Partial<LightningArcsLayerProps["config"]>) => {
    if (!selectedLayer) return;
    onUpdateLayer(selectedLayer.id, (l) =>
      l.type === "lightning-arcs" ? { ...l, config: { ...l.config, ...patch } } : l,
    );
  };

  return (
    <div className="w-80 border-l border-[#1e1e2d] bg-[#0d0d14] text-white flex flex-col h-full overflow-y-auto select-none">
      {/* Inspector Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a26]">
        <Sliders className="w-4 h-4 text-[#7c6fff]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-200">
          Motion Inspector
        </span>
      </div>

      <div className="p-4 space-y-6">
        {/* Phase Timing Section */}
        <div className="space-y-3 p-3 rounded-xl bg-[#13131c] border border-white/5">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Lifecycle Phase Timing</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>⚡ Intro (Entrance)</span>
                <span className="font-mono text-purple-300">
                  {template.phaseTiming.introDuration.toFixed(2)}s
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.0}
                step={0.05}
                value={template.phaseTiming.introDuration}
                onChange={(e) => handleUpdatePhaseTiming("introDuration", parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1.5 bg-[#1f1f2e] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>⚓ Hold (Resting Loop)</span>
                <span className="font-mono text-emerald-300">
                  {template.phaseTiming.holdDuration.toFixed(2)}s
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.1}
                value={template.phaseTiming.holdDuration}
                onChange={(e) => handleUpdatePhaseTiming("holdDuration", parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-[#1f1f2e] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>💨 Outro (Exit)</span>
                <span className="font-mono text-rose-300">
                  {template.phaseTiming.outroDuration.toFixed(2)}s
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.0}
                step={0.05}
                value={template.phaseTiming.outroDuration}
                onChange={(e) => handleUpdatePhaseTiming("outroDuration", parseFloat(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-[#1f1f2e] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Selected Layer Properties */}
        {selectedLayer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c28]">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Layers className="w-3.5 h-3.5 text-[#7c6fff]" />
                <span>{selectedLayer.name}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                {selectedLayer.type}
              </span>
            </div>

            {/* Phase Scope & Blend Mode */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Phase Scope</label>
                <select
                  value={selectedLayer.phaseScope}
                  onChange={(e) =>
                    onUpdateLayer(selectedLayer.id, (l) => ({
                      ...l,
                      phaseScope: e.target.value as any,
                    }))
                  }
                  className="w-full rounded border border-[#262638] bg-[#12121c] px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c6fff]"
                >
                  <option value="all">All Phases</option>
                  <option value="intro-only">Intro Only</option>
                  <option value="hold-only">Hold Only</option>
                  <option value="outro-only">Outro Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Blend Mode</label>
                <select
                  value={selectedLayer.blendMode}
                  onChange={(e) =>
                    onUpdateLayer(selectedLayer.id, (l) => ({
                      ...l,
                      blendMode: e.target.value as BlendMode,
                    }))
                  }
                  className="w-full rounded border border-[#262638] bg-[#12121c] px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c6fff]"
                >
                  <option value="source-over">Normal</option>
                  <option value="lighter">Additive (Lighter)</option>
                  <option value="screen">Screen</option>
                  <option value="multiply">Multiply</option>
                </select>
              </div>
            </div>

            {/* Text Layer Specifics */}
            {selectedLayer.type === "text" && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Live Text Content</label>
                  <input
                    type="text"
                    value={(selectedLayer as TextLayerProps).config.text}
                    onChange={(e) => updateTextConfig({ text: e.target.value })}
                    className="w-full rounded border border-[#262638] bg-[#12121c] px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#7c6fff] font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Font Family</label>
                    <select
                      value={(selectedLayer as TextLayerProps).config.fontFamily}
                      onChange={(e) => updateTextConfig({ fontFamily: e.target.value })}
                      className="w-full rounded border border-[#262638] bg-[#12121c] px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c6fff]"
                    >
                      {SUPPORTED_FONT_FAMILIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Font Size (px)</label>
                    <input
                      type="number"
                      value={(selectedLayer as TextLayerProps).config.fontSize}
                      onChange={(e) => updateTextConfig({ fontSize: parseInt(e.target.value) || 80 })}
                      className="w-full rounded border border-[#262638] bg-[#12121c] px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c6fff]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(selectedLayer as TextLayerProps).config.fill}
                        onChange={(e) => updateTextConfig({ fill: e.target.value })}
                        className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-xs text-gray-300">
                        {(selectedLayer as TextLayerProps).config.fill}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Stroke Width</label>
                    <input
                      type="number"
                      value={(selectedLayer as TextLayerProps).config.strokeWidth}
                      onChange={(e) => updateTextConfig({ strokeWidth: parseInt(e.target.value) || 0 })}
                      className="w-full rounded border border-[#262638] bg-[#12121c] px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c6fff]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-400 mb-1 text-[11px]">
                    <span>Letter Spacing (Tracking)</span>
                    <span className="font-mono text-white text-[10px]">
                      {((selectedLayer as TextLayerProps).config.tracking ?? 0)}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={50}
                    step={1}
                    value={(selectedLayer as TextLayerProps).config.tracking ?? 0}
                    onChange={(e) => updateTextConfig({ tracking: parseInt(e.target.value) || 0 })}
                    className="w-full accent-[#7c6fff] h-1.5 bg-[#1f1f2e] rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Glow Color</label>
                    <input
                      type="color"
                      value={(selectedLayer as TextLayerProps).config.glowColor || "#ff0033"}
                      onChange={(e) => updateTextConfig({ glowColor: e.target.value })}
                      className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Glow Radius</label>
                    <input
                      type="number"
                      value={(selectedLayer as TextLayerProps).config.glowRadius || 0}
                      onChange={(e) => updateTextConfig({ glowRadius: parseInt(e.target.value) || 0 })}
                      className="w-full rounded border border-[#262638] bg-[#12121c] px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c6fff]"
                    />
                  </div>
                </div>

                {/* Cloud & Per-Character Motion Controls */}
                <div className="pt-3 border-t border-[#1f1f2e] space-y-2.5">
                  <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
                    Cloud & Glyph Dynamics
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-gray-300">Per-Character Stagger</label>
                    <input
                      type="checkbox"
                      checked={!!(selectedLayer as TextLayerProps).config.perCharacter}
                      onChange={(e) => updateTextConfig({ perCharacter: e.target.checked })}
                      className="accent-[#7c6fff] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {(selectedLayer as TextLayerProps).config.perCharacter && (
                    <div className="space-y-2 pt-1 text-xs">
                      <div>
                        <div className="flex justify-between text-gray-400 mb-1 text-[10px]">
                          <span>Stagger Delay</span>
                          <span className="font-mono">
                            {((selectedLayer as TextLayerProps).config.staggerDelay ?? 0.07).toFixed(2)}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.02}
                          max={0.2}
                          step={0.01}
                          value={(selectedLayer as TextLayerProps).config.staggerDelay ?? 0.07}
                          onChange={(e) => updateTextConfig({ staggerDelay: parseFloat(e.target.value) })}
                          className="w-full accent-[#7c6fff] h-1.5 bg-[#1f1f2e] rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-gray-300">Ghost Motion Trails</label>
                        <input
                          type="checkbox"
                          checked={!!(selectedLayer as TextLayerProps).config.ghostTrail}
                          onChange={(e) => updateTextConfig({ ghostTrail: e.target.checked })}
                          className="accent-[#7c6fff] w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-gray-300">Idle Floating Cloud Wave</label>
                        <input
                          type="checkbox"
                          checked={!!(selectedLayer as TextLayerProps).config.idleWave}
                          onChange={(e) => updateTextConfig({ idleWave: e.target.checked })}
                          className="accent-[#7c6fff] w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cloud Atmosphere & Outer Contour */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="text-[11px] text-gray-300">Atmospheric Cloud Halo</label>
                    <input
                      type="checkbox"
                      checked={!!(selectedLayer as TextLayerProps).config.cloudHalo}
                      onChange={(e) => updateTextConfig({ cloudHalo: e.target.checked })}
                      className="accent-[#7c6fff] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Outer White Border</label>
                      <input
                        type="number"
                        value={(selectedLayer as TextLayerProps).config.cloudOuterStrokeWidth ?? 0}
                        onChange={(e) => updateTextConfig({ cloudOuterStrokeWidth: parseInt(e.target.value) || 0, cloudOuterStrokeColor: "#ffffff" })}
                        className="w-full rounded border border-[#262638] bg-[#12121c] px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c6fff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Cloud Blur (px)</label>
                      <input
                        type="number"
                        value={(selectedLayer as TextLayerProps).config.cloudHaloRadius ?? 60}
                        onChange={(e) => updateTextConfig({ cloudHaloRadius: parseInt(e.target.value) || 0 })}
                        className="w-full rounded border border-[#262638] bg-[#12121c] px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c6fff]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comic Burst Specifics */}
            {selectedLayer.type === "vector-burst" && (
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>Burst Points</span>
                    <span className="font-mono">
                      {(selectedLayer as VectorBurstLayerProps).config.points}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={24}
                    value={(selectedLayer as VectorBurstLayerProps).config.points}
                    onChange={(e) => updateBurstConfig({ points: parseInt(e.target.value) })}
                    className="w-full accent-[#7c6fff] h-1.5 bg-[#1f1f2e] rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Card Fill</label>
                    <input
                      type="color"
                      value={(selectedLayer as VectorBurstLayerProps).config.fillColor}
                      onChange={(e) => updateBurstConfig({ fillColor: e.target.value })}
                      className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Outer Glow</label>
                    <input
                      type="color"
                      value={(selectedLayer as VectorBurstLayerProps).config.glowColor || "#ff0000"}
                      onChange={(e) => updateBurstConfig({ glowColor: e.target.value })}
                      className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Lightning Arcs Specifics */}
            {selectedLayer.type === "lightning-arcs" && (
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>Arc Count</span>
                    <span className="font-mono">
                      {(selectedLayer as LightningArcsLayerProps).config.count}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={(selectedLayer as LightningArcsLayerProps).config.count}
                    onChange={(e) => updateLightningConfig({ count: parseInt(e.target.value) })}
                    className="w-full accent-sky-400 h-1.5 bg-[#1f1f2e] rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Arc Color</label>
                    <input
                      type="color"
                      value={(selectedLayer as LightningArcsLayerProps).config.color}
                      onChange={(e) => updateLightningConfig({ color: e.target.value })}
                      className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Core Color</label>
                    <input
                      type="color"
                      value={(selectedLayer as LightningArcsLayerProps).config.coreColor}
                      onChange={(e) => updateLightningConfig({ coreColor: e.target.value })}
                      className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
