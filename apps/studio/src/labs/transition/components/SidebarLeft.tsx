import React from "react";
import { ALL_TRANSITIONS } from "@clypra-studio/engine/transitions";

interface SidebarLeftProps {
  clipAFile: File | null;
  clipBFile: File | null;
  selectedTransition: string;
  fitMode: "stretch" | "fit" | "crop";
  onClipAImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClipBImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectTransition: (transition: string) => void;
  onSetFitMode: (mode: "stretch" | "fit" | "crop") => void;
}

export function SidebarLeft({
  clipAFile,
  clipBFile,
  selectedTransition,
  fitMode,
  onClipAImport,
  onClipBImport,
  onSelectTransition,
  onSetFitMode,
}: SidebarLeftProps) {
  // Extract categories dynamically
  const categories = Array.from(new Set(ALL_TRANSITIONS.map((t) => t.category)));

  return (
    <aside className="flex flex-col h-full w-[280px] min-w-[280px] bg-surface-container-low border-r border-outline-variant p-1 gap-1 overflow-hidden select-none">
      <div className="flex items-center gap-2 p-1 border-b border-outline-variant pb-2 mb-1">
        <div className="w-7 h-7 rounded bg-primary-container flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-on-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            dataset
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-label-sm font-bold text-on-surface truncate">PRJ_02_MIXER</h2>
          <p className="text-[9px] font-mono-data text-on-surface-variant uppercase">
            Dual_Chan_Sequencer
          </p>
        </div>
      </div>

      {/* Outgoing Clip A Selector */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1 flex justify-between">
          Outgoing (Clip A) <span className="text-primary">CHAN_1</span>
        </h3>
        <label className="border border-dashed border-outline-variant rounded p-2 text-center cursor-pointer hover:border-primary group transition-colors block">
          <input type="file" accept="video/*" className="hidden" onChange={onClipAImport} />
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1">
            movie
          </span>
          <p className="text-[10px] text-on-surface-variant group-hover:text-on-surface truncate">
            {clipAFile ? clipAFile.name : "LOAD_OUTGOING.mp4"}
          </p>
        </label>
      </div>

      {/* Incoming Clip B Selector */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded">
        <h3 className="text-[10px] font-bold text-[#ffb786] uppercase mb-1 flex justify-between">
          Incoming (Clip B) <span className="text-[#ffb786]">CHAN_2</span>
        </h3>
        <label className="border border-dashed border-outline-variant rounded p-2 text-center cursor-pointer hover:border-[#ffb786] group transition-colors block">
          <input type="file" accept="video/*" className="hidden" onChange={onClipBImport} />
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-[#ffb786] mb-1">
            movie
          </span>
          <p className="text-[10px] text-on-surface-variant group-hover:text-on-surface truncate">
            {clipBFile ? clipBFile.name : "LOAD_INCOMING.mp4"}
          </p>
        </label>
      </div>

      {/* Aspect Ratio / Fit Mode */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1 flex justify-between">
          Scaling Mode
        </h3>
        <div className="grid grid-cols-3 gap-1">
          {(["stretch", "fit", "crop"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onSetFitMode(mode)}
              className={`py-0.5 rounded text-[9px] font-bold transition-all border ${
                fitMode === mode
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-surface-container-highest text-on-surface-variant border-transparent"
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Transition Library */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1 px-1">
          Mix_Library
        </h3>
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {categories.map((category) => {
            const categoryTransitions = ALL_TRANSITIONS.filter((t) => t.category === category);
            return (
              <div key={category} className="space-y-1">
                <div className="text-[9px] font-bold text-primary uppercase px-1 pb-0.5 border-b border-outline-variant/30">
                  {category.replace("-", " ")}
                </div>
                {categoryTransitions.map((transition) => (
                  <div
                    key={transition.id}
                    onClick={() => onSelectTransition(transition.id)}
                    className={`p-1.5 cursor-pointer border-l-2 ${
                      selectedTransition === transition.id
                        ? "bg-surface-container-high border-primary text-primary"
                        : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                    } transition-all`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold truncate max-w-[180px]">
                        {transition.name.toUpperCase().replace(" ", "_")}
                      </span>
                      <span className="text-[8px] font-mono-data text-outline">
                        {transition.defaultDurationMs}ms
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                      {transition.description}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
