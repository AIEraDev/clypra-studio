/**
 * @clypra-studio/types — Overlay & Declarative Authoring Document Schema
 *
 * Single source of truth for OverlayDocument, SceneNode, Breakpoints, and Assets.
 */

import type {
  SceneNodeType,
  ShapeKind,
  TextOverflowPolicy,
  BaselineAlignment,
  RichTextNode,
  GradientNode,
  IconNode,
  AnchorSide,
  SpatialAnchorConfig,
  LineNode,
  MediaObjectFit,
  MediaCropBounds,
  MediaTimingConfig,
  MediaPlaybackConfig,
  DividerNode,
  MetricNode,
  ProgressNode,
  ChartNode,
  TableNode,
  ContainerNode,
  CalloutNode,
  AvatarNode,
} from "./primitives.js";

export type {
  SceneNodeType,
  ShapeKind,
  TextOverflowPolicy,
  BaselineAlignment,
  AnchorSide,
  SpatialAnchorConfig,
  LineNode,
  MediaObjectFit,
  MediaCropBounds,
  MediaTimingConfig,
  MediaPlaybackConfig,
  RichTextSpan,
  RichTextNode,
  GradientStop,
  GradientNode,
  IconNode,
  DividerNode,
  MetricNode,
  ProgressNode,
  ChartType,
  ChartSeries,
  ChartNode,
  TableColumn,
  TableNode,
  ContainerNode,
  CalloutNode,
  AvatarNode,
  PrimitiveDefinition,
} from "./primitives.js";

export type LayoutMode =
  | "none"
  | "row"
  | "column"
  | "grid"
  | "stack"
  | "space-between"
  | "space-around"
  | "space-evenly"
  | "flex-row"
  | "flex-column";
export type SizingMode = "fixed" | "hug" | "fill";
export type ShapePrimitiveType = ShapeKind;
export type MediaKind = "image" | "video" | "audio" | "lottie";

export interface NodePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface NodeConstraints {
  widthMode?: SizingMode;
  heightMode?: SizingMode;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  aspectRatioLock?: boolean;
}

export interface NodeLayout {
  mode?: LayoutMode;
  gap?: number;
  padding?: NodePadding;
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyContent?: "start" | "center" | "end" | "space-between" | "space-around";
  constraints?: NodeConstraints;
  /** Grid column count (when mode === 'grid') */
  gridColumns?: number;
}

export interface NodeDropShadow {
  color: string;
  blur: number;
  x: number;
  y: number;
}

export interface NodeFillGradient {
  type: "linear" | "radial";
  colors: string[];
  angle?: number;
}

export interface NodeStyle {
  fillColor?: string;
  fillGradient?: NodeFillGradient;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  opacity?: number;
  shadow?: NodeDropShadow;
  // Typography properties (for text nodes or component overrides)
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic" | "oblique";
  textColor?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  /** Text overflow behavior */
  overflow?: TextOverflowPolicy;
  /** Maximum lines before clamping/truncating */
  maxLines?: number;
  /** Minimum font size when overflow is scale-down */
  minFontSize?: number;
  /** Vertical baseline alignment */
  baseline?: BaselineAlignment;
  /** Tabular numerals for fixed-width digits */
  tabularNums?: boolean;
  /** Font registry reference */
  fontRef?: FontRef;
}

export interface NodePropertyBinding {
  targetProperty: string; // e.g. "text" or "style.fillColor"
  expression: string;     // e.g. "{{ revenue / 1000000 }}"
}

export interface Keyframe {
  time: number; // Normalized time 0.0 to 1.0 within clip/entrance
  value: number | string;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "cubicBezier";
}

export interface KeyframeTrack {
  property: string; // e.g. "x", "opacity", "style.fontSize"
  keyframes: Keyframe[];
}

export interface NodeAnimationStart {
  type: "time" | "marker";
  time?: number;
  markerId?: string;
}

export interface NodeEntranceAnimation {
  type: "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "zoom" | "bounce" | "pop";
  duration: number;
  delay?: number;
  easing?: string;
}

export interface NodeExitAnimation {
  type: "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "zoom";
  duration: number;
  delay?: number;
  easing?: string;
}

