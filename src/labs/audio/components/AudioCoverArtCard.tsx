import React, { useRef } from "react";
import { Image as ImageIcon, Upload, X, Disc } from "lucide-react";

interface AudioCoverArtCardProps {
  coverFile: File | null;
  coverPreviewUrl: string | null;
  trackTitle: string;
  trackAuthor: string;
  category: string;
  onCoverChange: (file: File | null) => void;
}

export function AudioCoverArtCard({
  coverFile,
  coverPreviewUrl,
  trackTitle,
  trackAuthor,
  category,
  onCoverChange,
}: AudioCoverArtCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCoverChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#88889C]">
          Cover Artwork <span className="text-[#55556E] font-normal lowercase">(optional)</span>
        </label>
        {coverPreviewUrl && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[10px] text-[#A0A0B4] hover:text-red-400 transition-colors"
          >
            <X size={12} />
            <span>Remove</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => onCoverChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      <div
        onClick={() => inputRef.current?.click()}
        className="group relative flex cursor-pointer overflow-hidden rounded-xl border border-[#252536] bg-[#0E0E18] p-3 transition-all hover:border-teal-500/40"
      >
        <div className="flex items-center gap-3.5 w-full">
          {/* Square Artwork Preview */}
          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg border border-[#2A2A3E] bg-[#141420] shadow-inner">
            {coverPreviewUrl ? (
              <img
                src={coverPreviewUrl}
                alt="Track Cover"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-[#1E1E2E] to-[#12121C] text-teal-400/70">
                <Disc size={26} className="animate-[spin_8s_linear_infinite]" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={16} className="text-white" />
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-white">
              {trackTitle || "Untitled Audio"}
            </div>
            <div className="truncate text-[11px] text-[#8A8A9E]">
              {trackAuthor || "Unknown Creator"}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded bg-[#1C1C2C] px-1.5 py-0.5 text-[9px] font-mono text-teal-300">
                {category || "music"}
              </span>
              <span className="text-[10px] text-[#6A6A80] group-hover:text-teal-400 transition-colors">
                {coverFile ? coverFile.name : "Click to upload PNG/JPG"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
