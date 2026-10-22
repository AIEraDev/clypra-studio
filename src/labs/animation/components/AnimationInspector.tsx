import React from "react";
import { Plus, Sliders, Type, Sparkles, Clock, Layers } from "lucide-react";
import type {
  TextAnimationPreset,
  AnimatableProperty,
  AnimationPhase,
  StaggerUnit,
  StaggerOrder,
} from "../../../types/animation";

interface AnimationInspectorProps {
  preset: TextAnimationPreset;
  onUpdatePreset: (updated: TextAnimationPreset) => void;
}

const PROPERTY_OPTIONS: Array<{
  property: AnimatableProperty;
  label: string;
  defaultFrom: number;
  defaultTo: number;
}> = [
  { property: "opacity", label: "Opacity", defaultFrom: 0, defaultTo: 1 },
  {
    property: "translateY",
    label: "Translate Y",
    defaultFrom: 40,
    defaultTo: 0,
  },
  {
    property: "translateX",
    label: "Translate X",
    defaultFrom: -40,
    defaultTo: 0,
  },
  {
    property: "scale",
    label: "Scale (Uniform)",
    defaultFrom: 0.5,
    defaultTo: 1,
  },
  { property: "rotation", label: "Rotation", defaultFrom: -45, defaultTo: 0 },
  { property: "skewX", label: "Skew X", defaultFrom: 15, defaultTo: 0 },
  { property: "blur", label: "Blur", defaultFrom: 12, defaultTo: 0 },
  {
    property: "tracking",
    label: "Tracking (Kerning)",
    defaultFrom: 8,
    defaultTo: 0,
  },
];

