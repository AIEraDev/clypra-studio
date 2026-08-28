import React, { useState } from "react";
import {
  Search,
  Play,
  Pause,
  Clock,
  Disc,
  Repeat,
  Copy,
  Check,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { AUDIO_CATEGORIES, type AudioAsset } from "../types";

interface AudioCatalogBrowserProps {
  tracks: AudioAsset[];
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string;
  durationFilter: "all" | "short" | "medium" | "long";
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onDurationFilterChange: (dur: "all" | "short" | "medium" | "long") => void;
  onLoadIntoStudio: (track: AudioAsset) => void;
  onRefresh: () => void;
}

export function AudioCatalogBrowser({
  tracks,
  isLoading,
  searchQuery,
  selectedCategory,
  durationFilter,
  onSearchChange,
  onCategoryChange,
  onDurationFilterChange,
  onLoadIntoStudio,
  onRefresh,
}: AudioCatalogBrowserProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const audioElementsRef = React.useRef<Record<string, HTMLAudioElement>>({});

  const handleTogglePlay = (track: AudioAsset) => {
    // Stop currently playing audio if different
    if (playingId && playingId !== track.id) {
      const prev = audioElementsRef.current[playingId];
      if (prev) {
        prev.pause();
        prev.currentTime = 0;
      }
    }

    let audio = audioElementsRef.current[track.id];
    if (!audio) {
      audio = new Audio(track.audioUrl);
      audio.onended = () => setPlayingId(null);
      audioElementsRef.current[track.id] = audio;
    }

    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.play().catch(() => {
        toast.error("Audio stream playback failed");
        setPlayingId(null);
      });
      setPlayingId(track.id);
    }
  };

  const handleCopyLink = (track: AudioAsset) => {
    navigator.clipboard.writeText(track.audioUrl);
    setCopiedId(track.id);
    toast.success("Audio stream URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 p-6">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#20202E] bg-[#0E0E18] p-4 shadow-xl">
        {/* Search Bar */}
        <div className="relative min-w-[260px] flex-1">
          <Search size={15} className="absolute left-3.5 top-3 text-[#5A5A72]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search audio by title, genre, creator, or tags..."
            className="w-full rounded-xl border border-[#262638] bg-[#0A0A12] pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#55556C] focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Duration Segmented Filter */}
        <div className="flex items-center rounded-xl border border-[#222232] bg-[#0A0A12] p-1">
          {[
            { id: "all", label: "All Durations" },
            { id: "short", label: "SFX (<5s)" },
            { id: "medium", label: "Loops (5-30s)" },
            { id: "long", label: "Full (>30s)" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onDurationFilterChange(item.id as "all" | "short" | "medium" | "long")
              }
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                durationFilter === item.id
                  ? "bg-[#1C1C2A] text-white shadow-xs"
                  : "text-[#7A7A8E] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-xl border border-[#242436] bg-[#12121D] px-3 py-2 text-xs text-[#8A8A9E] hover:border-teal-500/40 hover:text-white transition-colors"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin text-teal-400" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
            selectedCategory === "all"
              ? "border-teal-500/50 bg-teal-500/15 text-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.2)]"
              : "border-[#20202E] bg-[#0E0E18] text-[#808096] hover:border-[#353548] hover:text-white"
          }`}
        >
          All Genres ({tracks.length})
        </button>
        {AUDIO_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`rounded-lg border px-3 py-1 text-xs font-semibold capitalize transition-all ${
              selectedCategory === cat
                ? "border-teal-500/50 bg-teal-500/15 text-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.2)]"
                : "border-[#20202E] bg-[#0E0E18] text-[#808096] hover:border-[#353548] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Audio Track Grid */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-[#1E1E2C] bg-[#0A0A12] text-[#8A8A9E]">
          <RefreshCw size={24} className="animate-spin text-teal-400 mb-2" />
          <p className="text-xs">Fetching Clypra audio index...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-[#1E1E2C] bg-[#0A0A12] text-[#8A8A9E]">
          <Disc size={32} className="text-[#454558] mb-2" />
          <p className="text-sm font-semibold text-white">No audio tracks matched your filter</p>
          <p className="text-xs text-[#707086] mt-1">Try broadening your search term or category</p>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onCategoryChange("all");
              onDurationFilterChange("all");
            }}
            className="mt-3 rounded-lg border border-[#28283C] bg-[#141420] px-3 py-1.5 text-xs text-teal-300 hover:border-teal-500/40"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tracks.map((track) => {
            const isTrackPlaying = playingId === track.id;
            return (
              <div
                key={track.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#222232] bg-[#0E0E18] p-4 transition-all hover:border-teal-500/40 hover:bg-[#12121F] hover:shadow-xl"
              >
                <div>
                  {/* Top card header: artwork & play transport */}
                  <div className="flex items-start gap-3.5">
                    {/* Vinyl / Cover Art */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#2A2A3E] bg-[#141422] shadow-inner">
                      {track.coverArtUrl ? (
                        <img
                          src={track.coverArtUrl}
                          alt={track.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-teal-400/80 bg-linear-to-br from-[#1A1A2A] to-[#0E0E16]">
                          <Disc
                            size={22}
                            className={isTrackPlaying ? "animate-[spin_4s_linear_infinite]" : ""}
                          />
                        </div>
                      )}

                      {/* Play overlay button on artwork */}
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(track)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity hover:bg-black/60"
                        title={isTrackPlaying ? "Pause preview" : "Play preview"}
                      >
                        {isTrackPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                      </button>
                    </div>

                    {/* Metadata titles */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-teal-300">
                          {track.category}
                        </span>
                        {track.loopable && (
                          <span className="flex items-center gap-0.5 rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300">
                            <Repeat size={10} />
                            <span>Loop</span>
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 truncate text-xs font-bold text-white group-hover:text-teal-200 transition-colors">
                        {track.name}
                      </h4>
                      <p className="truncate text-[11px] text-[#8A8A9E]">
                        by {track.author || "Clypra Creator"}
                      </p>
                    </div>
                  </div>

                  {/* Description preview */}
                  {track.description && (
                    <p className="mt-3 line-clamp-2 text-[11px] text-[#7A7A90] leading-relaxed">
                      {track.description}
                    </p>
                  )}

                  {/* Tags */}
                  {track.tags && track.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {track.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-[#1E1E2C] bg-[#0A0A10] px-1.5 py-0.5 text-[9px] text-[#7A7A8E]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {track.tags.length > 4 && (
                        <span className="text-[9px] text-[#55556E] self-center">
                          +{track.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-[#1A1A28] pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8A8A9E]">
                    <Clock size={12} className="text-teal-400" />
                    <span>{track.duration > 0 ? `${track.duration}s` : "--"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Copy audio link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(track)}
                      className="rounded-lg border border-[#242436] bg-[#12121C] p-1.5 text-[#8A8A9E] hover:border-teal-500/40 hover:text-white transition-colors"
                      title="Copy stream link"
                    >
                      {copiedId === track.id ? (
                        <Check size={13} className="text-teal-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>

                    {/* Load into Studio Button */}
                    <button
                      type="button"
                      onClick={() => onLoadIntoStudio(track)}
                      className="flex items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-300 hover:bg-teal-500/20 hover:border-teal-500/50 transition-colors"
                      title="Load track metadata into Studio authoring workbench"
                    >
                      <SlidersHorizontal size={12} />
                      <span>Open in Studio</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
