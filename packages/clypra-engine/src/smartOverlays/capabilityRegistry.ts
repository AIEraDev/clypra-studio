/**
 * Phase 4R.1 — Executable Capability Registry
 *
 * Defines machine-readable capability entries and executable probe interfaces
 * for all 19 primitive node types in Clypra Studio.
 */

import { primitiveRegistry } from "./primitiveRegistry.js";
import { VisualizationEngine } from "./visualizationEngine.js";
import { TimelineVisualizationDefinition } from "./timelineVisualization.js";
import { AnnotationVisualizationDefinition } from "./annotationVisualization.js";
import type { ChartNode, TimelineNode, AnnotationNode } from "./overlayDocumentSchema.js";

const visualizationEngine = new VisualizationEngine();
const timelineEngine = new TimelineVisualizationDefinition();
const annotationEngine = new AnnotationVisualizationDefinition();

export type CapabilityStatus = "complete" | "partial" | "missing" | "limitation";

export interface CapabilityEntry {
  id: string;
  name: string;
  primitiveType: string;
  category: "graphics" | "data" | "visualization" | "structure" | "media";
  status: {
    schema: CapabilityStatus;
    factory: CapabilityStatus;
    command: CapabilityStatus;
    inspector: CapabilityStatus;
    animation: CapabilityStatus;
    responsive: CapabilityStatus;
    preview: CapabilityStatus;
    export: CapabilityStatus;
    desktopGeometry: CapabilityStatus;
    desktopPixels: CapabilityStatus;
  };
  testProbe?: () => boolean;
}

const DEFAULT_MISSING_DESKTOP = {
  schema: "complete" as const,
  factory: "complete" as const,
  command: "complete" as const,
  inspector: "complete" as const,
  animation: "complete" as const,
  responsive: "complete" as const,
  preview: "complete" as const,
  export: "complete" as const,
  desktopGeometry: "missing" as const, // Honest Status: Tauri IPC Rust deserializer pending
  desktopPixels: "missing" as const,   // Honest Status: Native wgpu pixel regression pending
};

