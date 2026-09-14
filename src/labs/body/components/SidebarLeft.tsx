import React from "react";

interface ProviderItem {
  id: string;
  name: string;
  status: string;
}

interface SidebarLeftProps {
  videoFile: File | null;
  fitMode: "stretch" | "fit" | "crop";
  selectedEffect: string;
  providers: ProviderItem[];
  activeProvider: string;
  onVideoImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetFitMode: (mode: "stretch" | "fit" | "crop") => void;
  onSetActiveProvider: (id: string) => void;
  onSelectEffect: (effect: string) => void;
}

export function SidebarLeft({
  videoFile,
  fitMode,
  selectedEffect,
  providers,
  activeProvider,
  onVideoImport,
  onSetFitMode,
  onSetActiveProvider,
  onSelectEffect,
}: SidebarLeftProps) {
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
          <h2 className="text-label-sm font-bold text-on-surface truncate">PRJ_03_BODY</h2>
          <p className="text-[9px] font-mono-data text-on-surface-variant uppercase">
            Feature_Segmentation
          </p>
        </div>
      </div>

      {/* Video Input */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1 flex justify-between">
          Source <span className="text-primary">LIVE</span>
        </h3>
        <label className="border border-dashed border-outline-variant rounded p-2 text-center cursor-pointer hover:border-primary group transition-colors block">
          <input type="file" accept="video/*" className="hidden" onChange={onVideoImport} />
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1">
            file_upload
          </span>
          <p className="text-[10px] text-on-surface-variant group-hover:text-on-surface truncate">
            {videoFile ? videoFile.name : "LOAD_SUBJECT.bin"}
          </p>
        </label>
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          {(["stretch", "fit", "crop"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onSetFitMode(mode)}
              className={`py-0.5 rounded text-[9px] font-bold border transition-all ${
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

      {/* Feature Providers manager */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1">
          Feature_Providers
        </h3>
        <div className="flex flex-col gap-1">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => onSetActiveProvider(p.id)}
              className={`py-1 px-1.5 rounded text-[10px] font-bold border text-left transition-all ${
                activeProvider === p.id
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-surface-container-highest text-on-surface-variant border-transparent"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{p.name}</span>
                <span className="text-[7.5px] font-mono-data opacity-60 uppercase">{p.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Effect Library */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-1 mb-1">
          <h3 className="text-[10px] font-bold text-outline-variant uppercase">
            Body_Library
          </h3>
          <span className="text-[8.5px] font-mono-data px-1 py-0.2 rounded bg-surface-container-highest text-primary">
            9 EFFECTS
          </span>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {/* Section 1: Body VFX (True Anatomical Effects) */}
          <div>
            <div className="flex items-center justify-between px-1 py-0.5 mb-1 bg-surface-container-highest/60 rounded border border-outline-variant/30">
              <span className="text-[9px] font-bold tracking-wider text-primary uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">flare</span>
                Body VFX (Anatomical)
              </span>
              <span className="text-[8px] font-mono-data text-on-surface-variant font-semibold">6 VFX</span>
            </div>
            <div className="space-y-1">
              <div
                onClick={() => onSelectEffect("neon-outline")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "neon-outline"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold">NEON_OUTLINE</span>
                  <span className="text-[8.5px] font-mono-data text-outline">v1.0</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  Luminescent contour stroke hugging silhouette
                </p>
              </div>

              <div
                onClick={() => onSelectEffect("cyber-glow")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "cyber-glow"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold">CYBER_NEON_GLOW</span>
                  <span className="text-[8.5px] font-mono-data text-outline">v1.0</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  Radiant multi-pass contour aura with MaskedGlow
                </p>
              </div>

              <div
                onClick={() => onSelectEffect("electro-contour")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "electro-contour"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-[#00E5FF]">ELECTRO_CONTOUR</span>
                  <span className="text-[8.5px] font-mono-data text-primary">NEW</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  High-voltage lightning arcs hugging body contour
                </p>
              </div>

              <div
                onClick={() => onSelectEffect("angel-wings")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "angel-wings"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold">ANGEL_WINGS</span>
                  <span className="text-[8.5px] font-mono-data text-outline">v1.5</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  SkeletalSpriteAnchor with torso orientation
                </p>
              </div>

              <div
                onClick={() => onSelectEffect("particle-aura")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "particle-aura"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold">PARTICLE_AURA</span>
                  <span className="text-[8.5px] font-mono-data text-outline">v1.3</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  Procedural orbiting body particle swarms
                </p>
              </div>

              <div
                onClick={() => onSelectEffect("body-ghost")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "body-ghost"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-[#FF66B2]">BODY_GHOST_CLONE</span>
                  <span className="text-[8.5px] font-mono-data text-primary">NEW</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  Chromatic motion trailing clones lagging behind subject
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Cutout & Depth Tools */}
          <div>
            <div className="flex items-center justify-between px-1 py-0.5 mb-1 bg-surface-container-highest/60 rounded border border-outline-variant/30">
              <span className="text-[9px] font-bold tracking-wider text-secondary uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">layers</span>
                Cutout & Depth Tools
              </span>
              <span className="text-[8px] font-mono-data text-on-surface-variant font-semibold">3 TOOLS</span>
            </div>
            <div className="space-y-1">
              <div
                onClick={() => onSelectEffect("subject-cutout")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "subject-cutout"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold">SUBJECT_CUTOUT</span>
                  <span className="text-[8.5px] font-mono-data text-outline">v1.0</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  AlphaCutout layer synthesis (Text Behind Subject)
                </p>
              </div>

              <div
                onClick={() => onSelectEffect("background-blur")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "background-blur"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold">BACKGROUND_BLUR</span>
                  <span className="text-[8.5px] font-mono-data text-outline">v2.0</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  Depth-of-field background portrait bokeh
                </p>
              </div>

              <div
                onClick={() => onSelectEffect("color-isolation")}
                className={`p-1.5 cursor-pointer border-l-2 rounded-r ${
                  selectedEffect === "color-isolation"
                    ? "bg-surface-container-high border-primary text-primary"
                    : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold">COLOR_ISOLATION</span>
                  <span className="text-[8.5px] font-mono-data text-outline">v1.0</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  Keep subjects colored, luma-desat BG
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