export const AnimationInspector: React.FC<AnimationInspectorProps> = ({
  preset,
  onUpdatePreset,
}) => {
  const handleAddTrack = (
    prop: AnimatableProperty,
    from: number,
    to: number,
  ) => {
    // Avoid duplicate tracks of the same property
    if ((preset.tracks ?? []).some((t) => t.property === prop)) return;

    const newTrack = {
      property: prop,
      keyframes: [
        { progress: 0.0, value: from, easing: "easeOutCubic" as const },
        { progress: 1.0, value: to },
      ],
    };

    onUpdatePreset({
      ...preset,
      tracks: [...(preset.tracks ?? []), newTrack],
    });
  };

  return (
    <div className="flex h-full w-80 flex-col overflow-y-auto border-l border-[var(--studio-border)] bg-[var(--studio-panel)] text-xs text-white">
      {/* ── Section: Metadata ── */}
      <div className="border-b border-[var(--studio-border)] p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
          <Type size={14} className="text-[var(--studio-accent)]" />
          Preset Parameters
        </h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
              Preset Name
            </label>
            <input
              type="text"
              value={preset.name}
              onChange={(e) =>
                onUpdatePreset({ ...preset, name: e.target.value })
              }
              className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white focus:border-[var(--studio-accent)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Phase
              </label>
              <select
                value={preset.phase}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    phase: e.target.value as AnimationPhase,
                  })
                }
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-1.5 text-xs text-white"
              >
                <option value="in">In (Entrance)</option>
                <option value="out">Out (Exit)</option>
                <option value="loop">Loop (Continuous)</option>
                <option value="combo">Combo</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Category
              </label>
              <select
                value={preset.category}
                onChange={(e) =>
                  onUpdatePreset({ ...preset, category: e.target.value })
                }
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-1.5 text-xs text-white"
              >
                <option value="Basic">Basic</option>
                <option value="Motion">Motion</option>
                <option value="3D">3D</option>
                <option value="Glitch">Glitch</option>
                <option value="VFX">VFX</option>
                <option value="Dynamic">Dynamic</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Timing & Duration Limits ── */}
      <div className="border-b border-[var(--studio-border)] p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
          <Clock size={14} className="text-[var(--studio-accent)]" />
          Timing Constraints
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
              Default Dur (s)
            </label>
            <input
              type="number"
              step={0.1}
              min={0.1}
              value={preset.defaultDuration}
              onChange={(e) =>
                onUpdatePreset({
                  ...preset,
                  defaultDuration: Number(e.target.value),
                })
              }
              className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
              Loop Period (s)
            </label>
            <input
              type="number"
              step={0.1}
              min={0.1}
              value={preset.previewLoopDuration}
              onChange={(e) =>
                onUpdatePreset({
                  ...preset,
                  previewLoopDuration: Number(e.target.value),
                })
              }
              className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Glyph Stagger Engine ── */}
      <div className="border-b border-[var(--studio-border)] p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
          <Layers size={14} className="text-[var(--studio-accent)]" />
          Glyph Stagger Sequencing
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Stagger Unit
              </label>
              <select
                value={preset.stagger?.unit ?? "none"}
                onChange={(e) => {
                  const unit = e.target.value as StaggerUnit;
                  onUpdatePreset({
                    ...preset,
                    stagger:
                      unit === "none"
                        ? undefined
                        : {
                            unit,
                            overlap: preset.stagger?.overlap ?? 0.5,
                            order: preset.stagger?.order ?? "left-to-right",
                          },
                  });
                }}
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-1.5 text-xs text-white"
              >
                <option value="none">None (Whole text)</option>
                <option value="character">Per Character</option>
                <option value="word">Per Word</option>
                <option value="line">Per Line</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Direction
              </label>
              <select
                disabled={!preset.stagger || preset.stagger.unit === "none"}
                value={preset.stagger?.order ?? "left-to-right"}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    stagger: {
                      unit: preset.stagger?.unit ?? "character",
                      overlap: preset.stagger?.overlap ?? 0.5,
                      order: e.target.value as StaggerOrder,
                    },
                  })
                }
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-1.5 text-xs text-white disabled:opacity-40"
              >
                <option value="left-to-right">Left to Right</option>
                <option value="right-to-left">Right to Left</option>
                <option value="center-out">Center Out</option>
                <option value="random">Random Jumble</option>
              </select>
            </div>
          </div>

          {preset.stagger && preset.stagger.unit !== "none" && (
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-[var(--studio-muted)]">
                <span>Glyph Overlap</span>
                <span>
                  {((preset.stagger.overlap ?? 0.5) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.95}
                step={0.05}
                value={preset.stagger.overlap ?? 0.5}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    stagger: {
                      ...preset.stagger!,
                      overlap: Number(e.target.value),
                    },
                  })
                }
                className="h-1.5 w-full accent-[var(--studio-accent)]"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Section: Procedural VFX ── */}
      <div className="border-b border-[var(--studio-border)] p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
          <Sparkles size={14} className="text-[var(--studio-accent)]" />
          Procedural VFX Shader
        </h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
              VFX Effect
            </label>
            <select
              value={preset.procedural?.type ?? "none"}
              onChange={(e) => {
                const type = e.target.value;
                onUpdatePreset({
                  ...preset,
                  procedural:
                    type === "none"
                      ? undefined
                      : {
                          type: type as any,
                          intensity: preset.procedural?.intensity ?? 0.7,
                          frequency: preset.procedural?.frequency ?? 20,
                        },
                });
              }}
              className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-1.5 text-xs text-white"
            >
              <option value="none">None</option>
              <option value="glitch">Glitch Jitter</option>
              <option value="wave">Wave Displacement</option>
              <option value="melt">Melt Dripping</option>
              <option value="chromatic">Chromatic Aberration</option>
              <option value="shiver">Shiver</option>
            </select>
          </div>

          {preset.procedural && (
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-[var(--studio-muted)]">
                <span>Intensity</span>
                <span>{(preset.procedural.intensity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={preset.procedural.intensity}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    procedural: {
                      ...preset.procedural!,
                      intensity: Number(e.target.value),
                    },
                  })
                }
                className="h-1.5 w-full accent-[var(--studio-accent)]"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Section: Add Property Track ── */}
      <div className="p-4">
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--studio-muted)]">
          Add Property Track
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {PROPERTY_OPTIONS.map((opt) => {
            const hasTrack = (preset.tracks ?? []).some(
              (t) => t.property === opt.property,
            );
            return (
              <button
                key={opt.property}
                disabled={hasTrack}
                onClick={() =>
                  handleAddTrack(opt.property, opt.defaultFrom, opt.defaultTo)
                }
                className={`flex items-center gap-1 rounded border px-2 py-1.5 text-left text-[11px] transition-colors ${
                  hasTrack
                    ? "border-transparent bg-white/5 text-white/30"
                    : "border-[var(--studio-border)] bg-[var(--studio-control)] text-white hover:border-[var(--studio-accent)]"
                }`}
              >
                <Plus
                  size={11}
                  className={
                    hasTrack ? "opacity-20" : "text-[var(--studio-accent)]"
                  }
                />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
