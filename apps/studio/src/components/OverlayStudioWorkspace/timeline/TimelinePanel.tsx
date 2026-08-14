import React, { useState, useEffect, useRef } from "react";
import type {
  OverlayDocument,
  SceneNode,
  DocumentCommand,
  TimelineMarker,
  KeyframeTrack,
} from "@clypra-studio/engine";
import { animationRuntime } from "@clypra-studio/engine";
import {
  Play,
  Pause,
  SkipBack,
  Clock,
  Bookmark,
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
  ZoomIn,
} from "lucide-react";

interface TimelineTrack {
  node: SceneNode;
  nodeId: string;
  nodeName: string;
  duration: number; // seconds
  delay: number; // seconds
  color: string;
  keyframeTracks: KeyframeTrack[];
}

interface TimelinePanelProps {
  doc: OverlayDocument;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSetSpeed: (speed: number) => void;
  onExecuteCommand?: (cmd: DocumentCommand) => void;
}

const MARKER_COLORS: Record<TimelineMarker["type"], string> = {
  keyword: "#A78BFA",
  chapter: "#34D399",
  beat: "#F59E0B",
  transcript: "#38BDF8",
};

export function TimelinePanel({
  doc,
  currentTime,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onSeek,
  onSetSpeed,
  onExecuteCommand = () => {},
}: TimelinePanelProps) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);
  const [showAddMarkerForm, setShowAddMarkerForm] = useState(false);
  const [markerLabel, setMarkerLabel] = useState("");
  const [markerType, setMarkerType] =
    useState<TimelineMarker["type"]>("keyword");
  const [zoom, setZoom] = useState(1);
  const trackScrollRef = useRef<HTMLDivElement>(null);

  const totalDuration = doc.duration || 5;
  const timePct = (t: number) =>
    `${Math.max(0, Math.min(100, (t / totalDuration) * 100))}%`;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "Home") {
        e.preventDefault();
        handleSeekWithSnap(0);
      } else if (e.key === "End") {
        e.preventDefault();
        handleSeekWithSnap(totalDuration);
      } else if (e.key === " ") {
        e.preventDefault();
        onTogglePlay();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [totalDuration, onTogglePlay]);

  // Mouse wheel zoom (Ctrl/Cmd + wheel) on track area
  const handleTrackWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((prev) => Math.max(0.25, Math.min(4, prev - e.deltaY * 0.005)));
    }
  };

  const tracks: TimelineTrack[] = doc.nodes.map((n, i) => ({
    node: n,
    nodeId: n.id,
    nodeName: n.name || n.id,
    duration: (n as any).animation?.entrance?.duration ?? totalDuration,
    delay: (n as any).animation?.entrance?.delay ?? 0,
    color: ["#7C6FFF", "#22D3EE", "#34D399", "#F59E0B", "#F87171"][i % 5],
    keyframeTracks: (n as any).animation?.keyframeTracks || [],
  }));

  const toggleExpand = (id: string) => {
    setExpandedNodeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSeekWithSnap = (rawTime: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, rawTime));
    const snapResult = animationRuntime.snapTime(
      clamped,
      doc.markers || [],
      0.1,
    );
    onSeek(snapResult.snappedTime);
  };

  const handleAddMarker = () => {
    if (!markerLabel.trim()) return;
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      time: Math.round(currentTime * 100) / 100,
      label: markerLabel.trim(),
      type: markerType,
      color: MARKER_COLORS[markerType],
    };
    onExecuteCommand({ type: "ADD_TIMELINE_MARKER", marker: newMarker });
    setMarkerLabel("");
    setShowAddMarkerForm(false);
  };

  const handleRemoveMarker = (markerId: string) => {
    onExecuteCommand({ type: "REMOVE_TIMELINE_MARKER", markerId });
  };

  const stepFrame = (frames: number) => {
    const frameTime = 1 / 60;
    handleSeekWithSnap(currentTime + frames * frameTime);
  };

  return (
    <div className="h-72 border-t border-[#1A1A24] bg-[#0A0A10] select-none z-20 shrink-0 font-sans flex flex-col">
      {/* ── TOP CONTROL BAR ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1A1A24] shrink-0">
        <button
          type="button"
          onClick={() => handleSeekWithSnap(0)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#232332] bg-[#08080C] text-gray-400 hover:text-white transition-all cursor-pointer"
          title="Rewind to start (0s)"
        >
          <SkipBack size={13} />
        </button>
        <button
          type="button"
          onClick={() => stepFrame(-1)}
          className="flex h-7 px-1.5 items-center justify-center rounded-lg border border-[#232332] bg-[#08080C] text-gray-400 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
          title="Step back 1 frame (-1/60s)"
        >
          -1f
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer"
          title="Play / Pause (Space)"
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <button
          type="button"
          onClick={() => stepFrame(1)}
          className="flex h-7 px-1.5 items-center justify-center rounded-lg border border-[#232332] bg-[#08080C] text-gray-400 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
          title="Step forward 1 frame (+1/60s)"
        >
          +1f
        </button>

        {/* Timecode */}
        <span className="font-mono text-[12px] font-bold text-violet-300 w-28">
          {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
        </span>

        {/* Add Marker trigger */}
        <button
          type="button"
          onClick={() => setShowAddMarkerForm((v) => !v)}
          className={`flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            showAddMarkerForm
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "border border-[#232332] bg-[#08080C] text-gray-400 hover:text-white"
          }`}
        >
          <Bookmark size={11} />
          <span>+ Marker</span>
        </button>

        {/* Inline Add Marker Form */}
        {showAddMarkerForm && (
          <div className="flex items-center gap-1 bg-[#151519] border border-white/[0.08] rounded-lg p-1">
            <input
              type="text"
              placeholder="Marker label..."
              value={markerLabel}
              onChange={(e) => setMarkerLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMarker()}
              className="w-28 bg-[#1C1C22] border border-white/6 rounded px-2 py-0.5 text-[11px] text-white outline-none"
              autoFocus
            />
            <select
              value={markerType}
              onChange={(e) => setMarkerType(e.target.value as any)}
              className="bg-[#1C1C22] border border-white/6 rounded px-1.5 py-0.5 text-[10px] text-gray-300 outline-none cursor-pointer"
            >
              <option value="keyword">Keyword</option>
              <option value="chapter">Chapter</option>
              <option value="beat">Beat</option>
              <option value="transcript">Transcript</option>
            </select>
            <button
              type="button"
              onClick={handleAddMarker}
              disabled={!markerLabel.trim()}
              className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold disabled:opacity-30 cursor-pointer"
            >
              Add
            </button>
          </div>
        )}

        {/* Speed Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-[#232332] bg-[#08080C] p-0.5 text-[11px] font-bold font-mono ml-auto">
          {[0.5, 1.0, 1.5, 2.0].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onSetSpeed(spd)}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                playbackSpeed === spd
                  ? "bg-violet-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 font-bold">
          <Clock size={11} />
          60 FPS
        </div>

        {/* Zoom Control */}
        <div className="flex items-center gap-1.5 ml-2 border-l border-white/6 pl-2">
          <ZoomIn size={11} className="text-gray-600" />
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.25}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-16 accent-violet-500 cursor-pointer"
            title="Timeline zoom"
          />
          <span className="text-[10px] font-mono text-gray-400 w-9">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* ── TRACKS AND MARKERS ─────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-auto relative custom-scrollbar"
        ref={trackScrollRef}
        onWheel={handleTrackWheel}
      >
        <div
          className="flex min-h-full"
          style={{ minWidth: `${Math.max(640, totalDuration * 100 * zoom)}px` }}
        >
          {/* Left Panel: Track Labels */}
          <div className="w-48 shrink-0 border-r border-[#1A1A24] bg-[#0C0C12]">
            {/* Header label area */}
            <div className="h-6 border-b border-[#1A1A24] px-3 flex items-center bg-[#0C0C12] sticky top-0 z-20">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">
                Tracks & Markers
              </span>
            </div>

            {/* Layer Rows */}
            {tracks.map((t) => {
              const isExpanded = expandedNodeIds.includes(t.nodeId);
              return (
                <React.Fragment key={t.nodeId}>
                  <div
                    className="h-7 px-2 flex items-center justify-between border-b border-[#1A1A24] hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => toggleExpand(t.nodeId)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {t.keyframeTracks.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown size={10} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={10} className="text-gray-500" />
                        )
                      ) : (
                        <div className="w-2.5 h-2.5" />
                      )}
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-[10px] font-bold text-gray-300 truncate">
                        {t.nodeName}
                      </span>
                    </div>
                  </div>

                  {/* Subtracks for keyframe properties */}
                  {isExpanded &&
                    t.keyframeTracks.map((kt) => (
                      <div
                        key={kt.property}
                        className="h-6 pl-7 pr-2 flex items-center border-b border-[#1A1A24]/60 bg-[#08080E]"
                      >
                        <span className="font-mono text-[9px] text-violet-400 font-bold truncate">
                          ♦ {kt.property}
                        </span>
                      </div>
                    ))}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right Panel: Time Ruler, Marker Track & Keyframe Diamonds */}
          <div className="flex-1 relative bg-[#08080C]">
            {/* Marker Track Ruler */}
            <div
              className="h-6 border-b border-[#1A1A24] relative bg-[#06060A] cursor-pointer sticky top-0 z-20"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const frac = (e.clientX - rect.left) / rect.width;
                handleSeekWithSnap(frac * totalDuration);
              }}
            >
              {/* Ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                <span
                  key={frac}
                  className="absolute top-1 text-[8px] font-mono text-gray-600"
                  style={{
                    left: `${frac * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {(frac * totalDuration).toFixed(1)}s
                </span>
              ))}

              {/* Document Markers */}
              {doc.markers &&
                doc.markers.map((m) => (
                  <div
                    key={m.id}
                    title={`${m.label} (${m.type}) — ${m.time.toFixed(2)}s`}
                    className="absolute top-0 bottom-0 flex items-center group cursor-pointer"
                    style={{
                      left: timePct(m.time),
                      transform: "translateX(-50%)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeekWithSnap(m.time);
                    }}
                  >
                    <span
                      className="px-1 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight shadow text-white border"
                      style={{
                        backgroundColor:
                          (m.color || MARKER_COLORS[m.type]) + "40",
                        borderColor: m.color || MARKER_COLORS[m.type],
                        color: m.color || MARKER_COLORS[m.type],
                      }}
                    >
                      ◆ {m.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMarker(m.id);
                      }}
                      className="hidden group-hover:inline-block ml-0.5 text-gray-400 hover:text-red-400 text-[8px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
            </div>

            {/* Layer Animation Bar Rows */}
            {tracks.map((t) => {
              const isExpanded = expandedNodeIds.includes(t.nodeId);
              return (
                <React.Fragment key={t.nodeId}>
                  <div
                    className="h-7 border-b border-[#1A1A24] relative cursor-pointer hover:bg-white/[0.01]"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const frac = (e.clientX - rect.left) / rect.width;
                      handleSeekWithSnap(frac * totalDuration);
                    }}
                  >
                    {/* Entrance Preset Bar */}
                    <div
                      className="absolute top-1 h-5 rounded-md opacity-75 hover:opacity-100 transition-opacity flex items-center px-1.5"
                      style={{
                        left: timePct(t.delay),
                        width: timePct(
                          Math.min(t.duration, totalDuration - t.delay),
                        ),
                        backgroundColor: t.color,
                      }}
                    >
                      <span className="text-[8px] font-bold text-black uppercase truncate opacity-80">
                        {(t.node as any).animation?.entrance?.type || "static"}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Keyframe Diamond Rows */}
                  {isExpanded &&
                    t.keyframeTracks.map((kt) => (
                      <div
                        key={kt.property}
                        className="h-6 border-b border-[#1A1A24]/60 relative bg-[#05050A] cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const frac = (e.clientX - rect.left) / rect.width;
                          handleSeekWithSnap(frac * totalDuration);
                        }}
                      >
                        {kt.keyframes.map((kf, kfIdx) => {
                          const kfTimeSec = kf.time * totalDuration;
                          return (
                            <div
                              key={kfIdx}
                              title={`${kt.property}: ${
                                kf.value
                              } at ${kfTimeSec.toFixed(2)}s`}
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-violet-400 border border-white rotate-45 rounded-sm shadow-md cursor-pointer hover:scale-125 transition-transform"
                              style={{
                                left: timePct(kfTimeSec),
                                transform:
                                  "translate(-50%, -50%) rotate(45deg)",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeekWithSnap(kfTimeSec);
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                </React.Fragment>
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              style={{ left: timePct(currentTime) }}
            >
              <div className="w-3.5 h-3.5 bg-white rounded-full -translate-x-1/2 -translate-y-1 shadow-md border border-violet-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
