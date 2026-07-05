import React from "react";

export function TopNavBar() {
  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center h-[30px] px-3 w-full z-50">
      <div className="flex items-center gap-2">
        <a href="/studio" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-[11px] font-bold" title="Back to Studio">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_back
          </span>
          <span>STUDIO</span>
        </a>
        <div className="w-px h-4 bg-outline-variant mx-1" />
        <span className="text-headline-lg font-black text-primary flex items-center gap-1">
          <span className="material-symbols-outlined text-primary">terminal</span>
          Transition Lab Console
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center px-2 py-0.5 rounded bg-surface-container text-primary font-mono-data text-[10px] gap-1 border border-outline-variant">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          LNK_STABLE
        </div>
      </div>
    </header>
  );
}
