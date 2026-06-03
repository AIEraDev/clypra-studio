import type { TextEffectConfig, GlowLayer, GradientStop } from "../types";

export const SCENE_VERSION = 1 as const;

// ─── Canvas / text dimension defaults ─────────────────────────────────────────
// Single source of truth. Every `|| 800`, `|| 200`, `|| 80` guard in renderer,
// textLayout, evaluate, and InkBrushEngine should import these instead of
// repeating the magic number.

/** Default canvas width in pixels. */
export const DEFAULT_CANVAS_WIDTH = 800 as const;
/** Default canvas height in pixels. */
export const DEFAULT_CANVAS_HEIGHT = 200 as const;
/** Default font size in pixels. */
export const DEFAULT_FONT_SIZE = 80 as const;
/** Default frames per second for new timelines. */
export const DEFAULT_FPS = 30 as const;
/** Default timeline duration in seconds for new scenes. */
export const DEFAULT_DURATION = 2 as const;

export type EffectLayerType = "panel" | "glow" | "shadow" | "extrusion" | "duplicateStack" | "stroke" | "fill" | "mask" | "filter" | "customEngine";

export type LayerTarget = "text" | "panel" | "scene" | "previous";

export type CustomEngineId = "ink";

export const CUSTOM_ENGINE_IDS: CustomEngineId[] = ["ink"];

export const LEGACY_RENDERER_MAP: Record<string, CustomEngineId> = {
  InkBrushEngine: "ink",
};

export const ENGINE_ID_TO_LEGACY: Record<CustomEngineId, string> = {
  ink: "InkBrushEngine",
};

export interface SceneCanvas {
  width: number;
  height: number;
  background: string;
}

export interface SceneText {
  content: string;
  fontFamily: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textPosX: "left" | "center" | "right";
  textPosY: "top" | "middle" | "bottom";
  wrapText?: boolean;
  autoFitText?: boolean;
  perCharFillEnabled?: boolean;
  charFillColors?: string[];
}

export interface EffectLayer {
  id: string;
  type: EffectLayerType;
  name: string;
  enabled: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  target: LayerTarget;
  params: Record<string, unknown>;
}

export interface CompositorSettings {
  blur: number;
  bloom: number;
  bloomThreshold?: number;
}

export interface Keyframe {
  time: number;
  value: number;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export interface AnimTrack {
  layerId: string;
  paramPath: string;
  keyframes: Keyframe[];
}

export interface Timeline {
  duration: number;
  fps: number;
  loop: boolean;
  tracks: AnimTrack[];
}

export interface SceneDocument {
  version: typeof SCENE_VERSION;
  effectName: string;
  canvas: SceneCanvas;
  text: SceneText;
  effectLayers: EffectLayer[];
  customEngineId: CustomEngineId | null;
  engineParams?: Record<string, unknown>;
  compositor: CompositorSettings;
  timeline: Timeline;
  /** Legacy flat config cache for gradual UI migration */
  legacyConfig?: TextEffectConfig;
  /** Deep Research extension snippet (not executed until sandboxed) */
  extensionCode?: string | null;
}

export interface StyleRecipe {
  id: string;
  name: string;
  category?: string;
  layers: EffectLayer[];
  exposed: string[];
  tags: string[];
  customEngineId?: CustomEngineId | null;
  scene?: SceneDocument;
}

export function createEmptyScene(overrides?: Partial<SceneDocument>): SceneDocument {
  return {
    version: SCENE_VERSION,
    effectName: "My Effect",
    canvas: { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT, background: "transparent" },
    text: {
      content: "CLYPRA",
      fontFamily: "Poppins",
      fontWeight: 700,
      fontStyle: "normal",
      fontSize: DEFAULT_FONT_SIZE,
      letterSpacing: 4,
      lineHeight: 1.2,
      textPosX: "center",
      textPosY: "middle",
    },
    effectLayers: [],
    customEngineId: null,
    compositor: { blur: 0, bloom: 0, bloomThreshold: 0.6 },
    timeline: { duration: DEFAULT_DURATION, fps: DEFAULT_FPS, loop: true, tracks: [] },
    ...overrides,
  };
}

export function newLayerId(): string {
  return `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
