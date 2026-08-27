import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Diamond,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Wand2,
} from "lucide-react";
import type { Keyframe, SceneDocument } from "@clypra-studio/engine";
import { ensureDefaultTimeline } from "@clypra-studio/engine";
import {
  getAnimatableParamDef,
  getAnimatableParamsForLayer,
  readLayerScalar,
} from "@clypra-studio/engine";
import {
  addKeyframeAtTime,
  addTrack,
  duplicateTrackAtPlayhead,
  findTrackIndex,
  getLayerById,
  moveKeyframe,
  removeKeyframe,
  removeTrack,
  updateKeyframe,
  updateTimeline,
} from "@clypra-studio/engine";

interface TimelinePanelProps {
  scene: SceneDocument;
  previewTime: number;
  isPlaying: boolean;
  uiMode: "basic" | "advanced";
  onPlayToggle: () => void;
  onReset: () => void;
  onTimeChange: (t: number) => void;
  onSceneChange: (scene: SceneDocument) => void;
}

type Selection = { trackIndex: number; keyframeIndex: number } | null;

const LANE_WIDTH = 520;
const LABEL_WIDTH = 148;
const ROW_HEIGHT = 28;
const RULER_HEIGHT = 22;

function timeToX(time: number, duration: number): number {
  if (duration <= 0) return 0;
  return (time / duration) * LANE_WIDTH;
}

function xToTime(x: number, duration: number): number {
  return Math.max(0, Math.min(duration, (x / LANE_WIDTH) * duration));
}

function formatTrackLabel(doc: SceneDocument, trackIndex: number): string {
  const track = doc.timeline.tracks[trackIndex];
  if (!track) return "Track";
  const layer = getLayerById(doc, track.layerId);
  const def = layer ? getAnimatableParamDef(layer, track.paramPath) : undefined;
  return `${layer?.name ?? "Layer"} · ${def?.label ?? track.paramPath}`;
}

