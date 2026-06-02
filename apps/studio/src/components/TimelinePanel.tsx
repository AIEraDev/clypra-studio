import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Diamond, Pause, Play, Plus, RotateCcw, Trash2, Wand2 } from "lucide-react";
import type { Keyframe, SceneDocument } from "@clypra/engine";
import { ensureDefaultTimeline } from "@clypra/engine";
import { getAnimatableParamDef, getAnimatableParamsForLayer, readLayerScalar } from "@clypra/engine";
import { addKeyframeAtTime, addTrack, duplicateTrackAtPlayhead, findTrackIndex, getLayerById, moveKeyframe, removeKeyframe, removeTrack, updateKeyframe, updateTimeline } from "@clypra/engine";

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
  if (duration <= 0) return 0;
  return Math.max(0, Math.min(duration, (x / LANE_WIDTH) * duration));
}

function formatTrackLabel(doc: SceneDocument, trackIndex: number): string {
  const track = doc.timeline.tracks[trackIndex];
  if (!track) return "Track";
  const layer = getLayerById(doc, track.layerId);
  const def = layer ? getAnimatableParamDef(layer, track.paramPath) : undefined;
  const layerName = layer?.name ?? "Layer";
  const paramLabel = def?.label ?? track.paramPath;
  return `${layerName} · ${paramLabel}`;
}

