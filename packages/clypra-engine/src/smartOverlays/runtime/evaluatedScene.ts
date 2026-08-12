import type { ShapeKind } from "../overlayDocumentSchema.js";

export interface EvaluatedTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  anchorX: number; // 0 to 1
  anchorY: number; // 0 to 1
}

export interface EvaluatedStyle {
  fillColor?: string;
  fillGradient?: {
    type: "linear" | "radial";
    colors: string[];
    angle?: number;
  };
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  opacity: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  shadowColor?: string;
  shadowBlur?: number;
  blurRadius?: number;
  backdropBlur?: number;
}

export interface EvaluatedContent {
  text?: string;
  typewriterProgress?: number;
  assetId?: string;
  mediaUrl?: string;
  iconName?: string;
  shapeType?: ShapeKind;
  numericValue?: number | string;
  formattedValue?: string;
  componentType?: string;
  props?: Record<string, any>;
}

export interface EvaluatedNode {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  visible: boolean;
  transform: EvaluatedTransform;
  style: EvaluatedStyle;
  content?: EvaluatedContent;
  /** Pure evaluated geometry (e.g. Chart/Gauge/Timeline evaluated geometry from visualizationEngine) */
  geometry?: any;
  children?: EvaluatedNode[];
  metadata?: Record<string, any>;
}

import type { VideoContext, EvaluatedVideoStateAtTime } from "../context/videoContext.js";

export interface RendererCapabilities {
  text: boolean;
  gradients: boolean;
  shadows: boolean;
  blur: boolean;
  masks: boolean;
  charts: boolean;
  media: boolean;
  blendModes: boolean;
  filters: boolean;
  nativeExport: boolean;
}

export interface RuntimeContext {
  viewport?: {
    zoom: number;
    panX: number;
    panY: number;
    canvasWidth: number;
    canvasHeight: number;
  };
  variables?: Record<string, any>;
  data?: Record<string, any>;
  activeBreakpointId?: string | null;
  video?: VideoContext;
  capabilities?: Partial<RendererCapabilities>;
}

export interface EvaluationDiagnostic {
  level: "warning" | "error" | "info";
  nodeId?: string;
  code: string;
  message: string;
}

export interface EvaluatedScene {
  version: "2.0";
  time: number;
  canvas: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  nodes: EvaluatedNode[];
  nodeMap: Record<string, EvaluatedNode>;
  videoState?: EvaluatedVideoStateAtTime;
  diagnostics: EvaluationDiagnostic[];
  metadata: {
    documentId: string;
    evaluatedAtTime: number;
    activeBreakpointId: string | null;
  };
}