export function TimelinePanel({
  scene,
  previewTime,
  isPlaying,
  uiMode,
  onPlayToggle,
  onReset,
  onTimeChange,
  onSceneChange,
}: TimelinePanelProps) {
  const duration = Math.max(0.1, scene.timeline.duration || 2);
  const fps = scene.timeline.fps || 30;
  const tracks = scene.timeline.tracks;

  const [selection, setSelection] = useState<Selection>(null);
  const [addLayerId, setAddLayerId] = useState("");
  const [addParamPath, setAddParamPath] = useState("");
  const dragRef = useRef<{
    trackIndex: number;
    keyframeIndex: number;
    startX: number;
    startTime: number;
  } | null>(null);
  const laneRef = useRef<HTMLDivElement>(null);

  const addableParams = useMemo(() => {
    const layer = scene.effectLayers.find((l) => l.id === addLayerId);
    if (!layer) return [];
    return getAnimatableParamsForLayer(layer).filter(
      (p) => findTrackIndex(scene, layer.id, p.path) < 0,
    );
  }, [scene, addLayerId]);

  useEffect(() => {
    if (!addLayerId && scene.effectLayers.length > 0)
      setAddLayerId(scene.effectLayers[0].id);
  }, [addLayerId, scene.effectLayers]);

  useEffect(() => {
    if (addableParams.length > 0) setAddParamPath(addableParams[0].path);
    else setAddParamPath("");
  }, [addableParams]);

  const selectedKeyframe: Keyframe | null = useMemo(() => {
    if (!selection) return null;
    return (
      tracks[selection.trackIndex]?.keyframes[selection.keyframeIndex] ?? null
    );
  }, [selection, tracks]);

  const selectedParamDef = useMemo(() => {
    if (!selection) return undefined;
    const track = tracks[selection.trackIndex];
    const layer = track ? getLayerById(scene, track.layerId) : undefined;
    return layer && track
      ? getAnimatableParamDef(layer, track.paramPath)
      : undefined;
  }, [selection, scene, tracks]);

  const patchScene = useCallback(
    (updater: (doc: SceneDocument) => SceneDocument) =>
      onSceneChange(updater(scene)),
    [onSceneChange, scene],
  );

  const addKeyframeAtPlayhead = useCallback(() => {
    if (tracks.length === 0) return;
    patchScene((doc) =>
      duplicateTrackAtPlayhead(doc, selection?.trackIndex ?? 0, previewTime),
    );
  }, [patchScene, previewTime, selection, tracks.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "k" && e.key !== "K") return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      e.preventDefault();
      addKeyframeAtPlayhead();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addKeyframeAtPlayhead]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !laneRef.current) return;
      const rect = laneRef.current.getBoundingClientRect();
      const time = xToTime(e.clientX - rect.left, duration);
      patchScene((doc) =>
        moveKeyframe(doc, drag.trackIndex, drag.keyframeIndex, time, duration),
      );
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [duration, patchScene]);

  const rulerTicks = useMemo(() => {
    const count = Math.min(12, Math.max(4, Math.ceil(duration)));
    return Array.from({ length: count + 1 }, (_, i) => (i / count) * duration);
  }, [duration]);

  const handleLaneClick = (
    trackIndex: number,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if ((e.target as HTMLElement).closest(".timeline-kf")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const time = xToTime(e.clientX - rect.left, duration);
    const track = tracks[trackIndex];
    const layer = track ? getLayerById(scene, track.layerId) : undefined;
    const value = layer ? readLayerScalar(layer, track.paramPath) : 0;
    patchScene((doc) => addKeyframeAtTime(doc, trackIndex, time, value));
    const nextTrack = tracks[trackIndex];
    const kfIndex = nextTrack
      ? nextTrack.keyframes.findIndex((k) => Math.abs(k.time - time) < 0.05)
      : -1;
    if (kfIndex >= 0) setSelection({ trackIndex, keyframeIndex: kfIndex });
  };

  // ── Shared control styles ──────────────────────────────────────────────────
  const ctrlInput = {
    background: "var(--studio-bg)",
    border: "1px solid var(--studio-border)",
    borderRadius: 5,
    color: "var(--studio-text)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    padding: "2px 6px",
    outline: "none",
  } as React.CSSProperties;

  // ── Transport bar ──────────────────────────────────────────────────────────
  const transport = (
    <div
      className="flex items-center gap-2 px-3 shrink-0"
      style={{
        height: 44,
        background: "var(--studio-shell)",
        borderTop: "1px solid var(--studio-border)",
      }}
    >
      {/* Play/pause */}
      <button
        type="button"
        onClick={onPlayToggle}
        title={isPlaying ? "Pause" : "Play preview"}
        className="timeline-play-btn"
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
      </button>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        title="Reset to start"
        className="canvas-toolbar-btn"
        style={{ width: 28, padding: 0 }}
      >
        <RotateCcw size={12} />
      </button>

      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={Math.min(previewTime, duration)}
        onChange={(e) => onTimeChange(parseFloat(e.target.value))}
        className="timeline-scrubber"
        style={{ flex: 1, minWidth: 0 }}
      />

      {/* Time display */}
      <span
        className="font-mono text-[10px] shrink-0 tabular-nums"
        style={{
          color: "var(--studio-accent)",
          minWidth: 52,
          textAlign: "right",
        }}
      >
        {previewTime.toFixed(2)}s
      </span>

      {/* Loop toggle */}
      <label
        className="flex items-center gap-1.5 shrink-0 text-[10px] cursor-pointer select-none"
        style={{ color: "var(--studio-muted)" }}
      >
        <input
          type="checkbox"
          checked={scene.timeline.loop}
          onChange={(e) =>
            patchScene((doc) => updateTimeline(doc, { loop: e.target.checked }))
          }
          className="accent-(--studio-accent)"
        />
        Loop
      </label>
    </div>
  );

  // ── Basic mode ─────────────────────────────────────────────────────────────
  if (uiMode === "basic") {
    return (
      <div className="shrink-0">
        {transport}
        <p
          className="px-4 py-2 text-[10px] border-t"
          style={{
            color: "var(--studio-muted)",
            background: "var(--studio-bg)",
            borderColor: "var(--studio-border)",
          }}
        >
          Select <span style={{ color: "var(--studio-accent)" }}>Layers</span>{" "}
          to enable the keyframe timeline{" "}
          <kbd
            className="px-1 rounded text-[9px]"
            style={{
              background: "var(--studio-raised)",
              border: "1px solid var(--studio-border)",
              color: "var(--studio-text)",
            }}
          >
            K
          </kbd>{" "}
          to add keyframes.
        </p>
      </div>
    );
  }

  // ── Advanced mode ──────────────────────────────────────────────────────────
  return (
    <div
      className="timeline-panel shrink-0 flex flex-col border-t"
      style={{
        background: "var(--studio-bg)",
        borderColor: "var(--studio-border)",
        maxHeight: "min(42vh, 320px)",
      }}
    >
      {transport}

      {/* Controls row */}
      <div
        className="flex flex-wrap items-center gap-2 px-3 py-1.5 border-b text-[10px]"
        style={{
          borderColor: "var(--studio-border)",
          background: "var(--studio-panel)",
        }}
      >
        <label
          className="flex items-center gap-1.5"
          style={{ color: "var(--studio-muted)" }}
        >
          Duration
          <input
            type="number"
            min={0.25}
            max={60}
            step={0.25}
            value={duration}
            onChange={(e) =>
              patchScene((doc) =>
                updateTimeline(doc, {
                  duration: Math.max(0.25, parseFloat(e.target.value) || 2),
                }),
              )
            }
            style={{ ...ctrlInput, width: 48 }}
          />
          s
        </label>
        <label
          className="flex items-center gap-1.5"
          style={{ color: "var(--studio-muted)" }}
        >
          FPS
          <input
            type="number"
            min={12}
            max={60}
            step={1}
            value={fps}
            onChange={(e) =>
              patchScene((doc) =>
                updateTimeline(doc, {
                  fps: Math.max(
                    12,
                    Math.min(60, parseInt(e.target.value, 10) || 30),
                  ),
                }),
              )
            }
            style={{ ...ctrlInput, width: 40 }}
          />
        </label>

        <select
          value={addLayerId}
          onChange={(e) => setAddLayerId(e.target.value)}
          style={{ ...ctrlInput, maxWidth: 120 }}
          title="Layer for new track"
        >
          {scene.effectLayers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={addParamPath}
          onChange={(e) => setAddParamPath(e.target.value)}
          disabled={addableParams.length === 0}
          style={{ ...ctrlInput, maxWidth: 120 }}
          title="Parameter to animate"
        >
          {addableParams.map((p) => (
            <option key={p.path} value={p.path}>
              {p.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!addLayerId || !addParamPath}
          onClick={() =>
            patchScene((doc) => addTrack(doc, addLayerId, addParamPath))
          }
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold disabled:opacity-40 cursor-pointer transition-colors"
          style={{
            background: "var(--studio-raised)",
            border: "1px solid var(--studio-border)",
            color: "var(--studio-text)",
          }}
        >
          <Plus size={11} /> Track
        </button>

        <button
          type="button"
          onClick={addKeyframeAtPlayhead}
          disabled={tracks.length === 0}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold disabled:opacity-40 cursor-pointer transition-colors"
          style={{
            border: "1px solid rgba(124,111,255,0.4)",
            color: "var(--studio-accent)",
            background: "var(--studio-active-soft)",
          }}
          title="Add keyframe at playhead (K)"
        >
          <Diamond size={11} /> Keyframe
        </button>

        <button
          type="button"
          onClick={() => patchScene((doc) => ensureDefaultTimeline(doc))}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer transition-colors ml-auto"
          style={{
            background: "var(--studio-control)",
            border: "1px solid var(--studio-border)",
            color: "var(--studio-muted)",
          }}
          title="Add demo shadow + mask reveal tracks"
        >
          <Wand2 size={11} /> Demo tracks
        </button>
      </div>

      {/* Selected keyframe editor */}
      {selectedKeyframe && selection && (
        <div
          className="flex flex-wrap items-center gap-2 px-3 py-1.5 border-b text-[10px]"
          style={{
            borderColor: "var(--studio-border)",
            background: "var(--studio-raised)",
          }}
        >
          <span
            className="truncate max-w-[180px]"
            style={{ color: "var(--studio-muted)" }}
          >
            {formatTrackLabel(scene, selection.trackIndex)}
          </span>

          <label
            className="flex items-center gap-1"
            style={{ color: "var(--studio-muted)" }}
          >
            Time
            <input
              type="number"
              min={0}
              max={duration}
              step={0.01}
              value={Number(selectedKeyframe.time.toFixed(3))}
              onChange={(e) =>
                patchScene((doc) =>
                  moveKeyframe(
                    doc,
                    selection.trackIndex,
                    selection.keyframeIndex,
                    parseFloat(e.target.value) || 0,
                    duration,
                  ),
                )
              }
              style={{ ...ctrlInput, width: 52 }}
            />
          </label>

          <label
            className="flex items-center gap-1"
            style={{ color: "var(--studio-muted)" }}
          >
            Value
            <input
              type="number"
              step={selectedParamDef?.step ?? 0.1}
              min={selectedParamDef?.min}
              max={selectedParamDef?.max}
              value={selectedKeyframe.value}
              onChange={(e) =>
                patchScene((doc) =>
                  updateKeyframe(
                    doc,
                    selection.trackIndex,
                    selection.keyframeIndex,
                    { value: parseFloat(e.target.value) || 0 },
                  ),
                )
              }
              style={{ ...ctrlInput, width: 60 }}
            />
            {selectedParamDef?.unit && (
              <span style={{ color: "var(--studio-subtle)" }}>
                {selectedParamDef.unit}
              </span>
            )}
          </label>

          <label
            className="flex items-center gap-1"
            style={{ color: "var(--studio-muted)" }}
          >
            Easing
            <select
              value={selectedKeyframe.easing ?? "easeInOut"}
              onChange={(e) =>
                patchScene((doc) =>
                  updateKeyframe(
                    doc,
                    selection.trackIndex,
                    selection.keyframeIndex,
                    { easing: e.target.value as Keyframe["easing"] },
                  ),
                )
              }
              style={ctrlInput}
            >
              <option value="linear">Linear</option>
              <option value="easeIn">Ease in</option>
              <option value="easeOut">Ease out</option>
              <option value="easeInOut">Ease in-out</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              patchScene((doc) =>
                removeKeyframe(
                  doc,
                  selection.trackIndex,
                  selection.keyframeIndex,
                ),
              );
              setSelection(null);
            }}
            title="Delete keyframe"
            className="p-1 rounded cursor-pointer transition-colors"
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
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Track scroll area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {tracks.length === 0 ? (
          <p
            className="px-4 py-6 text-[11px] text-center"
            style={{ color: "var(--studio-muted)" }}
          >
            No animation tracks yet. Add a track or click{" "}
            <strong style={{ color: "var(--studio-text)" }}>Demo tracks</strong>{" "}
            to get started.
          </p>
        ) : (
          <div
            className="flex"
            style={{ minWidth: LABEL_WIDTH + LANE_WIDTH + 24 }}
          >
            {/* Labels column */}
            <div
              className="shrink-0 border-r"
              style={{
                width: LABEL_WIDTH,
                borderColor: "var(--studio-border)",
              }}
            >
              <div
                style={{
                  height: RULER_HEIGHT,
                  borderColor: "var(--studio-border)",
                }}
                className="border-b"
              />
              {tracks.map((_, trackIndex) => (
                <div
                  key={trackIndex}
                  className="flex items-center justify-between gap-1 px-2 border-b text-[10px]"
                  style={{
                    height: ROW_HEIGHT,
                    borderColor: "rgba(34,34,48,0.6)",
                    color: "var(--studio-muted)",
                  }}
                >
                  <span
                    className="truncate"
                    title={formatTrackLabel(scene, trackIndex)}
                  >
                    {formatTrackLabel(scene, trackIndex)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      patchScene((doc) => removeTrack(doc, trackIndex));
                      setSelection(null);
                    }}
                    title="Remove track"
                    className="shrink-0 p-0.5 cursor-pointer transition-colors"
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
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>

            {/* Lane area */}
            <div className="relative flex-1" ref={laneRef}>
              {/* Ruler */}
              <div
                className="relative border-b"
                style={{
                  height: RULER_HEIGHT,
                  width: LANE_WIDTH,
                  background: "var(--studio-bg)",
                  borderColor: "var(--studio-border)",
                }}
              >
                {rulerTicks.map((t) => (
                  <span
                    key={t}
                    className="absolute top-1 font-mono text-[8px] -translate-x-1/2"
                    style={{
                      left: timeToX(t, duration),
                      color: "var(--studio-subtle)",
                    }}
                  >
                    {t.toFixed(1)}s
                  </span>
                ))}
              </div>

              {/* Tracks */}
              {tracks.map((track, trackIndex) => (
                <div
                  key={`${track.layerId}-${track.paramPath}`}
                  className="timeline-lane relative border-b cursor-crosshair"
                  style={{
                    height: ROW_HEIGHT,
                    width: LANE_WIDTH,
                    borderColor: "rgba(34,34,48,0.5)",
                    background: "var(--studio-bg)",
                  }}
                  onClick={(e) => handleLaneClick(trackIndex, e)}
                >
                  {track.keyframes.map((kf, keyframeIndex) => {
                    const isSelected =
                      selection?.trackIndex === trackIndex &&
                      selection?.keyframeIndex === keyframeIndex;
                    return (
                      <button
                        key={`${kf.time}-${keyframeIndex}`}
                        type="button"
                        className={`timeline-kf absolute${
                          isSelected ? " selected" : ""
                        }`}
                        style={{ left: timeToX(kf.time, duration) }}
                        title={`${kf.time.toFixed(2)}s → ${kf.value}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelection({ trackIndex, keyframeIndex });
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setSelection({ trackIndex, keyframeIndex });
                          dragRef.current = {
                            trackIndex,
                            keyframeIndex,
                            startX: e.clientX,
                            startTime: kf.time,
                          };
                        }}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Playhead */}
              <div
                className="timeline-panel absolute top-0 bottom-0 pointer-events-none z-10"
                style={{
                  left: timeToX(Math.min(previewTime, duration), duration),
                  width: 1,
                  background: "var(--studio-accent)",
                }}
              >
                <div
                  className="absolute -top-0.5 -translate-x-1/2 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: "var(--studio-accent)",
                    boxShadow: "0 0 8px var(--studio-accent)",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
