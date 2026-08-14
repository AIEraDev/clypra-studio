/**
 * Clypra Color Picker Type Definitions
 * Strict TypeScript - No `any` types allowed.
 */

export interface RGBA {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
  a: number; // 0 - 1
}

export interface HSLA {
  h: number; // 0 - 360 (degrees)
  s: number; // 0 - 100 (%)
  l: number; // 0 - 100 (%)
  a: number; // 0 - 1
}

export interface HSVA {
  h: number; // 0 - 360 (degrees)
  s: number; // 0 - 100 (%)
  v: number; // 0 - 100 (%) (value / brightness)
  a: number; // 0 - 1
}

export interface OKLCH {
  l: number; // 0 - 1 (lightness)
  c: number; // 0 - 0.4 (chroma)
  h: number; // 0 - 360 (hue)
  a: number; // 0 - 1
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'oklch';

export type ColorSize = 'sm' | 'md' | 'lg';

export type ColorPickerMode = 'solid' | 'wheel' | 'gradient' | 'grading' | 'palette' | 'accessibility';

export type GradientType = 'linear' | 'radial' | 'conic';

export type GradientInterpolation = 'oklab' | 'srgb';

export interface GradientStop {
  id: string;
  position: number; // 0 - 1 (0% to 100%)
  color: string; // Hex / RGBA formatted string
}

export interface GradientValue {
  type: GradientType;
  angle: number; // 0 - 360 degrees
  stops: GradientStop[];
  interpolation: GradientInterpolation;
}

export interface WheelColorGrading {
  h: number; // 0 - 360
  s: number; // 0 - 100
  luminance: number; // -100 to +100 offset
}

export interface ThreeWayColorGrading {
  lift: WheelColorGrading; // Shadows
  gamma: WheelColorGrading; // Midtones
  gain: WheelColorGrading; // Highlights
}

export type ColorBlindnessType = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface ColorHarmonies {
  complementary: string;
  analogous: [string, string];
  triadic: [string, string];
  tetradic: [string, string, string];
  splitComplementary: [string, string];
  monochromatic: [string, string, string];
}

export interface ContrastResult {
  wcagRatio: number;
  wcagLevel: 'AAA' | 'AA' | 'AA-Large' | 'Fail';
  apcaScore: number;
  apcaRating: 'Optimal' | 'Good' | 'Fair' | 'Poor';
  isSafeForCaptions: boolean;
}

export interface ColorToken {
  id: string;
  name: string;
  variable: string;
  value: string;
  category?: string;
}

export interface ClypraColorPickerHandle {
  getFormat: () => ColorFormat;
  setFormat: (format: ColorFormat) => void;
  getValue: () => string;
  getGradient: () => GradientValue;
  setGradient: (gradient: GradientValue) => void;
  getMode: () => ColorPickerMode;
  setMode: (mode: ColorPickerMode) => void;
  undo: () => void;
  redo: () => void;
  focus: () => void;
}

export interface ClypraColorPickerProps {
  /**
   * Controlled color value (hex, rgba, hsla, gradient CSS string, etc.).
   */
  value?: string;

  /**
   * Default color value for uncontrolled mode.
   * Defaults to '#8b5cf6' (Clypra Violet).
   */
  defaultValue?: string;

  /**
   * Real-time color change callback.
   * During drag operations, this is throttled at 16ms (1 frame).
   */
  onChange?: (color: string) => void;

  /**
   * Finalized color change callback.
   * Fires on mouse up, touch end, blur, or direct preset/format selection.
   */
  onChangeComplete?: (color: string) => void;

  /**
   * Callback when a gradient value changes in Gradient mode.
   */
  onGradientChange?: (gradient: GradientValue) => void;

  /**
   * Callback when 3-way color grading changes in Grading mode.
   */
  onGradingChange?: (grading: ThreeWayColorGrading) => void;

  /**
   * Color output format.
   * Defaults to 'hex'.
   */
  format?: ColorFormat;

  /**
   * Active initial mode.
   * Defaults to 'solid'.
   */
  mode?: ColorPickerMode;

  /**
   * Array of allowed modes to display in mode switcher.
   * Defaults to all: ['solid', 'wheel', 'gradient', 'grading', 'palette', 'accessibility']
   */
  availableModes?: ColorPickerMode[];

  /**
   * Whether to show the alpha channel slider and format inputs.
   * Defaults to true.
   */
  showAlpha?: boolean;

  /**
   * Array of preset color swatches to display.
   */
  presetColors?: string[];

  /**
   * Array of recent color swatches to display.
   */
  recentColors?: string[];

  /**
   * Array of design tokens to display in Tokens mode.
   */
  tokens?: ColorToken[];

  /**
   * Background color to check contrast against (for overlay / caption analyzer).
   * Defaults to '#18181b' (Dark video canvas).
   */
  contrastBackground?: string;

  /**
   * Callback fired when user clicks "Add to Presets".
   */
  onSavePreset?: (color: string) => void;

  /**
   * Whether the color picker is disabled.
   */
  disabled?: boolean;

  /**
   * Size variant for the trigger and picker panels.
   * 'sm' | 'md' | 'lg' (defaults to 'md')
   */
  size?: ColorSize;

  /**
   * Optional custom class name for the wrapper / popover.
   */
  className?: string;

  /**
   * Optional class name for the popover content.
   */
  popoverClassName?: string;

  /**
   * Optional class name for the trigger button.
   */
  triggerClassName?: string;

  /**
   * If true, renders the picker panel inline instead of inside a popover dropdown.
   */
  inline?: boolean;

  /**
   * Accessible label or title for the picker.
   */
  label?: string;

  /**
   * Whether to show the eye dropper tool if supported.
   * Defaults to true.
   */
  showEyeDropper?: boolean;

  /**
   * Whether to show the copy button in the top bar.
   * Defaults to true.
   */
  showCopyButton?: boolean;

  /**
   * Whether to show color harmonies recommendations.
   * Defaults to true.
   */
  showHarmonies?: boolean;
}

export interface DragPosition {
  x: number;
  y: number;
}

export interface ColorHistoryState {
  recentColors: string[];
  presetColors: string[];
  activeFormat: ColorFormat;
  maxRecentCount: number;
}
