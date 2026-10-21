import React, { useRef, useEffect, useState, useMemo } from "react";
import { Play, Pause, RotateCcw, Monitor, Grid, Sun, Moon } from "lucide-react";
import type { TextAnimationPreset } from "../../../types/animation";
import { evaluatePresetTransform } from "../services/animationEvaluator";

interface AnimationPreviewStageProps {
  preset: TextAnimationPreset;
  sampleText: string;
  onSampleTextChange: (text: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  onSeek: (time: number) => void;
  duration: number;
  /** Called once the stage canvas container mounts, forwarding the DOM node
   *  to the parent so it can drive canvas capture (FEAT-002). */
  onStageMount?: (el: HTMLDivElement) => void;
}

export const AnimationPreviewStage: React.FC<AnimationPreviewStageProps> = ({
  preset,
  sampleText,
  onSampleTextChange,
  isPlaying,
  onTogglePlay,
  currentTime,
  onSeek,
  duration,
  onStageMount,
}) => {
  const [bgMode, setBgMode] = useState<"dark" | "checker" | "light">("dark");
  const [fontSize, setFontSize] = useState<number>(64);
  const containerRef = useRef<HTMLDivElement>(null);

  // Forward the stage container DOM node to the parent for canvas capture.
  useEffect(() => {
    if (containerRef.current && onStageMount) {
      onStageMount(containerRef.current);
    }
  }, [onStageMount]);

  // Normalize current progress within preset duration [0, 1]
  const progress =
    duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  // Split sample text into individual characters for staggering
  const characters = useMemo(
    () => Array.from(sampleText || "ABC123"),
    [sampleText],
  );

  // Compute transform per glyph
  const glyphTransforms = useMemo(() => {
    return characters.map((char, index) => {
      return evaluatePresetTransform(
        preset,
        progress,
        index,
        characters.length,
      );
    });
  }, [preset, progress, characters]);

  const vfxType = preset.procedural?.type;
  const vfxStrength = preset.procedural?.intensity ?? 0;
  const vfxPhase = Math.sin(progress * Math.PI * 2);
  const hasGradientText = [
    "chromatic",
    "water",
    "flame",
    "neon",
    "shine",
  ].includes(vfxType ?? "");
  const vfxTextStyle: React.CSSProperties = (() => {
    switch (vfxType) {
      case "flame":
        return {
          backgroundImage:
            "linear-gradient(180deg, #fff6b3 4%, #ffb11a 45%, #f04416 100%)",
          textShadow: `0 0 ${14 + vfxStrength * 18}px rgba(255, 91, 20, .78)`,
        };
      case "water":
        return {
          backgroundImage:
            "linear-gradient(105deg, #54f8ff, #477cff 36%, #ec48ff 66%, #69fcff)",
          backgroundPosition: `${progress * 200}% 50%`,
          textShadow: "0 0 18px rgba(75, 177, 255, .72)",
        };
      case "neon":
        return {
          backgroundImage:
            "linear-gradient(105deg, #59f8ff, #d85cff 48%, #74ffcb)",
          textShadow: `0 0 ${9 + vfxStrength * 17}px rgba(113, 73, 255, .9)`,
        };
      case "shine":
        return {
          backgroundImage: `linear-gradient(105deg, #fff 0%, #fff 35%, #ffd280 ${45 + vfxPhase * 12}%, #fff 58%, #fff 100%)`,
          textShadow: "0 0 16px rgba(255, 167, 89, .5)",
        };
      case "chromatic":
        return {
          color: "#f7ff7a",
          textShadow: `${3 + vfxPhase * 2}px 0 #ff2458, ${-3 - vfxPhase * 2}px 0 #28d9ff`,
        };
      case "pixel":
        return {
          textShadow: "2px 0 #fff, -2px 0 #6ef4ff",
          imageRendering: "pixelated",
        };
      case "glitch":
        return {
          textShadow: `${vfxPhase * 5}px 0 #ff4068, ${-vfxPhase * 5}px 0 #45e9ff`,
        };
      default:
        return {};
    }
  })();

  return (
    <div className="flex h-full flex-col bg-[#0B0B10]">
      {/* ── Top Stage Toolbar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--studio-border)] bg-[var(--studio-panel)] px-4 py-2">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={sampleText}
            onChange={(e) => onSampleTextChange(e.target.value)}
            placeholder="Sample text..."
            className="h-7 w-48 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2 text-xs font-semibold text-white focus:border-[var(--studio-accent)] focus:outline-none"
          />
          <div className="flex items-center gap-1.5 text-xs text-[var(--studio-muted)]">
            <span>Size:</span>
            <input
              type="range"
              min={24}
              max={120}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="h-1.5 w-16 accent-[var(--studio-accent)]"
            />
            <span className="w-8 text-[11px] font-mono">{fontSize}px</span>
          </div>
        </div>

        {/* Stage Background Switcher */}
        <div className="flex items-center gap-1 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] p-0.5">
          <button
            onClick={() => setBgMode("dark")}
            title="Dark Stage"
            className={`flex h-6 w-6 items-center justify-center rounded ${bgMode === "dark" ? "bg-[var(--studio-active)] text-white" : "text-[var(--studio-muted)] hover:text-white"}`}
          >
            <Moon size={12} />
          </button>
          <button
            onClick={() => setBgMode("checker")}
            title="Checkerboard Alpha"
            className={`flex h-6 w-6 items-center justify-center rounded ${bgMode === "checker" ? "bg-[var(--studio-active)] text-white" : "text-[var(--studio-muted)] hover:text-white"}`}
          >
            <Grid size={12} />
          </button>
          <button
            onClick={() => setBgMode("light")}
            title="Light Stage"
            className={`flex h-6 w-6 items-center justify-center rounded ${bgMode === "light" ? "bg-[var(--studio-active)] text-white" : "text-[var(--studio-muted)] hover:text-white"}`}
          >
            <Sun size={12} />
          </button>
        </div>
      </div>

      {/* ── Center Canvas Stage ── */}
      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden select-none"
        style={{
          background:
            bgMode === "dark"
              ? "#08080C"
              : bgMode === "light"
                ? "#F0F2F5"
                : "repeating-conic-gradient(#181820 0% 25%, #101018 0% 50%) 50% / 20px 20px",
        }}
      >
        {/* Stage Center Crosshair Guides */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
          <div className="h-full w-[1px] bg-white/40" />
          <div className="absolute h-[1px] w-full bg-white/40" />
        </div>

        {/* Text Glyph Cluster */}
        <div
          className="relative flex items-center justify-center font-bold tracking-normal transition-all"
          style={{
            fontSize: `${fontSize}px`,
            color: hasGradientText
              ? "transparent"
              : bgMode === "light"
                ? "#111"
                : "#FFF",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            textShadow:
              bgMode === "light" ? "none" : "0 4px 24px rgba(0,0,0,0.6)",
            backgroundClip: hasGradientText ? "text" : undefined,
            WebkitBackgroundClip: hasGradientText ? "text" : undefined,
            ...vfxTextStyle,
          }}
        >
          {characters.map((char, i) => {
            const transform = glyphTransforms[i] || {
              opacity: 1,
              scaleX: 1,
              scaleY: 1,
              translateX: 0,
              translateY: 0,
              rotation: 0,
              skewX: 0,
              blur: 0,
              tracking: 0,
            };

            const transformStyle = [
              `translate3d(${transform.translateX}px, ${transform.translateY}px, 0)`,
              `scale(${transform.scaleX}, ${transform.scaleY})`,
              `rotate(${transform.rotation}deg)`,
              `skewX(${transform.skewX}deg)`,
            ].join(" ");

            return (
              <span
                key={i}
                className="inline-block origin-center will-change-transform"
                style={{
                  opacity: transform.opacity,
                  transform: transformStyle,
                  filter:
                    transform.blur > 0 ? `blur(${transform.blur}px)` : "none",
                  marginRight: `${transform.tracking}px`,
                  whiteSpace: "pre",
                }}
              >
                {char}
              </span>
            );
          })}
          {vfxType === "cursor" && (
            <span
              aria-hidden="true"
              className="ml-1 inline-block font-light text-[var(--studio-accent)]"
              style={{ opacity: progress % 0.24 < 0.13 ? 1 : 0.1 }}
            >
              {preset.name === "Dot Cursor" ? "•" : "|"}
            </span>
          )}
          {["sparkle", "dust", "petal", "flame"].includes(vfxType ?? "") && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-0.55em] overflow-visible"
            >
              {Array.from({ length: 10 }, (_, index) => {
                const angle = index * 2.399;
                const distance = 35 + (index % 4) * 18 + progress * 54;
                const x = Math.cos(angle) * distance;
                const y =
                  Math.sin(angle) * distance -
                  (vfxType === "flame" ? progress * 28 : 0);
                const glyph =
                  vfxType === "petal" ? "✦" : vfxType === "flame" ? "✧" : "•";
                return (
                  <span
                    key={index}
                    className="absolute left-1/2 top-1/2 text-[0.19em]"
                    style={{
                      color:
                        vfxType === "flame"
                          ? "#ff9d25"
                          : vfxType === "petal"
                            ? "#ff9ed8"
                            : "#ffe89a",
                      opacity: Math.max(0, (1 - progress) * 0.78),
                      transform: `translate(${x}px, ${y}px) rotate(${index * 37}deg)`,
                      filter: "drop-shadow(0 0 5px currentColor)",
                    }}
                  >
                    {glyph}
                  </span>
                );
              })}
            </div>
          )}
          {["neon", "shine", "water"].includes(vfxType ?? "") && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[-8%] h-[2px] rounded-full"
              style={{
                top: `${25 + progress * 55}%`,
                opacity: 0.25 + Math.abs(vfxPhase) * 0.55,
                background:
                  vfxType === "water"
                    ? "#64ecff"
                    : vfxType === "neon"
                      ? "#ca70ff"
                      : "#ffe19d",
                boxShadow: "0 0 15px currentColor",
              }}
            />
          )}
        </div>

        {/* Watermark / Preset Phase Tag */}
        <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/70 backdrop-blur-md">
          <span className="uppercase text-[var(--studio-accent)]">
            {preset.phase}
          </span>
          <span className="opacity-40">•</span>
          <span>{preset.name}</span>
          <span className="opacity-40">•</span>
          <span>{(progress * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* ── Bottom Transport Bar ── */}
      <div className="flex shrink-0 items-center gap-3 border-t border-[var(--studio-border)] bg-[var(--studio-panel)] px-4 py-2.5">
        <button
          onClick={onTogglePlay}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--studio-accent)] text-black transition-transform hover:scale-105"
        >
          {isPlaying ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={() => onSeek(0)}
          title="Reset to 0s"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--studio-border)] text-[var(--studio-muted)] hover:text-white"
        >
          <RotateCcw size={13} />
        </button>

        {/* Scrubber slider */}
        <div className="flex flex-1 items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer accent-[var(--studio-accent)]"
          />
          <span className="w-20 text-right font-mono text-xs text-[var(--studio-muted)]">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>
      </div>
    </div>
  );
};
