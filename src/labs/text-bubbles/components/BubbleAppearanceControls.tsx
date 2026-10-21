import React from "react";
import { Brush } from "lucide-react";
import {
  createBubbleAssetDefinition,
  type BubbleAssetDefinition,
  type TextBubblePreset,
} from "@clypra-studio/engine";

const TEXTURES = ["none", "hatch", "chalk"] as const;

/** Edits layers on the same definition consumed by the SVG and canvas renderers. */
export function BubbleAppearanceControls({ preset, onUpdatePreset }: {
  preset: TextBubblePreset;
  onUpdatePreset: (preset: TextBubblePreset) => void;
}) {
  const definition = preset.definition ?? createBubbleAssetDefinition();
  const update = (mutate: (next: BubbleAssetDefinition) => void) => {
    const next = structuredClone(definition);
    mutate(next);
    onUpdatePreset({ ...preset, definition: next });
  };
  const accent = definition.layers.accent;
  const texture = accent?.texture ?? "none";
  const applyRoughPreset = (roughness: number, nextTexture: (typeof TEXTURES)[number]) => update(next => {
    next.layers.outline.roughness = roughness;
    next.layers.accent = nextTexture === "none" ? undefined : { color: "#ffffff", opacity: nextTexture === "chalk" ? 0.12 : 0.22, texture: nextTexture };
  });

  return <div className="border-b border-[var(--studio-border)] p-4">
    <h3 className="mb-2 flex items-center gap-2 font-bold text-white"><Brush size={14} className="text-[var(--studio-accent)]" />Visual layers</h3>
    <p className="mb-3 text-[10px] leading-relaxed text-[var(--studio-muted)]">Fill, outline, and texture are serialized with the vector asset.</p>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-[var(--studio-muted)]">Fill<input aria-label="Bubble fill color" type="color" value={definition.layers.fill.color} onChange={event => update(next => { next.layers.fill.color = event.target.value; })} className="mt-1 h-7 w-full rounded border border-[var(--studio-border)] bg-transparent p-0" /></label>
        <label className="text-[11px] text-[var(--studio-muted)]">Outline<input aria-label="Bubble outline color" type="color" value={definition.layers.outline.color} onChange={event => update(next => { next.layers.outline.color = event.target.value; })} className="mt-1 h-7 w-full rounded border border-[var(--studio-border)] bg-transparent p-0" /></label>
      </div>
      <Range label="Fill opacity" value={definition.layers.fill.opacity * 100} min={0} max={100} suffix="%" onChange={value => update(next => { next.layers.fill.opacity = value / 100; })} />
      <Range label="Outline width" value={definition.layers.outline.width * 100} min={0} max={10} suffix="%" onChange={value => update(next => { next.layers.outline.width = value / 100; })} />
      <Range label="Outline roughness" value={definition.layers.outline.roughness * 100} min={0} max={100} suffix="%" onChange={value => update(next => { next.layers.outline.roughness = value / 100; })} />
      <div><span className="text-[11px] text-[var(--studio-muted)]">Hand-drawn style</span><div className="mt-1 grid grid-cols-3 gap-1"><button type="button" onClick={() => applyRoughPreset(0.12, "none")} className="h-7 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] text-[10px] text-white hover:border-[var(--studio-accent)]">Sketch</button><button type="button" onClick={() => applyRoughPreset(0.3, "hatch")} className="h-7 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] text-[10px] text-white hover:border-[var(--studio-accent)]">Comic</button><button type="button" onClick={() => applyRoughPreset(0.55, "chalk")} className="h-7 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] text-[10px] text-white hover:border-[var(--studio-accent)]">Chalk</button></div></div>
      <label className="block text-[11px] text-[var(--studio-muted)]">Texture<select aria-label="Bubble texture" value={texture} onChange={event => update(next => {
        const nextTexture = event.target.value as (typeof TEXTURES)[number];
        next.layers.accent = nextTexture === "none" ? undefined : { color: accent?.color ?? "#ffffff", opacity: accent?.opacity ?? 0.18, texture: nextTexture };
      })} className="mt-1 h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white">{TEXTURES.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      {accent && <Range label="Texture opacity" value={accent.opacity * 100} min={0} max={100} suffix="%" onChange={value => update(next => { if (next.layers.accent) next.layers.accent.opacity = value / 100; })} />}
    </div>
  </div>;
}

function Range({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return <label className="block text-[11px] text-[var(--studio-muted)]"><span className="flex justify-between"><span>{label}</span><span>{Math.round(value)}{suffix}</span></span><input aria-label={label} type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))} className="mt-1 h-1.5 w-full accent-[var(--studio-accent)]" /></label>;
}
