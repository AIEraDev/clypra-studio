/**
 * Declarative Overlay Document Schema
 * Single Canonical Source of Truth for Scene Graph, Components, Bindings, and Motion
 */

// ---------------------------------------------------------------------------
// Asset & Font Reference Types
// ---------------------------------------------------------------------------

export type AssetKind = "image" | "video" | "icon" | "audio" | "font";
export type AssetSource = "local" | "remote" | "builtin";

/**
 * A stable reference to an asset in the AssetRegistry.
 * OverlayDocument nodes hold an assetId, never binary data.
 */
export interface AssetRef {
  assetId: string;
  kind: AssetKind;
  source: AssetSource;
  /** Stable external URI — used for remote/cloud assets */
  uri?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    mimeType?: string;
    originalFilename?: string;
  };
}

/**
 * A catalog-agnostic font reference.
 * The document doesn't care whether "Inter" came from system, Google Fonts,
 * an uploaded .woff2, or a future Clypra font service.
 */
export interface FontRef {
  family: string;
  source: "system" | "builtin" | "uploaded" | "remote";
  weight: number;
  style: "normal" | "italic";
  /** Links to AssetRegistry for uploaded/remote fonts */
  assetId?: string;
  /** Direct URL for remote fonts (e.g. Google Fonts CSS) */
  url?: string;
}

/**
 * Document-level declaration of all asset dependencies.
 * Used by RuntimeAssetResolver.warmDocument() to pre-warm the cache.
 */
export interface AssetManifest {
  assets: AssetRef[];
}

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
  | "line"
  | "divider"
  | "metric"
  | "progress"
  | "chart"
  | "table"
  | "container"
  | "callout"
  | "avatar"
  | "annotation"
  | "connector"
  | "gauge"
  | "timeline"
  | "video"
  | "audio"
  | "lottie";

export type LayoutMode = "none" | "flex-row" | "flex-column" | "grid" | "space-between";
export type AlignmentMode = "start" | "center" | "end" | "stretch";
export type DimensionMode = "fixed" | "hug" | "fill" | "relative";
export type AnchorXMode = "left" | "center" | "right";
export type AnchorYMode = "top" | "center" | "bottom";

export interface NodeConstraints {
  horizontal?: "left" | "center" | "right" | "stretch" | AnchorXMode;
  vertical?: "top" | "center" | "bottom" | "stretch" | AnchorYMode;
  anchorX?: AnchorXMode;
  anchorY?: AnchorYMode;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  widthMode?: DimensionMode;
  heightMode?: DimensionMode;
  aspectRatio?: number;
  /** Clamp minimum resolved width (px) */
  minWidth?: number;
  /** Clamp maximum resolved width (px) */
  maxWidth?: number;
  /** Clamp minimum resolved height (px) */
  minHeight?: number;
  /** Clamp maximum resolved height (px) */
  maxHeight?: number;
  /** When true, height is derived from width × (1 / aspectRatio) after clamping */
  aspectRatioLock?: boolean;
}

