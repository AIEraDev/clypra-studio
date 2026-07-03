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
export { PreviewCanvas } from "./components/PreviewCanvas";
export type { PreviewCanvasProps } from "./components/PreviewCanvas";

export { PreviewCanvasV2 } from "./components/PreviewCanvas";
export type { PreviewCanvasV2Props } from "./components/PreviewCanvas";

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

export const UI_VERSION = "1.0.0";
