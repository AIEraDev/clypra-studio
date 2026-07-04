import React from "react";

export function TopNavBar() {
  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center h-[40px] px-3 w-full z-50">
      <div className="flex items-center gap-4">
        <span className="text-headline-lg font-black text-primary flex items-center gap-1">
          <span className="material-symbols-outlined text-primary">terminal</span>
          Transition_Console
        </span>
        <nav className="hidden md:flex gap-1 items-center">
          {["File", "Edit"].map((item) => (
            <a
              key={item}
              className="text-on-surface-variant text-label-sm hover:bg-surface-container-highest transition-colors px-2 py-0.5"
              href="#"
            >
              {item}
            </a>
          ))}
          <a
            className="text-primary font-bold border-b-2 border-primary text-label-sm px-2 py-0.5 bg-primary/5"
            href="#"
          >
            Project
          </a>
          {["Render", "Tools"].map((item) => (
            <a
              key={item}
              className="text-on-surface-variant text-label-sm hover:bg-surface-container-highest transition-colors px-2 py-0.5"
              href="#"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center px-2 py-0.5 rounded bg-surface-container text-primary font-mono-data text-[10px] gap-1 mr-2 border border-outline-variant">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          LNK_STABLE
        </div>
        <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
