import React from "react";
import { Bot, Box, Download, FileCode, Grid2X2, Image as ImageIcon, Layers, Palette, Sparkles, Type, UploadCloud } from "lucide-react";

export type WorkspaceMode = "design" | "animate" | "ai" | "export";

export type RailItem = "templates" | "assets" | "text" | "effects" | "elements" | "uploads" | "ai" | "brand" | "layers";

export const MODE_LABELS: Record<WorkspaceMode, string> = {
  design: "Design",
  animate: "Animate",
  ai: "AI Generate",
  export: "Export",
};

const RAIL_ITEMS: Array<{
  id: RailItem;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "templates", label: "Templates", icon: Grid2X2 },
  { id: "assets", label: "Assets", icon: ImageIcon },
  { id: "text", label: "Text", icon: Type },
  { id: "effects", label: "Effects", icon: Sparkles },
  { id: "elements", label: "Elements", icon: Box },
  { id: "uploads", label: "Uploads", icon: UploadCloud },
  { id: "ai", label: "AI Tools", icon: Bot },
  { id: "brand", label: "Brand Kit", icon: Palette },
  { id: "layers", label: "Layers", icon: Layers },
];

interface ModeSwitcherProps {
  value: WorkspaceMode;
  onChange: (mode: WorkspaceMode) => void;
}

export function ModeSwitcher({ value, onChange }: ModeSwitcherProps) {
  return (
    <div className="flex items-center rounded-md border border-[var(--studio-border)] bg-[var(--studio-control)] p-0.5" role="tablist" aria-label="Workspace mode">
      {(Object.keys(MODE_LABELS) as WorkspaceMode[]).map((mode) => (
        <button key={mode} type="button" role="tab" aria-selected={value === mode} onClick={() => onChange(mode)} className={`h-8 whitespace-nowrap rounded px-3 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--studio-focus)] ${value === mode ? "bg-[var(--studio-active)] text-white" : "text-[var(--studio-muted)] hover:bg-[var(--studio-hover)] hover:text-white"}`}>
          {MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}

interface LeftRailProps {
  activeItem: RailItem;
  onSelectItem: (item: RailItem) => void;
}

export function LeftRail({ activeItem, onSelectItem }: LeftRailProps) {
  return (
    <nav className="studio-left-rail flex w-14 shrink-0 flex-col items-center gap-1 border-r border-[var(--studio-border)] bg-[var(--studio-shell)] py-2" aria-label="Creation library">
      {RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" aria-label={label} title={label} onClick={() => onSelectItem(id)} className={`group flex h-10 w-10 items-center justify-center rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--studio-focus)] ${activeItem === id ? "bg-[var(--studio-active-soft)] text-white" : "text-[var(--studio-muted)] hover:bg-[var(--studio-hover)] hover:text-white"}`}>
          <Icon size={18} className={activeItem === id ? "text-[var(--studio-accent)]" : ""} />
        </button>
      ))}
    </nav>
  );
}

interface DrawerIntroProps {
  activeItem: RailItem;
  mode: WorkspaceMode;
  onOpenExport: () => void;
  onOpenAI: () => void;
}

export function DrawerIntro({ activeItem, mode, onOpenAI, onOpenExport }: DrawerIntroProps) {
  const active = RAIL_ITEMS.find((item) => item.id === activeItem) ?? RAIL_ITEMS[0];
  const Icon = active.icon;

  return (
    <div className="border-b border-[var(--studio-border)] bg-[var(--studio-panel)] px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--studio-control)] text-[var(--studio-accent)]">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold text-white">{active.label}</h2>
            <p className="truncate text-[10px] uppercase tracking-wide text-[var(--studio-muted)]">{MODE_LABELS[mode]} workspace</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onOpenAI} className="flex items-center justify-center gap-1.5 rounded-md border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 py-1.5 text-[11px] font-semibold text-[var(--studio-text)] hover:bg-[var(--studio-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--studio-focus)]">
          <Bot size={13} />
          AI Tools
        </button>
        <button type="button" onClick={onOpenExport} className="flex items-center justify-center gap-1.5 rounded-md border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 py-1.5 text-[11px] font-semibold text-[var(--studio-text)] hover:bg-[var(--studio-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--studio-focus)]">
          <Download size={13} />
          Export
        </button>
      </div>
    </div>
  );
}

export function ExportBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--studio-muted)]">
      <FileCode size={11} />
      Developer export
    </span>
  );
}
