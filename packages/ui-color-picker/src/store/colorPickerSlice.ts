/**
 * Clypra Color Picker Zustand Store Slice
 * Follows Clypra's Zustand architecture for UI state slicing.
 */

import { create, type StateCreator } from 'zustand';
import type { ColorFormat } from '../types/color';
import { DEFAULT_PRESET_COLORS, DEFAULT_RECENT_COLORS } from '../hooks/useColorHistory';
import { normalizeHex } from '../utils/colorValidation';

export interface ColorPickerSlice {
  colorPickerFormat: ColorFormat;
  colorPickerRecentColors: string[];
  colorPickerPresetColors: string[];
  isEyeDropperSupported: boolean;

  setColorPickerFormat: (format: ColorFormat) => void;
  addColorPickerRecentColor: (color: string) => void;
  addColorPickerPresetColor: (color: string) => void;
  triggerEyeDropper: () => Promise<string | null>;
}

export const createColorPickerSlice: StateCreator<ColorPickerSlice, [], [], ColorPickerSlice> = (set, get) => ({
  colorPickerFormat: 'hex',
  colorPickerRecentColors: DEFAULT_RECENT_COLORS,
  colorPickerPresetColors: DEFAULT_PRESET_COLORS,
  isEyeDropperSupported: typeof window !== 'undefined' && 'EyeDropper' in window,

  setColorPickerFormat: (format: ColorFormat) => {
    set({ colorPickerFormat: format });
  },

  addColorPickerRecentColor: (color: string) => {
    if (!color) return;
    const formatted = color.startsWith('#') ? normalizeHex(color) : color;
    const current = get().colorPickerRecentColors;
    const filtered = current.filter((c) => c.toLowerCase() !== formatted.toLowerCase());
    set({
      colorPickerRecentColors: [formatted, ...filtered].slice(0, 12),
    });
  },

  addColorPickerPresetColor: (color: string) => {
    if (!color) return;
    const formatted = color.startsWith('#') ? normalizeHex(color) : color;
    const current = get().colorPickerPresetColors;
    if (current.some((c) => c.toLowerCase() === formatted.toLowerCase())) {
      return;
    }
    set({
      colorPickerPresetColors: [...current, formatted],
    });
  },

  triggerEyeDropper: async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    // Check for native EyeDropper API (Chromium / modern browsers)
    type EyeDropperConstructor = new () => {
      open: () => Promise<{ sRGBHex: string }>;
    };

    const EyeDropperWindow = window as unknown as { EyeDropper?: EyeDropperConstructor };
    if (EyeDropperWindow.EyeDropper) {
      try {
        const eyeDropper = new EyeDropperWindow.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const hex = normalizeHex(result.sRGBHex);
          get().addColorPickerRecentColor(hex);
          return hex;
        }
      } catch {
        // User canceled eye dropper or permission denied
      }
    }
    return null;
  },
});

/**
 * Standalone Color Picker Zustand Store.
 */
export const useColorPickerStore = create<ColorPickerSlice>()((...args) => ({
  ...createColorPickerSlice(...args),
}));