export interface SemanticAnimationConfig {
  type: "typewriter" | "count-up" | "pulse" | "shimmer" | "wave" | "glitch";
  duration?: number;
  charsPerSecond?: number;
  from?: number;
  to?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export interface NodeAnimationConfig {
  start?: NodeAnimationStart;
  entrance?: NodeEntranceAnimation;
  exit?: NodeExitAnimation;
  semanticAnimation?: SemanticAnimationConfig;
  keyframeTracks?: KeyframeTrack[];
  /** Parent frame delay inheritance (stagger) */
  staggerChildren?: number;
  /** Loop behavior for keyframe tracks */
  loop?: boolean;
  /** If true, width/height animation triggers per-frame layout reflow passes instead of GPU transform scale */
  animatesLayout?: boolean;
  /** Layout transition duration for repeater/sibling reflows */
  layoutTransitionMs?: number;
}

export interface ResponsiveNodeOverride {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  layout?: Partial<NodeLayout>;
  style?: Partial<NodeStyle>;
  layoutOrder?: number;
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
  scaleX?: number;
  scaleY?: number;
  visible?: boolean;
  locked?: boolean;
  layout?: NodeLayout;
  style?: NodeStyle;
  animation?: NodeAnimationConfig;
  bindings?: NodePropertyBinding[];
  visibilityExpression?: string;
  anchor?: SpatialAnchorConfig;
  responsive?: Record<string, ResponsiveNodeOverride>;
}

export interface PrimitiveTextNode extends SceneNodeBase {
  type: "text";
  text: string;
  overflow?: TextOverflowPolicy;
  maxLines?: number;
  minFontSize?: number;
  baseline?: BaselineAlignment;
  tabularNums?: boolean;
}

export interface PrimitiveShapeNode extends SceneNodeBase {
  type: "shape";
  shapeType: ShapePrimitiveType;
}

export interface PrimitiveMediaNode extends SceneNodeBase {
  type: "media";
  mediaType: MediaKind;
  assetId: string;
  sourceUrl?: string;
  objectFit?: MediaObjectFit;
  aspectRatioLock?: boolean;
  cropBounds?: MediaCropBounds;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
  timing?: MediaTimingConfig;
  playback?: MediaPlaybackConfig;
}

export interface ComponentNode extends SceneNodeBase {
  type: "component";
  componentType: string;
  props: Record<string, any>;
  children?: SceneNode[];
}

export interface FrameNode extends SceneNodeBase {
  type: "frame";
  children: SceneNode[];
}

export interface RepeaterNode extends SceneNodeBase {
  type: "repeater";
  datasetBinding: string;
  itemTemplate: SceneNode;
  maxItems?: number;
  direction?: "vertical" | "horizontal";
  gap?: number;
  staggerMs?: number;
}

export type SceneNode =
  | PrimitiveTextNode
  | PrimitiveShapeNode
  | PrimitiveMediaNode
  | ComponentNode
  | FrameNode
  | RepeaterNode
  | RichTextNode
  | GradientNode
  | IconNode
  | DividerNode
  | LineNode
  | MetricNode
  | ProgressNode
  | ChartNode
  | TableNode
  | ContainerNode
  | CalloutNode
  | AvatarNode;

export interface DocumentVariable {
  key: string;
  type: "string" | "number" | "boolean" | "color" | "array";
  defaultValue: any;
  label?: string;
  description?: string;
}

export interface DataPreviewSet {
  id: string;
  label: string;
  values: Record<string, any>;
}

export interface TimelineMarker {
  id: string;
  name: string;
  time: number;
  color?: string;
}

export interface AssetRef {
  assetId: string;
  kind: MediaKind;
  source: "local" | "remote" | "data-url" | "blob";
  uri?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  sizeBytes?: number;
}

export interface AssetManifest {
  version: string;
  assets: AssetRef[];
}

export interface FontRef {
  family: string;
  weight?: number;
  style?: "normal" | "italic" | "oblique";
  sourceUrl?: string;
}

export interface FontManifest {
  version: string;
  fonts: FontRef[];
}

export interface Breakpoint {
  id: string;
  label: string;
  canvas: {
    width: number;
    height: number;
  };
  description?: string;
}

export interface BreakpointSet {
  activeId: string | null;
  breakpoints: Breakpoint[];
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor?: string;
}

export interface OverlayDocument {
  id: string;
  version: string;
  title: string;
  category?: string;
  canvas: CanvasConfig;
  variables: DocumentVariable[];
  nodes: SceneNode[];
  duration: number;
  fps?: number;
  markers?: TimelineMarker[];
  dataPreviewSets?: DataPreviewSet[];
  assetManifest?: AssetManifest;
  fontManifest?: FontManifest;
  breakpoints?: BreakpointSet;
  createdAt: string;
  updatedAt: string;
}
