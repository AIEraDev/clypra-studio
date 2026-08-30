import React from "react";
import { Sparkles, Ban, Layers, Shield, Tag, Bookmark } from "lucide-react";

export interface BoxStylePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  panel: {
    backgroundColor: string;
    backgroundOpacity: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    borderRadius: number;
    backgroundBorderColor?: string;
    backgroundBorderWidth?: number;
  } | null;
}

export const BOX_STYLE_PRESETS: BoxStylePreset[] = [
  {
    id: "none",
    name: "None",
    description: "Clean transparent text",
    icon: Ban,
    panel: null,
  },
  {
    id: "dark-pill",
    name: "Dark Pill",
    description: "Rounded capsule badge",
    icon: Tag,
    panel: {
      backgroundColor: "#12121c",
      backgroundOpacity: 0.88,
      paddingTop: 12,
      paddingRight: 28,
      paddingBottom: 12,
      paddingLeft: 28,
      borderRadius: 999,
      backgroundBorderColor: "#2A2A3E",
      backgroundBorderWidth: 1,
    },
  },
  {
    id: "accent-solid",
    name: "Accent Solid",
    description: "Solid high-contrast container",
    icon: Shield,
    panel: {
      backgroundColor: "#7c6fff",
      backgroundOpacity: 1.0,
      paddingTop: 16,
      paddingRight: 28,
      paddingBottom: 16,
      paddingLeft: 28,
      borderRadius: 12,
      backgroundBorderColor: "#9e94ff",
      backgroundBorderWidth: 1,
    },
  },
  {
    id: "glass-card",
    name: "Glass Card",
    description: "Frosted semi-transparent box",
    icon: Layers,
    panel: {
      backgroundColor: "#0d0d15",
      backgroundOpacity: 0.72,
      paddingTop: 18,
      paddingRight: 32,
      paddingBottom: 18,
      paddingLeft: 32,
      borderRadius: 16,
      backgroundBorderColor: "#333348",
      backgroundBorderWidth: 1,
    },
  },
  {
    id: "lower-third-stripe",
    name: "Lower-Third",
    description: "Broadcast lower-third bar",
    icon: Bookmark,
    panel: {
      backgroundColor: "#09090f",
      backgroundOpacity: 0.94,
      paddingTop: 16,
      paddingRight: 36,
      paddingBottom: 16,
      paddingLeft: 36,
      borderRadius: 6,
      backgroundBorderColor: "#2dd4bf",
      backgroundBorderWidth: 2,
    },
  },
  {
    id: "neon-outline",
    name: "Neon Glow",
    description: "Cyberpunk outline box",
    icon: Sparkles,
    panel: {
      backgroundColor: "#050508",
      backgroundOpacity: 0.85,
      paddingTop: 14,
      paddingRight: 24,
      paddingBottom: 14,
      paddingLeft: 24,
      borderRadius: 8,
      backgroundBorderColor: "#22d3ee",
      backgroundBorderWidth: 2,
    },
  },
];

interface BoxStylePresetPickerProps {
  currentBackgroundColor?: string;
  currentBorderRadius?: number;
  onApplyPreset: (preset: BoxStylePreset) => void;
}

export const BoxStylePresetPicker: React.FC<BoxStylePresetPickerProps> = ({
  currentBackgroundColor,
  onApplyPreset,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899]">
        Box Style Presets
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {BOX_STYLE_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive =
            preset.id === "none"
              ? !currentBackgroundColor || currentBackgroundColor === "none"
              : currentBackgroundColor === preset.panel?.backgroundColor;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              title={preset.description}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                isActive
                  ? "bg-teal-500/15 border-teal-500/60 text-teal-300 shadow-sm shadow-teal-500/20"
                  : "bg-[#15151F] border-[#2A2A38] hover:border-[#3E3E52] text-[#9A9AAA] hover:text-white"
              }`}
            >
              <Icon size={14} className="mb-1 text-teal-400" />
              <span className="text-[10px] font-semibold truncate w-full">
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
