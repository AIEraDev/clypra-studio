import React from "react";
import {
  Music2,
  Library,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { AudioLabViewMode, DemoSampleTrack } from "../types";

export const DEMO_PRESET_TRACKS: DemoSampleTrack[] = [
  {
    id: "cinematic-deep-impact-riser",
    name: "Cinematic Deep Impact Riser",
    category: "cinematic",
    author: "Clypra Audio Labs",
    duration: 6.4,
    bpm: 110,
    loopable: false,
    tags: ["cinematic", "trailer", "impact", "riser", "dramatic"],
    description: "Sub-bass rumble crescendo peaking in a clean cinematic trailer impact.",
    license: {
      type: "cc0",
      attributionRequired: false,
    },
    source: {
      provider: "Clypra Studio Archive",
      url: "https://clypra.abdulkabirmusa.com/assets/audio/cinematic-impact.mp3",
    },
    audioUrl: "https://raw.githubusercontent.com/AIEraDev/clypra-api/main/data/audio/transition/woosh-long-cinematic.wav",
  },
  {
    id: "lofi-midnight-study-beat",
    name: "Lo-Fi Midnight Study Beat",
    category: "lo-fi",
    author: "Clypra Beatmakers",
    duration: 13.59,
    bpm: 84,
    loopable: true,
    tags: ["lo-fi", "chill", "study", "beats", "vinyl", "warm"],
    description: "Gentle chillhop loop with vinyl crackle, electric piano chords, and a relaxed groove.",
    license: {
      type: "royalty-free",
      attributionRequired: true,
    },
    source: {
      provider: "Clypra Open Commons",
      url: "https://clypra.abdulkabirmusa.com/assets/audio/midnight-beat.mp3",
    },
    audioUrl: "https://raw.githubusercontent.com/AIEraDev/clypra-api/main/data/audio/music/wii-u-song-pou-song-loop.wav",
  },
  {
    id: "ambient-aurora-drone",
    name: "Ambient Aurora Space Drone",
    category: "ambient",
    author: "Soundscape Studio",
    duration: 33.3,
    bpm: 60,
    loopable: true,
    tags: ["ambient", "drone", "space", "meditation", "synth"],
    description: "Expansive ethereal background pad engineered for dialogue beds and documentary montage.",
    license: {
      type: "public-domain",
      attributionRequired: false,
    },
    source: {
      provider: "Freesound Public Commons",
      url: "https://freesound.org/people/crokomoko/sounds/833509/",
    },
    audioUrl: "https://raw.githubusercontent.com/AIEraDev/clypra-api/main/data/audio/chill/stay-with-me-please-i-need-you-here.wav",
  },
];

interface AudioHeaderProps {
  viewMode: AudioLabViewMode;
  onViewModeChange: (mode: AudioLabViewMode) => void;
  catalogCount: number;
  onLoadSample: (sample: DemoSampleTrack) => void;
  onReset: () => void;
}

export function AudioHeader({
  viewMode,
  onViewModeChange,
  catalogCount,
  onLoadSample,
  onReset,
}: AudioHeaderProps) {
  return (
    <header className="border-b border-[#1E1E2A] bg-[#0E0E16]/80 px-6 py-3.5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <Music2 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">Audio Lab</h1>
              <span className="rounded-md border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-300">
                Studio Edition
              </span>
            </div>
            <p className="text-[11px] text-[#88889C]">
              Interactive waveform inspection, metadata synthesis, and direct R2 delivery
            </p>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center rounded-xl border border-[#232332] bg-[#0A0A10] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => onViewModeChange("studio")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "studio"
                ? "bg-[#181824] text-white shadow-sm ring-1 ring-white/10"
                : "text-[#88889C] hover:text-white"
            }`}
          >
            <SlidersHorizontal size={14} className={viewMode === "studio" ? "text-teal-400" : ""} />
            <span>Studio Authoring</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("catalog")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "catalog"
                ? "bg-[#181824] text-white shadow-sm ring-1 ring-white/10"
                : "text-[#88889C] hover:text-white"
            }`}
          >
            <Library size={14} className={viewMode === "catalog" ? "text-purple-400" : ""} />
            <span>Catalog Explorer</span>
            {catalogCount > 0 && (
              <span className="rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-mono font-medium text-purple-300">
                {catalogCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          {viewMode === "studio" && (
            <>
              {/* Quick load sample selector */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-[#28283A] bg-[#12121B] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-teal-500/40 hover:bg-[#181824] hover:text-white"
                  title="Load a pre-configured sample sound to test"
                >
                  <Sparkles size={13} className="text-teal-400" />
                  <span>Load Sample</span>
                </button>
                <div className="absolute right-0 top-full z-30 mt-1 hidden w-56 rounded-xl border border-[#2A2A3E] bg-[#111119] p-1.5 shadow-2xl group-hover:block">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#66667C]">
                    Presets
                  </p>
                  {DEMO_PRESET_TRACKS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => onLoadSample(sample)}
                      className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-300 transition-colors hover:bg-teal-500/10 hover:text-teal-200"
                    >
                      <Wand2 size={12} className="mt-0.5 shrink-0 text-teal-400" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{sample.name}</div>
                        <div className="text-[10px] text-[#7A7A8E]">
                          {sample.category} • {sample.duration}s
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onReset}
                title="Clear current track and reset form"
                className="flex items-center gap-1.5 rounded-lg border border-[#28283A] bg-[#12121B] px-2.5 py-1.5 text-xs text-[#8A8A9E] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
