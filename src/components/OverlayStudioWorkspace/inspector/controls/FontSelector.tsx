import React from "react";
import {
  fontRegistry,
  type FontRef,
  type DocumentCommand,
  type SceneNode,
} from "@clypra-studio/engine";
import { Type } from "lucide-react";

interface FontSelectorProps {
  node: SceneNode;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

import {
  SUPPORTED_FONT_FAMILIES,
  isSupportedFontFamily,
} from "@/constants/fonts";

export function FontSelector({ node, onExecuteCommand }: FontSelectorProps) {
  const currentFontRef: FontRef | undefined = (node as any).style?.fontRef;
  const currentFamily =
    currentFontRef?.family || (node as any).style?.fontFamily || "Inter";
  const currentWeight = currentFontRef?.weight || 400;
  const currentStyle = currentFontRef?.style || "normal";

  const fontState = fontRegistry.getState(
    currentFamily,
    currentWeight,
    currentStyle,
  );
  const isSupported = isSupportedFontFamily(currentFamily);

  const updateFont = (patch: Partial<FontRef>) => {
    const updatedRef: FontRef = {
      family: patch.family ?? currentFamily,
      weight: patch.weight ?? currentWeight,
      style: patch.style ?? currentStyle,
      source: "builtin",
      url: patch.url ?? currentFontRef?.url,
    };

    onExecuteCommand({
      type: "SET_FONT_REF",
      nodeId: node.id,
      fontRef: updatedRef,
    });
  };

  return (
    <div className="flex flex-col gap-2.5 p-2.5 bg-[#151519] border border-white/6 rounded-xl">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
          <Type size={11} className="text-violet-400" />
          Font Reference
        </label>
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
            fontState === "ready" || isSupported
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : fontState === "loading"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {isSupported ? "Native Ready" : fontState}
        </span>
      </div>

      {/* Font Family Dropdown */}
      <select
        value={currentFamily}
        onChange={(e) => updateFont({ family: e.target.value })}
        className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors"
      >
        {SUPPORTED_FONT_FAMILIES.map((fam) => (
          <option key={fam} value={fam}>
            {fam}
          </option>
        ))}
      </select>

      {/* Weight & Style row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">
            Weight
          </label>
          <select
            value={currentWeight}
            onChange={(e) =>
              updateFont({ weight: parseInt(e.target.value, 10) })
            }
            className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-medium focus:border-violet-500 outline-none"
          >
            <option value={300}>300 Light</option>
            <option value={400}>400 Regular</option>
            <option value={600}>600 SemiBold</option>
            <option value={700}>700 Bold</option>
            <option value={800}>800 ExtraBold</option>
          </select>
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">
            Style
          </label>
          <select
            value={currentStyle}
            onChange={(e) => updateFont({ style: e.target.value as any })}
            className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-medium focus:border-violet-500 outline-none"
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </div>
      </div>
    </div>
  );
}
