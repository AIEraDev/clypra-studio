/**
 * Phase 4O — Single Source Primitive Registry & Default Node Factories
 *
 * Provides central registration, default node creation factories, and
 * metadata declarations for all 16 fundamental primitive node types.
 */

import type {
  SceneNode,
  SceneNodeType,
  FrameNode,
  PrimitiveTextNode,
  PrimitiveShapeNode,
  PrimitiveMediaNode,
  RichTextNode,
  GradientNode,
  IconNode,
  DividerNode,
  MetricNode,
  ProgressNode,
  ChartNode,
  TableNode,
  ContainerNode,
  CalloutNode,
  AvatarNode,
  GaugeNode,
  TimelineNode,
  AnnotationNode,
  ConnectorNode,
} from "./overlayDocumentSchema.js";

export interface PrimitiveDefinition {
  type: SceneNodeType;
  label: string;
  category: "graphics" | "data" | "structure" | "media";
  createDefaultNode: (id?: string) => SceneNode;
}

export class PrimitiveRegistry {
  private definitions = new Map<SceneNodeType, PrimitiveDefinition>();

  constructor() {
    this.registerDefaults();
  }

  public register(def: PrimitiveDefinition) {
    this.definitions.set(def.type, def);
  }

  public get(type: SceneNodeType): PrimitiveDefinition | undefined {
    return this.definitions.get(type);
  }

  public list(): PrimitiveDefinition[] {
    return Array.from(this.definitions.values());
  }

  public createDefaultNode(type: SceneNodeType, customId?: string): SceneNode {
    const def = this.definitions.get(type);
    if (!def) {
      throw new Error(`Unknown primitive node type: ${type}`);
    }
    return def.createDefaultNode(customId);
  }

