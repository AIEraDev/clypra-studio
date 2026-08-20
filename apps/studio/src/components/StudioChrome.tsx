import React from "react";
import {
  Download,
  FileCode,
  Music,
  Shield,
  Sticker,
  Type,
  Beaker,
  Layers,
} from "lucide-react";
import type { RailItem } from "../app/studioRoutes";

export type { RailItem } from "../app/studioRoutes";

const RAIL_ITEMS: Array<{
  id: RailItem;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
}> = [
  { id: "text-effects", label: "Text Effects", icon: Type },
  { id: "audio", label: "Audio", icon: Music },
  { id: "stickers", label: "Stickers", icon: Sticker },
  { id: "overlays", label: "Overlays", icon: Layers },
  { id: "labs", label: "Labs", icon: Beaker, adminOnly: true },
  { id: "admin", label: "Admin Settings", icon: Shield, adminOnly: true },
];

type GpuState = "idle" | "rendering" | "ready" | "error";

interface LeftRailProps {
  activeItem: RailItem;
  onSelectItem: (item: RailItem) => void;
  isAdmin?: boolean;
  gpuState?: GpuState;
}

export function LeftRail({
  activeItem,
  onSelectItem,
  isAdmin = false,
  gpuState = "idle",
}: LeftRailProps) {
  const visibleItems = RAIL_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const gpuDotClass =
    gpuState === "ready"
      ? "studio-rail-gpu-dot"
      : gpuState === "rendering"
      ? "studio-rail-gpu-dot live"
      : gpuState === "error"
      ? "studio-rail-gpu-dot error"
      : "";

  return (
    <nav
      className="studio-left-rail flex shrink-0 flex-col items-center gap-1 py-3"
      aria-label="Creation library"
    >
      {visibleItems.map(({ id, label, icon: Icon }) => {
        const isActive = activeItem === id;
        const showGpuDot = id === "text-effects" && gpuState !== "idle";

        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => onSelectItem(id)}
            className={`studio-rail-btn${isActive ? " active" : ""}`}
          >
            <Icon size={17} />
            {showGpuDot && <span className={gpuDotClass} />}
          </button>
        );
      })}
    </nav>
  );
}

interface DrawerIntroProps {
  activeItem: RailItem;
  showExport?: boolean;
  onOpenExport: () => void;
}

export function DrawerIntro({
  activeItem,
  showExport = false,
  onOpenExport,
}: DrawerIntroProps) {
  const active =
    RAIL_ITEMS.find((item) => item.id === activeItem) ?? RAIL_ITEMS[0];
  const Icon = active.icon;

  return (
    <div className="drawer-intro">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="drawer-intro-icon">
          <Icon size={13} />
        </span>
        <h2 className="truncate text-[13px] font-semibold text-white tracking-tight">
          {active.label}
        </h2>
      </div>

      {showExport && (
        <button
          type="button"
          onClick={onOpenExport}
          title="Export &amp; Code panel"
          className="canvas-toolbar-btn shrink-0"
        >
          <Download size={11} className="mr-1" />
          Export
        </button>
      )}
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
