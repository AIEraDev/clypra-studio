import type { TextEffectConfig, GlowLayer, GradientStop } from "../types";

export const SCENE_VERSION = 1 as const;

export type EffectLayerType =
  | "panel"
  | "glow"
  | "shadow"
  | "extrusion"
  | "duplicateStack"
  | "stroke"
  | "fill"
  | "mask"
  | "filter"
  | "customEngine";

export type LayerTarget = "text" | "panel" | "scene" | "previous";

export type CustomEngineId = "ink" | "fire" | "ice" | "aura";

export const CUSTOM_ENGINE_IDS: CustomEngineId[] = ["ink", "fire", "ice", "aura"];

export const LEGACY_RENDERER_MAP: Record<string, CustomEngineId> = {
  InkBrushEngine: "ink",
  FireEngine: "fire",
  IceEngine: "ice",
  AuraEngine: "aura",
};

export const ENGINE_ID_TO_LEGACY: Record<CustomEngineId, string> = {
  ink: "InkBrushEngine",
  fire: "FireEngine",
  ice: "IceEngine",
  aura: "AuraEngine",
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
    canvas: { width: 800, height: 200, background: "transparent" },
    text: {
      content: "CLYPRA",
      fontFamily: "Poppins",
      fontWeight: 700,
      fontStyle: "normal",
      fontSize: 80,
      letterSpacing: 4,
      lineHeight: 1.2,
      textPosX: "center",
      textPosY: "middle",
    },
    effectLayers: [],
    customEngineId: null,
    compositor: { blur: 0, bloom: 0, bloomThreshold: 0.6 },
    timeline: { duration: 2, fps: 30, loop: true, tracks: [] },
    ...overrides,
  };
}

export function newLayerId(): string {
  return `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export type { GlowLayer, GradientStop, TextEffectConfig };
