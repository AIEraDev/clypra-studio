/**
 * Clypra Color Harmonies Component
 * Automatic generation of Complementary, Analogous, Triadic, Tetradic, and Monochromatic palettes.
 */

import React, { useMemo } from 'react';
import type { HSVA } from '../types/color';
import { generateHarmonies } from '../utils/colorHarmonies';

export interface HarmoniesViewProps {
  hsva: HSVA;
  onSelectColor: (hex: string) => void;
  disabled?: boolean;
  className?: string;
}

export const HarmoniesView: React.FC<HarmoniesViewProps> = ({
  hsva,
  onSelectColor,
  disabled = false,
  className = '',
}) => {
  const harmonies = useMemo(() => generateHarmonies(hsva), [hsva]);

  return (
    <div className={`flex flex-col gap-2.5 w-full text-zinc-300 ${className}`}>
      {/* Complementary */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400">Complementary (180°)</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectColor(harmonies.complementary)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-white/10 hover:border-violet-500 transition-colors cursor-pointer"
        >
          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: harmonies.complementary }} />
          <span className="text-[10px] font-mono text-zinc-200">{harmonies.complementary}</span>
        </button>
      </div>

      {/* Triadic */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400">Triadic (120°)</span>
        <div className="flex items-center gap-1.5">
          {harmonies.triadic.map((col, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              title={col}
              onClick={() => onSelectColor(col)}
              className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-sm"
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
      </div>

      {/* Analogous */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400">Analogous (±30°)</span>
        <div className="flex items-center gap-1.5">
          {harmonies.analogous.map((col, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              title={col}
              onClick={() => onSelectColor(col)}
              className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-sm"
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
      </div>

      {/* Monochromatic */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400">Monochromatic Tints</span>
        <div className="flex items-center gap-1.5">
          {harmonies.monochromatic.map((col, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              title={col}
              onClick={() => onSelectColor(col)}
              className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-sm"
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