export function TimelinePanel({ scene, previewTime, isPlaying, uiMode, onPlayToggle, onReset, onTimeChange, onSceneChange }: TimelinePanelProps) {
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
    return getAnimatableParamsForLayer(layer).filter((p) => findTrackIndex(scene, layer.id, p.path) < 0);
  }, [scene, addLayerId]);

  useEffect(() => {
    if (!addLayerId && scene.effectLayers.length > 0) {
      setAddLayerId(scene.effectLayers[0].id);
    }
  }, [addLayerId, scene.effectLayers]);

  useEffect(() => {
    if (addableParams.length > 0) setAddParamPath(addableParams[0].path);
    else setAddParamPath("");
  }, [addableParams]);

  const selectedKeyframe: Keyframe | null = useMemo(() => {
    if (!selection) return null;
    const track = tracks[selection.trackIndex];
    return track?.keyframes[selection.keyframeIndex] ?? null;
  }, [selection, tracks]);

  const selectedParamDef = useMemo(() => {
    if (!selection) return undefined;
    const track = tracks[selection.trackIndex];
    const layer = track ? getLayerById(scene, track.layerId) : undefined;
    return layer && track ? getAnimatableParamDef(layer, track.paramPath) : undefined;
  }, [selection, scene, tracks]);

  const patchScene = useCallback(
    (updater: (doc: SceneDocument) => SceneDocument) => {
      onSceneChange(updater(scene));
    },
    [onSceneChange, scene],
  );

  const addKeyframeAtPlayhead = useCallback(() => {
    if (tracks.length === 0) return;
    const trackIndex = selection?.trackIndex ?? 0;
    patchScene((doc) => duplicateTrackAtPlayhead(doc, trackIndex, previewTime));
  }, [patchScene, previewTime, selection, tracks.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "k" && e.key !== "K") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
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
      const x = e.clientX - rect.left;
      const time = xToTime(x, duration);
      patchScene((doc) => moveKeyframe(doc, drag.trackIndex, drag.keyframeIndex, time, duration));
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

  const handleLaneClick = (trackIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".timeline-kf")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const time = xToTime(e.clientX - rect.left, duration);
    const track = tracks[trackIndex];
    const layer = track ? getLayerById(scene, track.layerId) : undefined;
    const value = layer ? readLayerScalar(layer, track.paramPath) : 0;
    patchScene((doc) => addKeyframeAtTime(doc, trackIndex, time, value));
    const nextTrack = tracks[trackIndex];
    const kfIndex = nextTrack ? nextTrack.keyframes.findIndex((k) => Math.abs(k.time - time) < 0.05) : -1;
    if (kfIndex >= 0) setSelection({ trackIndex, keyframeIndex: kfIndex });
  };

  const transport = (
    <div className="timeline-transport flex items-center gap-2 px-3 py-2 border-t border-[#2A2A38] bg-[#15151C] shrink-0">
      <button type="button" onClick={onPlayToggle} className="p-1.5 rounded bg-[#7C6FFF] text-white hover:bg-[#6B5CE7] cursor-pointer" title={isPlaying ? "Pause" : "Play preview"}>
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button type="button" onClick={onReset} className="p-1.5 rounded border border-[#2A2A38] text-gray-400 hover:text-white cursor-pointer" title="Reset time">
        <RotateCcw size={14} />
      </button>
      <input type="range" min={0} max={duration} step={0.01} value={Math.min(previewTime, duration)} onChange={(e) => onTimeChange(parseFloat(e.target.value))} className="flex-1 h-1 accent-[#7C6FFF] min-w-0" />
      <span className="text-[10px] font-mono text-gray-500 w-[72px] text-right shrink-0">{previewTime.toFixed(2)}s</span>
      <label className="flex items-center gap-1 text-[10px] text-gray-500 shrink-0">
        <input type="checkbox" checked={scene.timeline.loop} onChange={(e) => patchScene((doc) => updateTimeline(doc, { loop: e.target.checked }))} className="accent-[#7C6FFF]" />
        Loop
      </label>
    </div>
  );

  if (uiMode === "basic") {
    return (
      <div className="shrink-0">
        {transport}
        <p className="px-4 py-2 text-[10px] text-gray-500 border-t border-[#1A1A26] bg-[#12121A]">
          Select <span className="text-[#7C6FFF]">Layers</span> from the left rail to enable the full keyframe timeline (press <kbd className="px-1 rounded bg-[#1E1E26] border border-[#2A2A38]">K</kbd> to add keyframes).
        </p>
      </div>
    );
  }

  return (
    <div className="timeline-panel shrink-0 flex flex-col border-t border-[#2A2A38] bg-[#12121A] max-h-[min(42vh,320px)]">
      {transport}

      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[#1A1A26] text-[10px]">
        <label className="flex items-center gap-1 text-gray-500">
          Duration
          <input type="number" min={0.25} max={60} step={0.25} value={duration} onChange={(e) => patchScene((doc) => updateTimeline(doc, { duration: Math.max(0.25, parseFloat(e.target.value) || 2) }))} className="w-14 px-1 py-0.5 rounded bg-[#0D0D11] border border-[#2A2A38] text-white font-mono" />s
        </label>
        <label className="flex items-center gap-1 text-gray-500">
          FPS
          <input type="number" min={12} max={60} step={1} value={fps} onChange={(e) => patchScene((doc) => updateTimeline(doc, { fps: Math.max(12, Math.min(60, parseInt(e.target.value, 10) || 30)) }))} className="w-12 px-1 py-0.5 rounded bg-[#0D0D11] border border-[#2A2A38] text-white font-mono" />
        </label>

        <select value={addLayerId} onChange={(e) => setAddLayerId(e.target.value)} className="max-w-[120px] px-1 py-0.5 rounded bg-[#0D0D11] border border-[#2A2A38] text-gray-300" title="Layer for new track">
          {scene.effectLayers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select value={addParamPath} onChange={(e) => setAddParamPath(e.target.value)} disabled={addableParams.length === 0} className="max-w-[120px] px-1 py-0.5 rounded bg-[#0D0D11] border border-[#2A2A38] text-gray-300 disabled:opacity-40" title="Parameter to animate">
          {addableParams.map((p) => (
            <option key={p.path} value={p.path}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="button" disabled={!addLayerId || !addParamPath} onClick={() => patchScene((doc) => addTrack(doc, addLayerId, addParamPath))} className="flex items-center gap-1 px-2 py-1 rounded bg-[#2A2A38] text-gray-200 hover:bg-[#7C6FFF] hover:text-white disabled:opacity-40 cursor-pointer">
          <Plus size={12} />
          Track
        </button>
        <button type="button" onClick={addKeyframeAtPlayhead} disabled={tracks.length === 0} className="flex items-center gap-1 px-2 py-1 rounded border border-[#7C6FFF]/40 text-[#7C6FFF] hover:bg-[#7C6FFF]/15 disabled:opacity-40 cursor-pointer" title="Add keyframe at playhead (K)">
          <Diamond size={12} />
          Keyframe
        </button>
        <button type="button" onClick={() => patchScene((doc) => ensureDefaultTimeline(doc))} className="flex items-center gap-1 px-2 py-1 rounded border border-[#2A2A38] text-gray-400 hover:text-white cursor-pointer ml-auto" title="Add demo shadow + mask reveal tracks">
          <Wand2 size={12} />
          Demo tracks
        </button>
      </div>

      {selectedKeyframe && selection && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 border-b border-[#1A1A26] bg-[#15151C] text-[10px]">
          <span className="text-gray-500 truncate max-w-[180px]">{formatTrackLabel(scene, selection.trackIndex)}</span>
          <label className="flex items-center gap-1 text-gray-400">
            Time
            <input type="number" min={0} max={duration} step={0.01} value={Number(selectedKeyframe.time.toFixed(3))} onChange={(e) => patchScene((doc) => moveKeyframe(doc, selection.trackIndex, selection.keyframeIndex, parseFloat(e.target.value) || 0, duration))} className="w-14 px-1 py-0.5 rounded bg-[#0D0D11] border border-[#2A2A38] text-white font-mono" />
          </label>
          <label className="flex items-center gap-1 text-gray-400">
            Value
            <input
              type="number"
              step={selectedParamDef?.step ?? 0.1}
              min={selectedParamDef?.min}
              max={selectedParamDef?.max}
              value={selectedKeyframe.value}
              onChange={(e) =>
                patchScene((doc) =>
                  updateKeyframe(doc, selection.trackIndex, selection.keyframeIndex, {
                    value: parseFloat(e.target.value) || 0,
                  }),
                )
              }
              className="w-16 px-1 py-0.5 rounded bg-[#0D0D11] border border-[#2A2A38] text-white font-mono"
            />
            {selectedParamDef?.unit ? <span className="text-gray-600">{selectedParamDef.unit}</span> : null}
          </label>
          <label className="flex items-center gap-1 text-gray-400">
            Easing
            <select
              value={selectedKeyframe.easing ?? "easeInOut"}
              onChange={(e) =>
                patchScene((doc) =>
                  updateKeyframe(doc, selection.trackIndex, selection.keyframeIndex, {
                    easing: e.target.value as Keyframe["easing"],
                  }),
                )
              }
              className="px-1 py-0.5 rounded bg-[#0D0D11] border border-[#2A2A38] text-gray-200"
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
              patchScene((doc) => removeKeyframe(doc, selection.trackIndex, selection.keyframeIndex));
              setSelection(null);
            }}
            className="p-1 rounded text-red-400/80 hover:bg-red-500/10 cursor-pointer"
            title="Delete keyframe"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {tracks.length === 0 ? (
          <p className="px-4 py-6 text-xs text-gray-500 text-center">
            No animation tracks yet. Add a track or use <strong>Demo tracks</strong> to animate shadow drift and mask reveal.
          </p>
        ) : (
          <div className="flex" style={{ minWidth: LABEL_WIDTH + LANE_WIDTH + 24 }}>
            <div className="shrink-0 border-r border-[#1A1A26]" style={{ width: LABEL_WIDTH }}>
              <div style={{ height: RULER_HEIGHT }} className="border-b border-[#1A1A26]" />
              {tracks.map((_, trackIndex) => (
                <div key={trackIndex} className="flex items-center justify-between gap-1 px-2 border-b border-[#1A1A26]/60 text-[10px] text-gray-400" style={{ height: ROW_HEIGHT }}>
                  <span className="truncate" title={formatTrackLabel(scene, trackIndex)}>
                    {formatTrackLabel(scene, trackIndex)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      patchScene((doc) => removeTrack(doc, trackIndex));
                      setSelection(null);
                    }}
                    className="shrink-0 p-0.5 text-gray-600 hover:text-red-400 cursor-pointer"
                    title="Remove track"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>

            <div className="relative flex-1" ref={laneRef}>
              <div className="relative border-b border-[#1A1A26] bg-[#0D0D11]" style={{ height: RULER_HEIGHT, width: LANE_WIDTH }}>
                {rulerTicks.map((t) => (
                  <span key={t} className="absolute top-0 text-[9px] font-mono text-gray-600 -translate-x-1/2" style={{ left: timeToX(t, duration) }}>
                    {t.toFixed(1)}s
                  </span>
                ))}
              </div>

              {tracks.map((track, trackIndex) => (
                <div key={`${track.layerId}-${track.paramPath}`} className="timeline-lane relative border-b border-[#1A1A26]/50 cursor-crosshair bg-[#15151C]/40 hover:bg-[#1A1A26]/30" style={{ height: ROW_HEIGHT, width: LANE_WIDTH }} onClick={(e) => handleLaneClick(trackIndex, e)}>
                  {track.keyframes.map((kf, keyframeIndex) => {
                    const isSelected = selection?.trackIndex === trackIndex && selection?.keyframeIndex === keyframeIndex;
                    return (
                      <button
                        key={`${kf.time}-${keyframeIndex}`}
                        type="button"
                        className={`timeline-kf absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border cursor-grab active:cursor-grabbing ${isSelected ? "bg-[#7C6FFF] border-white shadow-[0_0_8px_rgba(124,111,255,0.6)]" : "bg-[#2A2A38] border-[#7C6FFF]/60 hover:bg-[#7C6FFF]/40"}`}
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

              <div className="timeline-playhead absolute top-0 bottom-0 w-px bg-[#7C6FFF] pointer-events-none z-10" style={{ left: timeToX(Math.min(previewTime, duration), duration) }}>
                <div className="absolute -top-0.5 -left-1 w-2 h-2 rounded-full bg-[#7C6FFF]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
