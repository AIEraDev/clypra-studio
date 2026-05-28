import React, { useRef, useEffect, useState } from "react";
import { GOOGLE_FONTS } from "../constants";
import { TextEffectConfig } from "../types";
import { TextEffectRenderer } from "../renderer";
import { X, ArrowLeft, ArrowRight } from "lucide-react";

interface FontCompareProps {
  config: TextEffectConfig;
  onSelectFont: (fontFamily: string) => void;
  onClose: () => void;
}

// Subcomponent to render a mini canvas for a single font
const MiniFontCanvas: React.FC<{
  fontFamily: string;
  config: TextEffectConfig;
  id: string;
}> = ({ fontFamily, config, id }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // We build a mini config scaled down
    const scale = 0.5; // Scale down for mini view
    const width = 360;
    const height = 110;

    canvas.width = width;
    canvas.height = height;

    const miniConfig: TextEffectConfig = {
      ...config,
      fontFamily,
      fontSize: Math.min(config.fontSize * scale, 48), // limit font size in mini previews so it fits beautifully
      letterSpacing: config.letterSpacing * scale,
      strokeWidth: config.strokeWidth * scale,
      bevelDepth: config.bevelDepth * scale,
      panelPaddingX: config.panelPaddingX * scale,
      panelPaddingY: config.panelPaddingY * scale,
      canvasWidth: width,
      canvasHeight: height,
      textPosX: "center",
      textPosY: "middle",
      shadowOffsetX: config.shadowOffsetX * scale,
      shadowOffsetY: config.shadowOffsetY * scale,
      shadowBlur: config.shadowBlur * scale,
      glowLayers: config.glowLayers.map((g) => ({
        ...g,
        blur: g.blur * scale,
        spread: g.spread ? g.spread * scale : undefined
      })),
      fireFlameHeight: config.fireFlameHeight ? config.fireFlameHeight * scale : undefined,
      iceIcicleHeight: config.iceIcicleHeight ? config.iceIcicleHeight * scale : undefined,
      iceSnowHeight: config.iceSnowHeight ? config.iceSnowHeight * scale : undefined,
      auraReach: config.auraReach ? config.auraReach * scale : undefined
    };

    // Make sure font is loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        TextEffectRenderer.draw(ctx, miniConfig);
      }).catch(() => {
        TextEffectRenderer.draw(ctx, miniConfig);
      });
    } else {
      TextEffectRenderer.draw(ctx, miniConfig);
    }
  }, [fontFamily, config]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className="w-full h-[110px] rounded bg-[#0E0E12] border border-[#2A2A38] shadow-inner cursor-pointer"
    />
  );
};

export const FontCompare: React.FC<FontCompareProps> = ({
  config,
  onSelectFont,
  onClose
}) => {
  const [page, setPage] = useState<number>(0);
  const itemsPerPage = 12; // 3 columns * 4 rows = 12 previews at once

  const totalPages = Math.ceil(GOOGLE_FONTS.length / itemsPerPage);
  const startIndex = page * itemsPerPage;
  const currentFonts = GOOGLE_FONTS.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  return (
    <div
      id="font-compare-overlay"
      className="absolute inset-0 bg-[#0E0E12]/95 border border-[#2A2A38] z-40 rounded-lg p-6 flex flex-col backdrop-blur-md overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A38] pb-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white font-sans">
            Google Font Comparative Matrix
          </h3>
          <p className="text-xs text-[#666677] font-sans mt-0.5">
            Click any typography specimen below to instantly apply it to your workbench.
          </p>
        </div>
        <button
          id="close-font-compare-btn"
          onClick={onClose}
          className="p-1 px-3 text-sm text-[#666677] hover:text-white border border-[#2A2A38] hover:border-[#7C6FFF] rounded transition-all duration-150 flex items-center gap-1.5 cursor-pointer bg-[#1E1E26]"
        >
          <X size={15} /> Close Comparison
        </button>
      </div>

      {/* Grid */}
      <div
        id="font-compare-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 content-start select-none"
      >
        {currentFonts.map((font) => (
          <div
            id={`font-specimen-${toKebabCase(font)}`}
            key={font}
            onClick={() => {
              onSelectFont(font);
              onClose();
            }}
            className="p-2.5 rounded-lg bg-[#1E1E26] border border-[#2A2A38] hover:border-[#7C6FFF] transition-colors group flex flex-col gap-1.5 cursor-pointer hover:shadow-[0_0_12px_rgba(124,111,255,0.15)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white font-sans group-hover:text-[#7C6FFF] transition-colors truncate">
                {font}
              </span>
              <span className="text-[9px] font-mono text-[#666677] bg-[#2A2A38]/50 px-1.5 py-0.5 rounded uppercase">
                google webfont
              </span>
            </div>
            <MiniFontCanvas
              id={`canvas-mini-${toKebabCase(font)}`}
              fontFamily={font}
              config={config}
            />
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-[#2A2A38] pt-4 mt-6">
        <span className="text-xs text-[#666677] font-mono">
          Showing specimen {startIndex + 1} - {Math.min(startIndex + itemsPerPage, GOOGLE_FONTS.length)} of {GOOGLE_FONTS.length} Google Web Fonts
        </span>

        <div className="flex items-center gap-2">
          <button
            id="font-compare-prev"
            disabled={page === 0}
            onClick={handlePrev}
            className={`p-1.5 px-3 rounded text-xs flex items-center gap-1 border border-[#2A2A38] font-sans transition-all cursor-pointer ${
              page === 0
                ? "text-gray-600 border-gray-800 bg-transparent cursor-not-allowed"
                : "text-white bg-[#1E1E26] hover:bg-[#2A2A38]"
            }`}
          >
            <ArrowLeft size={14} /> Previous Specimen
          </button>
          
          <span className="text-xs font-mono text-[#7C6FFF] px-2">
            Page {page + 1} / {totalPages}
          </span>

          <button
            id="font-compare-next"
            disabled={page === totalPages - 1}
            onClick={handleNext}
            className={`p-1.5 px-3 rounded text-xs flex items-center gap-1 border border-[#2A2A38] font-sans transition-all cursor-pointer ${
              page === totalPages - 1
                ? "text-gray-600 border-gray-800 bg-transparent cursor-not-allowed"
                : "text-white bg-[#1E1E26] hover:bg-[#2A2A38]"
            }`}
          >
            Next Specimen <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple utility duplicated to isolate highlight/formatting code dependencies
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}
