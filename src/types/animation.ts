/**
 * Authoritative CapCut-Parity Text Animation Types
 * Shared across Clypra Studio, Clypra API, and Clypra Desktop.
 */

export type AnimationPhase = "in" | "out" | "loop" | "combo";

export type StaggerOrder =
  | "left-to-right"
  | "right-to-left"
  | "center-out"
  | "random";

export type StaggerUnit = "character" | "word" | "line" | "none";

export interface CubicBezierEasing {
  type: "bezier";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SpringEasing {
  type: "spring";
  damping: number;
  stiffness: number;
  mass: number;
}

export type StandardEasing =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInBack"
  | "easeOutBack"
  | "easeOutBounce"
  | "easeOutElastic";

export type EasingCurve = StandardEasing | CubicBezierEasing | SpringEasing;

export type AnimatableProperty =
  | "opacity"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "translateX"
  | "translateY"
  | "rotation"
  | "skewX"
  | "tracking"
  | "blur";

export interface PropertyKeyframe {
  /** Normalized progress within the animation phase [0.0, 1.0] */
  progress: number;
  /** Value at this keyframe */
  value: number;
  /** Easing to use between this keyframe and the next */
  easing?: EasingCurve;
}

export interface AnimatedPropertyTrack {
  property: AnimatableProperty;
  /** List of keyframes sorted by progress [0.0 -> 1.0] */
  keyframes: PropertyKeyframe[];
}

export interface StaggerConfig {
  unit: StaggerUnit;
  /** Overlap factor between consecutive units (0.0 = completely sequential, 0.8 = 80% overlap, 1.0 = simultaneous) */
  overlap: number;
  /** Order in which glyphs animate */
  order: StaggerOrder;
}

export interface ProceduralVfxConfig {
  type:
    | "glitch"
    | "wave"
    | "melt"
    | "chromatic"
    | "dust"
    | "shiver"
    | "cursor"
    | "pixel"
    | "flame"
    | "sparkle"
    | "neon"
    | "shine"
    | "water"
    | "petal";
  intensity: number;
  frequency?: number;
  seed?: number;
}

export interface TextAnimationPreset {
  id: string;
  name: string;
  phase: AnimationPhase;
  category: string;
  tags: string[];

  /** Recommended default duration in seconds (e.g. 0.5s for In/Out, 1.2s for Loop) */
  defaultDuration: number;
  /** Minimum allowable duration in seconds (e.g. 0.1s) */
  minDuration: number;
  /** Maximum allowable duration in seconds (e.g. 5.0s) */
  maxDuration: number;

  /** Multi-property animated tracks */
  tracks: AnimatedPropertyTrack[];

  /** Per-glyph or per-word stagger sequencing */
  stagger?: StaggerConfig;

  /** Optional procedural shader or noise effect */
  procedural?: ProceduralVfxConfig;

  /** URL or base64 data URI of the animated WebP/GIF preview thumbnail */
  thumbnailUrl: string;
  /** URL of the short preview video (mp4/webm) shown in the preset browser */
  previewVideoUrl?: string;
  /** Loop cycle duration used for the thumbnail preview (typically 1.2s) */
  previewLoopDuration: number;

  /** Metadata */
  author?: string;
  createdAt?: number;
  updatedAt?: number;
  version: number;
}

export interface AnimationCatalogResponse {
  presets: TextAnimationPreset[];
  categories: string[];
  total: number;
}
