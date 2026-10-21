import React, { useState } from "react";
import { Spline } from "lucide-react";
import { compileBubblePath, createBubbleAssetDefinition, createFreeformBubbleAssetDefinition, type BubbleAssetDefinition, type BubbleTailSide, type FreeformBubbleDefinition, type ParametricBubbleDefinition, type TextBubblePreset } from "@clypra-studio/engine";

const TAIL_SIDES: BubbleTailSide[] = ["bottom", "top", "left", "right"];

function isParametricDefinition(definition: BubbleAssetDefinition): definition is ParametricBubbleDefinition {
  return definition.geometry.kind === "parametric-path";
}

export function BubbleGeometryControls({ preset, onUpdatePreset }: { preset: TextBubblePreset; onUpdatePreset: (preset: TextBubblePreset) => void }) {
  const definition = preset.definition ?? createBubbleAssetDefinition();
  const [draggedAnchor, setDraggedAnchor] = useState<number | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<number>(0);
  const update = (mutate: (next: BubbleAssetDefinition) => void) => {
    const next = structuredClone(definition); mutate(next); onUpdatePreset({ ...preset, definition: next });
  };
  const path = compileBubblePath(definition);
  const { fill, outline } = definition.layers;
  if (!isParametricDefinition(definition)) {
    const anchors = definition.geometry.commands.filter(command => command.kind !== "close");
    const selected = anchors[Math.min(selectedAnchor, anchors.length - 1)];
    const freeformDefinition: FreeformBubbleDefinition = definition;
    const updateFreeform = (mutate: (next: FreeformBubbleDefinition) => void) => {
      const next = structuredClone(freeformDefinition);
      mutate(next);
      onUpdatePreset({ ...preset, definition: next });
    };
    const updateAnchor = (index: number, event: React.PointerEvent<SVGSVGElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, -0.08 + ((event.clientX - bounds.left) / bounds.width) * 1.16));
      const y = Math.max(0, Math.min(1, -0.08 + ((event.clientY - bounds.top) / bounds.height) * 1.28));
      const next = structuredClone(definition);
      const command = next.geometry.commands.filter(candidate => candidate.kind !== "close")[index];
      if (command) command.to = [x, y];
      onUpdatePreset({ ...preset, definition: next });
    };
    return <div className="border-b border-[var(--studio-border)] p-4">
      <h3 className="mb-2 flex items-center gap-2 font-bold text-white"><Spline size={14} className="text-[var(--studio-accent)]" />Freeform silhouette</h3>
      <svg viewBox="-0.08 -0.08 1.16 1.28" onPointerMove={event => { if (draggedAnchor !== null) updateAnchor(draggedAnchor, event); }} onPointerUp={() => setDraggedAnchor(null)} onPointerLeave={() => setDraggedAnchor(null)} className="mb-3 w-full touch-none rounded border border-[var(--studio-border)] bg-[#09090d] p-2" aria-label="Editable freeform bubble preview">
        <path d={path} fill={fill.color} fillOpacity={fill.opacity} stroke={outline.color} strokeWidth={outline.width} vectorEffect="non-scaling-stroke" />
        {anchors.map((command, index) => <circle key={index} cx={command.to[0]} cy={command.to[1]} r={selectedAnchor === index ? "0.034" : "0.025"} fill={selectedAnchor === index ? "#ffffff" : "var(--studio-accent)"} className="cursor-grab active:cursor-grabbing" onPointerDown={event => { event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); setSelectedAnchor(index); setDraggedAnchor(index); }} />)}
      </svg>
      <p className="mb-3 text-[10px] leading-relaxed text-[var(--studio-muted)]">Drag an anchor, then use the node tools below to build the silhouette. Paths—not a preview bitmap—are saved in the asset JSON.</p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => updateFreeform(next => { const closeIndex = next.geometry.commands.findIndex(command => command.kind === "close"); next.geometry.commands.splice(closeIndex, 0, { kind: "line", to: [0.5, 0.5] }); setSelectedAnchor(anchors.length); })} className="h-7 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] text-xs font-semibold text-white hover:border-[var(--studio-accent)]">Add node</button>
        <button type="button" disabled={anchors.length <= 3} onClick={() => updateFreeform(next => { const target = next.geometry.commands.filter(command => command.kind !== "close")[selectedAnchor]; const index = next.geometry.commands.indexOf(target); if (index >= 0) next.geometry.commands.splice(index, 1); setSelectedAnchor(Math.max(0, selectedAnchor - 1)); })} className="h-7 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] text-xs font-semibold text-white hover:border-[var(--studio-accent)] disabled:cursor-not-allowed disabled:opacity-40">Delete node</button>
      </div>
      {selected && <div className="mb-3 space-y-2 rounded border border-[var(--studio-border)] bg-black/20 p-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--studio-muted)]">Selected node {selectedAnchor + 1}</div>
        <div className="grid grid-cols-2 gap-2"><Range label="Node X" value={selected.to[0] * 100} onChange={value => updateFreeform(next => { const command = next.geometry.commands.filter(candidate => candidate.kind !== "close")[selectedAnchor]; if (command) command.to[0] = value / 100; })} /><Range label="Node Y" value={selected.to[1] * 100} onChange={value => updateFreeform(next => { const command = next.geometry.commands.filter(candidate => candidate.kind !== "close")[selectedAnchor]; if (command) command.to[1] = value / 100; })} /></div>
        {selectedAnchor > 0 && <label className="block text-[11px] text-[var(--studio-muted)]">Incoming segment<select aria-label="Freeform segment type" value={selected.kind === "quadratic" ? "quadratic" : "line"} onChange={event => updateFreeform(next => { const command = next.geometry.commands.filter(candidate => candidate.kind !== "close")[selectedAnchor]; if (!command || command.kind === "move") return; const kind = event.target.value; next.geometry.commands[next.geometry.commands.indexOf(command)] = kind === "quadratic" ? { kind: "quadratic", control: [command.to[0], command.to[1]], to: command.to } : { kind: "line", to: command.to }; })} className="mt-1 h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white"><option value="line">straight line</option><option value="quadratic">quadratic curve</option></select></label>}
        {selected.kind === "quadratic" && <div className="grid grid-cols-2 gap-2"><Range label="Curve X" value={selected.control[0] * 100} onChange={value => updateFreeform(next => { const command = next.geometry.commands.filter(candidate => candidate.kind !== "close")[selectedAnchor]; if (command?.kind === "quadratic") command.control[0] = value / 100; })} /><Range label="Curve Y" value={selected.control[1] * 100} onChange={value => updateFreeform(next => { const command = next.geometry.commands.filter(candidate => candidate.kind !== "close")[selectedAnchor]; if (command?.kind === "quadratic") command.control[1] = value / 100; })} /></div>}
      </div>}
      <button type="button" onClick={() => onUpdatePreset({ ...preset, definition: createBubbleAssetDefinition() })} className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] text-xs font-semibold text-white hover:border-[var(--studio-accent)]">Return to parametric shape</button>
    </div>;
  }
  const parametricDefinition = definition;
  const updateParametric = (mutate: (next: ParametricBubbleDefinition) => void) => {
    const next = structuredClone(parametricDefinition);
    mutate(next);
    onUpdatePreset({ ...preset, definition: next });
  };
  const tail = parametricDefinition.geometry.tail;
  const viewBox = tail.side === "top" ? "-0.04 -0.28 1.08 1.32"
    : tail.side === "left" ? "-0.28 -0.04 1.32 1.08"
      : tail.side === "right" ? "-0.04 -0.04 1.32 1.08"
        : "-0.04 -0.04 1.08 1.32";
  const tailHandle = tail.side === "top" ? { x: tail.anchor, y: -tail.depth }
    : tail.side === "left" ? { x: -tail.depth, y: tail.anchor }
      : tail.side === "right" ? { x: 1 + tail.depth, y: tail.anchor }
        : { x: tail.anchor, y: 1 + tail.depth };
  return <div className="border-b border-[var(--studio-border)] p-4">
    <h3 className="mb-2 flex items-center gap-2 font-bold text-white"><Spline size={14} className="text-[var(--studio-accent)]" />Vector geometry</h3>
    <svg viewBox={viewBox} className="mb-3 w-full rounded border border-[var(--studio-border)] bg-[#09090d] p-2" aria-label="Editable vector bubble preview">
      <path d={path} fill={fill.color} fillOpacity={fill.opacity} stroke={outline.color} strokeWidth={outline.width} vectorEffect="non-scaling-stroke" />
      {tail.enabled && <circle cx={tailHandle.x} cy={tailHandle.y} r="0.028" fill="var(--studio-accent)" />}
    </svg>
    <div className="space-y-2">
      <button type="button" onClick={() => onUpdatePreset({ ...preset, definition: createFreeformBubbleAssetDefinition() })} className="h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] text-xs font-semibold text-white hover:border-[var(--studio-accent)]">Convert to freeform silhouette</button>
      <Range label="Corner curve" value={parametricDefinition.geometry.body.cornerRadius * 100} onChange={value => updateParametric(next => { next.geometry.body.cornerRadius = value / 100; })} />
      <label className="block text-[11px] text-[var(--studio-muted)]">Tail side<select aria-label="Vector tail side" value={tail.side} onChange={e => updateParametric(next => { next.geometry.tail.side = e.target.value as BubbleTailSide; })} className="mt-1 h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white">{TAIL_SIDES.map(side => <option key={side} value={side}>{side}</option>)}</select></label>
      <Range label="Tail anchor" value={tail.anchor * 100} onChange={value => updateParametric(next => { next.geometry.tail.anchor = value / 100; })} />
      <Range label="Tail width" value={tail.width * 100} onChange={value => updateParametric(next => { next.geometry.tail.width = value / 100; })} />
      <Range label="Tail depth" value={tail.depth * 100} onChange={value => updateParametric(next => { next.geometry.tail.depth = value / 100; })} />
      <label className="block text-[11px] text-[var(--studio-muted)]">Text alignment<select aria-label="Vector text alignment" value={parametricDefinition.textLayout.alignment} onChange={event => updateParametric(next => { next.textLayout.alignment = event.target.value as ParametricBubbleDefinition["textLayout"]["alignment"]; })} className="mt-1 h-7 w-full rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white"><option value="left">left</option><option value="center">center</option><option value="right">right</option></select></label>
    </div>
  </div>;
}

function Range({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block text-[11px] text-[var(--studio-muted)]"><span className="flex justify-between"><span>{label}</span><span>{Math.round(value)}%</span></span><input aria-label={label} type="range" min="0" max="100" value={value} onChange={event => onChange(Number(event.target.value))} className="mt-1 h-1.5 w-full accent-[var(--studio-accent)]" /></label>;
}
