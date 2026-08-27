import React, { useState } from "react";
import {
  Play,
  Pause,
  Plus,
  Trash2,
  ChevronDown,
  Clock,
  Move,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
} from "lucide-react";
import type {
  SceneNode,
  OverlayDocument,
  DocumentCommand,
  MotionPreset,
  AnimationStartSpec,
  SemanticAnimationConfig,
  KeyframeTrack,
  TimelineMarker,
} from "@clypra-studio/engine";
import { motionPresetRegistry, componentRegistry } from "@clypra-studio/engine";

interface AnimationInspectorControlProps {
  selectedNode: SceneNode;
  doc: OverlayDocument;
  currentTime: number;
  onExecuteCommand: (cmd: DocumentCommand) => void;
  onSeekTime: (time: number) => void;
}

type TabMode = "preset" | "semantic" | "keyframe";

const LABEL_CLS =
  "block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1";
const INPUT_CLS =
  "w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors placeholder:text-gray-600 font-mono";
const SELECT_CLS =
  "w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors cursor-pointer";

export function AnimationInspectorControl({
  selectedNode,
  doc,
  currentTime,
  onExecuteCommand,
  onSeekTime,
}: AnimationInspectorControlProps) {
  const [tabMode, setTabMode] = useState<TabMode>("preset");

  const anim = selectedNode.animation || {};

  const execAnim = (patch: Record<string, any>) => {
    onExecuteCommand({
      type: "UPDATE_ANIMATION",
      nodeId: selectedNode.id,
      animation: {
        ...anim,
        ...patch,
      },
    });
  };

  // Preview Phase State seek triggers
  const handlePreviewPhase = (phase: "rest" | "enter" | "hold" | "exit") => {
    const ent = anim.entrance;
    const ext = anim.exit;
    const dur = doc.duration || 5;

    if (phase === "rest") onSeekTime(0);
    else if (phase === "enter")
      onSeekTime((ent?.delay || 0) + (ent?.duration || 0) * 0.5);
    else if (phase === "hold") onSeekTime(dur * 0.5);
    else if (phase === "exit") onSeekTime(dur - (ext?.duration || 0.5) * 0.5);
  };

  // Entrance preset update
  const setEntrance = (patch: Partial<MotionPreset> | undefined) => {
    if (!patch) {
      const { entrance, ...rest } = anim;
      execAnim(rest);
      return;
    }
    execAnim({
      entrance: {
        type: "fade",
        duration: 0.5,
        delay: 0,
        easing: "ease-out",
        ...(anim.entrance || {}),
        ...patch,
      },
    });
  };

  // Exit preset update
  const setExit = (patch: Partial<MotionPreset> | undefined) => {
    if (!patch) {
      const { exit, ...rest } = anim;
      execAnim(rest);
      return;
    }
    execAnim({
      exit: {
        type: "fade",
        duration: 0.5,
        delay: 0,
        easing: "ease-out",
        ...(anim.exit || {}),
        ...patch,
      },
    });
  };

  // Keyframe track operations
  const keyframeTracks = anim.keyframeTracks || [];

  const addKeyframeTrack = (property: string) => {
    if (keyframeTracks.some((t) => t.property === property)) return;
    const normalizedTime = Math.max(
      0,
      Math.min(1, currentTime / (doc.duration || 5)),
    );
    const currentVal = (selectedNode as any)[property] ?? 0;
    const newTracks: KeyframeTrack[] = [
      ...keyframeTracks,
      {
        property,
        keyframes: [{ time: normalizedTime, value: currentVal }],
      },
    ];
    onExecuteCommand({
      type: "UPDATE_KEYFRAME_TRACKS",
      nodeId: selectedNode.id,
      tracks: newTracks,
    });
  };

  const addKeyframeAtPlayhead = (property: string) => {
    const normalizedTime = Math.max(
      0,
      Math.min(1, currentTime / (doc.duration || 5)),
    );
    const trackIdx = keyframeTracks.findIndex((t) => t.property === property);
    if (trackIdx === -1) return;

    const track = keyframeTracks[trackIdx];
    const currentVal = (selectedNode as any)[property] ?? 0;
    const updatedKeyframes = [
      ...track.keyframes.filter(
        (k) => Math.abs(k.time - normalizedTime) > 0.01,
      ),
      { time: normalizedTime, value: currentVal },
    ].sort((a, b) => a.time - b.time);

    const updatedTracks = [...keyframeTracks];
    updatedTracks[trackIdx] = { ...track, keyframes: updatedKeyframes };

    onExecuteCommand({
      type: "UPDATE_KEYFRAME_TRACKS",
      nodeId: selectedNode.id,
      tracks: updatedTracks,
    });
  };

  const removeKeyframeTrack = (property: string) => {
    const updatedTracks = keyframeTracks.filter((t) => t.property !== property);
    onExecuteCommand({
      type: "UPDATE_KEYFRAME_TRACKS",
      nodeId: selectedNode.id,
      tracks: updatedTracks,
    });
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Preview Phase Bar */}
      <div>
        <span className={LABEL_CLS}>Preview State</span>
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#151519] border border-white/6 rounded-xl">
          {[
            { id: "rest", label: "Rest" },
            { id: "enter", label: "Enter" },
            { id: "hold", label: "Hold" },
            { id: "exit", label: "Exit" },
          ].map((ph) => (
            <button
              key={ph.id}
              type="button"
              onClick={() => handlePreviewPhase(ph.id as any)}
              className="py-1 text-[10px] font-bold uppercase rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              {ph.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Tabs */}
      <div className="flex border-b border-white/6">
        {[
          { id: "preset", label: "Presets" },
          { id: "semantic", label: "Semantic" },
          { id: "keyframe", label: "Keyframes" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTabMode(t.id as any)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              tabMode === t.id
                ? "text-violet-400 border-b-2 border-violet-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: PRESETS ────────────────────────────────────────────── */}
      {tabMode === "preset" && (
        <div className="space-y-3">
          {/* Entrance Preset */}
          <div className="bg-[#151519] border border-white/6 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-violet-400">
                Entrance Animation
              </span>
              {anim.entrance && (
                <button
                  type="button"
                  onClick={() => setEntrance(undefined)}
                  className="text-[10px] text-gray-500 hover:text-red-400 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <select
              value={anim.entrance?.type || "none"}
              onChange={(e) => {
                if (e.target.value === "none") setEntrance(undefined);
                else setEntrance({ type: e.target.value as any });
              }}
              className={SELECT_CLS}
            >
              <option value="none">None (Static)</option>
              {motionPresetRegistry.list("entrance").map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {anim.entrance && (
              <>
                {anim.entrance.type === "slide" && (
                  <div>
                    <span className={LABEL_CLS}>Direction</span>
                    <select
                      value={anim.entrance.direction || "up"}
                      onChange={(e) =>
                        setEntrance({ direction: e.target.value as any })
                      }
                      className={SELECT_CLS}
                    >
                      <option value="up">Slide Up</option>
                      <option value="down">Slide Down</option>
                      <option value="left">Slide Left</option>
                      <option value="right">Slide Right</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={LABEL_CLS}>Duration (s)</span>
                    <input
                      type="number"
                      step={0.05}
                      min={0.1}
                      max={5}
                      value={anim.entrance.duration}
                      onChange={(e) =>
                        setEntrance({
                          duration: parseFloat(e.target.value) || 0.5,
                        })
                      }
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <span className={LABEL_CLS}>Delay (s)</span>
                    <input
                      type="number"
                      step={0.05}
                      min={0}
                      max={5}
                      value={anim.entrance.delay || 0}
                      onChange={(e) =>
                        setEntrance({ delay: parseFloat(e.target.value) || 0 })
                      }
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div>
                  <span className={LABEL_CLS}>Easing</span>
                  <select
                    value={anim.entrance.easing || "ease-out"}
                    onChange={(e) =>
                      setEntrance({ easing: e.target.value as any })
                    }
                    className={SELECT_CLS}
                  >
                    <option value="ease-out">Ease Out (Smooth)</option>
                    <option value="ease-in-out">Ease In-Out</option>
                    <option value="elastic">Elastic</option>
                    <option value="linear">Linear</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Marker Relative Start Spec */}
          {doc.markers && doc.markers.length > 0 && (
            <div className="bg-[#151519] border border-white/6 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-violet-400">
                Marker Snap Binding
              </span>
              <select
                value={
                  anim.start?.type === "marker" ? anim.start.markerId : "none"
                }
                onChange={(e) => {
                  if (e.target.value === "none") {
                    execAnim({ start: undefined });
                  } else {
                    execAnim({
                      start: {
                        type: "marker",
                        markerId: e.target.value,
                        offset:
                          anim.start?.type === "marker" ? anim.start.offset : 0,
                      },
                    });
                  }
                }}
                className={SELECT_CLS}
              >
                <option value="none">None (Absolute Time)</option>
                {doc.markers.map((m) => (
                  <option key={m.id} value={m.id}>
                    ◆ {m.label} ({m.time.toFixed(2)}s)
                  </option>
                ))}
              </select>

              {anim.start?.type === "marker" && (
                <div>
                  <span className={LABEL_CLS}>Marker Offset (s)</span>
                  <input
                    type="number"
                    step={0.05}
                    value={anim.start.offset || 0}
                    onChange={(e) =>
                      execAnim({
                        start: {
                          type: "marker",
                          markerId: (anim.start as any).markerId,
                          offset: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className={INPUT_CLS}
                  />
                </div>
              )}
            </div>
          )}

          {/* Hierarchy Inheritance Scope */}
          <div className="bg-[#151519] border border-white/6 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-violet-400">
              Child Inheritance & Stagger
            </span>
            <div>
              <span className={LABEL_CLS}>Animation Scope</span>
              <select
                value={anim.animationScope || "node"}
                onChange={(e) =>
                  execAnim({ animationScope: e.target.value as any })
                }
                className={SELECT_CLS}
              >
                <option value="node">This Node Only</option>
                <option value="children">Direct Children</option>
                <option value="subtree">Full Subtree</option>
              </select>
            </div>

            {anim.animationScope && anim.animationScope !== "node" && (
              <div>
                <span className={LABEL_CLS}>Stagger Children Delay (s)</span>
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={2}
                  value={anim.staggerChildren || 0}
                  onChange={(e) =>
                    execAnim({
                      staggerChildren: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={INPUT_CLS}
                />
              </div>
            )}
          </div>

          {/* Motion System Reflow Mode */}
          <div className="bg-[#151519] border border-white/6 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-violet-400">
              Motion System Reflow Mode
            </span>
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-[11px] font-bold text-gray-300">
                  Animate Layout Reflow
                </p>
                <p className="text-[9px] text-gray-500">
                  Per-frame stack reflow pass for siblings instead of GPU transform scale
                </p>
              </div>
              <input
                type="checkbox"
                checked={anim.animatesLayout || false}
                onChange={(e) => execAnim({ animatesLayout: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-[#1C1C22] text-violet-500 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SEMANTIC ANIMATIONS ────────────────────────────────── */}
      {tabMode === "semantic" && (
        <div className="space-y-3">
          <div className="bg-[#151519] border border-white/6 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-violet-400">
              Semantic Effect
            </span>
            <select
              value={anim.semanticAnimation?.type || "none"}
              onChange={(e) => {
                const t = e.target.value;
                if (t === "none") execAnim({ semanticAnimation: undefined });
                else if (t === "count-up") {
                  execAnim({
                    semanticAnimation: {
                      type: "count-up",
                      from: 0,
                      to: 100,
                      duration: 1.2,
                      format: "0,0",
                    },
                  });
                } else if (t === "typewriter") {
                  execAnim({
                    semanticAnimation: {
                      type: "typewriter",
                      charsPerSecond: 18,
                    },
                  });
                }
              }}
              className={SELECT_CLS}
            >
              <option value="none">None</option>
              <option value="count-up">Numeric Count-Up</option>
              <option value="typewriter">Typewriter Reveal</option>
            </select>

            {anim.semanticAnimation?.type === "count-up" && (
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={LABEL_CLS}>From</span>
                    <input
                      type="number"
                      value={anim.semanticAnimation.from}
                      onChange={(e) =>
                        execAnim({
                          semanticAnimation: {
                            ...anim.semanticAnimation,
                            from: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <span className={LABEL_CLS}>To</span>
                    <input
                      type="text"
                      value={String(anim.semanticAnimation.to)}
                      onChange={(e) =>
                        execAnim({
                          semanticAnimation: {
                            ...anim.semanticAnimation,
                            to: e.target.value,
                          },
                        })
                      }
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
                <div>
                  <span className={LABEL_CLS}>Duration (s)</span>
                  <input
                    type="number"
                    step={0.1}
                    value={anim.semanticAnimation.duration}
                    onChange={(e) =>
                      execAnim({
                        semanticAnimation: {
                          ...anim.semanticAnimation,
                          duration: parseFloat(e.target.value) || 1,
                        },
                      })
                    }
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            )}

            {anim.semanticAnimation?.type === "typewriter" && (
              <div className="mt-2">
                <span className={LABEL_CLS}>Characters per second</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={anim.semanticAnimation.charsPerSecond}
                  onChange={(e) =>
                    execAnim({
                      semanticAnimation: {
                        ...anim.semanticAnimation,
                        charsPerSecond: parseInt(e.target.value, 10) || 18,
                      },
                    })
                  }
                  className={INPUT_CLS}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: KEYFRAMES ─────────────────────────────────────────── */}
      {tabMode === "keyframe" && (
        <div className="space-y-3">
          <div className="bg-[#151519] border border-white/6 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-violet-400">
                Keyframe Tracks
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addKeyframeTrack(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="bg-[#1C1C22] border border-white/6 rounded px-2 py-0.5 text-[10px] text-gray-300 font-bold outline-none cursor-pointer"
              >
                <option value="">+ Add Track</option>
                {(() => {
                  const baseProps = [
                    "opacity",
                    "x",
                    "y",
                    "scaleX",
                    "scaleY",
                    "rotation",
                    "blur",
                  ];
                  let customProps: string[] = [];
                  if (selectedNode.type === "component") {
                    const compDef = componentRegistry.get(
                      (selectedNode as any).componentType,
                    );
                    if (compDef) {
                      customProps = compDef.schema
                        .filter((f) => f.animatable === true)
                        .map((f) => `props.${f.key}`);
                    }
                  }
                  const allProps = [...baseProps, ...customProps];
                  return allProps.map((prop) => (
                    <option
                      key={prop}
                      value={prop}
                      disabled={keyframeTracks.some((t) => t.property === prop)}
                    >
                      {prop}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {keyframeTracks.length === 0 ? (
              <p className="text-[11px] text-gray-600 text-center py-4">
                No keyframe tracks defined. Select "+ Add Track" above to
                animate custom properties.
              </p>
            ) : (
              <div className="space-y-3">
                {keyframeTracks.map((track) => (
                  <div
                    key={track.property}
                    className="border border-white/4 rounded-lg p-2 bg-[#111116] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-violet-300">
                        {track.property}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Add Keyframe at playhead"
                          onClick={() => addKeyframeAtPlayhead(track.property)}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 cursor-pointer"
                        >
                          + Keyframe
                        </button>
                        <button
                          type="button"
                          onClick={() => removeKeyframeTrack(track.property)}
                          className="text-gray-500 hover:text-red-400 text-[10px] p-0.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {track.keyframes.map((kf, kfIdx) => (
                        <div
                          key={kfIdx}
                          className="flex items-center gap-1.5 bg-[#191921] px-2 py-1 rounded"
                        >
                          <span className="text-[9px] font-mono text-gray-500">
                            {(kf.time * (doc.duration || 5)).toFixed(2)}s
                          </span>
                          <input
                            type="number"
                            step={0.1}
                            value={kf.value}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updatedKf = [...track.keyframes];
                              updatedKf[kfIdx] = { ...kf, value: val };
                              const updatedTracks = keyframeTracks.map((t) =>
                                t.property === track.property
                                  ? { ...t, keyframes: updatedKf }
                                  : t,
                              );
                              onExecuteCommand({
                                type: "UPDATE_KEYFRAME_TRACKS",
                                nodeId: selectedNode.id,
                                tracks: updatedTracks,
                              });
                            }}
                            className="w-16 bg-[#111116] border border-white/6 rounded px-1 py-0.5 text-[11px] font-mono text-white text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
