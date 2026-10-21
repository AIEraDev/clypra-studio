import React, { useRef, useEffect, useState } from "react";
import { Grid, Moon, Sun, Maximize2, ShieldAlert } from "lucide-react";
import {
  type TextBubblePreset,
  resolveBubbleLayout,
} from "@clypra-studio/engine";
import { renderCuratedBubble } from "../renderCuratedBubble";

interface BubbleStagePreviewProps {
  preset: TextBubblePreset;
  sampleText: string;
  onSampleTextChange: (text: string) => void;
  onUpdatePreset: (updated: TextBubblePreset) => void;
}

export const BubbleStagePreview: React.FC<BubbleStagePreviewProps> = ({
  preset,
  sampleText,
  onSampleTextChange,
  onUpdatePreset,
}) => {
  const [bgMode, setBgMode] = useState<"dark" | "checker" | "light">("dark");
  const [fontSize, setFontSize] = useState<number>(preset.defaultTextStyle?.fontSize || 32);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [sizingMode, setSizingMode] = useState<"auto-fit" | "fixed">(
    preset.layout.sizingMode || "auto-fit",
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync font size when preset changes
  useEffect(() => {
    if (preset.defaultTextStyle?.fontSize) {
      setFontSize(preset.defaultTextStyle.fontSize);
    }
    if (preset.layout.sizingMode) {
      setSizingMode(preset.layout.sizingMode);
    }
    onSampleTextChange(preset.sampleText || "Sample Text");
  }, [preset.id, onSampleTextChange]);

  // Render on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const stageWidth = 720;
    const stageHeight = 420;
    canvas.width = stageWidth * dpr;
    canvas.height = stageHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, stageWidth, stageHeight);

    // 1. Measure text
    const textStyle = preset.defaultTextStyle;
    const fontDesc = `${textStyle?.fontStyle === "italic" ? "italic " : ""}${textStyle?.fontWeight || "bold"} ${fontSize}px ${textStyle?.fontFamily || "Inter, sans-serif"}`;
    ctx.font = fontDesc;

    const metrics = ctx.measureText(sampleText || "Sample Text");
    const textW = Math.ceil(metrics.width);
    const textH = Math.ceil(fontSize * 1.2);

    // 2. Resolve outer bounds via layout resolver
    const vectorPadding = preset.definition?.textLayout.padding;
    const layoutPadding = vectorPadding
      ? {
          top: vectorPadding[0] * preset.layout.minHeight,
          right: vectorPadding[1] * preset.layout.minWidth,
          bottom: vectorPadding[2] * preset.layout.minHeight,
          left: vectorPadding[3] * preset.layout.minWidth,
        }
      : preset.layout.padding;
    const layoutRes = resolveBubbleLayout(textW, textH, {
      ...preset.layout,
      padding: layoutPadding,
      sizingMode,
    });

    const outerW = layoutRes.outerWidth;
    const outerH = layoutRes.outerHeight;

    const startX = Math.round((stageWidth - outerW) / 2);
    const startY = Math.round((stageHeight - outerH) / 2);

    // 3. Render bubble background using shared engine helper
    renderCuratedBubble(ctx, preset, startX, startY, outerW, outerH);

    // 4. Render text centered inside outer composition
    ctx.save();
    ctx.fillStyle = textStyle?.color || (preset.category === "paper" ? "#ef4444" : "#000000");
    ctx.font = fontDesc;
    ctx.textAlign = preset.definition?.textLayout.alignment ?? "center";
    ctx.textBaseline = "middle";

    const textCenterX = preset.definition?.textLayout.alignment === "left"
      ? startX + (layoutPadding?.left ?? 0) + layoutRes.textOffsetX
      : preset.definition?.textLayout.alignment === "right"
        ? startX + outerW - (layoutPadding?.right ?? 0) + layoutRes.textOffsetX
        : startX + outerW / 2 + layoutRes.textOffsetX;
    const textCenterY = startY + outerH / 2 + layoutRes.textOffsetY;

    ctx.fillText(sampleText || "Sample Text", textCenterX, textCenterY);

    if (textStyle?.textDecoration === "underline") {
      ctx.strokeStyle = textStyle.color || "#ef4444";
      ctx.lineWidth = Math.max(2, Math.floor(fontSize / 14));
      ctx.beginPath();
      ctx.moveTo(textCenterX - textW / 2, textCenterY + textH / 2 - 2);
      ctx.lineTo(textCenterX + textW / 2, textCenterY + textH / 2 - 2);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Draw visual boundary guides if enabled
    if (showGuides) {
      ctx.save();
      // Outer bounding box guide
      ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(startX, startY, outerW, outerH);

      // Safe content area guide
      const p = layoutPadding ?? { top: 14, right: 18, bottom: 14, left: 18 };
      ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
      ctx.strokeRect(
        startX + p.left,
        startY + p.top,
        outerW - p.left - p.right,
        outerH - p.top - p.bottom,
      );
      ctx.restore();
    }
  }, [preset, sampleText, fontSize, showGuides, sizingMode]);

  return (
    <div className="flex h-full flex-col bg-[#0B0B10]">
      {/* ── Top Toolbar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--studio-border)] bg-[var(--studio-panel)] px-4 py-2">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={sampleText}
            onChange={(e) => onSampleTextChange(e.target.value)}
            placeholder="Sample text..."
            className="h-7 w-64 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] px-2.5 text-xs font-semibold text-white focus:border-[var(--studio-accent)] focus:outline-none"
          />

          <div className="flex items-center gap-1.5 text-xs text-[var(--studio-muted)]">
            <span>Size:</span>
            <input
              type="range"
              min={16}
              max={64}
              value={fontSize}
              onChange={(e) => {
                const sz = Number(e.target.value);
                setFontSize(sz);
                onUpdatePreset({
                  ...preset,
                  defaultTextStyle: { ...preset.defaultTextStyle, fontSize: sz },
                });
              }}
              className="h-1.5 w-16 accent-[var(--studio-accent)]"
            />
            <span className="w-8 text-[11px] font-mono">{fontSize}px</span>
          </div>

          {/* Sizing mode switcher */}
          <div className="flex items-center gap-1 rounded border border-[var(--studio-border)] bg-[var(--studio-control)] p-0.5 text-[10px] font-semibold">
            <button
              onClick={() => {
                setSizingMode("auto-fit");
                onUpdatePreset({
                  ...preset,
                  layout: { ...preset.layout, sizingMode: "auto-fit" },
                });
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                sizingMode === "auto-fit"
                  ? "bg-[var(--studio-active)] text-white shadow"
                  : "text-[var(--studio-muted)] hover:text-white"
              }`}
            >
              Auto-fit
            </button>
            <button
              onClick={() => {
                setSizingMode("fixed");
                onUpdatePreset({
                  ...preset,
                  layout: { ...preset.layout, sizingMode: "fixed" },
                });
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                sizingMode === "fixed"
                  ? "bg-[var(--studio-active)] text-white shadow"
                  : "text-[var(--studio-muted)] hover:text-white"
              }`}
            >
              Fixed
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Guide Overlay Toggle */}
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-semibold transition-colors ${
              showGuides
                ? "border-[var(--studio-accent)]/50 bg-[var(--studio-accent)]/10 text-[var(--studio-accent)]"
                : "border-[var(--studio-border)] text-[var(--studio-muted)] hover:text-white"
            }`}
          >
            <Maximize2 size={12} />
            <span>Guides</span>
          </button>

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
      </div>

      {/* ── Main Canvas Stage Viewport ── */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-6 select-none"
        style={{
          background:
            bgMode === "dark"
              ? "radial-gradient(circle at center, #181824 0%, #0B0B10 100%)"
              : bgMode === "light"
              ? "#f1f5f9"
              : "repeating-conic-gradient(#1c1c28 0% 25%, #14141e 0% 50%) 50% / 20px 20px",
        }}
      >
        <div className="relative rounded-xl border border-[var(--studio-border)] bg-black/60 shadow-2xl backdrop-blur-sm">
          <canvas
            ref={canvasRef}
            style={{ width: "720px", height: "420px" }}
            className="block"
          />

          {/* Bottom HUD: Live Dimensions */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-[var(--studio-border)] bg-black/70 px-3 py-1.5 text-[10px] text-[var(--studio-muted)] backdrop-blur-md">
            <span>
              Preset: <strong className="text-white">{preset.name}</strong>
            </span>
            <span>·</span>
            <span>
              Category: <strong className="text-white capitalize">{preset.category}</strong>
            </span>
            <span>·</span>
            <span>
              Layout: <strong className="text-[var(--studio-accent)]">{sizingMode}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
