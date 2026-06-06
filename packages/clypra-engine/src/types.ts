export interface GradientStop {
  color: string;
  offset: number; // 0 - 100
}

export interface GlowLayer {
  enabled: boolean;
  color: string;
  blur: number; // 0 - 150
  opacity: number; // 0 - 100
  type: "outer" | "inner";
  strength?: number; // 1 - 20 (render passes)
  spread?: number; // 0 - 50px
}

export interface TextEffectConfig {
  // Text
  text: string;
  effectName: string;

  // Font
  fontFamily: string;
  fontWeight: number; // 400 - 900
  fontStyle: "normal" | "italic";
  fontSize: number; // 24 - 200
  letterSpacing: number; // -10 - 30
  lineHeight: number; // 0.8 - 2.5

  // Fill
  fillType: "solid" | "linear" | "radial" | "pattern" | "none";
  fillColor: string;
  fillGradientAngle: number; // 0 - 360
  fillGradientStops: GradientStop[];
  patternType?: "chalk" | "noise" | "grunge" | "carbon" | "stripes" | "film" | "brushed" | "marble" | "halftone" | "paper";

  /** Pro: independent solid fill color per visible character (reading order) */
  perCharFillEnabled?: boolean;
  charFillColors?: string[];

  // Stroke
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number; // 0 - 30
  strokePosition: "outside" | "center" | "inside";
  strokeOpacity: number; // 0 - 100
  strokeLineJoin: "round" | "miter" | "bevel";
  strokeBlur?: number; // 0 - 30
  strokeType?: "single" | "double" | "neon";
  strokeColorSecondary?: string;
  strokeWidthSecondary?: number; // 0 - 30
  strokeFadeRange?: number; // 0 - 100 percentage for fade gradient effect

  // Glow (up to 3 layers)
  glowLayers: GlowLayer[];

  // Shadow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number; // 0 - 60
  shadowOffsetX: number; // -50 - 50
  shadowOffsetY: number; // -50 - 50
  shadowOpacity: number; // 0 - 100
  shadowType: "drop" | "inner";

  // 3D / Bevel
  bevelEnabled: boolean;
  bevelDepth: number; // 0 - 20
  bevelHighlight: string;
  bevelShadow: string;
  bevelDirection: "bottom-right" | "bottom" | "right";
  bevelCoreColor?: string;
  bevelEdgeColor?: string;
  bevelEdgeWidth?: number; // 0 - 15
  bevelBlur?: number; // 0 - 50
  bevelBlurColor?: string;
  bevelPerspectiveEnabled?: boolean;
  bevelVanishingPointX?: number;
  bevelVanishingPointY?: number;
  bevelFocalLength?: number;

  // Custom Text Multi-Stack Extrusions (Multi-layer overlapping duplicates)
  stackEnabled?: boolean;
  stackCount?: number; // 1 - 8 stack layers
  stackOffsetX?: number; // -100 - 100 px per stack unit
  stackOffsetY?: number; // -100 - 100 px per stack unit
  stackOpacityDecay?: number; // 0 - 100 % reduction per layer
  stackColor1?: string;
  stackColor2?: string;
  stackColor3?: string;
  stackColor4?: string;

  // Background Panel
  panelEnabled: boolean;
  panelColor: string;
  panelOpacity: number; // 0 - 100
  panelRadius: number; // 0 - 60
  panelPaddingX: number; // 0 - 80
  panelPaddingY: number; // 0 - 40
  panelStrokeEnabled: boolean;
  panelStrokeColor: string;
  panelStrokeWidth: number; // 1 - 10

  // Canvas
  canvasWidth: number; // default 800
  canvasHeight: number; // default 200
  textPosX: "left" | "center" | "right";
  textPosY: "top" | "middle" | "bottom";

  /** Scale type to fit safe area inside canvas */
  autoFitText?: boolean;
  /** Wrap long lines to composition safe width */
  wrapText?: boolean;

  // Ink Brush specific controls
  inkColor?: string;
  bristleDensity?: number;
  bristleSkipRate?: number;
  dripRate?: number;
  dripMaxLength?: number;
  grainDensity?: number;
  skewX?: number;

  customRenderer?: string;
}

export interface Preset {
  id: string;
  name: string;
  config: TextEffectConfig;
  /** Cached scene graph (optional; built-ins use recipes cache) */
  scene?: import("./engine/schema").SceneDocument;
  isCustom?: boolean;
  category?: "3d" | "Neon" | "Metallic" | "Glitch" | "Retro" | "Gradient" | "Grunge" | "Outline" | "Shadow" | "Elements" | "Luxury" | "Classic" | "Experimental" | string;
  createdAt?: number;
}

