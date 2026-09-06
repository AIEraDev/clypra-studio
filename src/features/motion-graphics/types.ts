export type MotionPhase = "intro" | "hold" | "outro";

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeOutBack"
  | "easeInBack"
  | "spring";

export interface Keyframe<T = number> {
  time: number; // in seconds relative to template start
  value: T;
  easing?: EasingType;
}

export interface KeyframeTrack<T = number> {
  property: string;
  keyframes: Keyframe<T>[];
}

export type BlendMode = "source-over" | "screen" | "lighter" | "multiply";

export type MotionLayerType =
  | "text"
  | "vector-burst"
  | "lightning-arcs"
  | "fire-streaks"
  | "stars"
  | "particles"
  | "glow-aura";

export interface BaseLayerProps {
  id: string;
  name: string;
  type: MotionLayerType;
  visible: boolean;
  locked: boolean;
  blendMode: BlendMode;
  /** Restrict rendering to a specific lifecycle phase, or "all" */
  phaseScope: "all" | "intro-only" | "hold-only" | "outro-only";
  transform: {
    x: number; // offset px from center
    y: number; // offset px from center
    scaleX: number;
    scaleY: number;
    rotation: number; // in degrees
    opacity: number; // 0 to 1
  };
  tracks?: Record<string, KeyframeTrack<number>>;
}

export interface TextLayerProps extends BaseLayerProps {
  type: "text";
  config: {
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    fontStyle?: "normal" | "italic";
    fill: string;
    strokeColor: string;
    strokeWidth: number;
    outerStrokeColor?: string;
    outerStrokeWidth?: number;
    glowColor?: string;
    glowRadius?: number;
    tracking?: number; // letter spacing in px
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetY?: number;
    /** Per-character staggered drop, bounce, and wave animation */
    perCharacter?: boolean;
    staggerDelay?: number; // e.g. 0.07s
    entranceType?: "drop-bounce" | "pop-scale" | "wave";
    entranceDistance?: number; // e.g. 100px
    idleWave?: boolean; // floating cloud bobbing during hold phase
    idleWaveSpeed?: number; // e.g. 3
    idleWaveAmplitude?: number; // e.g. 8px
    ghostTrail?: boolean; // translucent motion echo during drop
    cloudHalo?: boolean; // diffuse atmospheric cloud glow
    cloudHaloColor?: string;
    cloudHaloRadius?: number;
    cloudOuterStrokeWidth?: number; // outer white contour border
    cloudOuterStrokeColor?: string;
    skewX?: number; // horizontal shear / italic slant (e.g. -0.14)
    condenseX?: number; // horizontal scale factor (e.g. 0.95)
    puffyBevel?: boolean; // 3D marshmallow / cloud volume shading
    puffyBevelColor?: string;
    fillCounters?: boolean; // fill inner holes of O/D with stroke color
  };
}

export interface VectorBurstLayerProps extends BaseLayerProps {
  type: "vector-burst";
  config: {
    points: number;
    innerRadiusRatio: number; // ratio of inner to outer radius (e.g. 0.6)
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    jitter: number; // randomization factor
    glowColor?: string;
    glowRadius?: number;
    autoFitText: boolean; // dynamically scale to fit active text bounding box
    paddingX: number;
    paddingY: number;
  };
}

export interface LightningArcsLayerProps extends BaseLayerProps {
  type: "lightning-arcs";
  config: {
    count: number;
    color: string;
    coreColor: string;
    roughness: number;
    branchChance: number;
    glowRadius: number;
    speed: number;
    direction: "sweep-horizontal" | "radial" | "vertical";
  };
}

export interface FireStreaksLayerProps extends BaseLayerProps {
  type: "fire-streaks";
  config: {
    count: number;
    primaryColor: string;
    secondaryColor: string;
    intensity: number;
    angle: number; // in degrees
    sweepProgress?: number;
  };
}

export interface StarsLayerProps extends BaseLayerProps {
  type: "stars";
  config: {
    count: number;
    minSize: number;
    maxSize: number;
    color: string;
    pulseSpeed: number;
    spreadRadius: number;
  };
}

export interface ParticlesLayerProps extends BaseLayerProps {
  type: "particles";
  config: {
    count: number;
    color: string;
    size: number;
    speed: number;
    glow: boolean;
  };
}

export interface GlowAuraLayerProps extends BaseLayerProps {
  type: "glow-aura";
  config: {
    color: string;
    radius: number;
    intensity: number;
  };
}

export type MotionLayer =
  | TextLayerProps
  | VectorBurstLayerProps
  | LightningArcsLayerProps
  | FireStreaksLayerProps
  | StarsLayerProps
  | ParticlesLayerProps
  | GlowAuraLayerProps;

export interface PhaseTiming {
  introDuration: number; // e.g. 0.6s
  holdDuration: number; // e.g. 1.8s
  outroDuration: number; // e.g. 0.6s
}

export interface MotionGraphicTemplate {
  id: string;
  name: string;
  description: string;
  category: "Trending" | "VFX" | "Comic" | "Neon" | "Gaming";
  thumbnailUrl?: string;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  phaseTiming: PhaseTiming;
  layers: MotionLayer[];
}
