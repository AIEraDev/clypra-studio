/**
 * @clypra/ui-color-picker
 *
 * Universal Color System Platform for Clypra products.
 * Built for React 19 + TypeScript with shadcn foundation, strict typing,
 * multi-stop gradients, 3-way video color wheels, and real-time APCA/WCAG contrast analyzer.
 *
 * @packageDocumentation
 */

// Components
export {
  ClypraColorPicker,
  ColorTrigger,
  SaturationBrightness,
  HueSlider,
  AlphaSlider,
  ColorInputs,
  PresetGrid,
  GradientEditor,
  generateCssGradient,
  ColorGradingWheels,
  ColorWheel,
  ContrastAnalyzer,
  HarmoniesView,
  TokenBindingSelector,
  DEFAULT_CLYPRA_TOKENS,
} from './components';

export type {
  ColorTriggerProps,
  SaturationBrightnessProps,
  HueSliderProps,
  AlphaSliderProps,
  ColorInputsProps,
  PresetGridProps,
  GradientEditorProps,
  ColorGradingWheelsProps,
  ColorWheelProps,
  ContrastAnalyzerProps,
  HarmoniesViewProps,
  TokenBindingSelectorProps,
} from './components';

// Types
export type {
  RGBA,
  HSLA,
  HSVA,
  OKLCH,
  ColorFormat,
  ColorSize,
  ColorPickerMode,
  GradientType,
  GradientInterpolation,
  GradientStop,
  GradientValue,
  WheelColorGrading,
  ThreeWayColorGrading,
  ColorBlindnessType,
  ColorHarmonies,
  ContrastResult,
  ColorToken,
  ClypraColorPickerProps,
  ClypraColorPickerHandle,
  ColorHistoryState,
} from './types/color';

// Pure Color Math Utilities
export {
  clamp,
  round,
  hexToRgba,
  rgbaToHex,
  rgbaToHsla,
  hslaToRgba,
  rgbaToHsva,
  hsvaToRgba,
  hsvaToHsla,
  hslaToHsva,
  hsvaToHex,
  hsvaToCssRgb,
  parseColor,
  formatColor,
  isValidColor,
  getRelativeLuminance,
  getContrastColor,
} from './utils/colorUtils';

// Color Harmonies, Naming & Vision Deficiencies
export {
  generateHarmonies,
  simulateColorBlindness,
  getColorName,
  calculateContrast,
} from './utils/colorHarmonies';

// Color Validation Utilities
export {
  isValidHex,
  normalizeHex,
  validateChannelValue,
  getChannelsFromHsva,
  parseChannelsToHsva,
  validateAndParseInput,
} from './utils/colorValidation';

// Hooks
export { useColorDrag } from './hooks/useColorDrag';
export type { UseColorDragOptions, UseColorDragReturn } from './hooks/useColorDrag';

export { useColorFormat } from './hooks/useColorFormat';
export type { UseColorFormatOptions, UseColorFormatReturn } from './hooks/useColorFormat';

export {
  useColorHistory,
  DEFAULT_PRESET_COLORS,
  DEFAULT_RECENT_COLORS,
} from './hooks/useColorHistory';
export type { UseColorHistoryOptions, UseColorHistoryReturn } from './hooks/useColorHistory';

// Zustand Store Slice
export {
  createColorPickerSlice,
  useColorPickerStore,
} from './store/colorPickerSlice';
export type { ColorPickerSlice } from './store/colorPickerSlice';
