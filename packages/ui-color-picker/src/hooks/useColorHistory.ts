/**
 * Clypra Color History and Preset Management Hook
 * Maintains Recent Colors (MRU cache) and Presets with optional onSavePreset callback.
 */

import { useState, useCallback } from 'react';
import { normalizeHex } from '../utils/colorValidation';

export const DEFAULT_PRESET_COLORS: string[] = [
  '#8B5CF6', // Clypra Violet (Primary)
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#84CC16', // Lime
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#FFFFFF', // White
  '#71717A', // Zinc
  '#000000', // Black
];

export const DEFAULT_RECENT_COLORS: string[] = [
  '#8B5CF6',
  '#3B82F6',
  '#10B981',
  '#EF4444',
  '#F59E0B',
  '#FFFFFF',
];

export interface UseColorHistoryOptions {
  presetColors?: string[];
  recentColors?: string[];
  onSavePreset?: (color: string) => void;
  maxRecentCount?: number;
}

export interface UseColorHistoryReturn {
  presets: string[];
  recents: string[];
  addRecentColor: (color: string) => void;
  addPresetColor: (color: string) => void;
  canSavePreset: boolean;
}

export function useColorHistory({
  presetColors,
  recentColors,
  onSavePreset,
  maxRecentCount = 10,
}: UseColorHistoryOptions): UseColorHistoryReturn {
  const [internalPresets, setInternalPresets] = useState<string[]>(presetColors || DEFAULT_PRESET_COLORS);
  const [internalRecents, setInternalRecents] = useState<string[]>(recentColors || DEFAULT_RECENT_COLORS);

  const presets = presetColors !== undefined ? presetColors : internalPresets;
  const recents = recentColors !== undefined ? recentColors : internalRecents;

  const addRecentColor = useCallback(
    (color: string) => {
      if (!color) return;
      const formatted = color.startsWith('#') ? normalizeHex(color) : color;

      setInternalRecents((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== formatted.toLowerCase());
        return [formatted, ...filtered].slice(0, maxRecentCount);
      });
    },
    [maxRecentCount]
  );

  const addPresetColor = useCallback(
    (color: string) => {
      if (!color) return;
      const formatted = color.startsWith('#') ? normalizeHex(color) : color;

      if (onSavePreset) {
        onSavePreset(formatted);
      }

      setInternalPresets((prev) => {
        if (prev.some((c) => c.toLowerCase() === formatted.toLowerCase())) {
          return prev;
        }
        return [...prev, formatted];
      });
    },
    [onSavePreset]
  );

  return {
    presets,
    recents,
    addRecentColor,
    addPresetColor,
    canSavePreset: Boolean(onSavePreset),
  };
}
