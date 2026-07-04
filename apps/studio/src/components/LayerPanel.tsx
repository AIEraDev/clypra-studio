import React from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Layers, Plus, Trash2 } from "lucide-react";
import type { SceneDocument, EffectLayer, EffectLayerType } from "@clypra-studio/engine";
import { newLayerId } from "@clypra-studio/engine";
import { pruneTracksForLayer } from "@clypra-studio/engine";

interface LayerPanelProps {
  scene: SceneDocument;
  onSceneChange: (scene: SceneDocument) => void;
  uiMode: "basic" | "advanced";
  selectedLayerId?: string | null;
  onSelectLayer?: (layerId: string | null) => void;
}

const ADDABLE_TYPES: EffectLayerType[] = ["glow", "shadow", "filter", "mask"];

function defaultParamsForType(type: EffectLayerType): Record<string, unknown> {
  switch (type) {
    case "glow":
      return { enabled: true, color: "#7C6FFF", blur: 24, opacity: 80, type: "outer" };
    case "shadow":
      return {
        shadowEnabled: true,
        shadowColor: "#000000",
        shadowBlur: 12,
        shadowOffsetX: 4,
        shadowOffsetY: 4,
        shadowOpacity: 80,
        shadowType: "drop",
      };
    case "filter":
      return { blur: 2, bloom: 0.15 };
    case "mask":
      return { maskType: "rectReveal", revealProgress: 0 };
    default:
      return {};
  }
}

export function LayerPanel({ scene, onSceneChange, uiMode, selectedLayerId, onSelectLayer }: LayerPanelProps) {
  if (uiMode === "basic") {
    return (
      <div className="px-4 py-3 border-b border-[#2A2A38] bg-[#12121A]">
        <p className="text-[10px] font-mono uppercase text-clypra-muted tracking-wider mb-1">Effect layers</p>
        <p className="text-xs text-gray-500">
          Select <span className="text-[#7C6FFF]">Layers</span> from the left rail to reorder and edit.
        </p>
        <p className="text-[10px] text-gray-600 mt-1">{scene.effectLayers.length} layers active</p>
      </div>
    );
  }

  const updateLayers = (layers: EffectLayer[]) => {
    onSceneChange({ ...scene, effectLayers: layers });
  };

  const moveLayer = (index: number, dir: -1 | 1) => {
    const next = [...scene.effectLayers];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateLayers(next);
  };

  const toggleLayer = (id: string) => {
    updateLayers(scene.effectLayers.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)));
  };

  const setOpacity = (id: string, opacity: number) => {
    updateLayers(scene.effectLayers.map((l) => (l.id === id ? { ...l, opacity: opacity / 100 } : l)));
  };

  const removeLayer = (id: string) => {
    onSceneChange(pruneTracksForLayer({ ...scene, effectLayers: scene.effectLayers.filter((l) => l.id !== id) }, id));
  };

  const addLayer = (type: EffectLayerType) => {
    const layer: EffectLayer = {
      id: newLayerId(),
      type,
      name: `${type} ${scene.effectLayers.filter((l) => l.type === type).length + 1}`,
      enabled: true,
      opacity: 1,
      blendMode: "source-over",
      target: type === "filter" ? "previous" : "text",
      params: defaultParamsForType(type),
    };
    updateLayers([...scene.effectLayers, layer]);
  };

  return (
    <div className="border-b border-[#2A2A38] bg-[#12121A]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A1A26]">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Layers size={14} className="text-[#7C6FFF]" />
          Effect Layers
        </div>
        <div className="flex gap-1">
          {ADDABLE_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => addLayer(t)} className="p-1 rounded hover:bg-[#2A2A38] text-gray-400 hover:text-white cursor-pointer" title={`Add ${t}`}>
              <Plus size={12} />
            </button>
          ))}
        </div>
      </div>
      <ul className="">
        {scene.effectLayers.map((layer, index) => (
          <li key={layer.id} className={`flex items-center gap-2 px-3 py-1.5 border-b border-[#1A1A26]/50 hover:bg-[#1A1A26]/40 text-xs ${selectedLayerId === layer.id ? "bg-[#7C6FFF]/10" : ""}`}>
            <button type="button" onClick={() => toggleLayer(layer.id)} className="text-gray-500 hover:text-white cursor-pointer">
              {layer.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
            <button type="button" onClick={() => onSelectLayer?.(layer.id)} className="flex-1 truncate text-left text-gray-300 cursor-pointer">
              <span className="text-[#7C6FFF] font-mono text-[10px] mr-1">{layer.type}</span>
              {layer.name}
            </button>
            <input type="range" min={0} max={100} value={Math.round(layer.opacity * 100)} onChange={(e) => setOpacity(layer.id, parseInt(e.target.value, 10))} className="w-14 h-1 accent-[#7C6FFF]" title="Opacity" />
            <button type="button" onClick={() => moveLayer(index, -1)} disabled={index === 0} className="p-0.5 text-gray-600 hover:text-white disabled:opacity-30 cursor-pointer">
              <ChevronUp size={12} />
            </button>
            <button type="button" onClick={() => moveLayer(index, 1)} disabled={index === scene.effectLayers.length - 1} className="p-0.5 text-gray-600 hover:text-white disabled:opacity-30 cursor-pointer">
              <ChevronDown size={12} />
            </button>
            {ADDABLE_TYPES.includes(layer.type) && (
              <button type="button" onClick={() => removeLayer(layer.id)} className="p-0.5 text-gray-600 hover:text-red-400 cursor-pointer">
                <Trash2 size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {scene.effectLayers.some((l) => l.type === "mask" && l.enabled) && (
        <div className="px-4 py-2 border-t border-[#1A1A26]">
          <label className="text-[10px] text-gray-500 flex items-center gap-2">
            Reveal
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(((scene.effectLayers.find((l) => l.type === "mask" && l.enabled)?.params.revealProgress as number) ?? 1) * 100)}
              onChange={(e) => {
                const mask = scene.effectLayers.find((l) => l.type === "mask" && l.enabled);
                if (!mask) return;
                onSceneChange({
                  ...scene,
                  effectLayers: scene.effectLayers.map((l) =>
                    l.id === mask.id
                      ? {
                          ...l,
                          params: {
                            ...l.params,
                            revealProgress: parseInt(e.target.value, 10) / 100,
                          },
                        }
                      : l,
                  ),
                });
              }}
              className="flex-1 h-1 accent-[#7C6FFF]"
            />
          </label>
        </div>
      )}
      <div className="px-4 py-2 flex gap-3 text-[10px] text-gray-500">
        <label className="flex items-center gap-1">
          Blur
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={scene.compositor.blur}
            onChange={(e) =>
              onSceneChange({
                ...scene,
                compositor: { ...scene.compositor, blur: parseFloat(e.target.value) },
              })
            }
            className="w-16 h-1 accent-[#7C6FFF]"
          />
        </label>
        <label className="flex items-center gap-1">
          Bloom
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={scene.compositor.bloom}
            onChange={(e) =>
              onSceneChange({
                ...scene,
                compositor: { ...scene.compositor, bloom: parseFloat(e.target.value) },
              })
            }
            className="w-16 h-1 accent-[#7C6FFF]"
          />
        </label>
      </div>
    </div>
  );
}
