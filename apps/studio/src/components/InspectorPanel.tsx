import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import type { TextEffectConfig } from "@clypra-studio/engine";
import type {
  EffectLayer,
  EffectLayerType,
  SceneDocument,
} from "@clypra-studio/engine";
import { newLayerId } from "@clypra-studio/engine";
import { pruneTracksForLayer } from "@clypra-studio/engine";
import { ClypraColorPicker } from "@clypra/ui-color-picker";
import { LegacyControlsPanel } from "./LegacyControlsPanel";

type ConfigPatch =
  | Partial<TextEffectConfig>
  | ((config: TextEffectConfig) => TextEffectConfig);

interface InspectorPanelProps {
  config: TextEffectConfig;
  scene: SceneDocument;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
  onConfigChange: (patch: ConfigPatch) => void;
  onSceneChange: (
    scene: SceneDocument | ((prev: SceneDocument) => SceneDocument),
  ) => void;
  onSavePreset: () => void;
  onStartFromScratch: () => void;
  onFitText: () => void;
  onOpenFontCompare: () => void;
  activeEffectId: string;
  collapsedSections: Record<string, boolean>;
  isGeneratingName: boolean;
  onToggleSection: (section: string) => void;
  onGenerateEffectName: () => void;
  onApplyCompositionPreset: (presetId: string) => void;
}

const ADDABLE_TYPES: EffectLayerType[] = ["glow", "shadow", "filter", "mask"];

const TYPE_ABBR: Record<string, string> = {
  glow: "GL",
  shadow: "SH",
  filter: "FX",
  mask: "MK",
  text: "TX",
};
const TYPE_LABEL: Record<string, string> = {
  glow: "Glow",
  shadow: "Shadow",
  filter: "Filter",
  mask: "Mask",
  text: "Text",
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

// ── Collapsible Section ──────────────────────────────────────────────────────
function Section({
  id,
  title,
  accent = false,
  defaultOpen = true,
  headerRight,
  children,
}: {
  id: string;
  title: string;
  accent?: boolean;
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="inspector-section"
      style={accent ? { borderLeft: "3px solid var(--studio-accent)" } : {}}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`sec-${id}`}
        onClick={() => setOpen((v) => !v)}
        className="inspector-section-header w-full"
      >
        <span className="inspector-section-title">{title}</span>
        <span className="flex items-center gap-2">
          {headerRight}
          {open ? (
            <ChevronDown size={13} style={{ color: "var(--studio-muted)" }} />
          ) : (
            <ChevronRight size={13} style={{ color: "var(--studio-muted)" }} />
          )}
        </span>
      </button>
      {open && (
        <div id={`sec-${id}`} className="inspector-section-body space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────────────────────
function FieldLabel({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span
        className="text-[9px] font-bold uppercase tracking-widest"
        style={{ color: "var(--studio-muted)" }}
      >
        {label}
      </span>
      {value !== undefined && (
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--studio-accent)" }}
        >
          {value}
        </span>
      )}
    </div>
  );
}

// ── Slider ────────────────────────────────────────────────────────────────────
function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} value={`${value}${unit}`} />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="studio-slider w-full"
      />
    </div>
  );
}

// ── Color field ───────────────────────────────────────────────────────────────
function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const safe = value?.startsWith("#") ? value : "#ffffff";
  return (
    <div className="studio-color-field flex items-center gap-2">
      <ClypraColorPicker
        value={safe}
        onChange={onChange}
        onChangeComplete={onChange}
        size="sm"
        placement="bottom-end"
        triggerClassName="w-7 h-7 rounded border border-white/10"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-transparent font-mono text-[11px] outline-none"
        style={{ color: "var(--studio-text)" }}
      />
    </div>
  );
}

