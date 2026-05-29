import React, { useMemo } from "react";
import { Palette, RotateCcw, Sparkles } from "lucide-react";
import type { TextEffectConfig } from "../types";
import { applyFillColorToAll, countTextGlyphs, rainbowCharFillColors, resizeCharFillColors, setCharFillColor } from "../engine/perCharFill";

interface PerCharColorEditorProps {
  config: TextEffectConfig;
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
  const colors = useMemo(() => resizeCharFillColors(config.text || "", config.charFillColors, config.fillColor || "#ffffff"), [config.text, config.charFillColors, config.fillColor]);

  const enabled = !!config.perCharFillEnabled;
  const glyphCount = countTextGlyphs(config.text || "");

  const patchColors = (next: string[]) => {
    onChange({ charFillColors: next, perCharFillEnabled: true, customRenderer: undefined });
  };

  const toggleEnabled = (on: boolean) => {
    if (on) {
      onChange({
        perCharFillEnabled: true,
        charFillColors: resizeCharFillColors(config.text || "", config.charFillColors, config.fillColor || "#ffffff"),
        customRenderer: undefined,
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
        <label className="flex items-center gap-2 text-[10px] uppercase font-mono text-[#666677] cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => toggleEnabled(e.target.checked)} className="accent-[#7C6FFF]" />
          <Palette size={12} className="text-[#7C6FFF]" />
          Per-character color
        </label>
        {enabled && (
          <div className="flex gap-1">
            <button type="button" title="Apply base fill to all glyphs" onClick={() => patchColors(applyFillColorToAll(colors, config.fillColor || "#ffffff"))} className="p-1 rounded border border-[#2A2A38] text-gray-400 hover:text-white cursor-pointer">
              <RotateCcw size={11} />
            </button>
            <button type="button" title="Rainbow sweep" onClick={() => patchColors(rainbowCharFillColors(config.text || ""))} className="p-1 rounded border border-[#7C6FFF]/40 text-[#7C6FFF] hover:bg-[#7C6FFF]/10 cursor-pointer">
              <Sparkles size={11} />
            </button>
          </div>
        )}
      </div>

      {enabled && (
        <>
          <p className="text-[9px] text-gray-600 leading-snug">Solid fill only. Each chip is one character in reading order (spaces shown as ␣).</p>
          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto custom-scrollbar">
            {glyphs.map(({ char, index }) => (
              <label key={index} className="group flex flex-col items-center gap-0.5 cursor-pointer" title={`Character ${index + 1}: ${char === "␣" ? "space" : char}`}>
                <input type="color" value={(colors[index] || config.fillColor || "#ffffff").startsWith("#") ? colors[index] || config.fillColor : "#ffffff"} onChange={(e) => patchColors(setCharFillColor(colors, index, e.target.value))} className="w-7 h-7 rounded border border-[#2A2A38] bg-transparent cursor-pointer p-0" />
                <span className="text-[8px] font-mono text-gray-500 group-hover:text-[#7C6FFF]">{char}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
