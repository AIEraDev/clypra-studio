import React from "react";
import {
  Type,
  Square,
  Sparkles,
  CreditCard,
  Tag,
  Image as ImageIcon,
  LayoutGrid,
  Heading,
  MessageSquareQuote,
  Timer,
  Share2,
  Newspaper,
  Compass,
} from "lucide-react";

export type QuickInsertType =
  | "text"
  | "title-card"
  | "text-box"
  | "lower-third"
  | "caption"
  | "callout"
  | "social"
  | "countdown"
  | "quote"
  | "news"
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
      type: "title-card",
      label: "Title Card",
      description: "Dual-tier cinematic opener (Title 96px + Subtitle 32px)",
      icon: Heading,
      accentColor: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/10",
    },
    {
      type: "lower-third",
      label: "Lower Third",
      description: "Dual-tier broadcast name bar (Speaker 44px + Role 24px)",
      icon: Sparkles,
      accentColor: "text-purple-400 border-purple-500/30 hover:border-purple-500/60 bg-purple-500/10",
    },
    {
      type: "text-box",
      label: "Text + Box",
      description: "Auto-fitting background badge",
      icon: CreditCard,
      accentColor: "text-teal-400 border-teal-500/30 hover:border-teal-500/60 bg-teal-500/10",
    },
    {
      type: "caption",
      label: "Caption",
      description: "Subtitle dialogue bar",
      icon: Type,
      accentColor: "text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/10",
    },
    {
      type: "callout",
      label: "Callout",
      description: "Point & label feature highlight (Header 34px + Detail 22px)",
      icon: Compass,
      accentColor: "text-sky-400 border-sky-500/30 hover:border-sky-500/60 bg-sky-500/10",
    },
    {
      type: "social",
      label: "Social CTA",
      description: "Follow badge & handle (Prompt 22px + Handle 38px)",
      icon: Share2,
      accentColor: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 bg-blue-500/10",
    },
    {
      type: "countdown",
      label: "Countdown",
      description: "Timer overlay (Digits 120px + Label 26px)",
      icon: Timer,
      accentColor: "text-amber-400 border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10",
    },
    {
      type: "quote",
      label: "Quote",
      description: "Pull quote & attribution (Quote 44px + Author 24px)",
      icon: MessageSquareQuote,
      accentColor: "text-rose-400 border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10",
    },
    {
      type: "news",
      label: "News Banner",
      description: "Breaking news strap (Badge 24px + Headline 50px)",
      icon: Newspaper,
      accentColor: "text-red-400 border-red-500/30 hover:border-red-500/60 bg-red-500/10",
    },
    {
      type: "pill",
      label: "Pill Tag",
      description: "Rounded status tag badge",
      icon: Tag,
      accentColor: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10",
    },
    {
      type: "text",
      label: "Text",
      description: "Single headline layer (84px)",
      icon: Type,
      accentColor: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 bg-blue-500/10",
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
