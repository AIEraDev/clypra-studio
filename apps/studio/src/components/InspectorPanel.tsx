import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Plus,
  RotateCcw,
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
import { COMPOSITION_PRESETS } from "@clypra-studio/engine";

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
}

const ADDABLE_TYPES: EffectLayerType[] = ["glow", "shadow", "filter", "mask"];

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

function Section({
  id,
  title,
  children,
  defaultOpen = true,
  action,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="studio-inspector-section rounded-md border border-(--studio-border) bg-(--studio-panel)">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`inspector-${id}`}
        onClick={() => setOpen((next) => !next)}
        className="flex w-full items-center justify-between gap-2 border-b border-(--studio-border) px-3 py-2 text-left focus-visible:outline focus-visible:outline-(--studio-focus)"
      >
        <span className="text-[12px] font-semibold text-white">{title}</span>
        <span className="flex items-center gap-2">
          {action}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && (
        <div id={`inspector-${id}`} className="space-y-3 p-3">
          {children}
        </div>
      )}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-(--studio-muted)">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberField({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-8 w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 text-[12px] text-white focus:border-(--studio-accent) focus:outline-none"
    />
  );
}

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
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-(--studio-muted)">
          {label}
        </span>
        <span className="text-[10px] font-mono text-(--studio-text)">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-(--studio-accent)"
      />
    </div>
  );
}

