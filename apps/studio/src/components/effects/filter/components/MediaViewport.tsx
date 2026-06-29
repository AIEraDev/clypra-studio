import React from "react";
import { Eye, EyeOff, Undo, Download, Film, Image as ImageIcon, Compass, Pause, Play } from "lucide-react";
import { FilterPreset } from "../types";

interface MediaViewportProps {
  mediaUrl: string | undefined;
  isVideo: boolean;
  mediaMetadata: { width: number; height: number; duration?: number } | null;
  isPlaying: boolean;
  currentTime: number;
  showSplitComparison: boolean;
  setShowSplitComparison: (show: boolean | ((prev: boolean) => boolean)) => void;
  splitPosition: number;
  selectedFilter: FilterPreset | null;
  intensity: number;
  pixiCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  handleVideoMetadataLoaded: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  handleVideoSeeked: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  handlePlayPause: () => void;
  handleSeek: (val: number) => void;
  handleResetAll: () => void;
  exportFrame: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
}

export const MediaViewport: React.FC<MediaViewportProps> = ({
  mediaUrl,
  isVideo,
  mediaMetadata,
  isPlaying,
  currentTime,
  showSplitComparison,
  setShowSplitComparison,
  splitPosition,
  selectedFilter,
  intensity,
  pixiCanvasRef,
  containerRef,
  videoRef,
  handleVideoMetadataLoaded,
  handleVideoSeeked,
  handlePlayPause,
  handleSeek,
  handleResetAll,
  exportFrame,
  handleImageUpload,
  handleVideoUpload,
  handleMouseDown,
}) => {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0B0B0F] overflow-hidden">
      {/* Main Toolbar */}
      <div className="h-14 border-b border-[#1A1A24] px-4 flex items-center justify-between shrink-0 bg-[#0E0E14]/70 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-wider text-white">Viewer</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-3">
          {mediaUrl && (
            <>
              {/* Draggable Split Switch */}
              <button
                onClick={() => setShowSplitComparison((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${showSplitComparison ? "bg-[#7C6FFF]/15 border-[#7C6FFF]/40 text-[#A49BFF]" : "bg-[#181824] border-[#22222F] text-[#8A8A99] hover:text-white"}`}
              >
                {showSplitComparison ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>Split Comparison</span>
              </button>

              {/* Reset button */}
              <button
                onClick={handleResetAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181824] hover:bg-[#1E1E2D] border border-[#22222F] hover:border-[#323247] rounded-md text-[11px] font-medium text-[#8A8A99] hover:text-white transition-colors cursor-pointer"
              >
                <Undo size={13} />
                <span>Reset All</span>
              </button>

              {/* Export button */}
              <button
                onClick={exportFrame}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181824] hover:bg-[#1E1E2D] border border-[#22222F] hover:border-[#323247] rounded-md text-[11px] font-medium text-[#8A8A99] hover:text-white transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Export Frame</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Canvas Workspace Viewport Area */}
      <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(28,26,45,0.4)_0%,transparent_70%)]">
        {mediaUrl ? (
          <div
            ref={containerRef}
            className="relative inline-block max-h-full max-w-full rounded-xl overflow-hidden shadow-2xl border border-[#22222F] checkerboard"
            onMouseMove={(e) => {}} // Handled by parent onMouseMove on container
            onMouseUp={(e) => {}}
            onMouseLeave={(e) => {}}
            onTouchMove={(e) => {}}
            onTouchEnd={(e) => {}}
          >
            <canvas
              ref={pixiCanvasRef}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "calc(100vh - 200px)",
                width: "auto",
                height: "auto",
              }}
              className="select-none pointer-events-none"
            />

            {mediaUrl && isVideo && (
              <video
                ref={videoRef}
                src={mediaUrl}
                className="hidden"
                preload="auto"
                playsInline
                muted
                onLoadedMetadata={handleVideoMetadataLoaded}
                onSeeked={handleVideoSeeked}
              />
            )}

            {/* Slider Drag Overlay */}
            {showSplitComparison && (
              <>
                {/* Draggable Divider line */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize select-none pointer-events-auto"
                  style={{ left: `${splitPosition}%` }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                >
                  {/* Glowing circular handle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-black shadow-2xl border border-gray-400/30 flex items-center justify-center font-bold text-xs select-none hover:scale-110 active:scale-95 transition-all cursor-ew-resize">
                    ↔
                  </div>
                </div>

                {/* Before / After labels */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border border-white/5 pointer-events-none select-none">
                  Before
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border border-white/5 pointer-events-none select-none">
                  After
                </div>
              </>
            )}

            {/* Current Active Preset Overlay badge */}
            {selectedFilter && (
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-[#E1E1E6] px-3 py-1.5 rounded-lg border border-white/5 text-[10px] pointer-events-none select-none">
                <div className="font-bold">{selectedFilter.name}</div>
                <div className="text-[#8A8A99] font-mono text-[9px] scale-90 -ml-1 mt-0.5">
                  Strength: {intensity}%
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Styled Import drop zone placeholder */
          <div className="max-w-md w-full p-8 rounded-2xl border border-[#22222F] bg-[#111117]/60 backdrop-blur-md text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-[#7C6FFF]/20 to-purple-500/20 border border-[#7C6FFF]/25 flex items-center justify-center mx-auto text-[#7C6FFF]">
              <Compass size={28} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Clypra Studio Canvas</h3>
              <p className="text-xs text-[#8A8A99] max-w-xs mx-auto leading-relaxed">
                Import a video or image file to start grading. You can apply stunning cinematic presets, adjust specific tones, or generate custom looks using AI.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <label className="flex items-center gap-2 py-2 px-4 bg-[#7C6FFF] hover:bg-[#685BEA] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#7C6FFF]/10 cursor-pointer transition-colors">
                <Film size={14} />
                <span>Import Video</span>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
              <label className="flex items-center gap-2 py-2 px-4 bg-[#1E1E2A] hover:bg-[#282837] border border-[#2A2A3D] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                <ImageIcon size={14} />
                <span>Import Image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Video Scrubber Timeline */}
      {isVideo && mediaUrl && (
        <div className="h-16 border-t border-[#1A1A24] bg-[#0E0E14] px-4 flex items-center gap-4 shrink-0">
          <button
            onClick={handlePlayPause}
            className="w-8 h-8 rounded-full bg-[#7C6FFF] hover:bg-[#685BEA] flex items-center justify-center text-white shrink-0 shadow transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
          </button>

          {/* Scrubber slider track */}
          <div className="flex-1 relative group py-2">
            <input
              type="range"
              min="0"
              max={mediaMetadata?.duration || 0}
              step="0.05"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#1E1E2A] rounded-lg appearance-none cursor-pointer outline-none focus:outline-none accent-[#7C6FFF]"
            />
          </div>

          {/* Time counters */}
          <div className="text-[11px] font-mono text-[#8A8A99] shrink-0 select-none">
            <span className="text-white">{currentTime.toFixed(2)}s</span>
            <span className="opacity-50"> / </span>
            <span>{mediaMetadata?.duration?.toFixed(2) || "0.00"}s</span>
          </div>
        </div>
      )}
    </div>
  );
};