export interface NodeLayoutRules {
  mode?: LayoutMode;
  gap?: number | { col: number; row: number };
  padding?: number | {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  alignItems?: AlignmentMode | "flex-start" | "flex-end";
  justifyContent?: AlignmentMode | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  wrap?: boolean | "wrap" | "nowrap";
  gridColumns?: number;
  constraints?: NodeConstraints;
}

/** @deprecated Use FontRef instead. Kept for migration compatibility. */
export interface FontSpec {
  family: string;
  weight?: number;
  source?: "system" | "web" | "asset";
  url?: string;
}

export interface NodeStyleRules {
  fillColor?: string;
  fillGradient?: {
    type: "linear" | "radial";
    colors: string[];
    angle?: number;
  };
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  fontFamily?: string;
  /** @deprecated Use fontRef instead */
  fontSpec?: FontSpec;
  /** Catalog-agnostic font reference — resolved via FontRegistry at runtime */
  fontRef?: FontRef;
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "600" | "800" | string;
  textColor?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase";
  overflow?: "visible" | "hidden" | "truncate" | "shrink-to-fit" | "multiline" | string;
  minFontSize?: number;
  maxLines?: number;
  tabularNums?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadow?: {
    x: number;
    y: number;
    blur: number;
    spread?: number;
    color: string;
  };
  blurRadius?: number;
  backdropBlur?: number;
}

export interface MotionPreset {
  type: "fade" | "slide" | "scale" | "pop" | "bounce" | "typewriter" | "glow-pulse";
  direction?: "up" | "down" | "left" | "right";
  duration: number;
  delay?: number;
  easing?: "linear" | "ease-out" | "ease-in-out" | "elastic";
}

/** Generalized start specification supporting absolute seconds or marker offsets */
export type AnimationStartSpec =
  | { type: "absolute"; time: number }
  | { type: "marker"; markerId: string; offset?: number };

/** Strongly typed semantic animation configuration */
export type SemanticAnimationConfig =
  | { type: "count-up"; from: number; to: number | string; duration: number; format?: string }
  | { type: "typewriter"; charsPerSecond: number }
  | { type: "repeater-stagger"; delay: number; direction: "forward" | "reverse" };

export interface KeyframeTrack {
  property: string; // e.g. "opacity", "x", "y", "scale", "rotation", "blur"
  keyframes: Array<{
    time: number;   // normalized 0-1 or clip seconds
    value: number | string;
    easing?: string;
  }>;
}

export interface NodeAnimationRules {
  entrance?: MotionPreset;
  exit?: MotionPreset;
  start?: AnimationStartSpec;
  semanticAnimation?: SemanticAnimationConfig;
  keyframeTracks?: KeyframeTrack[];
  /** Controls animation inheritance scope for child nodes */
  animationScope?: "node" | "children" | "subtree";
  /** Stagger delay applied incrementally to children based on scene tree order */
  staggerChildren?: number;
  /** If true, width/height animation triggers per-frame layout reflow passes instead of GPU transform scale */
  animatesLayout?: boolean;
  /** Layout transition duration for repeater/sibling reflows */
  layoutTransitionMs?: number;
}

export interface DataBindingRule {
  targetProperty: string;
  expression: string;
}

/**
 * Sparse property patch stored per breakpoint on a node.
 * Only the properties that *change* at a given breakpoint are stored.
 * Identity fields (id, type, children) are never overridden.
 */
export interface ResponsiveNodeOverride {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  /** Partial deep-merge over base node.layout */
  layout?: Partial<NodeLayoutRules>;
  /** Partial deep-merge over base node.style */
  style?: Partial<NodeStyleRules>;
  /** Re-order this node within its parent at this breakpoint (0-based) */
  layoutOrder?: number;
}

export type AnchorSide = "left" | "right" | "top" | "bottom" | "center";

export interface SpatialAnchorConfig {
  targetId: string;
  anchorSide?: AnchorSide;
  targetSide?: AnchorSide;
  offsetX?: number;
  offsetY?: number;
}

export interface SceneNodeBase {
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
  anchor?: SpatialAnchorConfig;
  layout?: NodeLayoutRules;
  style?: NodeStyleRules;
  animation?: NodeAnimationRules;
  bindings?: DataBindingRule[];
  visibilityExpression?: string;
  /**
   * Breakpoint-scoped property overrides.
   * Key = breakpoint id; value = sparse patch merged over base properties.
   * Only changed properties are stored — base properties are always inherited.
   */
  responsive?: Record<string, ResponsiveNodeOverride>;
}

export interface FrameNode extends SceneNodeBase {
  type: "frame";
  children: SceneNode[];
}

export interface PrimitiveTextNode extends SceneNodeBase {
  type: "text";
  text: string;
}

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

export interface PrimitiveShapeNode extends SceneNodeBase {
  type: "shape";
  shapeType: ShapeKind;
  svgPath?: string;
  points?: number[];
  cornerRadius?: number;
}

export interface PrimitiveMediaNode extends SceneNodeBase {
  type: "media";
  mediaType: "image" | "icon" | "svg" | "avatar" | "video" | "audio" | "lottie";
  /** @deprecated Prefer assetId. Kept as legacy fallback for migration. */
  src?: string;
  /** Stable reference to AssetRegistry — document never contains binary data */
  assetId?: string;
  // Sizing matrix attributes
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  aspectRatioLock?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none";
}

export interface VideoPlaybackConfig {
  startTime?: number; // Timeline offset when video begins (seconds)
  trimIn?: number; // In-point offset within source video (seconds)
  trimOut?: number; // Out-point offset within source video (seconds)
  speed?: number; // Playback rate multiplier (default: 1.0)
  loop?: boolean; // Wrap local playhead when reaching duration
  volume?: number; // Audio volume 0.0 - 1.0
  muted?: boolean;
}

export interface VideoNode extends SceneNodeBase {
  type: "video";
  assetId: string;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  aspectRatioLock?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none";
  playback?: VideoPlaybackConfig;
}

export interface AudioPlaybackConfig {
  startTime?: number;
  trimIn?: number;
  trimOut?: number;
  speed?: number;
  loop?: boolean;
  volume?: number; // 0.0 - 1.0
  muted?: boolean;
  fadeInDuration?: number; // Seconds for linear fade-in
  fadeOutDuration?: number; // Seconds for linear fade-out
  duckingDb?: number; // Target volume reduction in dB
}

export interface AudioNode extends SceneNodeBase {
  type: "audio";
  assetId: string;
  playback?: AudioPlaybackConfig;
}

export interface LottieNode extends SceneNodeBase {
  type: "lottie";
  assetId: string;
  fps?: number; // Defaults to 60
  speed?: number; // Speed multiplier (default: 1.0)
  loop?: boolean;
  mode?: "forward" | "reverse" | "pingpong";
  slots?: Record<string, string | number>; // Dynamic property/color/text injection
}

export interface RepeaterNode extends SceneNodeBase {
  type: "repeater";
  datasetBinding: string;
  staggerDelay?: number;
  itemTemplate: SceneNode;
  direction?: "vertical" | "horizontal";
  previewItemCount?: number;
  /** Stable field name used to track instance identity across sort/reorder operations */
  keyField?: string;
  /** Maximum number of items to instantiate from the dataset (windowing limit) */
  maxItems?: number;
  /** Context variable name for the current item in templates (defaults to "item") */
  itemContextKey?: string;
  /** Context variable name for the current index in templates (defaults to "index") */
  indexContextKey?: string;
}

export interface ComponentNode extends SceneNodeBase {
  type: "component";
  componentType: string;
  variant?: string;
  props: Record<string, any>;
  children?: SceneNode[];
}

export interface RichTextSpan {
  text: string;
  style?: Partial<NodeStyleRules>;
}

export interface RichTextNode extends SceneNodeBase {
  type: "rich-text";
  spans: RichTextSpan[];
}

import type { GradientStop } from "../types.js";
export type { GradientStop };

export interface GradientNode extends SceneNodeBase {
  type: "gradient";
  gradientType: "linear" | "radial";
  angle?: number; // degrees
  stops: GradientStop[];
}

export interface IconNode extends SceneNodeBase {
  type: "icon";
  iconName: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  assetId?: string;
  svgPath?: string;
}

export interface LineNode extends SceneNodeBase {
  type: "line";
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  startNodeId?: string;
  endNodeId?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeCap?: "butt" | "round" | "square";
  strokeJoin?: "miter" | "round" | "bevel";
  dashPattern?: number[];
}

export interface DividerNode extends SceneNodeBase {
  type: "divider";
  orientation: "horizontal" | "vertical";
  lineStyle?: "solid" | "dashed" | "dotted" | "gradient";
  thickness?: number;
}

export interface MetricNode extends SceneNodeBase {
  type: "metric";
  value: number | string;
  prefix?: string;
  suffix?: string;
  label?: string;
  decimals?: number;
  /** Number formatting style */
  format?: "number" | "currency" | "percent" | "compact";
  locale?: string;
  /** Manual trend percentage (overrides auto-calculated delta) */
  trend?: number;
  trendDirection?: "up" | "down" | "neutral";
  // Phase 4Q — semantic KPI fields
  /** Previous period value — delta and percentage change are auto-calculated */
  previousValue?: number;
  /** Show the delta/percentage change label below the primary value */
  showDelta?: boolean;
  /** Show the trend direction arrow (▲/▼) */
  showTrend?: boolean;
  /** Animate value counting up from 0. Uses existing semanticAnimation hook. */
  countUp?: boolean;
  /** Count-up animation duration in seconds. Default: 1.2 */
  countUpDuration?: number;
}

export interface ProgressNode extends SceneNodeBase {
  type: "progress";
  value: number; // 0 to 1 or 0 to max
  max?: number;
  trackColor?: string;
  fillColor?: string;
  showLabel?: boolean;
  styleType?: "bar" | "circle";
}

export type ChartType = "line" | "bar" | "area" | "donut" | "pie" | "radar" | "scatter";

// ---------------------------------------------------------------------------
// Phase 4P — Visualization Engine configuration types
// ---------------------------------------------------------------------------

export interface AxisConfig {
  /** Fixed minimum value. Undefined = auto from data. */
  min?: number;
  /** Fixed maximum value. Undefined = auto from data. */
  max?: number;
  /** Number of tick marks / grid lines. Default: 5 */
  tickCount?: number;
  /** Show horizontal grid lines across plot area */
  showGrid?: boolean;
  /** Show axis tick labels */
  showLabels?: boolean;
  /** Label format template e.g. "{{value}}%" or "${{value}}" */
  labelFormat?: string;
}

export interface ChartBarStyle {
  /** Border radius on bar corners (px). Default: 4 */
  rounded?: number;
  /** Enable glow (rendered as DropShadowFilter with zero offset) */
  glow?: boolean;
  /** Glow/shadow color (RGBA hex). Default: series color at 40% opacity */
  glowColor?: string;
  /** Enable vertical gradient fill on each bar */
  gradient?: boolean;
  /** Spacing between grouped series bars within a category (px) */
  groupGap?: number;
}

export interface ChartAnimationConfig {
  /** Animation style for bar entrance */
  mode: "grow" | "fade" | "none";
  /** Total animation duration in seconds. Default: 1.2 */
  duration?: number;
  /** Per-bar stagger delay in seconds. Default: 0.08 */
  stagger?: number;
  /** CSS easing name used for bar grow curve. Default: "easeOutCubic" */
  easing?: "linear" | "easeInCubic" | "easeOutCubic" | "easeInOutCubic" | "easeOutQuart" | "easeOutElastic";
  /** Animate the numeric label above each bar as a count-up */
  countUpLabels?: boolean;
}

export interface ChartSeries {
  /** Unique key used as yField when populating from dataSource objects */
  id: string;
  /** Display name shown in legend */
  name: string;
  /** Bar fill color (hex) */
  color: string;
  /** Raw data values, one per category */
  data?: number[];
  /** Stack group key — bars sharing the same stackGroup are stacked (requires stacked: true) */
  stackGroup?: string;
}

export interface ChartNode extends SceneNodeBase {
  type: "chart";
  chartType: ChartType;
  /** Stack series within each category (grouped otherwise) */
  stacked?: boolean;
  /** Bar orientation. Default: "vertical" */
  orientation?: "vertical" | "horizontal";
  /** Explicit category labels (X-axis). Populated from xField when dataSource is bound. */
  xLabels?: string[];
  /** Key in dataSource objects used to extract category labels */
  xField?: string;
  /** Keys in dataSource objects used for each series (deprecated: prefer series[].id) */
  yFields?: string[];
  /** Series definitions — color, label, and data */
  series?: ChartSeries[];
  /** Y-axis configuration */
  axis?: AxisConfig;
  /** Bar visual styling */
  barStyle?: ChartBarStyle;
  /** Chart-level animation, independent of NodeAnimationConfig entrance */
  chartAnimation?: ChartAnimationConfig;
  /** Default color palette — auto-assigned to series without explicit color */
  colorPalette?: string[];
  /** Chart title displayed above plot area (distinct from node.name) */
  title?: string;
  /** Show grid lines (shorthand for axis.showGrid) */
  showGrid?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Legend placement. Default: "bottom" */
  legendPosition?: "bottom" | "right" | "top";
  /** Bound data source expression */
  dataSource?: string;
  // Phase 4Q — chart-type-specific visual options
  /** Donut inner radius as fraction of outer radius. Default: 0.55 */
  donutHoleRatio?: number;
  /** Show percentage labels on pie/donut arcs */
  showPercentageLabels?: boolean;
  /** Area chart: fill the area below the line */
  showAreaFill?: boolean;
  /** Area chart: fill opacity 0–1. Default: 0.25 */
  areaFillOpacity?: number;
  /** Line chart: radius of data point dots (px). Default: 4 */
  pointRadius?: number;
  /** Line chart: animate as progressive path draw (left-to-right reveal) */
  drawProgress?: boolean;
  /** Phase 4R — Region highlights spotlighting specific category ranges */
  highlights?: Array<{
    seriesId?: string;
    dataIndexRange?: [number, number];
    color?: string;
    opacity?: number;
    label?: string;
  }>;
}

export interface AnnotationNode extends Omit<SceneNodeBase, "anchor"> {
  type: "annotation";
  text: string;
  anchor?: {
    nodeId: string;
    seriesId?: string;
    dataIndex?: number;
    element?: "bar-top" | "bar-center" | "point" | "arc-mid" | "absolute";
  };
  offsetX?: number;
  offsetY?: number;
  showLeader?: boolean;
  leaderColor?: string;
  pointerStyle?: "dot" | "arrow" | "none";
}

export interface ConnectorNode extends SceneNodeBase {
  type: "connector";
  fromNodeId: string;
  toNodeId: string;
  fromAnchor?: "top" | "bottom" | "left" | "right" | "center" | { x: number; y: number };
  toAnchor?: "top" | "bottom" | "left" | "right" | "center" | { x: number; y: number };
  fromElement?: "bar-top" | "point" | "arc-mid" | "center";
  toElement?: "bar-top" | "point" | "arc-mid" | "center";
  lineStyle?: "straight" | "curved" | "elbow" | "orthogonal" | "bezier";
  arrowHead?: "none" | "start" | "end" | "both";
  strokeColor?: string;
  strokeWidth?: number;
  dashPattern?: number[];
}

export interface GaugeThreshold {
  value: number;
  color: string;
}

export interface GaugeNode extends SceneNodeBase {
  type: "gauge";
  value: number;
  min?: number;
  max?: number;
  gaugeStyle?: "semicircle" | "full" | "arc";
  sweepAngle?: number;
  trackColor?: string;
  fillColor?: string;
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  thresholds?: GaugeThreshold[];
  chartAnimation?: ChartAnimationConfig;
}

export interface TimelineEvent {
  id: string;
  label: string;
  time: number;
  description?: string;
  color?: string;
  icon?: string;
}

export interface TimelineNode extends SceneNodeBase {
  type: "timeline";
  events: TimelineEvent[];
  orientation?: "horizontal" | "vertical";
  trackColor?: string;
  eventColor?: string;
  showLabels?: boolean;
  animationMode?: "sequential" | "simultaneous";
  chartAnimation?: Pick<ChartAnimationConfig, "mode" | "stagger" | "easing">;
}

export interface TableColumn {
  key: string;
  label: string;
  width?: number;
  format?: string;
}

export interface TableNode extends SceneNodeBase {
  type: "table";
  columns: TableColumn[];
  dataSource?: string;
  rows?: Array<Record<string, any>>;
}

export interface ContainerNode extends SceneNodeBase {
  type: "container";
  children: SceneNode[];
  clipContent?: boolean;
}

export interface CalloutNode extends SceneNodeBase {
  type: "callout";
  title: string;
  body: string;
  iconName?: string;
  calloutType?: "info" | "warning" | "success" | "danger";
}

export interface AvatarNode extends SceneNodeBase {
  type: "avatar";
  src?: string;
  initials?: string;
  assetId?: string;
  shape?: "circle" | "rounded" | "square";
  badgeStatus?: "online" | "offline" | "busy";
}

export type SceneNode =
  | FrameNode
  | PrimitiveTextNode
  | PrimitiveShapeNode
  | PrimitiveMediaNode
  | VideoNode
  | AudioNode
  | LottieNode
  | RepeaterNode
  | ComponentNode
  | RichTextNode
  | GradientNode
  | IconNode
  | LineNode
  | DividerNode
  | MetricNode
  | ProgressNode
  | ChartNode
  | TableNode
  | ContainerNode
  | CalloutNode
  | AvatarNode
  | AnnotationNode
  | ConnectorNode
  | GaugeNode
  | TimelineNode;

export interface DocumentVariable {
  key: string;
  type: "string" | "number" | "boolean" | "color" | "array";
  defaultValue: any;
  label?: string;
}

export interface DataPreviewSet {
  id: string;
  label: string;
  values: Record<string, any>;
}

/** Timeline Marker for snapping, keyframing, and video synchronization */
export interface TimelineMarker {
  id: string;
  time: number; // seconds
  label: string;
  type: "transcript" | "keyword" | "chapter" | "beat";
  color?: string;
}

/**
 * A named viewport context that overrides the canvas dimensions and
 * allows nodes to carry responsive overrides for that viewport.
 */
export interface Breakpoint {
  id: string;
  label: string;           // e.g. "Mobile", "Portrait", "Square"
  canvas: {
    width: number;
    height: number;
  };
  description?: string;
}

/**
 * Document-level breakpoint registry.
 * `activeId === null` means the canonical / base layout is active.
 */
export interface BreakpointSet {
  /** null = base / canonical layout */
  activeId: string | null;
  breakpoints: Breakpoint[];
}

export interface OverlayDocument {
  id: string;
  version: "2.0";
  /** Monotonic authoring revision used by Studio save artifacts. */
  schemaVersion?: number;
  title: string;
  description?: string;
  category: string;
  canvas: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  variables: DocumentVariable[];
  nodes: SceneNode[];
  duration: number;
  createdAt: string;
  updatedAt: string;
  dataPreviewSets?: DataPreviewSet[];
  /** Named timeline markers across the document duration */
  markers?: TimelineMarker[];
  /** Declares all asset dependencies for this document — used to pre-warm the resolver */
  assetManifest?: AssetManifest;
  /** Responsive breakpoint definitions and active selection */
  breakpoints?: BreakpointSet;
}

/**
 * Envelope for a Published Overlay Artifact.
 * Connecting Studio (Authoring) to Clypra Desktop (Execution).
 */
export interface PublishedOverlayArtifact {
  documentId: string;
  revision: number;
  schemaVersion: string;
  updatedAt: string;
  publishedAt?: string;
  author?: string;
  document: OverlayDocument;
}
