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

  // Fire Engine specific controls
  fireColor?: string;
  fireIntensity?: number;
  fireFlameHeight?: number;
  fireEmberCount?: number;

  // Ice Engine specific controls
  iceColor?: string;
  iceThickness?: number;
  iceIcicleHeight?: number;
  iceFrostDensity?: number;
  iceSnowHeight?: number;

  // Aura Engine specific controls
  auraColor?: string;
  auraGlowColor?: string;
  auraIntensity?: number;
  auraReach?: number;
  auraParticleCount?: number;

  customRenderer?: string;
}

export interface Preset {
  id: string;
  name: string;
  config: TextEffectConfig;
  /** Cached scene graph (optional; built-ins use recipes cache) */
  scene?: import("./engine/schema").SceneDocument;
  isCustom?: boolean;
  category?: "Classic" | "Neon" | "Experimental" | string;
  createdAt?: number;
}
