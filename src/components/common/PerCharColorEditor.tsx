import React, { useMemo } from "react";
import { Palette, RotateCcw, Sparkles } from "lucide-react";
import type { TextEffectConfig } from "@clypra-studio/engine";
import {
  applyFillColorToAll,
  countTextGlyphs,
  rainbowCharFillColors,
  resizeCharFillColors,
  setCharFillColor,
} from "@clypra-studio/engine";
import { ClypraColorPicker } from "@clypra/ui-color-picker";

export type PerCharColorConfig = Partial<TextEffectConfig> & {
  text?: string;
  fillColor?: string;
  charFillColors?: string[];
  perCharFillEnabled?: boolean;
};

export interface PerCharColorEditorProps {
  config: PerCharColorConfig;
  onChange: (patch: Partial<TextEffectConfig>) => void;
}

function visibleChars(text: string): { char: string; index: number }[] {
  const out: { char: string; index: number }[] = [];
  let idx = 0;
  for (const ch of text) {
    if (ch === "\n") continue;
    out.push({ char: ch === " " ? "␣" : ch, index: idx });
    idx++;
  }
  return out;
}

export function PerCharColorEditor({ config, onChange }: PerCharColorEditorProps) {
  const glyphs = useMemo(() => visibleChars(config.text || ""), [config.text]);
  const colors = useMemo(
    () =>
      resizeCharFillColors(
        config.text || "",
        config.charFillColors,
        config.fillColor || "#ffffff"
      ),
    [config.text, config.charFillColors, config.fillColor]
  );

  const enabled = !config.perCharFillEnabled;
  const glyphCount = countTextGlyphs(config.text || "");

  const patchColors = (next: string[]) => {
    onChange({ charFillColors: next, perCharFillEnabled: true });
  };

  const toggleEnabled = (on: boolean) => {
    if (on) {
      onChange({
        perCharFillEnabled: true,
        charFillColors: resizeCharFillColors(
          config.text || "",
          config.charFillColors,
          config.fillColor || "#ffffff"
        ),
      });
    } else {
      onChange({ perCharFillEnabled: false });
    }
  };

  if (glyphCount === 0) {
    return <p className="text-[10px] text-gray-500 px-1">Enter text to color individual characters.</p>;
  }

  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[10px] uppercase font-mono text-clypra-muted cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toggleEnabled(e.target.checked)}
            className="accent-[#8B5CF6]"
          />
          <Palette size={12} className="text-[#8B5CF6]" />
          Per-character color
        </label>
        {enabled && (
          <div className="flex gap-1">
            <button
              type="button"
              title="Apply base fill to all glyphs"
              onClick={() => patchColors(applyFillColorToAll(colors, config.fillColor || "#ffffff"))}
              className="p-1 rounded border border-[#2A2A38] text-gray-400 hover:text-white cursor-pointer"
            >
              <RotateCcw size={11} />
            </button>
            <button
              type="button"
              title="Rainbow sweep"
              onClick={() => patchColors(rainbowCharFillColors(config.text || ""))}
              className="p-1 rounded border border-[#8B5CF6]/40 text-[#8B5CF6] hover:bg-[#8B5CF6]/10 cursor-pointer"
            >
              <Sparkles size={11} />
            </button>
          </div>
        )}
      </div>

      {enabled && (
        <>
          <p className="text-[9px] text-gray-600 leading-snug">
            Solid fill only. Each chip is one character in reading order (spaces shown as ␣).
          </p>
          <div className="flex flex-wrap gap-1.5 custom-scrollbar">
            {glyphs.map(({ char, index }) => {
              const charColor = colors[index] || config.fillColor || "#ffffff";
              return (
                <div
                  key={index}
                  className="group flex flex-col items-center gap-0.5"
                  title={`Character ${index + 1}: ${char === "␣" ? "space" : char}`}
                >
                  <ClypraColorPicker
                    value={charColor}
                    onChange={(c) => patchColors(setCharFillColor(colors, index, c))}
                    onChangeComplete={(c) => patchColors(setCharFillColor(colors, index, c))}
                    format="hex"
                    showAlpha={false}
                    size="sm"
                    triggerClassName="w-6 h-6 p-0 border border-[#2A2A38] rounded"
                    popoverClassName="mt-1 z-[100]"
                  />
                  <span className="text-[8px] font-mono text-gray-500 group-hover:text-[#8B5CF6]">
                    {char}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
