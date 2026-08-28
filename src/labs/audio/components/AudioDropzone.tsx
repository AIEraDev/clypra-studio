import React, { useRef, useState } from "react";
import { UploadCloud, FileAudio, CheckCircle2, X } from "lucide-react";

interface AudioDropzoneProps {
  audioFile: File | null;
  audioUrlOverride: string | null;
  onFileSelect: (file: File | null) => void;
}

export function AudioDropzone({
  audioFile,
  audioUrlOverride,
  onFileSelect,
}: AudioDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const acceptedFormats = ["MP3", "WAV", "M4A", "AAC", "FLAC", "OGG"];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#88889C]">
          1. Ingest Audio Source <span className="text-teal-400">*</span>
        </label>
        {audioFile && (
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

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-teal-400 bg-teal-500/10 scale-[1.01]"
            : audioFile || audioUrlOverride
            ? "border-teal-500/40 bg-[#0E0E18]"
            : "border-[#28283C] bg-[#0A0A10] hover:border-teal-500/50 hover:bg-[#0E0E16]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/flac,audio/ogg,.mp3,.wav,.m4a,.aac,.flac,.ogg"
          onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />

        {audioFile ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/15 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
              <CheckCircle2 size={24} />
            </div>
            <div className="max-w-[240px] truncate font-medium text-xs text-white">
              {audioFile.name}
            </div>
            <div className="text-[10px] text-teal-300 font-mono">
              {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • {audioFile.type || "audio file"}
            </div>
            <span className="mt-1 text-[10px] text-[#7A7A8E] hover:text-white underline">
              Click to replace file
            </span>
          </div>
        ) : audioUrlOverride ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/15 text-teal-300">
              <FileAudio size={24} />
            </div>
            <div className="font-medium text-xs text-white">Remote Sample Loaded</div>
            <span className="text-[10px] text-[#7A7A8E] hover:text-white underline">
              Click or drop local file to replace
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#252536] bg-[#12121C] text-gray-400 group-hover:text-teal-400 transition-colors">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                Drag and drop audio file here
              </p>
              <p className="text-[10px] text-[#7A7A8E] mt-0.5">
                or click to browse local files
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Format pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] text-[#66667C]">Supports:</span>
        {acceptedFormats.map((fmt) => (
          <span
            key={fmt}
            className="rounded border border-[#242434] bg-[#0E0E16] px-1.5 py-0.5 text-[9px] font-mono text-[#8A8A9E]"
          >
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
}
