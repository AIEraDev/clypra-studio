import React from "react";
import { Sliders, Type, Layout, Palette } from "lucide-react";
import type { TextBubblePreset, TextBubbleCategory } from "@clypra-studio/engine";
import { BubbleAppearanceControls } from "./BubbleAppearanceControls";
import { BubbleGeometryControls } from "./BubbleGeometryControls";

interface BubbleLayoutInspectorProps {
  preset: TextBubblePreset;
  onUpdatePreset: (updated: TextBubblePreset) => void;
}

const CATEGORIES: TextBubbleCategory[] = [
  "paper",
  "speech",
  "comic",
  "cute",
  "banner",
  "labels",
  "decorative",
  "neon",
];

export const BubbleLayoutInspector: React.FC<BubbleLayoutInspectorProps> = ({
  preset,
  onUpdatePreset,
}) => {
  const p = preset.layout.padding ?? { top: 14, right: 18, bottom: 14, left: 18 };

  const handlePaddingChange = (side: keyof typeof p, val: number) => {
    const padding = {
      ...p,
      [side]: Math.max(0, val),
    };
    const definition = preset.definition && {
      ...preset.definition,
      textLayout: {
        ...preset.definition.textLayout,
        padding: [
          Math.min(0.5, padding.top / preset.layout.minHeight),
          Math.min(0.5, padding.right / preset.layout.minWidth),
          Math.min(0.5, padding.bottom / preset.layout.minHeight),
          Math.min(0.5, padding.left / preset.layout.minWidth),
        ] as [number, number, number, number],
      },
    };
    onUpdatePreset({
      ...preset,
      ...(definition ? { definition } : {}),
      layout: {
        ...preset.layout,
        padding,
      },
    });
  };

  return (
    <div className="flex h-full w-80 flex-col overflow-y-auto border-l border-[var(--studio-border)] bg-[var(--studio-panel)] text-xs text-white">
      {/* ── Section: Metadata ── */}
      <div className="border-b border-[var(--studio-border)] p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
          <Type size={14} className="text-[var(--studio-accent)]" />
          Preset Metadata
        </h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
              Preset Name
            </label>
            <input
              type="text"
              value={preset.name}
              onChange={(e) => onUpdatePreset({ ...preset, name: e.target.value })}
              className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white focus:border-[var(--studio-accent)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Category
              </label>
              <select
                value={preset.category}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    category: e.target.value as TextBubbleCategory,
                  })
                }
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white capitalize focus:border-[var(--studio-accent)] focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Version
              </label>
              <input
                type="number"
                disabled
                value={preset.version}
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)]/50 px-2 text-xs text-[var(--studio-muted)]"
              />
            </div>
          </div>
        </div>
      </div>

      <BubbleGeometryControls preset={preset} onUpdatePreset={onUpdatePreset} />
      <BubbleAppearanceControls preset={preset} onUpdatePreset={onUpdatePreset} />

      {/* ── Section: Layout & Padding ── */}
      <div className="border-b border-[var(--studio-border)] p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
          <Layout size={14} className="text-[var(--studio-accent)]" />
          Content Bounds & Padding
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Min Width (px)
              </label>
              <input
                type="number"
                value={preset.layout.minWidth}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    layout: { ...preset.layout, minWidth: Number(e.target.value) },
                  })
                }
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white focus:border-[var(--studio-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Min Height (px)
              </label>
              <input
                type="number"
                value={preset.layout.minHeight}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    layout: { ...preset.layout, minHeight: Number(e.target.value) },
                  })
                }
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white focus:border-[var(--studio-accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* 4-Side Padding Matrix */}
          <div>
            <label className="mb-1.5 block text-[11px] text-[var(--studio-muted)]">
              Text Safe Padding (T / R / B / L)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["top", "right", "bottom", "left"] as const).map((side) => (
                <div key={side}>
                  <input
                    type="number"
                    value={p[side]}
                    onChange={(e) => handlePaddingChange(side, Number(e.target.value))}
                    className="h-7 w-full text-center rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-1 text-xs text-white focus:border-[var(--studio-accent)] focus:outline-none"
                  />
                  <span className="mt-0.5 block text-center text-[9px] uppercase tracking-wider text-[var(--studio-muted)]">
                    {side[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[var(--studio-muted)]">
              Preserve Aspect Ratio
            </span>
            <input
              type="checkbox"
              checked={preset.layout.preserveAspectRatio}
              onChange={(e) =>
                onUpdatePreset({
                  ...preset,
                  layout: {
                    ...preset.layout,
                    preserveAspectRatio: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-[var(--studio-border)] bg-[var(--studio-control)] accent-[var(--studio-accent)]"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Typography Defaults ── */}
      <div className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
          <Palette size={14} className="text-[var(--studio-accent)]" />
          Default Text Style
        </h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={preset.defaultTextStyle?.color || "#ffffff"}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    defaultTextStyle: {
                      ...preset.defaultTextStyle,
                      color: e.target.value,
                    },
                  })
                }
                className="h-7 w-9 cursor-pointer rounded border border-[var(--studio-border)] bg-transparent p-0"
              />
              <input
                type="text"
                value={preset.defaultTextStyle?.color || "#ffffff"}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    defaultTextStyle: {
                      ...preset.defaultTextStyle,
                      color: e.target.value,
                    },
                  })
                }
                className="h-7 flex-1 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 font-mono text-xs text-white focus:border-[var(--studio-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Font Style
              </label>
              <select
                value={preset.defaultTextStyle?.fontStyle || "normal"}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    defaultTextStyle: {
                      ...preset.defaultTextStyle,
                      fontStyle: e.target.value as "normal" | "italic",
                    },
                  })
                }
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white focus:border-[var(--studio-accent)] focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-[var(--studio-muted)]">
                Decoration
              </label>
              <select
                value={preset.defaultTextStyle?.textDecoration || "none"}
                onChange={(e) =>
                  onUpdatePreset({
                    ...preset,
                    defaultTextStyle: {
                      ...preset.defaultTextStyle,
                      textDecoration: e.target.value as "none" | "underline",
                    },
                  })
                }
                className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white focus:border-[var(--studio-accent)] focus:outline-none"
              >
                <option value="none">None</option>
                <option value="underline">Underline</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
