/**
 * Clypra Preset & Recent Colors Component
 * Explicitly sized circular swatches with hover scaling, active rings, and dual horizontal trays.
 */

import React from 'react';
import { parseColor, hsvaToHex } from '../utils/colorUtils';

export interface PresetGridProps {
  presets?: string[];
  recents?: string[];
  currentColorHex: string;
  onSelectColor: (color: string) => void;
  onSavePreset?: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

export const PresetGrid: React.FC<PresetGridProps> = ({
  presets = [],
  recents = [],
  currentColorHex,
  onSelectColor,
  onSavePreset,
  disabled = false,
  className = '',
}) => {
  const isSelected = (color: string) => {
    const parsed1 = parseColor(color);
    const parsed2 = parseColor(currentColorHex);
    if (!parsed1 || !parsed2) return false;
    return hsvaToHex(parsed1).toLowerCase() === hsvaToHex(parsed2).toLowerCase();
  };

  return (
    <div className={`flex flex-col gap-2 w-full border-t border-white/10 pt-2 flex-shrink-0 ${className}`}>
      {/* Presets Row */}
      {presets.length > 0 && (
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 shrink-0 w-12">Preset</span>
          <div
            className="flex items-center gap-1.5 flex-1 overflow-x-auto clypra-horizontal-scroll py-0.5"
            role="group"
            aria-label="Preset color swatches"
          >
            {presets.map((color, index) => {
              const active = isSelected(color);
              return (
                <button
                  key={`preset-${index}-${color}`}
                  type="button"
                  disabled={disabled}
                  title={color}
                  aria-label={`Select preset color ${color}`}
                  onClick={() => onSelectColor(color)}
                  className={`clypra-swatch clypra-checkerboard-sm ${
                    active ? 'ring-2 ring-violet-500 scale-110 shadow-md shadow-violet-500/40' : ''
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
                >
                  <div
                    className="absolute inset-0 w-full h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </button>
              );
            })}
          </div>

          {onSavePreset && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSavePreset(currentColorHex)}
              title="Add current color to presets"
              className="flex-shrink-0 p-1 rounded-md border border-white/10 hover:border-violet-500/50 bg-white/[0.04] hover:bg-violet-500/20 text-zinc-400 hover:text-violet-300 transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Recent Colors Row */}
      {recents.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 shrink-0 w-12">Recent</span>
          <div
            className="clypra-horizontal-scroll flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1"
            role="group"
            aria-label="Recent colors"
          >
            {recents.map((color, index) => {
              const active = isSelected(color);
              return (
                <button
                  key={`recent-${index}-${color}`}
                  type="button"
                  disabled={disabled}
                  title={color}
                  aria-label={`Select recent color ${color}`}
                  onClick={() => onSelectColor(color)}
                  className={`clypra-swatch clypra-checkerboard-sm ${
                    active ? 'ring-2 ring-violet-500 scale-110 shadow-md shadow-violet-500/40' : ''
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
                >
                  <div
                    className="absolute inset-0 w-full h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
