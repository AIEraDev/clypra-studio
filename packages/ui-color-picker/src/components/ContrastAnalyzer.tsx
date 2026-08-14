/**
 * Clypra Contrast & Accessibility Analyzer Component
 * Real-time WCAG 2.1 & APCA contrast scoring against video background and live Color Blindness simulation.
 */

import React, { useState, useMemo } from 'react';
import type { HSVA, ColorBlindnessType } from '../types/color';
import { hsvaToRgba, parseColor, rgbaToHex } from '../utils/colorUtils';
import { calculateContrast, simulateColorBlindness } from '../utils/colorHarmonies';

export interface ContrastAnalyzerProps {
  hsva: HSVA;
  backgroundHex?: string;
  className?: string;
}

export const ContrastAnalyzer: React.FC<ContrastAnalyzerProps> = ({
  hsva,
  backgroundHex = '#18181b',
  className = '',
}) => {
  const [selectedCvd, setSelectedCvd] = useState<ColorBlindnessType>('normal');

  const foregroundRgba = useMemo(() => hsvaToRgba(hsva), [hsva]);
  const backgroundRgba = useMemo(() => {
    const parsed = parseColor(backgroundHex);
    return parsed ? hsvaToRgba(parsed) : { r: 24, g: 24, b: 27, a: 1 };
  }, [backgroundHex]);

  const contrast = useMemo(() => {
    return calculateContrast(foregroundRgba, backgroundRgba);
  }, [foregroundRgba, backgroundRgba]);

  const simulatedColorHex = useMemo(() => {
    const sim = simulateColorBlindness(foregroundRgba, selectedCvd);
    return rgbaToHex(sim);
  }, [foregroundRgba, selectedCvd]);

  const cvdOptions: Array<{ type: ColorBlindnessType; label: string; desc: string }> = [
    { type: 'normal', label: 'Normal', desc: 'Standard Vision' },
    { type: 'protanopia', label: 'Protanopia', desc: 'Red-blind (L-cone)' },
    { type: 'deuteranopia', label: 'Deuteranopia', desc: 'Green-blind (M-cone)' },
    { type: 'tritanopia', label: 'Tritanopia', desc: 'Blue-blind (S-cone)' },
    { type: 'achromatopsia', label: 'Monochrome', desc: 'Total color blindness' },
  ];

  return (
    <div className={`flex flex-col gap-3 w-full text-zinc-200 ${className}`}>
      {/* Real-time Video Contrast Gauge */}
      <div className="flex flex-col gap-2 p-2.5 bg-zinc-900/80 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400">Video Canvas Contrast</span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              contrast.wcagLevel === 'AAA'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : contrast.wcagLevel === 'AA'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {contrast.wcagRatio}:1 · {contrast.wcagLevel}
          </span>
        </div>

        {/* Live Subtitle / Text Preview over dark video backing */}
        <div
          className="w-full p-2.5 rounded border border-white/10 flex items-center justify-center text-center shadow-inner"
          style={{ backgroundColor: backgroundHex }}
        >
          <span
            className="text-xs font-medium tracking-wide transition-colors"
            style={{ color: rgbaToHex(foregroundRgba) }}
          >
            Video Caption & Overlay Preview
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span>APCA Score: <strong className="text-zinc-200 font-mono">{contrast.apcaScore} ({contrast.apcaRating})</strong></span>
          <span>Caption Safe: <strong className={contrast.isSafeForCaptions ? 'text-emerald-400' : 'text-amber-400'}>{contrast.isSafeForCaptions ? 'Yes' : 'Add Shadow'}</strong></span>
        </div>
      </div>

      {/* Color Blindness Vision Simulator */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400">Color Blindness Simulator</span>
          <span className="text-[10px] font-mono text-zinc-500">{simulatedColorHex}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {cvdOptions.map((cvd) => {
            const isActive = selectedCvd === cvd.type;
            const sim = simulateColorBlindness(foregroundRgba, cvd.type);
            const hex = rgbaToHex(sim);

            return (
              <button
                key={cvd.type}
                type="button"
                onClick={() => setSelectedCvd(cvd.type)}
                className={`flex items-center gap-2 p-1.5 rounded-md border text-left transition-all ${
                  isActive
                    ? 'bg-violet-600/20 border-violet-500 text-white'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-white/5'
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-medium text-zinc-200 truncate">{cvd.label}</span>
                  <span className="text-[9px] text-zinc-500 truncate">{cvd.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
