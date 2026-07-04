import React, { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import type { Preset, TextEffectConfig } from "@clypra-studio/engine";
import { TextEffectRenderer } from "@clypra-studio/engine";

interface PresetChipProps {
  preset: Preset;
  activePresetId: string;
  handleApplyPreset: (preset: Preset) => void;
  handleDeletePreset: (id: string, event: React.MouseEvent) => void;
}

export const PresetChip: React.FC<PresetChipProps> = ({ preset, activePresetId, handleApplyPreset, handleDeletePreset }) => {
  const canvasRefMini = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRefMini.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 80;
    canvas.height = 30;

    const miniCfg: TextEffectConfig = {
      ...preset.config,
      text: preset.config.text.substring(0, 5) || "TEXT",
      fontSize: 14,
      letterSpacing: 0,
      strokeWidth: Math.max(0.5, preset.config.strokeWidth * 0.15),
      bevelDepth: preset.config.bevelDepth * 0.15,
      canvasWidth: 80,
      canvasHeight: 30,
      textPosX: "center",
      textPosY: "middle",
      panelPaddingX: preset.config.panelPaddingX * 0.1,
      panelPaddingY: preset.config.panelPaddingY * 0.1,
      panelRadius: preset.config.panelRadius * 0.15,
      panelStrokeWidth: Math.max(0.5, preset.config.panelStrokeWidth * 0.15),
      shadowBlur: preset.config.shadowBlur * 0.15,
      shadowOffsetX: preset.config.shadowOffsetX * 0.15,
      shadowOffsetY: preset.config.shadowOffsetY * 0.15,
      glowLayers: preset.config.glowLayers.map((layer) => ({
        ...layer,
        blur: Math.min(layer.blur * 0.15, 8),
      })),
    };

    TextEffectRenderer.draw(ctx, miniCfg);
  }, [preset]);

  const isActive = activePresetId === preset.id;

  return (
    <div id={`preset-chip-${preset.id}`} onClick={() => handleApplyPreset(preset)} className={`group relative flex shrink-0 cursor-pointer select-none items-center justify-between gap-2.5 rounded-lg border p-1.5 px-3 transition-all duration-150 ${isActive ? "border-[#7C6FFF] bg-[#1E1E26] shadow-[0_0_10px_rgba(124,111,255,0.15)]" : "border-[#2A2A38] bg-[#15151C]/60 hover:border-[#7C6FFF]/50 hover:bg-[#1C1C24]"}`}>
      <span className="max-w-[85px] truncate font-sans text-[11px] font-medium text-white">{preset.name}</span>
      <canvas ref={canvasRefMini} className="h-[30px] w-[80px] rounded border border-gray-900 bg-[#09090D] shadow-inner" />
      {preset.isCustom && (
        <button id={`delete-preset-${preset.id}`} type="button" title="Delete custom preset" aria-label={`Delete ${preset.name}`} onClick={(event) => handleDeletePreset(preset.id, event)} className="absolute -right-1.5 -top-1.5 z-20 flex rounded-full bg-red-700 p-0.5 text-white opacity-0 transition-opacity hover:bg-red-800 group-hover:opacity-100">
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};
