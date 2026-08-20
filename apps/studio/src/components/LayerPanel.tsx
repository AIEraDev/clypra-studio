import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  SceneDocument,
  EffectLayer,
  EffectLayerType,
} from "@clypra-studio/engine";
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

const TYPE_ABBR: Record<string, string> = {
  glow: "GL",
  shadow: "SH",
  filter: "FX",
  mask: "MK",
  text: "TX",
};

function defaultParamsForType(type: EffectLayerType): Record<string, unknown> {
  switch (type) {
    case "glow":
      return {
        enabled: true,
        color: "#7C6FFF",
        blur: 24,
        opacity: 80,
        type: "outer",
      };
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

export function LayerPanel({
  scene,
  onSceneChange,
  uiMode,
  selectedLayerId,
  onSelectLayer,
}: LayerPanelProps) {
  if (uiMode === "basic") {
    return (
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: "var(--studio-border)",
          background: "var(--studio-panel)",
        }}
      >
        <p
          className="text-[10px] font-mono uppercase tracking-widest mb-1"
          style={{ color: "var(--studio-muted)" }}
        >
          Effect layers
        </p>
        <p className="text-[11px]" style={{ color: "var(--studio-muted)" }}>
          Select <span style={{ color: "var(--studio-accent)" }}>Layers</span>{" "}
          tab to reorder and edit.
        </p>
        <p
          className="text-[10px] mt-1"
          style={{ color: "var(--studio-subtle)" }}
        >
          {scene.effectLayers.length}{" "}
          {scene.effectLayers.length === 1 ? "layer" : "layers"} active
        </p>
      </div>
    );
  }

  const updateLayers = (layers: EffectLayer[]) =>
    onSceneChange({ ...scene, effectLayers: layers });

  const moveLayer = (index: number, dir: -1 | 1) => {
    const next = [...scene.effectLayers];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateLayers(next);
  };

  const toggleLayer = (id: string) =>
    updateLayers(
      scene.effectLayers.map((l) =>
        l.id === id ? { ...l, enabled: !l.enabled } : l,
      ),
    );

  const setOpacity = (id: string, opacity: number) =>
    updateLayers(
      scene.effectLayers.map((l) =>
        l.id === id ? { ...l, opacity: opacity / 100 } : l,
      ),
    );

  const removeLayer = (id: string) => {
    onSceneChange(
      pruneTracksForLayer(
        {
          ...scene,
          effectLayers: scene.effectLayers.filter((l) => l.id !== id),
        },
        id,
      ),
    );
  };

  const addLayer = (type: EffectLayerType) => {
    const layer: EffectLayer = {
      id: newLayerId(),
      type,
      name: `${type} ${
        scene.effectLayers.filter((l) => l.type === type).length + 1
      }`,
      enabled: true,
      opacity: 1,
      blendMode: "source-over",
      target: type === "filter" ? "previous" : "text",
      params: defaultParamsForType(type),
    };
    updateLayers([...scene.effectLayers, layer]);
  };

  return (
    <div
      className="flex flex-col border-b"
      style={{
        borderColor: "var(--studio-border)",
        background: "var(--studio-bg)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{
          borderColor: "var(--studio-border)",
          background: "var(--studio-panel)",
        }}
      >
        <div className="flex items-center gap-2">
          <Layers size={13} style={{ color: "var(--studio-accent)" }} />
          <span className="text-[11px] font-bold text-white tracking-wide">
            Effect Layers
          </span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
            style={{
              background: "var(--studio-control)",
              color: "var(--studio-muted)",
            }}
          >
            {scene.effectLayers.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {ADDABLE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addLayer(t)}
              title={`Add ${t} layer`}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[9px] font-bold uppercase tracking-wide transition-colors cursor-pointer"
              style={{ color: "var(--studio-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--studio-text)";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--studio-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--studio-muted)";
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              <Plus size={10} />
              {TYPE_ABBR[t] ?? t.slice(0, 2).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Layer list */}
      <ul className="py-1.5 px-2 space-y-1">
        {scene.effectLayers.length === 0 && (
          <li
            className="py-4 text-center text-[11px]"
            style={{ color: "var(--studio-muted)" }}
          >
            No layers yet. Add one above.
          </li>
        )}
        {scene.effectLayers.map((layer, index) => {
          const isSelected = selectedLayerId === layer.id;
          const opacityPct = Math.round(layer.opacity * 100);
          const isAddable = ADDABLE_TYPES.includes(layer.type);

          return (
            <li
              key={layer.id}
              className="layer-row"
              style={
                isSelected
                  ? {
                      borderColor: "var(--studio-accent)",
                      background: "var(--studio-active-soft)",
                    }
                  : {}
              }
              onClick={() => onSelectLayer?.(layer.id)}
            >
              {/* Visibility toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayer(layer.id);
                }}
                title={layer.enabled ? "Hide layer" : "Show layer"}
                className="shrink-0 cursor-pointer"
                style={{
                  color: layer.enabled
                    ? "var(--studio-text)"
                    : "var(--studio-subtle)",
                }}
              >
                {layer.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              {/* Type badge */}
              <span className={`layer-type-badge ${layer.type}`}>
                {TYPE_ABBR[layer.type] ?? layer.type.slice(0, 2).toUpperCase()}
              </span>

              {/* Name */}
              <span
                className="flex-1 min-w-0 truncate text-[11px] font-semibold"
                style={{ color: isSelected ? "white" : "var(--studio-text)" }}
              >
                {layer.name}
              </span>

              {/* Opacity mini-bar */}
              <div
                className="layer-opacity-bar shrink-0"
                title={`Opacity: ${opacityPct}%`}
              >
                <div
                  className="layer-opacity-bar-fill"
                  style={{ width: `${opacityPct}%` }}
                />
              </div>

              {/* Move up/down */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(index, -1);
                }}
                disabled={index === 0}
                className="shrink-0 cursor-pointer disabled:opacity-20"
                style={{ color: "var(--studio-muted)" }}
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(index, 1);
                }}
                disabled={index === scene.effectLayers.length - 1}
                className="shrink-0 cursor-pointer disabled:opacity-20"
                style={{ color: "var(--studio-muted)" }}
              >
                <ChevronDown size={12} />
              </button>

              {/* Delete (only addable layers) */}
              {isAddable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                  title="Remove layer"
                  className="shrink-0 cursor-pointer transition-colors"
                  style={{ color: "var(--studio-subtle)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "var(--gpu-error)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "var(--studio-subtle)")
                  }
                >
                  <Trash2 size={11} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Mask reveal quick-control */}
      {scene.effectLayers.some((l) => l.type === "mask" && l.enabled) && (
        <div
          className="px-3 py-2.5 border-t"
          style={{
            borderColor: "var(--studio-border)",
            background: "var(--studio-panel)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "var(--studio-muted)" }}
            >
              Reveal
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--studio-accent)" }}
            >
              {Math.round(
                ((scene.effectLayers.find((l) => l.type === "mask" && l.enabled)
                  ?.params.revealProgress as number) ?? 1) * 100,
              )}
              %
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            className="studio-slider w-full"
            value={Math.round(
              ((scene.effectLayers.find((l) => l.type === "mask" && l.enabled)
                ?.params.revealProgress as number) ?? 1) * 100,
            )}
            onChange={(e) => {
              const mask = scene.effectLayers.find(
                (l) => l.type === "mask" && l.enabled,
              );
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
          />
        </div>
      )}

      {/* Compositor controls */}
      <div
        className="px-3 py-2.5 border-t flex gap-4"
        style={{
          borderColor: "var(--studio-border)",
          background: "var(--studio-panel)",
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "var(--studio-muted)" }}
            >
              Blur
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--studio-text)" }}
            >
              {scene.compositor.blur}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={scene.compositor.blur}
            className="studio-slider w-full"
            onChange={(e) =>
              onSceneChange({
                ...scene,
                compositor: {
                  ...scene.compositor,
                  blur: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "var(--studio-muted)" }}
            >
              Bloom
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--studio-text)" }}
            >
              {Math.round(scene.compositor.bloom * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={scene.compositor.bloom}
            className="studio-slider w-full"
            onChange={(e) =>
              onSceneChange({
                ...scene,
                compositor: {
                  ...scene.compositor,
                  bloom: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
