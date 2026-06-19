import React from "react";
import { Download, FileCode, Filter, Grid2X2, Layers, Music, Palette, Sparkles, Sticker, Type, Video, Wand2 } from "lucide-react";

export type RailItem = "text-effects" | "audio" | "stickers" | "overlays" | "video-effects" | "body-effects" | "filters";

const RAIL_ITEMS: Array<{
  id: RailItem;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "text-effects", label: "Text Effects", icon: Type },
  { id: "audio", label: "Audio", icon: Music },
  { id: "stickers", label: "Stickers", icon: Sticker },
  { id: "overlays", label: "Overlays", icon: Video },
  { id: "video-effects", label: "Video Effects", icon: Wand2 },
  { id: "body-effects", label: "Body Effects", icon: Sparkles },
  { id: "filters", label: "Filters", icon: Filter },
];

interface LeftRailProps {
  activeItem: RailItem;
  onSelectItem: (item: RailItem) => void;
}

export function LeftRail({ activeItem, onSelectItem }: LeftRailProps) {
  return (
    <nav className="studio-left-rail flex w-14 shrink-0 flex-col items-center gap-1 border-r border-(--studio-border) bg-(--studio-shell) py-2" aria-label="Creation library">
      {RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" aria-label={label} title={label} onClick={() => onSelectItem(id)} className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors cursor-pointer ${activeItem === id ? "bg-(--studio-active-oft)] text-white" : "text-(--studio-muted) hover:bg-(--studio-hover) hover:text-white"}`}>
          <Icon size={18} className={activeItem === id ? "text-(--studio-accent)" : ""} />
        </button>
      ))}
    </nav>
  );
}

interface DrawerIntroProps {
  activeItem: RailItem;
  showExport?: boolean;
  onOpenExport: () => void;
}

export function DrawerIntro({ activeItem, showExport = false, onOpenExport }: DrawerIntroProps) {
  const active = RAIL_ITEMS.find((item) => item.id === activeItem) ?? RAIL_ITEMS[0];
  const Icon = active.icon;

  return (
    <div className="border-b border-(--studio-border) bg-(--studio-panel) px-4 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-(--studio-control) text-(--studio-accent)">
            <Icon size={14} />
          </span>
          <h2 className="truncate text-[13px] font-semibold text-white">{active.label}</h2>
        </div>

        {showExport && (
          <button type="button" onClick={onOpenExport} className="shrink-0 flex items-center gap-1 rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1 text-[10px] font-semibold text-(--studio-muted) hover:text-white hover:bg-(--studio-hover) transition-colors" title="Export &amp; Code panel">
            <Download size={11} />
            Export
          </button>
        )}
      </div>
    </div>
  );
}

export function ExportBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-(--studio-muted)">
      <FileCode size={11} />
      Developer export
    </span>
  );
}