  private registerDefaults() {
    // 1. Frame
    this.register({
      type: "frame",
      label: "Frame Container",
      category: "structure",
      createDefaultNode: (id = `frame-${Date.now()}`) =>
        ({
          id,
          name: "Frame Container",
          type: "frame",
          x: 320,
          y: 180,
          width: 640,
          height: 360,
          constraints: { horizontal: "center", vertical: "center" },
          style: { backgroundColor: "#1F2937" },
          layout: { mode: "flex-column", padding: { top: 16, right: 16, bottom: 16, left: 16 }, gap: 12, constraints: { horizontal: "center", vertical: "center" } },
          children: [],
        } as FrameNode),
    });

    // 2. Text
    this.register({
      type: "text",
      label: "Text",
      category: "graphics",
      createDefaultNode: (id = `text-${Date.now()}`) =>
        ({
          id,
          name: "Text Label",
          type: "text",
          x: 540,
          y: 340,
          width: 110,
          height: 28,
          text: "Text Label",
          constraints: { horizontal: "center", vertical: "center" },
          layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
          style: { fontSize: 20, textColor: "#FFFFFF" },
        } as PrimitiveTextNode),
    });

    // 3. Shape
    this.register({
      type: "shape",
      label: "Shape",
      category: "graphics",
      createDefaultNode: (id = `shape-${Date.now()}`) =>
        ({
          id,
          name: "Shape",
          type: "shape",
          x: 320,
          y: 180,
          width: 640,
          height: 360,
          shapeType: "rectangle",
          constraints: { horizontal: "center", vertical: "center" },
          style: { fillColor: "#3B82F6", borderRadius: 8 },
        } as PrimitiveShapeNode),
    });

    // 4. Media
    this.register({
      type: "media",
      label: "Media",
      category: "media",
      createDefaultNode: (id = `media-${Date.now()}`) =>
        ({
          id,
          name: "Media Node",
          type: "media",
          x: 580,
          y: 300,
          width: 120,
          height: 120,
          mediaType: "image",
          constraints: { horizontal: "center", vertical: "center" },
        } as PrimitiveMediaNode),
    });

    // 5. Rich Text
    this.register({
      type: "rich-text",
      label: "Rich Text",
      category: "graphics",
      createDefaultNode: (id = `richtext-${Date.now()}`) =>
        ({
          id,
          name: "Rich Text",
          type: "rich-text",
          x: 490,
          y: 330,
          width: 300,
          height: 60,
          constraints: { horizontal: "center", vertical: "center" },
          spans: [
            { text: "Rich ", style: { fontSize: 24, textColor: "#6366F1", fontWeight: "bold" } },
            { text: "Formatted ", style: { fontSize: 24, textColor: "#EC4899", fontWeight: "normal" } },
            { text: "Text", style: { fontSize: 24, textColor: "#10B981", fontWeight: "bold" } },
          ],
        } as RichTextNode),
    });

    // 6. Gradient
    this.register({
      type: "gradient",
      label: "Gradient Fill",
      category: "graphics",
      createDefaultNode: (id = `gradient-${Date.now()}`) =>
        ({
          id,
          name: "Gradient Box",
          type: "gradient",
          x: 515,
          y: 285,
          width: 250,
          height: 150,
          gradientType: "linear",
          angle: 45,
          stops: [
            { offset: 0, color: "#8B5CF6" },
            { offset: 1, color: "#3B82F6" },
          ],
          constraints: { horizontal: "center", vertical: "center" },
          style: { borderRadius: 12 },
        } as GradientNode),
    });

    // 7. Icon
    this.register({
      type: "icon",
      label: "Icon",
      category: "graphics",
      createDefaultNode: (id = `icon-${Date.now()}`) =>
        ({
          id,
          name: "Icon",
          type: "icon",
          x: 624,
          y: 344,
          width: 32,
          height: 32,
          iconName: "check-circle",
          constraints: { horizontal: "center", vertical: "center" },
          style: { fillColor: "#10B981" },
        } as IconNode),
    });

    // 8. Divider
    this.register({
      type: "divider",
      label: "Divider",
      category: "structure",
      createDefaultNode: (id = `divider-${Date.now()}`) =>
        ({
          id,
          name: "Divider Line",
          type: "divider",
          x: 490,
          y: 359,
          width: 300,
          height: 2,
          orientation: "horizontal",
          lineStyle: "solid",
          thickness: 2,
          constraints: { horizontal: "center", vertical: "center" },
          style: { strokeColor: "#374151" },
        } as DividerNode),
    });

    // 9. Metric
    this.register({
      type: "metric",
      label: "Metric Display",
      category: "data",
      createDefaultNode: (id = `metric-${Date.now()}`) =>
        ({
          id,
          name: "KPI Metric",
          type: "metric",
          x: 530,
          y: 320,
          width: 220,
          height: 80,
          value: 1250000,
          prefix: "$",
          suffix: "",
          label: "Total Revenue",
          decimals: 0,
          format: "currency",
          trend: 12.5,
          trendDirection: "up",
          constraints: { horizontal: "center", vertical: "center" },
        } as MetricNode),
    });

    // 10. Progress
    this.register({
      type: "progress",
      label: "Progress Bar",
      category: "data",
      createDefaultNode: (id = `progress-${Date.now()}`) =>
        ({
          id,
          name: "Progress Indicator",
          type: "progress",
          x: 520,
          y: 348,
          width: 240,
          height: 24,
          value: 75,
          max: 100,
          trackColor: "#1F2937",
          fillColor: "#3B82F6",
          showLabel: true,
          styleType: "bar",
          constraints: { horizontal: "center", vertical: "center" },
        } as ProgressNode),
    });

    // 11. Chart (Phase 4P — full VisualizationEngine config)
    this.register({
      type: "chart",
      label: "Animated Bar Chart",
      category: "data",
      createDefaultNode: (id = `chart-${Date.now()}`) =>
        ({
          id,
          name: "Analytics Chart",
          type: "chart",
          x: 360,
          y: 190,
          width: 560,
          height: 340,
          chartType: "bar",
          orientation: "vertical",
          stacked: false,
          xField: "category",
          xLabels: ["Company A", "Company B"],
          series: [
            { id: "retained", name: "Retained Customers", color: "#45FF72", data: [84, 62] },
            { id: "new",      name: "New Customers",       color: "#FF4141", data: [21, 38] },
          ],
          axis: { min: 0, tickCount: 5, showGrid: true, showLabels: true },
          barStyle: { rounded: 6, glow: false, gradient: false, groupGap: 6 },
          chartAnimation: { mode: "grow", duration: 1.2, stagger: 0.08, easing: "easeOutCubic", countUpLabels: true },
          colorPalette: ["#45FF72", "#FF4141", "#4ECDC4", "#FFE66D", "#A78BFA"],
          showLegend: true,
          legendPosition: "bottom",
          constraints: { horizontal: "center", vertical: "center" },
          style: { fillColor: "#111827" },
        } as ChartNode),
    });


    // 12. Table
    this.register({
      type: "table",
      label: "Data Table",
      category: "data",
      createDefaultNode: (id = `table-${Date.now()}`) =>
        ({
          id,
          name: "Data Table",
          type: "table",
          x: 415,
          y: 260,
          width: 450,
          height: 200,
          columns: [
            { key: "name", label: "Name", width: 150 },
            { key: "role", label: "Role", width: 150 },
            { key: "status", label: "Status", width: 100 },
          ],
          rows: [
            { name: "Alex Chen", role: "Lead Engineer", status: "Active" },
            { name: "Sarah Jenkins", role: "Design Director", status: "Active" },
            { name: "Michael Vance", role: "Product Manager", status: "Away" },
          ],
          constraints: { horizontal: "center", vertical: "center" },
        } as TableNode),
    });

    // 13. Container
    this.register({
      type: "container",
      label: "Card Container",
      category: "structure",
      createDefaultNode: (id = `container-${Date.now()}`) =>
        ({
          id,
          name: "Card Container",
          type: "container",
          x: 480,
          y: 250,
          width: 320,
          height: 220,
          clipContent: true,
          constraints: { horizontal: "center", vertical: "center" },
          style: { backgroundColor: "#111827", borderRadius: 16, strokeColor: "#1F2937", strokeWidth: 1 },
          layout: { mode: "flex-column", padding: { top: 20, right: 20, bottom: 20, left: 20 }, gap: 12, constraints: { horizontal: "center", vertical: "center" } },
          children: [],
        } as ContainerNode),
    });

    // 14. Callout
    this.register({
      type: "callout",
      label: "Callout Box",
      category: "structure",
      createDefaultNode: (id = `callout-${Date.now()}`) =>
        ({
          id,
          name: "Callout Box",
          type: "callout",
          x: 465,
          y: 315,
          width: 350,
          height: 90,
          title: "System Notification",
          body: "All background sync operations completed successfully.",
          iconName: "info-circle",
          calloutType: "info",
          constraints: { horizontal: "center", vertical: "center" },
          style: { backgroundColor: "#1E1B4B", borderRadius: 12, strokeColor: "#4338CA", strokeWidth: 1 },
        } as CalloutNode),
    });

    // 15. Avatar
    this.register({
      type: "avatar",
      label: "User Avatar",
      category: "media",
      createDefaultNode: (id = `avatar-${Date.now()}`) =>
        ({
          id,
          name: "User Avatar",
          type: "avatar",
          x: 616,
          y: 336,
          width: 48,
          height: 48,
          initials: "AC",
          shape: "circle",
          badgeStatus: "online",
          constraints: { horizontal: "center", vertical: "center" },
        } as AvatarNode),
    });

    // 16. Gauge
    this.register({
      type: "gauge",
      label: "Gauge Meter",
      category: "data",
      createDefaultNode: (id = `gauge-${Date.now()}`) =>
        ({
          id,
          name: "Gauge Meter",
          type: "gauge",
          x: 520,
          y: 270,
          width: 240,
          height: 180,
          value: 72,
          min: 0,
          max: 100,
          gaugeStyle: "semicircle",
          trackColor: "#1F2937",
          fillColor: "#3B82F6",
          showValue: true,
          showLabel: true,
          label: "Performance",
          constraints: { horizontal: "center", vertical: "center" },
        } as GaugeNode),
    });

    // 17. Timeline
    this.register({
      type: "timeline",
      label: "Timeline Axis",
      category: "data",
      createDefaultNode: (id = `timeline-${Date.now()}`) =>
        ({
          id,
          name: "Timeline Axis",
          type: "timeline",
          x: 390,
          y: 300,
          width: 500,
          height: 120,
          events: [
            { id: "e1", label: "Kickoff", time: 0, color: "#45FF72" },
            { id: "e2", label: "Beta", time: 50, color: "#FFE66D" },
            { id: "e3", label: "Launch", time: 100, color: "#FF4141" },
          ],
          orientation: "horizontal",
          trackColor: "#374151",
          showLabels: true,
          constraints: { horizontal: "center", vertical: "center" },
        } as TimelineNode),
    });

    // 18. Annotation
    this.register({
      type: "annotation",
      label: "Annotation",
      category: "graphics",
      createDefaultNode: (id = `ann-${Date.now()}`) =>
        ({
          id,
          name: "Annotation Callout",
          type: "annotation",
          x: 570,
          y: 340,
          width: 140,
          height: 40,
          text: "+42% Growth",
          offsetX: 0,
          offsetY: -30,
          showLeader: true,
          leaderColor: "#A78BFA",
          pointerStyle: "dot",
          constraints: { horizontal: "center", vertical: "center" },
        } as AnnotationNode),
    });

    // 19. Connector
    this.register({
      type: "connector",
      label: "Connector Arrow",
      category: "graphics",
      createDefaultNode: (id = `conn-${Date.now()}`) =>
        ({
          id,
          name: "Connector Arrow",
          type: "connector",
          x: 565,
          y: 320,
          width: 150,
          height: 80,
          fromNodeId: "",
          toNodeId: "",
          lineStyle: "straight",
          arrowHead: "end",
          strokeColor: "#3B82F6",
          strokeWidth: 2,
          constraints: { horizontal: "center", vertical: "center" },
        } as ConnectorNode),
    });
  }
}

export const primitiveRegistry = new PrimitiveRegistry();