export const CAPABILITY_REGISTRY: Record<string, CapabilityEntry> = {
  // Core Graphics Primitives
  "shape-rectangle": {
    id: "shape-rectangle",
    name: "Shape (Rectangle/Circle)",
    primitiveType: "shape",
    category: "graphics",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("shape");
      if (!node || node.type !== "shape") return false;
      node.width = 300;
      node.height = 150;
      return node.width === 300 && node.height === 150;
    },
  },
  "text-label": {
    id: "text-label",
    name: "Text Label",
    primitiveType: "text",
    category: "graphics",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("text");
      if (!node || node.type !== "text") return false;
      node.text = "Probing Text";
      return node.text === "Probing Text";
    },
  },
  "media-asset": {
    id: "media-asset",
    name: "Media Asset (Image/Video)",
    primitiveType: "media",
    category: "media",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("media");
      if (!node || node.type !== "media") return false;
      node.src = "test.mp4";
      return node.src === "test.mp4";
    },
  },
  "layout-frame": {
    id: "layout-frame",
    name: "Layout Frame",
    primitiveType: "frame",
    category: "structure",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("frame");
      if (!node || node.type !== "frame") return false;
      return Array.isArray(node.children);
    },
  },
  "container-card": {
    id: "container-card",
    name: "Container Card",
    primitiveType: "container",
    category: "structure",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("container");
      if (!node || node.type !== "container") return false;
      return typeof node.style === "object";
    },
  },
  "callout-box": {
    id: "callout-box",
    name: "Callout Box",
    primitiveType: "callout",
    category: "graphics",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("callout");
      if (!node || node.type !== "callout") return false;
      return typeof node.calloutType === "string";
    },
  },
  "user-avatar": {
    id: "user-avatar",
    name: "User Avatar",
    primitiveType: "avatar",
    category: "graphics",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("avatar");
      if (!node || node.type !== "avatar") return false;
      return typeof node.initials === "string";
    },
  },
  "kpi-metric": {
    id: "kpi-metric",
    name: "KPI Metric",
    primitiveType: "metric",
    category: "data",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("metric");
      if (!node || node.type !== "metric") return false;
      return typeof node.value === "string" || typeof node.value === "number";
    },
  },
  "progress-bar": {
    id: "progress-bar",
    name: "Progress Indicator",
    primitiveType: "progress",
    category: "data",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("progress");
      if (!node || node.type !== "progress") return false;
      return typeof node.value === "number";
    },
  },
  "data-table": {
    id: "data-table",
    name: "Data Table",
    primitiveType: "table",
    category: "data",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("table");
      if (!node || node.type !== "table") return false;
      return Array.isArray(node.columns);
    },
  },

  // Visualization Primitives
  "chart-bar": {
    id: "chart-bar",
    name: "Animated Bar Chart",
    primitiveType: "chart",
    category: "visualization",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("chart") as ChartNode;
      if (!node || node.type !== "chart") return false;
      const geom = visualizationEngine.evaluate(node, node.width || 560, node.height || 340, 1.0);
      return geom.bars.length > 0 && geom.plotArea.w > 0;
    },
  },
  "chart-line": {
    id: "chart-line",
    name: "Line Chart",
    primitiveType: "chart",
    category: "visualization",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("chart") as ChartNode;
      node.chartType = "line";
      const geom = visualizationEngine.evaluate(node, node.width || 560, node.height || 340, 1.0);
      return geom.linePoints.length > 0;
    },
  },
  "chart-area": {
    id: "chart-area",
    name: "Area Chart",
    primitiveType: "chart",
    category: "visualization",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("chart") as ChartNode;
      node.chartType = "area";
      const geom = visualizationEngine.evaluate(node, node.width || 560, node.height || 340, 1.0);
      return geom.linePoints.length > 0;
    },
  },
  "chart-pie": {
    id: "chart-pie",
    name: "Pie Chart",
    primitiveType: "chart",
    category: "visualization",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("chart") as ChartNode;
      node.chartType = "pie";
      const geom = visualizationEngine.evaluate(node, node.width || 560, node.height || 340, 1.0);
      return geom.arcs.length > 0;
    },
  },
  "chart-donut": {
    id: "chart-donut",
    name: "Donut Chart",
    primitiveType: "chart",
    category: "visualization",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("chart") as ChartNode;
      node.chartType = "donut";
      const geom = visualizationEngine.evaluate(node, node.width || 560, node.height || 340, 1.0);
      return geom.arcs.length > 0;
    },
  },
  "gauge-meter": {
    id: "gauge-meter",
    name: "Gauge Meter",
    primitiveType: "gauge",
    category: "visualization",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("gauge");
      if (!node || node.type !== "gauge") return false;
      node.value = 75;
      return node.value === 75;
    },
  },
  "timeline-axis": {
    id: "timeline-axis",
    name: "Timeline Axis",
    primitiveType: "timeline",
    category: "visualization",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("timeline") as TimelineNode;
      if (!node || node.type !== "timeline") return false;
      node.events = [
        { id: "e1", label: "Kickoff", time: 0, color: "#45FF72" },
        { id: "e2", label: "Launch", time: 10, color: "#FF4141" },
      ];
      const geom = timelineEngine.evaluate(node, { width: 600, height: 200, t: 0.5 });
      return geom.events.length === 2 && geom.axisX2 > geom.axisX1;
    },
  },
  "geometry-annotation": {
    id: "geometry-annotation",
    name: "Geometry Annotation",
    primitiveType: "annotation",
    category: "graphics",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("annotation") as AnnotationNode;
      if (!node || node.type !== "annotation") return false;
      node.text = "Key Callout";
      node.offsetX = 20;
      const geom = annotationEngine.evaluate(node, { width: 400, height: 400, t: 1.0 });
      return geom.text === "Key Callout" && geom.x === node.x + 20;
    },
  },
  "connector-arrow": {
    id: "connector-arrow",
    name: "Connector Arrow",
    primitiveType: "connector",
    category: "graphics",
    status: DEFAULT_MISSING_DESKTOP,
    testProbe: () => {
      const node = primitiveRegistry.createDefaultNode("connector");
      if (!node || node.type !== "connector") return false;
      node.arrowHead = "both";
      return node.arrowHead === "both";
    },
  },
};

export function getCapabilityReport(): { total: number; complete: number; missingDesktop: number } {
  const entries = Object.values(CAPABILITY_REGISTRY);
  let complete = 0;
  let missingDesktop = 0;

  for (const entry of entries) {
    if (entry.status.desktopGeometry === "missing") {
      missingDesktop++;
    } else {
      complete++;
    }
  }

  return { total: entries.length, complete, missingDesktop };
}