// ── Layer type color ──────────────────────────────────────────────────────────
function LayerTypeDot({ type }: { type: string }) {
  return (
    <span
      className={`layer-type-badge ${type}`}
      style={{ fontSize: 8, width: 18, height: 18 }}
    >
      {TYPE_ABBR[type] ?? type.slice(0, 2).toUpperCase()}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function InspectorPanel({
  config,
  scene,
  selectedLayerId,
  onSelectLayer,
  onConfigChange,
  onSceneChange,
  onSavePreset,
  onStartFromScratch,
  onFitText,
  onOpenFontCompare,
  activeEffectId,
  collapsedSections,
  isGeneratingName,
  onToggleSection,
  onGenerateEffectName,
  onApplyCompositionPreset,
}: InspectorPanelProps) {
  const selectedLayer = useMemo(
    () => scene.effectLayers.find((l) => l.id === selectedLayerId) ?? null,
    [scene.effectLayers, selectedLayerId],
  );

  const updateLayers = (layers: EffectLayer[]) =>
    onSceneChange({ ...scene, effectLayers: layers });

  const patchLayer = (id: string, patch: Partial<EffectLayer>) =>
    updateLayers(
      scene.effectLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );

  const patchSelectedParams = (patch: Record<string, unknown>) => {
    if (!selectedLayer) return;
    patchLayer(selectedLayer.id, {
      params: { ...selectedLayer.params, ...patch },
    });
  };

  const addLayer = (type: EffectLayerType) => {
    const layer: EffectLayer = {
      id: newLayerId(),
      type,
      name: `${TYPE_LABEL[type] ?? type} ${
        scene.effectLayers.filter((l) => l.type === type).length + 1
      }`,
      enabled: true,
      opacity: 1,
      blendMode: "source-over",
      target: type === "filter" ? "previous" : "text",
      params: defaultParamsForType(type),
    };
    updateLayers([...scene.effectLayers, layer]);
    onSelectLayer(layer.id);
  };

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
    if (selectedLayerId === id) onSelectLayer(null);
  };

  const duplicateLayer = (layer: EffectLayer) => {
    const clone: EffectLayer = {
      ...layer,
      id: newLayerId(),
      name: `${layer.name} copy`,
      params: { ...layer.params },
    };
    const idx = scene.effectLayers.findIndex((l) => l.id === layer.id);
    const next = [...scene.effectLayers];
    next.splice(idx + 1, 0, clone);
    updateLayers(next);
    onSelectLayer(clone.id);
  };

  const moveLayer = (index: number, dir: -1 | 1) => {
    const next = [...scene.effectLayers];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateLayers(next);
  };

  return (
    <aside
      id="studio-inspector-panel"
      className="flex w-full flex-col border-l"
      style={{
        background: "var(--studio-shell)",
        borderColor: "var(--studio-border)",
        minWidth: 0,
      }}
      aria-label="Inspector"
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0"
        style={{
          borderColor: "var(--studio-border)",
          background: "var(--studio-panel)",
        }}
      >
        <div className="min-w-0 flex-1">
          <p
            className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "var(--studio-muted)" }}
          >
            INSPECTOR
          </p>
          <h2 className="truncate text-[13px] font-bold text-white">
            {selectedLayer
              ? selectedLayer.name
              : config.effectName || "Untitled style"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onSavePreset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shrink-0"
          style={{
            background: "var(--studio-active)",
            border: "1px solid var(--studio-active-strong)",
          }}
        >
          <Save size={11} />
          Save
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Selection toggle */}
        <Section id="selection" title="Selection" defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelectLayer(null)}
              className="rounded-lg py-2 text-[11px] font-bold transition-colors"
              style={
                !selectedLayer
                  ? {
                      background: "var(--studio-active-soft)",
                      border: "1px solid var(--studio-accent)",
                      color: "var(--studio-accent)",
                    }
                  : {
                      background: "var(--studio-control)",
                      border: "1px solid var(--studio-border)",
                      color: "var(--studio-muted)",
                    }
              }
            >
              Text layer
            </button>
            <button
              type="button"
              onClick={onStartFromScratch}
              className="rounded-lg py-2 text-[11px] font-bold transition-colors"
              style={{
                background: "var(--studio-control)",
                border: "1px solid var(--studio-border)",
                color: "var(--studio-text)",
              }}
            >
              Blank slate
            </button>
          </div>
          {!selectedLayer && (
            <button
              type="button"
              onClick={onOpenFontCompare}
              className="canvas-toolbar-btn w-full justify-center"
            >
              Compare fonts
            </button>
          )}

          {selectedLayer && (
            <div
              className="space-y-2 rounded-lg p-2"
              style={{
                background: "var(--studio-control)",
                border: "1px solid var(--studio-border)",
              }}
            >
              <input
                value={selectedLayer.name}
                onChange={(e) =>
                  patchLayer(selectedLayer.id, { name: e.target.value })
                }
                className="studio-input"
              />
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    patchLayer(selectedLayer.id, {
                      enabled: !selectedLayer.enabled,
                    })
                  }
                  className="flex items-center justify-center gap-1 rounded py-1.5 text-[10px] font-semibold"
                  style={{
                    background: "var(--studio-raised)",
                    color: "var(--studio-text)",
                  }}
                >
                  {selectedLayer.enabled ? (
                    <EyeOff size={11} />
                  ) : (
                    <Eye size={11} />
                  )}
                  {selectedLayer.enabled ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => duplicateLayer(selectedLayer)}
                  className="flex items-center justify-center gap-1 rounded py-1.5 text-[10px] font-semibold"
                  style={{
                    background: "var(--studio-raised)",
                    color: "var(--studio-text)",
                  }}
                >
                  <Copy size={11} />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => removeLayer(selectedLayer.id)}
                  className="flex items-center justify-center gap-1 rounded py-1.5 text-[10px] font-semibold"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    color: "var(--gpu-error)",
                  }}
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* The Inspector is the single text-style authority. The former left
            Style tab is hosted here so advanced controls stay available
            without creating a second editing surface. */}
        {!selectedLayer && (
          <div className="-mx-1">
            <LegacyControlsPanel
              visible
              config={config}
              activeEffectId={activeEffectId}
              collapsedSections={collapsedSections}
              isGeneratingName={isGeneratingName}
              modifyConfig={onConfigChange}
              toggleSection={onToggleSection}
              handleGenerateAiEffectName={onGenerateEffectName}
              applyCompositionPreset={onApplyCompositionPreset}
              fitTextToComposition={onFitText}
            />
          </div>
        )}

        {/* Effect stack */}
        <Section
          id="effect-stack"
          title="Effect Stack"
          defaultOpen
          headerRight={
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
              style={{
                background: "var(--studio-control)",
                color: "var(--studio-muted)",
              }}
            >
              {scene.effectLayers.length}
            </span>
          }
        >
          {/* Add layer row */}
          <div className="flex flex-wrap gap-1 pb-1">
            {ADDABLE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addLayer(type)}
                className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors"
                style={{
                  background: "var(--studio-control)",
                  border: "1px solid var(--studio-border)",
                  color: "var(--studio-muted)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--studio-text)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--studio-accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--studio-muted)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--studio-border)";
                }}
              >
                <Plus size={10} />
                {TYPE_LABEL[type]}
              </button>
            ))}
          </div>

          {/* Layer rows */}
          <div className="space-y-1">
            {scene.effectLayers.map((layer, index) => {
              const isSelected = selectedLayerId === layer.id;
              return (
                <div
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
                  onClick={() => onSelectLayer(layer.id)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      patchLayer(layer.id, { enabled: !layer.enabled });
                    }}
                    style={{
                      color: layer.enabled
                        ? "var(--studio-text)"
                        : "var(--studio-subtle)",
                    }}
                    className="shrink-0"
                  >
                    {layer.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>

                  <LayerTypeDot type={layer.type} />

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[11px] font-semibold text-white leading-tight">
                      {layer.name}
                    </p>
                    <p
                      className="text-[9px] font-mono"
                      style={{ color: "var(--studio-muted)" }}
                    >
                      {layer.blendMode} · {Math.round(layer.opacity * 100)}%
                    </p>
                  </div>

                  <div className="layer-opacity-bar shrink-0">
                    <div
                      className="layer-opacity-bar-fill"
                      style={{ width: `${Math.round(layer.opacity * 100)}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(index, -1);
                    }}
                    disabled={index === 0}
                    style={{ color: "var(--studio-muted)" }}
                    className="shrink-0 disabled:opacity-20"
                  >
                    <ChevronDown
                      size={12}
                      style={{ transform: "rotate(180deg)" }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(index, 1);
                    }}
                    disabled={index === scene.effectLayers.length - 1}
                    style={{ color: "var(--studio-muted)" }}
                    className="shrink-0 disabled:opacity-20"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Selected layer params */}
        {selectedLayer && (
          <Section
            id="selected-effect"
            title={`${
              TYPE_LABEL[selectedLayer.type] ?? selectedLayer.type
            } Parameters`}
            accent
            defaultOpen
          >
            <SliderField
              label="Opacity"
              value={Math.round(selectedLayer.opacity * 100)}
              min={0}
              max={100}
              unit="%"
              onChange={(opacity) =>
                patchLayer(selectedLayer.id, { opacity: opacity / 100 })
              }
            />

            <label className="block">
              <FieldLabel label="Blend mode" />
              <select
                value={selectedLayer.blendMode}
                onChange={(e) =>
                  patchLayer(selectedLayer.id, {
                    blendMode: e.target.value as GlobalCompositeOperation,
                  })
                }
                className="studio-input"
              >
                {[
                  "source-over",
                  "screen",
                  "multiply",
                  "overlay",
                  "lighter",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            {"color" in selectedLayer.params && (
              <label className="block">
                <FieldLabel label="Effect color" />
                <ColorField
                  value={String(selectedLayer.params.color ?? "#ffffff")}
                  onChange={(color) => patchSelectedParams({ color })}
                />
              </label>
            )}
            {"blur" in selectedLayer.params && (
              <SliderField
                label="Blur"
                value={Number(selectedLayer.params.blur ?? 0)}
                min={0}
                max={150}
                unit="px"
                onChange={(blur) => patchSelectedParams({ blur })}
              />
            )}
            {"bloom" in selectedLayer.params && (
              <SliderField
                label="Bloom intensity"
                value={Math.round(
                  Number(selectedLayer.params.bloom ?? 0) * 100,
                )}
                min={0}
                max={100}
                unit="%"
                onChange={(bloom) =>
                  patchSelectedParams({ bloom: bloom / 100 })
                }
              />
            )}
            {"revealProgress" in selectedLayer.params && (
              <SliderField
                label="Reveal"
                value={Math.round(
                  Number(selectedLayer.params.revealProgress ?? 0) * 100,
                )}
                min={0}
                max={100}
                unit="%"
                onChange={(reveal) =>
                  patchSelectedParams({ revealProgress: reveal / 100 })
                }
              />
            )}

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => duplicateLayer(selectedLayer)}
                className="flex items-center justify-center gap-1 rounded py-1.5 text-[10px] font-semibold"
                style={{
                  background: "var(--studio-control)",
                  color: "var(--studio-text)",
                }}
              >
                <Copy size={11} /> Copy
              </button>
              <button
                type="button"
                onClick={() =>
                  patchLayer(selectedLayer.id, {
                    params: defaultParamsForType(selectedLayer.type),
                  })
                }
                className="flex items-center justify-center gap-1 rounded py-1.5 text-[10px] font-semibold"
                style={{
                  background: "var(--studio-control)",
                  color: "var(--studio-text)",
                }}
              >
                <RotateCcw size={11} /> Reset
              </button>
              <button
                type="button"
                onClick={() => removeLayer(selectedLayer.id)}
                className="flex items-center justify-center gap-1 rounded py-1.5 text-[10px] font-semibold"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  color: "var(--gpu-error)",
                }}
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </Section>
        )}
      </div>
    </aside>
  );
}
