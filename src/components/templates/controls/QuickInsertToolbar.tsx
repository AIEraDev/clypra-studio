import React from "react";
import {
  Type,
  Square,
  Sparkles,
  CreditCard,
  Tag,
  Image as ImageIcon,
  LayoutGrid,
  Plus,
} from "lucide-react";

export type QuickInsertType =
  | "text"
  | "text-box"
  | "lower-third"
  | "pill"
  | "shape"
  | "image"
  | "container";

interface QuickInsertToolbarProps {
  onInsert: (type: QuickInsertType) => void;
  disabled?: boolean;
}

export const QuickInsertToolbar: React.FC<QuickInsertToolbarProps> = ({
  onInsert,
  disabled = false,
}) => {
  const insertItems: Array<{
    type: QuickInsertType;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    accentColor: string;
  }> = [
    {
      type: "text",
      label: "Text",
      description: "Clean typography headline",
      icon: Type,
      accentColor: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 bg-blue-500/10",
    },
    {
      type: "text-box",
      label: "Text + Box",
      description: "Auto-fitting background badge",
      icon: CreditCard,
      accentColor: "text-teal-400 border-teal-500/30 hover:border-teal-500/60 bg-teal-500/10",
    },
    {
      type: "lower-third",
      label: "Lower Third",
      description: "Broadcast title card bar",
      icon: Sparkles,
      accentColor: "text-purple-400 border-purple-500/30 hover:border-purple-500/60 bg-purple-500/10",
    },
    {
      type: "pill",
      label: "Pill Tag",
      description: "Rounded status tag badge",
      icon: Tag,
      accentColor: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10",
    },
    {
      type: "shape",
      label: "Shape",
      description: "Background box or line",
      icon: Square,
      accentColor: "text-amber-400 border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10",
    },
    {
      type: "image",
      label: "Image",
      description: "Media or logo asset",
      icon: ImageIcon,
      accentColor: "text-pink-400 border-pink-500/30 hover:border-pink-500/60 bg-pink-500/10",
    },
    {
      type: "container",
      label: "Container",
      description: "Auto-reflow flex layout container",
      icon: LayoutGrid,
      accentColor: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/10",
    },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {insertItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.type}
            type="button"
            disabled={disabled}
            onClick={() => onInsert(item.type)}
            title={item.description}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${item.accentColor}`}
          >
            <Icon size={13} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
