/**
 * @clypra-studio/types — Second Generation Compositional Primitives
 *
 * Self-contained definitions for Phase 4O primitive node types.
 * Intentionally does NOT import from overlay.ts to avoid circular dependency.
 * All primitive interfaces extend SceneNodeBase inline via structural typing.
 */

// ---------------------------------------------------------------------------
// Shape System
// ---------------------------------------------------------------------------

export type SceneNodeType =
  | "frame"
  | "text"
  | "shape"
  | "media"
  | "repeater"
  | "component"
  | "rich-text"
  | "gradient"
  | "icon"
  | "divider"
  | "metric"
  | "progress"
  | "chart"
  | "table"
  | "container"
  | "callout"
  | "avatar";

export type ShapeKind =
  | "rectangle"
  | "rounded-rectangle"
  | "circle"
  | "ellipse"
  | "triangle"
  | "polygon"
  | "star"
  | "arrow"
  | "chevron"
  | "hexagon"
  | "diamond"
  | "line"
  | "divider"
  | "custom-path";

// ---------------------------------------------------------------------------
// Shared inline base (mirrors SceneNodeBase for structural compatibility)
// Not exported — consumers should use SceneNodeBase from ./overlay
// ---------------------------------------------------------------------------

interface PrimitiveBase {
  id: string;
  name: string;
  type: SceneNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  visible?: boolean;
  locked?: boolean;
  style?: Record<string, any>;
  layout?: Record<string, any>;
  animation?: Record<string, any>;
  bindings?: Array<{ targetProperty: string; expression: string }>;
  visibilityExpression?: string;
  responsive?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// N1 — Graphics Primitives
// ---------------------------------------------------------------------------

export interface RichTextSpan {
  text: string;
  style?: Record<string, any>;
}

export interface RichTextNode extends PrimitiveBase {
  type: "rich-text";
  spans: RichTextSpan[];
}

export interface GradientStop {
  offset: number; // 0 to 1
  color: string;
}

export interface GradientNode extends PrimitiveBase {
  type: "gradient";
  gradientType: "linear" | "radial";
  angle?: number;
  stops: GradientStop[];
}

export interface IconNode extends PrimitiveBase {
  type: "icon";
  iconName: string;
  assetId?: string;
  svgPath?: string;
}

export interface DividerNode extends PrimitiveBase {
  type: "divider";
  orientation: "horizontal" | "vertical";
  lineStyle?: "solid" | "dashed" | "dotted" | "gradient";
  thickness?: number;
}

// ---------------------------------------------------------------------------
// N2 — Data-Aware Primitives
// ---------------------------------------------------------------------------

export interface MetricNode extends PrimitiveBase {
  type: "metric";
  value: number | string;
  prefix?: string;
  suffix?: string;
  label?: string;
  decimals?: number;
  format?: "number" | "currency" | "percent";
  locale?: string;
  trend?: number;
  trendDirection?: "up" | "down" | "neutral";
}

export interface ProgressNode extends PrimitiveBase {
  type: "progress";
  value: number;
  max?: number;
  trackColor?: string;
  fillColor?: string;
  showLabel?: boolean;
  styleType?: "bar" | "circle";
}

export type ChartType = "line" | "bar" | "area" | "donut" | "pie" | "radar" | "scatter";

// Phase 4Q — Visualization Engine geometry output types (consumed by Pixi projection and tests)
export interface LinePoint {
  seriesId: string;
  categoryIndex: number;
  x: number;
  y: number;
  fullY: number;
  baseY: number;
  color: string;
  rawValue: number;
  animatedValue: number;
  labelText: string;
  active: boolean;
}

export interface ArcGeometry {
  seriesId: string;
  startAngle: number;
  endAngle: number;
  fullEndAngle: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  rawValue: number;
  animatedValue: number;
  percentage: number;
  labelText: string;
  labelX: number;
  labelY: number;
}

export interface AxisConfig {
  min?: number;
  max?: number;
  tickCount?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  labelFormat?: string;
}

export interface ChartBarStyle {
  rounded?: number;
  glow?: boolean;
  glowColor?: string;
  gradient?: boolean;
  groupGap?: number;
}

export interface ChartAnimationConfig {
  mode: "grow" | "fade" | "none";
  duration?: number;
  stagger?: number;
  easing?: "linear" | "easeInCubic" | "easeOutCubic" | "easeInOutCubic" | "easeOutQuart" | "easeOutElastic";
  countUpLabels?: boolean;
}

export interface ChartSeries {
  id: string;
  name: string;
  color: string;
  data?: number[];
  stackGroup?: string;
}

export interface ChartNode extends PrimitiveBase {
  type: "chart";
  chartType: ChartType;
  stacked?: boolean;
  orientation?: "vertical" | "horizontal";
  xLabels?: string[];
  xField?: string;
  yFields?: string[];
  series?: ChartSeries[];
  axis?: AxisConfig;
  barStyle?: ChartBarStyle;
  chartAnimation?: ChartAnimationConfig;
  colorPalette?: string[];
  title?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  legendPosition?: "bottom" | "right" | "top";
  dataSource?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  width?: number;
  format?: string;
}

export interface TableNode extends PrimitiveBase {
  type: "table";
  columns: TableColumn[];
  dataSource?: string;
  rows?: Array<Record<string, any>>;
}

// ---------------------------------------------------------------------------
// N3 — Structural / Composite Primitives
// ---------------------------------------------------------------------------

export interface ContainerNode extends PrimitiveBase {
  type: "container";
  children: any[]; // SceneNode[] — typed loosely to avoid circular dep
  clipContent?: boolean;
}

export interface CalloutNode extends PrimitiveBase {
  type: "callout";
  title: string;
  body: string;
  iconName?: string;
  calloutType?: "info" | "warning" | "success" | "danger";
}

// ---------------------------------------------------------------------------
// N4 — Media Primitives
// ---------------------------------------------------------------------------

export interface AvatarNode extends PrimitiveBase {
  type: "avatar";
  src?: string;
  initials?: string;
  assetId?: string;
  shape?: "circle" | "rounded" | "square";
  badgeStatus?: "online" | "offline" | "busy";
}

// ---------------------------------------------------------------------------
// Primitive Registry Metadata
// ---------------------------------------------------------------------------

export interface PrimitiveDefinition {
  type: SceneNodeType;
  label: string;
  category: "graphics" | "data" | "structure" | "media";
  description?: string;
  createDefaultNode: (id?: string) => any;
}
