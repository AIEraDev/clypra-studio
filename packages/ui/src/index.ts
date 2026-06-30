/**
 * @clypra/ui
 *
 * Shared UI components for all Clypra Studio Labs.
 * These components provide common developer tools: graph inspection,
 * performance monitoring, resource visualization, and parameter editing.
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

export { Timeline } from "./components/Timeline";
export type { TimelineProps } from "./components/Timeline";

export { PresetManager } from "./components/PresetManager";
export type { PresetManagerProps, Preset } from "./components/PresetManager";

export { ValidationPanel } from "./components/ValidationPanel";
export type { ValidationPanelProps, ValidationIssue, ValidationSeverity } from "./components/ValidationPanel";

export const UI_VERSION = "1.0.0";
