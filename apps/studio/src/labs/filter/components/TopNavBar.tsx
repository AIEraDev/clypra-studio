import React from "react";
import { Link } from "react-router-dom";
import { PRESET_FILTERS } from "../../../components/effects/filter/FilterPresets";
import { ClypraLogo } from "../../../components/ClypraLogo";

export function TopNavBar() {
  const presetCount = PRESET_FILTERS.length;

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center h-[30px] px-3 w-full z-50">
      <div className="flex items-center gap-2">
        <Link to="/studio" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 text-[11px] font-bold" title="Back to Clypra Studio">
          <ClypraLogo size={17} />
          <span>CLYPRA STUDIO</span>
        </Link>
        <div className="w-px h-4 bg-outline-variant mx-1" />
        <span className="text-headline-lg font-black text-primary flex items-center gap-1">
          Filter Lab Console
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center px-2 py-0.5 rounded bg-surface-container text-secondary font-mono-data text-[9px] gap-1 border border-outline-variant">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 12 }}>
            palette
          </span>
          {presetCount} PRESETS
        </div>
        <div className="flex items-center px-2 py-0.5 rounded bg-surface-container text-primary font-mono-data text-[10px] gap-1 border border-outline-variant">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          LNK_STABLE
        </div>
      </div>
    </header>
  );
}