function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const safeValue = value?.startsWith("#") ? value : "#ffffff";
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={safeValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-8 shrink-0 cursor-pointer rounded border border-(--studio-border) bg-transparent p-0"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 min-w-0 flex-1 rounded border border-(--studio-border) bg-(--studio-control) px-2 font-mono text-[12px] text-white focus:border-(--studio-accent) focus:outline-none"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded border border-(--studio-border) bg-(--studio-control) px-2 py-2">
      <span className="text-[12px] font-medium text-(--studio-text)">
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-(--studio-accent)"
      />
    </label>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded border border-(--studio-border) bg-(--studio-control) p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-7 rounded text-[10px] font-semibold capitalize ${
            value === option
              ? "bg-(--studio-active) text-white"
              : "text-(--studio-muted) hover:bg-(--studio-hover) hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

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
}: InspectorPanelProps) {
  const selectedLayer = useMemo(
    () =>
      scene.effectLayers.find((layer) => layer.id === selectedLayerId) ?? null,
    [scene.effectLayers, selectedLayerId],
  );

  const updateLayers = (layers: EffectLayer[]) => {
    onSceneChange({ ...scene, effectLayers: layers });
  };

  const patchLayer = (layerId: string, patch: Partial<EffectLayer>) => {
    updateLayers(
      scene.effectLayers.map((layer) =>
        layer.id === layerId ? { ...layer, ...patch } : layer,
      ),
    );
  };

  const patchSelectedLayerParams = (patch: Record<string, unknown>) => {
    if (!selectedLayer) return;
    patchLayer(selectedLayer.id, {
      params: { ...selectedLayer.params, ...patch },
    });
  };

  const addLayer = (type: EffectLayerType) => {
    const layer: EffectLayer = {
      id: newLayerId(),
      type,
      name: `${type} ${
        scene.effectLayers.filter((item) => item.type === type).length + 1
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

  const removeLayer = (layerId: string) => {
    onSceneChange(
      pruneTracksForLayer(
        {
          ...scene,
          effectLayers: scene.effectLayers.filter(
            (layer) => layer.id !== layerId,
          ),
        },
        layerId,
      ),
    );
    if (selectedLayerId === layerId) onSelectLayer(null);
  };

  const duplicateLayer = (layer: EffectLayer) => {
    const clone: EffectLayer = {
      ...layer,
      id: newLayerId(),
      name: `${layer.name} copy`,
      params: { ...layer.params },
    };
    const index = scene.effectLayers.findIndex((item) => item.id === layer.id);
    const next = [...scene.effectLayers];
    next.splice(index + 1, 0, clone);
    updateLayers(next);
    onSelectLayer(clone.id);
  };

  const moveLayer = (index: number, direction: -1 | 1) => {
    const next = [...scene.effectLayers];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateLayers(next);
  };

  return (
    <aside
      id="studio-inspector-panel"
      className="studio-inspector flex w-full flex-col border-l border-(--studio-border) bg-(--studio-shell) md:w-[344px]"
      aria-label="Contextual inspector"
    >
      <div className="border-b border-(--studio-border) px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-(--studio-muted)">
              Inspector
            </p>
            <h2 className="truncate text-[13px] font-semibold text-white">
              {selectedLayer
                ? selectedLayer.name
                : config.effectName || "Untitled style"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onSavePreset}
            className="rounded bg-(--studio-active) px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-(--studio-active-trong)]"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <Section id="selection" title="Selection">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelectLayer(null)}
              className={`rounded border px-2 py-2 text-[11px] font-semibold ${
                !selectedLayer
                  ? "border-(--studio-accent) bg-(--studio-active-oft)] text-white"
                  : "border-(--studio-border) bg-(--studio-control) text-(--studio-muted)"
              }`}
            >
              Text layer
            </button>
            <button
              type="button"
              onClick={onStartFromScratch}
              className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-2 text-[11px] font-semibold text-(--studio-text) hover:bg-(--studio-hover)"
            >
              Blank slate
            </button>
          </div>
          {selectedLayer && (
            <div className="space-y-2 rounded border border-(--studio-border) bg-(--studio-control) p-2">
              <input
                value={selectedLayer.name}
                onChange={(event) =>
                  patchLayer(selectedLayer.id, { name: event.target.value })
                }
                className="h-8 w-full rounded border border-(--studio-border) bg-(--studio-shell) px-2 text-[12px] text-white focus:border-(--studio-accent) focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    patchLayer(selectedLayer.id, {
                      enabled: !selectedLayer.enabled,
                    })
                  }
                  className="rounded bg-(--studio-panel) px-2 py-1.5 text-[11px] text-white"
                >
                  {selectedLayer.enabled ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => duplicateLayer(selectedLayer)}
                  className="rounded bg-(--studio-panel) px-2 py-1.5 text-[11px] text-white"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => removeLayer(selectedLayer.id)}
                  className="rounded bg-red-500/15 px-2 py-1.5 text-[11px] text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </Section>

        {!selectedLayer && (
          <>
            <Section id="typography" title="Typography">
              <Row label="Text">
                <textarea
                  rows={2}
                  value={config.text}
                  onChange={(event) =>
                    onConfigChange({ text: event.target.value })
                  }
                  className="w-full resize-none rounded border border-(--studio-border) bg-(--studio-control) p-2 text-[12px] text-white focus:border-(--studio-accent) focus:outline-none"
                />
              </Row>
              <Row label="Font family">
                <div className="flex gap-2">
                  <input
                    value={config.fontFamily}
                    onChange={(event) =>
                      onConfigChange({ fontFamily: event.target.value })
                    }
                    className="h-8 min-w-0 flex-1 rounded border border-(--studio-border) bg-(--studio-control) px-2 text-[12px] text-white focus:border-(--studio-accent) focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={onOpenFontCompare}
                    className="rounded border border-(--studio-border) bg-(--studio-control) px-2 text-[11px] text-white"
                  >
                    Compare
                  </button>
                </div>
              </Row>
              <div className="grid grid-cols-2 gap-2">
                <Row label="Weight">
                  <NumberField
                    value={config.fontWeight}
                    min={100}
                    max={1000}
                    step={100}
                    onChange={(fontWeight) => onConfigChange({ fontWeight })}
                  />
                </Row>
                <Row label="Size">
                  <NumberField
                    value={config.fontSize}
                    min={8}
                    max={400}
                    onChange={(fontSize) => onConfigChange({ fontSize })}
                  />
                </Row>
              </div>
              <SliderField
                label="Letter spacing"
                value={config.letterSpacing}
                min={-10}
                max={30}
                unit="px"
                onChange={(letterSpacing) => onConfigChange({ letterSpacing })}
              />
              <SliderField
                label="Line height"
                value={config.lineHeight}
                min={0.8}
                max={2.5}
                step={0.1}
                unit="x"
                onChange={(lineHeight) => onConfigChange({ lineHeight })}
              />
            </Section>

            <Section id="fill" title="Fill">
              <Segmented
                value={config.fillType}
                options={["solid", "linear", "radial", "pattern", "none"]}
                onChange={(fillType) =>
                  onConfigChange({ fillType, customRenderer: undefined })
                }
              />
              {config.fillType !== "none" && (
                <Row label="Primary color">
                  <ColorField
                    value={config.fillColor}
                    onChange={(fillColor) =>
                      onConfigChange({ fillColor, customRenderer: undefined })
                    }
                  />
                </Row>
              )}
              {(config.fillType === "linear" ||
                config.fillType === "radial") && (
                <SliderField
                  label="Gradient angle"
                  value={config.fillGradientAngle}
                  min={0}
                  max={360}
                  unit="deg"
                  onChange={(fillGradientAngle) =>
                    onConfigChange({ fillGradientAngle })
                  }
                />
              )}
            </Section>

            <Section id="stroke" title="Stroke">
              <ToggleRow
                label="Enable stroke"
                checked={config.strokeEnabled}
                onChange={(strokeEnabled) => onConfigChange({ strokeEnabled })}
              />
              <Row label="Stroke color">
                <ColorField
                  value={config.strokeColor}
                  onChange={(strokeColor) =>
                    onConfigChange({ strokeColor, strokeEnabled: true })
                  }
                />
              </Row>
              <SliderField
                label="Width"
                value={config.strokeWidth}
                min={0}
                max={30}
                unit="px"
                onChange={(strokeWidth) =>
                  onConfigChange({ strokeWidth, strokeEnabled: true })
                }
              />
              <Segmented
                value={config.strokePosition}
                options={["outside", "center", "inside"]}
                onChange={(strokePosition) =>
                  onConfigChange({ strokePosition, strokeEnabled: true })
                }
              />
            </Section>

            <Section id="effects" title="Glow And Shadow">
              <ToggleRow
                label="Drop shadow"
                checked={config.shadowEnabled}
                onChange={(shadowEnabled) => onConfigChange({ shadowEnabled })}
              />
              <SliderField
                label="Shadow blur"
                value={config.shadowBlur}
                min={0}
                max={60}
                unit="px"
                onChange={(shadowBlur) =>
                  onConfigChange({ shadowBlur, shadowEnabled: true })
                }
              />
              <SliderField
                label="Glow blur"
                value={config.glowLayers?.[0]?.blur ?? 0}
                min={0}
                max={150}
                unit="px"
                onChange={(blur) =>
                  onConfigChange((prev) => ({
                    ...prev,
                    glowLayers: prev.glowLayers.map((layer, index) =>
                      index === 0 ? { ...layer, enabled: true, blur } : layer,
                    ),
                  }))
                }
              />
            </Section>

            <Section id="layout" title="Transform And Canvas">
              <div className="grid grid-cols-2 gap-2">
                <Row label="Width">
                  <NumberField
                    value={config.canvasWidth}
                    min={200}
                    max={2400}
                    onChange={(canvasWidth) => onConfigChange({ canvasWidth })}
                  />
                </Row>
                <Row label="Height">
                  <NumberField
                    value={config.canvasHeight}
                    min={100}
                    max={1200}
                    onChange={(canvasHeight) =>
                      onConfigChange({ canvasHeight })
                    }
                  />
                </Row>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {COMPOSITION_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.description}
                    onClick={() =>
                      onConfigChange({
                        canvasWidth: preset.width,
                        canvasHeight: preset.height,
                      })
                    }
                    className="rounded border border-(--studio-border) bg-(--studio-control) px-1 py-1.5 text-[9px] font-semibold text-(--studio-muted) hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <ToggleRow
                label="Wrap text"
                checked={config.wrapText !== false}
                onChange={(wrapText) => onConfigChange({ wrapText })}
              />
              <ToggleRow
                label="Auto-fit text"
                checked={!!config.autoFitText}
                onChange={(autoFitText) => onConfigChange({ autoFitText })}
              />
              <button
                type="button"
                onClick={onFitText}
                className="w-full rounded border border-(--studio-accent) bg-(--studio-active-oft)] px-2 py-2 text-[11px] font-semibold text-white"
              >
                Fit text to composition
              </button>
            </Section>
          </>
        )}

        <Section id="effect-stack" title="Effect Stack" defaultOpen>
          <div className="mb-2 flex flex-wrap gap-1">
            {ADDABLE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addLayer(type)}
                className="flex items-center gap-1 rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1 text-[10px] font-semibold text-(--studio-text) hover:bg-(--studio-hover)"
              >
                <Plus size={11} />
                {type}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            {scene.effectLayers.map((layer, index) => (
              <div
                key={layer.id}
                className={`rounded border px-2 py-2 ${
                  selectedLayerId === layer.id
                    ? "border-(--studio-accent) bg-(--studio-active-oft)]"
                    : "border-(--studio-border) bg-(--studio-control)"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={layer.enabled ? "Hide layer" : "Show layer"}
                    onClick={() =>
                      patchLayer(layer.id, { enabled: !layer.enabled })
                    }
                    className="text-(--studio-muted) hover:text-white"
                  >
                    {layer.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectLayer(layer.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[12px] font-semibold text-white">
                      {layer.name}
                    </span>
                    <span className="block truncate text-[10px] text-(--studio-muted)">
                      {layer.type} · {layer.blendMode} ·{" "}
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Move layer up"
                    onClick={() => moveLayer(index, -1)}
                    className="text-(--studio-muted) hover:text-white"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Move layer down"
                    onClick={() => moveLayer(index, 1)}
                    className="text-(--studio-muted) hover:text-white"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {selectedLayer && (
          <Section
            id="selected-effect"
            title={`${selectedLayer.type} Parameters`}
          >
            <SliderField
              label="Layer opacity"
              value={Math.round(selectedLayer.opacity * 100)}
              min={0}
              max={100}
              unit="%"
              onChange={(opacity) =>
                patchLayer(selectedLayer.id, { opacity: opacity / 100 })
              }
            />
            <Row label="Blend mode">
              <select
                value={selectedLayer.blendMode}
                onChange={(event) =>
                  patchLayer(selectedLayer.id, {
                    blendMode: event.target.value as GlobalCompositeOperation,
                  })
                }
                className="h-8 w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 text-[12px] text-white focus:border-(--studio-accent) focus:outline-none"
              >
                {[
                  "source-over",
                  "screen",
                  "multiply",
                  "overlay",
                  "lighter",
                ].map((modeOption) => (
                  <option key={modeOption} value={modeOption}>
                    {modeOption}
                  </option>
                ))}
              </select>
            </Row>
            {"color" in selectedLayer.params && (
              <Row label="Effect color">
                <ColorField
                  value={String(selectedLayer.params.color ?? "#ffffff")}
                  onChange={(color) => patchSelectedLayerParams({ color })}
                />
              </Row>
            )}
            {"blur" in selectedLayer.params && (
              <SliderField
                label="Blur"
                value={Number(selectedLayer.params.blur ?? 0)}
                min={0}
                max={150}
                unit="px"
                onChange={(blur) => patchSelectedLayerParams({ blur })}
              />
            )}
            {"bloom" in selectedLayer.params && (
              <SliderField
                label="Bloom Intensity"
                value={Math.round(
                  Number(selectedLayer.params.bloom ?? 0) * 100,
                )}
                min={0}
                max={100}
                unit="%"
                onChange={(bloom) =>
                  patchSelectedLayerParams({ bloom: bloom / 100 })
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
                  patchSelectedLayerParams({ revealProgress: reveal / 100 })
                }
              />
            )}
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => duplicateLayer(selectedLayer)}
                className="flex items-center justify-center gap-1 rounded bg-(--studio-control) px-2 py-1.5 text-[10px] text-white"
              >
                <Copy size={11} />
                Copy
              </button>
              <button
                type="button"
                onClick={() =>
                  patchLayer(selectedLayer.id, {
                    params: defaultParamsForType(selectedLayer.type),
                  })
                }
                className="flex items-center justify-center gap-1 rounded bg-(--studio-control) px-2 py-1.5 text-[10px] text-white"
              >
                <RotateCcw size={11} />
                Reset
              </button>
              <button
                type="button"
                onClick={() => removeLayer(selectedLayer.id)}
                className="flex items-center justify-center gap-1 rounded bg-red-500/15 px-2 py-1.5 text-[10px] text-red-300"
              >
                <Trash2 size={11} />
                Delete
              </button>
            </div>
          </Section>
        )}
      </div>
    </aside>
  );
}
