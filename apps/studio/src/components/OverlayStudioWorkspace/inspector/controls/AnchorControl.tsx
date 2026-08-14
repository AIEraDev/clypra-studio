import React from "react";
import { Link2, Unlink } from "lucide-react";
import type { SceneNode, SpatialAnchorConfig, AnchorSide } from "@clypra-studio/engine";

interface AnchorControlProps {
  node: SceneNode;
  nodes: SceneNode[];
  onChange: (anchor: SpatialAnchorConfig | undefined) => void;
}

const SIDES: Array<{ label: string; value: AnchorSide }> = [
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
  { label: "Center", value: "center" },
];

export function AnchorControl({ node, nodes, onChange }: AnchorControlProps) {
  const currentAnchor = (node.anchor && "targetId" in node.anchor ? node.anchor : undefined) as SpatialAnchorConfig | undefined;
  const availableTargets = nodes.filter((n) => n.id !== node.id);

  const set = (patch: Partial<SpatialAnchorConfig>) => {
    if (!currentAnchor?.targetId && !patch.targetId) return;
    onChange({
      targetId: currentAnchor?.targetId || "",
      anchorSide: currentAnchor?.anchorSide || "left",
      targetSide: currentAnchor?.targetSide || "right",
      offsetX: currentAnchor?.offsetX ?? 16,
      offsetY: currentAnchor?.offsetY ?? 0,
      ...patch,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Target Node Selection */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 truncate flex items-center gap-1">
          <Link2 size={12} className="text-violet-400" /> Target
        </span>
        <select
          value={currentAnchor?.targetId || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              onChange(undefined);
            } else {
              set({ targetId: val });
            }
          }}
          className="flex-1 bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 focus:outline-none cursor-pointer"
        >
          <option value="">No Spatial Anchor</option>
          {availableTargets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name || t.id} ({t.type})
            </option>
          ))}
        </select>
        {currentAnchor?.targetId && (
          <button
            type="button"
            title="Remove Anchor"
            onClick={() => onChange(undefined)}
            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <Unlink size={12} />
          </button>
        )}
      </div>

      {/* Anchor Settings (When Target Selected) */}
      {currentAnchor?.targetId && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
                Target Edge
              </span>
              <select
                value={currentAnchor.targetSide || "right"}
                onChange={(e) => set({ targetSide: e.target.value as AnchorSide })}
                className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                {SIDES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
                Self Edge
              </span>
              <select
                value={currentAnchor.anchorSide || "left"}
                onChange={(e) => set({ anchorSide: e.target.value as AnchorSide })}
                className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                {SIDES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
                Offset X
              </span>
              <input
                type="number"
                value={currentAnchor.offsetX ?? 16}
                onChange={(e) => set({ offsetX: Number(e.target.value) })}
                className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
                Offset Y
              </span>
              <input
                type="number"
                value={currentAnchor.offsetY ?? 0}
                onChange={(e) => set({ offsetY: Number(e.target.value) })}
                className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