export interface EffectIndexItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  tags?: string[];
  isPremium?: boolean;

  // Preview format
  previewType?: "static" | "video" | "lottie";
  thumbnailUrl?: string; // always present from API manifests
  thumbnail?: string; // legacy/static data compatibility
  previewUrl?: string; // WebM (video) or JSON (lottie) — animated only
  durationMs?: number; // loop length hint for progress ring, templates only
}

// ── Effect Property Type Definitions ───────────────────────────────────────

export interface EffectFill {
  type: "solid" | "linear" | "radial" | "pattern" | "none";
  color?: string;
  gradient?: {
    angle: number;
    stops: Array<{ color: string; offset: number }>;
  };
  patternType?: string;
  perCharFillEnabled?: boolean;
  charFillColors?: string[];
}

export interface EffectStroke {
  color: string;
  width: number;
  position?: "outside" | "center" | "inside";
  opacity?: number;
  lineJoin?: "round" | "miter" | "bevel";
  blur?: number;
  type?: "solid" | "gradient";
  colorSecondary?: string;
  widthSecondary?: number;
  fadeRange?: [number, number];
}

export interface EffectShadow {
  type?: "drop" | "inner";
  color: string;
  blur: number;
  offset?: { x: number; y: number }; // Current Studio output (nested)
  offsetX?: number; // Legacy format (flat) - for backward compatibility
  offsetY?: number; // Legacy format (flat) - for backward compatibility
  opacity?: number;
}

export interface EffectBevel {
  depth: number;
  highlight?: string; // Current Studio output
  highlightColor?: string; // Legacy format - for backward compatibility
  shadow?: string; // Current Studio output
  shadowColor?: string; // Legacy format - for backward compatibility
  direction?: "bottom-right" | "bottom" | "right";
  coreColor?: string;
  edgeColor?: string;
  edgeWidth?: number;
  blur?: number;
  blurColor?: string;
  perspectiveEnabled?: boolean;
  vanishingPointX?: number;
  vanishingPointY?: number;
  focalLength?: number;
}

export interface EffectGlow {
  color: string;
  blur: number;
  opacity: number;
  type?: "outer" | "inner";
  strength?: number;
  spread?: number;
}

export interface EffectPanel {
  color: string;
  opacity: number;
  radius: number;
  padding?: { x: number; y: number }; // Current Studio output (nested)
  paddingX?: number; // Legacy format (flat) - for backward compatibility
  paddingY?: number; // Legacy format (flat) - for backward compatibility
  stroke?: {
    color: string;
    width: number;
  } | null;
}

export interface EffectStack {
  count: number;
  offsetX: number;
  offsetY: number;
  opacityDecay: number;
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
}

// ────────────────────────────────────────────────────────────────────────────

export interface EffectFullDefinition extends EffectIndexItem {
  version?: string;
  description: string;
  tags: string[];
  font: {
    family: string;
    weight: number;
    style: "normal" | "italic";
    letterSpacing: number;
    lineHeight: number;
  };
  fills: EffectFill[];
  strokes: EffectStroke[];
  shadows: EffectShadow[];
  bevel?: EffectBevel;
  glow?: EffectGlow; // Legacy single glow
  glows?: EffectGlow[]; // Current multi-layer glows
  panel?: EffectPanel; // Effect definition property
  glitch?: any; // TODO: Define proper type when glitch effects are implemented
  animation?: {
    type: "none" | "typewriter" | "wave" | "fade" | "glitch";
    speed?: number;
    amplitude?: number;
    frequency?: number;
  };
  background?: any; // DEPRECATED: Use 'panel' instead. Kept for backward compatibility only.
  stack?: EffectStack;
}

export interface TextEffectDefinition extends EffectFullDefinition {
  text?: string;
  description: string;
  tags: string[];
}

export interface EvaluatedTextLayer {
  readonly layerId: string;
  readonly clipId: string;
  readonly role: string;
  readonly zIndex: number;
  readonly layerType: "text";
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly opacity: number;
  readonly inTransition: boolean;
  readonly blendMode: string;
  readonly time?: number;
  readonly clipStartTime?: number;
  readonly clipDuration?: number;
  readonly text: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly color: string;
  readonly fontWeight: "normal" | "bold" | number;
  readonly fontStyle: "normal" | "italic";
  readonly textAlign: "left" | "center" | "right";
  readonly verticalAlign: "top" | "middle" | "bottom";
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly stroke?: {
    color: string;
    width: number;
  };
  readonly shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  readonly background?: {
    color: string;
    padding: number;
    borderRadius: number;
  };
  readonly styleId?: string;
}
