/**
 * @clypra/ui
 *
 * Shared UI components for all Clypra Studio Labs.
 * These components provide common developer tools: graph inspection,
 * performance monitoring, resource visualization, and parameter editing.
 *
 * @packageDocumentation
 */

// Week 3 Components - Developer Panels
export { GraphInspector } from "./components/GraphInspector";
export type { GraphInspectorProps } from "./components/GraphInspector";

export { PassInspector } from "./components/PassInspector";
export type { PassInspectorProps } from "./components/PassInspector";

export { ResourceInspector } from "./components/ResourceInspector";
export type { ResourceInspectorProps } from "./components/ResourceInspector";

export { PerformanceMonitor } from "./components/PerformanceMonitor";
export type { PerformanceMonitorProps, PerformanceMetrics } from "./components/PerformanceMonitor";

// Week 4 Components - Preview & Timeline
export { ResponsivePreviewCanvas } from "./components/PreviewCanvas";
export type { ResponsivePreviewCanvasProps } from "./components/PreviewCanvas";

export { useResponsiveCanvas } from "./components/PreviewCanvas";
export type { ResponsiveCanvasConfig, ResponsiveCanvasState } from "./components/PreviewCanvas";

export { Timeline } from "./components/Timeline";
export type { TimelineProps } from "./components/Timeline";

export { PresetManager } from "./components/PresetManager";
export type { PresetManagerProps, Preset } from "./components/PresetManager";

export { ValidationPanel } from "./components/ValidationPanel";
export type { ValidationPanelProps, ValidationIssue, ValidationSeverity } from "./components/ValidationPanel";

export { RuntimeInspector } from "./components/RuntimeInspector/RuntimeInspector";
export type { RuntimeInspectorProps } from "./components/RuntimeInspector/RuntimeInspector";

export { RuntimeObservatory } from "./components/RuntimeObservatory";
export type { RuntimeObservatoryProps } from "./components/RuntimeObservatory";

export { SnapshotObservatory } from "./components/RuntimeObservatory";
export type { SnapshotObservatoryProps } from "./components/RuntimeObservatory";

// SVG Bezier Curve Editor & Keyframe Easing Inspector
export { BezierCurveEditor, KeyframePropertyInspector } from "./components/BezierCurveEditor";
export type { BezierCurveEditorProps } from "./components/BezierCurveEditor";

// Multi-Keyframe Graph Editor & Timeline Inspector
export { MultiKeyframeGraphEditor, VideoEditorInspector } from "./components/MultiKeyframeGraphEditor";
export type { MultiKeyframeGraphEditorProps } from "./components/MultiKeyframeGraphEditor";

// Color Grading & CDL Studio
export { ColorWheel, ColorGradingStudioPanel } from "./components/ColorGradingStudio";
export type { ColorWheelProps, ColorGradingStudioPanelProps } from "./components/ColorGradingStudio";

// Body & Masking Effects Studio
export { BodyEffectsStudioPanel } from "./components/BodyEffectsStudio";
export type { BodyEffectsStudioPanelProps } from "./components/BodyEffectsStudio";

// Studio diagnostics and control bar
export { StudioDiagnosticsOverlay } from "./components/StudioDiagnosticsOverlay";
export { StudioControlPanel } from "./components/StudioControlPanel";
export type { StudioControlPanelProps } from "./components/StudioControlPanel";

// Clypra Color Picker Component Suite
export {
  ClypraColorPicker,
  ColorTrigger,
  SaturationBrightness,
  HueSlider,
  AlphaSlider,
  ColorInputs,
  PresetGrid,
  useColorDrag,
  useColorFormat,
  useColorHistory,
  createColorPickerSlice,
  useColorPickerStore,
  hexToRgba,
  rgbaToHex,
  rgbaToHsva,
  hsvaToRgba,
  hsvaToHsla,
  hslaToHsva,
  parseColor,
  formatColor,
  isValidColor,
  getContrastColor,
} from "@clypra/ui-color-picker";

export type {
  ClypraColorPickerProps,
  ClypraColorPickerHandle,
  ColorFormat,
  ColorSize,
  RGBA,
  HSLA,
  HSVA,
  ColorTriggerProps,
  SaturationBrightnessProps,
  HueSliderProps,
  AlphaSliderProps,
  ColorInputsProps,
  PresetGridProps,
  ColorPickerSlice,
} from "@clypra/ui-color-picker";

export const UI_VERSION = "0.1.0";
