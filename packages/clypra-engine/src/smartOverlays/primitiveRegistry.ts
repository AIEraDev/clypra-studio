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
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          style: { backgroundColor: "#1F2937" },
          layout: { mode: "flex-column", padding: { top: 16, right: 16, bottom: 16, left: 16 }, gap: 12 },
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
          x: 0,
          y: 0,
          width: 200,
          height: 40,
          text: "Text Label",
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
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          shapeType: "rectangle",
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
          x: 0,
          y: 0,
          width: 120,
          height: 120,
          mediaType: "image",
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
          x: 0,
          y: 0,
          width: 300,
          height: 60,
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
          x: 0,
          y: 0,
          width: 250,
          height: 150,
          gradientType: "linear",
          angle: 45,
          stops: [
            { offset: 0, color: "#8B5CF6" },
            { offset: 1, color: "#3B82F6" },
          ],
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
          x: 0,
          y: 0,
          width: 32,
          height: 32,
          iconName: "check-circle",
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
          x: 0,
          y: 0,
          width: 300,
          height: 2,
          orientation: "horizontal",
          lineStyle: "solid",
          thickness: 2,
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
          x: 0,
          y: 0,
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
          x: 0,
          y: 0,
          width: 240,
          height: 24,
          value: 75,
          max: 100,
          trackColor: "#1F2937",
          fillColor: "#3B82F6",
          showLabel: true,
          styleType: "bar",
        } as ProgressNode),
    });

    // 11. Chart
    this.register({
      type: "chart",
      label: "Data Chart",
      category: "data",
      createDefaultNode: (id = `chart-${Date.now()}`) =>
        ({
          id,
          name: "Analytics Chart",
          type: "chart",
          x: 0,
          y: 0,
          width: 400,
          height: 250,
          chartType: "bar",
          xField: "month",
          yFields: ["sales"],
          series: [
            { name: "Sales", color: "#6366F1", data: [120, 200, 150, 300, 250, 400] },
          ],
          showGrid: true,
          showLegend: true,
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
          x: 0,
          y: 0,
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
          x: 0,
          y: 0,
          width: 320,
          height: 220,
          clipContent: true,
          style: { backgroundColor: "#111827", borderRadius: 16, strokeColor: "#1F2937", strokeWidth: 1 },
          layout: { mode: "flex-column", padding: { top: 20, right: 20, bottom: 20, left: 20 }, gap: 12 },
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
          x: 0,
          y: 0,
          width: 350,
          height: 90,
          title: "System Notification",
          body: "All background sync operations completed successfully.",
          iconName: "info-circle",
          calloutType: "info",
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
          x: 0,
          y: 0,
          width: 48,
          height: 48,
          initials: "AC",
          shape: "circle",
          badgeStatus: "online",
        } as AvatarNode),
    });
  }
}

export const primitiveRegistry = new PrimitiveRegistry();
