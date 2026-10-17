import React, { useState } from "react";
import { Plus, Trash2, Key, Sliders } from "lucide-react";
import type {
  TextAnimationPreset,
  AnimatedPropertyTrack,
  PropertyKeyframe,
  AnimatableProperty,
  EasingCurve,
} from "../../../types/animation";

interface AnimationTimelineProps {
  preset: TextAnimationPreset;
  onUpdatePreset: (updated: TextAnimationPreset) => void;
  progress: number;
  onSeekProgress: (progress: number) => void;
}

const AVAILABLE_EASINGS: Array<{ value: EasingCurve; label: string }> = [
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In-Out" },
  { value: "easeOutCubic", label: "Smooth Cubic" },
  { value: "easeOutBack", label: "Overshoot / Pop (Back)" },
  { value: "easeInBack", label: "Anticipate (In Back)" },
  { value: "easeOutBounce", label: "Bouncy (Bounce)" },
  { value: "easeOutElastic", label: "Elastic" },
  { value: { type: "spring", damping: 14, stiffness: 120, mass: 1 }, label: "Spring (Soft)" },
  { value: { type: "spring", damping: 8, stiffness: 180, mass: 1 }, label: "Spring (Snappy)" },
];

export const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  preset,
  onUpdatePreset,
  progress,
  onSeekProgress,
}) => {
  const [selectedKeyframe, setSelectedKeyframe] = useState<{
    trackIndex: number;
    kfIndex: number;
  } | null>(null);

  // Add keyframe at current playhead progress
  const handleAddKeyframeAtPlayhead = (trackIndex: number) => {
    const track = preset.tracks[trackIndex];
    if (!track) return;

    // Determine value at current progress
    const newKf: PropertyKeyframe = {
      progress: Math.round(progress * 100) / 100,
      value: track.keyframes[track.keyframes.length - 1]?.value ?? 0,
      easing: "easeOut",
    };

    const nextKeyframes = [...track.keyframes, newKf].sort(
      (a, b) => a.progress - b.progress,
    );

    const updatedTracks = [...preset.tracks];
    updatedTracks[trackIndex] = {
      ...track,
      keyframes: nextKeyframes,
    };

    onUpdatePreset({
      ...preset,
      tracks: updatedTracks,
    });
  };

  const handleUpdateKeyframe = (
    trackIndex: number,
    kfIndex: number,
    field: "progress" | "value" | "easing",
    value: any,
  ) => {
    const track = preset.tracks[trackIndex];
    if (!track) return;

    const nextKeyframes = track.keyframes.map((kf, i) => {
      if (i !== kfIndex) return kf;
      return { ...kf, [field]: value };
    });

    if (field === "progress") {
      nextKeyframes.sort((a, b) => a.progress - b.progress);
    }

    const updatedTracks = [...preset.tracks];
    updatedTracks[trackIndex] = { ...track, keyframes: nextKeyframes };

    onUpdatePreset({
      ...preset,
      tracks: updatedTracks,
    });
  };

  const handleDeleteKeyframe = (trackIndex: number, kfIndex: number) => {
    const track = preset.tracks[trackIndex];
    if (!track || track.keyframes.length <= 1) return;

    const nextKeyframes = track.keyframes.filter((_, i) => i !== kfIndex);
    const updatedTracks = [...preset.tracks];
    updatedTracks[trackIndex] = { ...track, keyframes: nextKeyframes };

    setSelectedKeyframe(null);
    onUpdatePreset({
      ...preset,
      tracks: updatedTracks,
    });
  };

  const handleRemoveTrack = (trackIndex: number) => {
    const updatedTracks = preset.tracks.filter((_, i) => i !== trackIndex);
    setSelectedKeyframe(null);
    onUpdatePreset({
      ...preset,
      tracks: updatedTracks,
    });
  };

  const activeKfData =
    selectedKeyframe !== null
      ? preset.tracks[selectedKeyframe.trackIndex]?.keyframes[
          selectedKeyframe.kfIndex
        ]
      : null;

  return (
    <div className="flex h-48 flex-col border-t border-[var(--studio-border)] bg-[var(--studio-panel)] text-xs text-white">
      {/* ── Timeline Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--studio-border)] bg-[#111118] px-4 py-1.5">
        <div className="flex items-center gap-2 font-semibold">
          <Sliders size={13} className="text-[var(--studio-accent)]" />
          <span className="text-[11px] uppercase tracking-wider text-[var(--studio-muted)]">
            Keyframe Motion Timeline
          </span>
        </div>

        {/* Selected Keyframe Inspector */}
        {selectedKeyframe && activeKfData && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--studio-muted)]">
              {preset.tracks[selectedKeyframe.trackIndex]?.property} @{" "}
              {(activeKfData.progress * 100).toFixed(0)}%:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[var(--studio-muted)]">Val:</span>
              <input
                type="number"
                step={0.1}
                value={activeKfData.value}
                onChange={(e) =>
                  handleUpdateKeyframe(
                    selectedKeyframe.trackIndex,
                    selectedKeyframe.kfIndex,
                    "value",
                    Number(e.target.value),
                  )
                }
                className="h-6 w-16 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-1.5 text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[var(--studio-muted)]">Curve:</span>
              <select
                value={
                  typeof activeKfData.easing === "string"
                    ? activeKfData.easing
                    : "linear"
                }
                onChange={(e) =>
                  handleUpdateKeyframe(
                    selectedKeyframe.trackIndex,
                    selectedKeyframe.kfIndex,
                    "easing",
                    e.target.value,
                  )
                }
                className="h-6 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs text-white"
              >
                {AVAILABLE_EASINGS.map((eas, idx) => (
                  <option
                    key={idx}
                    value={typeof eas.value === "string" ? eas.value : "spring"}
                  >
                    {eas.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() =>
                handleDeleteKeyframe(
                  selectedKeyframe.trackIndex,
                  selectedKeyframe.kfIndex,
                )
              }
              title="Delete keyframe"
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Tracks List & Lane Graph ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {preset.tracks.map((track, trackIdx) => (
          <div
            key={track.property + trackIdx}
            className="flex items-center border-b border-[var(--studio-border)]/50 hover:bg-white/[0.02]"
          >
            {/* Track Label Header */}
            <div className="flex w-36 shrink-0 items-center justify-between border-r border-[var(--studio-border)] px-3 py-2">
              <span className="font-mono text-[11px] font-semibold text-white/90">
                {track.property}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAddKeyframeAtPlayhead(trackIdx)}
                  title="Add Keyframe at Playhead"
                  className="rounded p-1 text-[var(--studio-muted)] hover:bg-[var(--studio-control)] hover:text-white"
                >
                  <Plus size={11} />
                </button>
                <button
                  onClick={() => handleRemoveTrack(trackIdx)}
                  title="Remove Track"
                  className="rounded p-1 text-[var(--studio-muted)] hover:text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>

            {/* Track Keyframe Lane */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickProgress = Math.max(
                  0,
                  Math.min(1, (e.clientX - rect.left) / rect.width),
                );
                onSeekProgress(clickProgress);
              }}
              className="relative h-9 flex-1 cursor-crosshair bg-black/20"
            >
              {/* Playhead Vertical Line */}
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-[1px] bg-[var(--studio-accent)]"
                style={{ left: `${progress * 100}%` }}
              />

              {/* Progress Ruler Grid Lines */}
              <div className="pointer-events-none absolute inset-0 flex justify-between px-2 opacity-15">
                {[0, 25, 50, 75, 100].map((step) => (
                  <div key={step} className="h-full border-r border-white/40" />
                ))}
              </div>

              {/* Keyframe Diamond Markers */}
              {track.keyframes.map((kf, kfIdx) => {
                const isSelected =
                  selectedKeyframe?.trackIndex === trackIdx &&
                  selectedKeyframe?.kfIndex === kfIdx;

                return (
                  <button
                    key={kfIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedKeyframe({ trackIndex: trackIdx, kfIndex: kfIdx });
                      onSeekProgress(kf.progress);
                    }}
                    style={{ left: `${kf.progress * 100}%` }}
                    className={`absolute top-1/2 -ml-2 -mt-2 z-20 flex h-4 w-4 rotate-45 items-center justify-center rounded-xs transition-transform hover:scale-125 ${
                      isSelected
                        ? "border-2 border-white bg-[var(--studio-accent)] shadow-[0_0_8px_var(--studio-accent)]"
                        : "border border-black/80 bg-white/90 hover:bg-white"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {preset.tracks.length === 0 && (
          <div className="flex h-24 items-center justify-center text-[var(--studio-muted)]">
            No animated tracks yet. Add a property track from the right inspector.
          </div>
        )}
      </div>
    </div>
  );
};
