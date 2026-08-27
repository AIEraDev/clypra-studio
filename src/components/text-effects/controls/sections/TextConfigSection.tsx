import React from "react";
import { Loader2, Sparkles, Type } from "lucide-react";
import { resizeCharFillColors } from "@clypra-studio/engine";
import { ControlSectionCard } from "../common/ControlSectionCard";
import type { BaseControlSectionProps } from "../common/types";

interface TextConfigSectionProps extends BaseControlSectionProps {
  activeEffectId: string;
  isGeneratingName: boolean;
  handleGenerateAiEffectName: () => void;
}

export function TextConfigSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
  activeEffectId,
  isGeneratingName,
  handleGenerateAiEffectName,
}: TextConfigSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-text"
      title="1. Text Configuration"
      icon={<Type size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div>
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
          Preview Label Text
        </label>
        <textarea
          id="input-text-val"
          rows={2}
          value={config.text}
          onChange={(e) => {
            const text = e.target.value;
            modifyConfig({
              text,
              charFillColors: config.perCharFillEnabled
                ? resizeCharFillColors(
                    text,
                    config.charFillColors,
                    config.fillColor || "#ffffff",
                  )
                : config.charFillColors,
            });
          }}
          className="w-full bg-[#0E0E12] border border-clypra-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] resize-none font-sans"
          placeholder="Insert preview label..."
        />
      </div>

      <div>
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
          Clypra Class Name
        </label>
        <div className="flex gap-1.5">
          <input
            id="input-effect-name"
            type="text"
            value={config.effectName}
            onChange={(e) => modifyConfig({ effectName: e.target.value })}
            className="flex-1 bg-[#0E0E12] border border-clypra-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] font-sans min-w-0"
          />
          <button
            type="button"
            onClick={handleGenerateAiEffectName}
            disabled={isGeneratingName}
            className="px-2.5 bg-[#7C6FFF]/10 hover:bg-[#7C6FFF]/20 active:bg-[#7C6FFF]/30 border border-[#7C6FFF]/30 rounded-lg text-clypra-accent font-sans text-xs flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="Generate Class Name with Gemini AI"
          >
            {isGeneratingName ? (
              <Loader2 size={13} className="animate-spin text-clypra-accent" />
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
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-0.5">
          Effect Registration ID
        </label>
        <span className="text-[10px] font-mono text-gray-500 bg-[#0E0E12] px-2 py-1 rounded block border border-dashed border-clypra-border truncate select-all">
          {activeEffectId}
        </span>
      </div>
    </ControlSectionCard>
  );
}
