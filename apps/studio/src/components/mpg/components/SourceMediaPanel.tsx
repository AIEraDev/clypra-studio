import React, { useRef } from "react";
import { ImageIcon, Upload } from "lucide-react";
import type { SourceMedia } from "../types";
import { ACCEPTED_IMAGE_TYPES } from "../sourceImage";

interface SourceMediaPanelProps {
  sources: SourceMedia[];
  selectedId: string;
  onSelect: (id: string) => void;
  onUpload: (file: File) => void;
}

export const SourceMediaPanel: React.FC<SourceMediaPanelProps> = ({
  sources,
  selectedId,
  onSelect,
  onUpload,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Source Media</label>

      <div className="space-y-2">
        {sources.map((src) => (
          <button
            key={src.id}
            type="button"
            onClick={() => onSelect(src.id)}
            className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg border text-sm transition-all ${
              selectedId === src.id
                ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white"
                : "bg-[#1E1E24]/40 border-[#22222E] text-gray-400 hover:text-white hover:border-[#3A3A4A]"
            }`}
          >
            <ImageIcon size={16} className="shrink-0" />
            <span className="truncate">{src.name}</span>
            {src.isCustom && <span className="text-[10px] text-[#7C6FFF] ml-auto">Custom</span>}
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#33334A] text-xs text-gray-400 hover:text-white hover:border-[#7C6FFF]/50 transition-colors"
      >
        <Upload size={14} />
        Upload test image
      </button>

      <p className="text-[10px] text-gray-600 leading-relaxed">
        Upload any image (JPEG, PNG, WebP, GIF, SVG…)
      </p>
    </div>
  );
};
