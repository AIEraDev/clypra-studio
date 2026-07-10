/**
 * @clypra-studio/engine — EffectDefinition
 *
 * Unified type system for all Clypra video effects.
 * Supports two rendering backends:
 *   - 'canvas2d'  → existing text/overlay effects (EffectEngine class pattern)
 *   - 'pixi'      → new GPU-accelerated video/motion/filter effects (PixiJS)
 *
 * Both backends are consumed identically by EffectGraph and EffectRenderer.
 * The Studio and Desktop Editor import from this single package — same code, same output.
 */

import type { Application, Container, Filter, Ticker } from "pixi.js";

// ---------------------------------------------------------------------------
// Shared param schema (drives Studio sliders automatically)
// ---------------------------------------------------------------------------

export type ParamType = "range" | "color" | "toggle" | "select" | "text";

export interface ParamSchema {
  key: string;
  label: string;
  type: ParamType;
  value: number | string | boolean;
  min?: number; // range only
  max?: number; // range only
  step?: number; // range only (default 1)
  options?: string[]; // select only
}

export type ParamValues = Record<string, number | string | boolean>;

// ---------------------------------------------------------------------------
// Effect category taxonomy (maps to API route /effects/:category)
// ---------------------------------------------------------------------------

export type EffectCategory = "light" | "glitch" | "cinematic" | "neon" | "retro" | "motion" | "color" | "blur" | "distortion" | "particle" | "custom";

// ---------------------------------------------------------------------------
// Backend: Canvas 2D  (existing — DO NOT CHANGE)
// ---------------------------------------------------------------------------

export interface Canvas2DEngine {
  /** Advance internal animation state by N steps */
  advanceSteps(steps: number): void;
  /** Draw one frame onto the provided context */
  drawFrame(ctx: CanvasRenderingContext2D, ghostFrames?: ImageData[]): void;
}

export type Canvas2DEngineConstructor = new (config: ParamValues) => Canvas2DEngine;

export interface Canvas2DEffectDefinition {
  backend: "canvas2d";
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags: string[];
  thumbnail?: string;
  /** Static param schema — parsed by Studio to build sliders */
  params: ParamSchema[];
  /** The engine class that renders this effect */
  engineClass: Canvas2DEngineConstructor;
}

// ---------------------------------------------------------------------------
// Backend: PixiJS  (new — GPU-accelerated)
// ---------------------------------------------------------------------------

/**
 * PixiJS effect subtypes:
 *
 *  'filter'  — one or more GLSL shaders applied as a filter chain on a sprite/container.
 *              Pure GPU, no per-frame JS. Uniform values are updated from param changes.
 *
 *  'motion'  — animated overlay managed via PixiJS Ticker. Particles, sweeps, pulses.
 *              Has full scene-graph access (can add/remove children).
 *
 *  'composite' — combines filter + motion in one effect (e.g. neon glow + particle burst).
 */
export type PixiEffectSubtype = "filter" | "motion" | "composite";

/** Context passed to every PixiJS effect lifecycle method */
export interface PixiEffectContext {
  /** The PixiJS Application instance (shared, do not destroy) */
  app: Application;
  /** The container to attach overlays or receive filters */
  container: Container;
  /** PixiJS ticker — subscribe for per-frame updates */
  ticker: Ticker;
  /** Current param values (updated when user moves a slider) */
  params: ParamValues;
  /** Canvas dimensions */
  width: number;
  height: number;
}

/** A single PixiJS Filter definition (for 'filter' and 'composite' subtypes) */
export interface PixiFilterSpec {
  /**
   * Factory that returns a configured PixiJS Filter.
   * Called once on mount, and again when params change significantly.
   * Import Filter types lazily inside the factory to keep the engine tree-shakeable.
   */
  create: (params: ParamValues) => Filter | Filter[];
  /**
   * Called every frame (if the filter has animated uniforms).
   * Mutate filter.resources / uniforms here instead of re-creating the filter.
   * Return false to skip uniform update this frame (for static filters).
   */
  updateUniforms?: (filter: Filter | Filter[], params: ParamValues, elapsed: number) => void;
}

export interface PixiEffectDefinition {
  backend: "pixi";
  subtype: PixiEffectSubtype;
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags: string[];
  thumbnail?: string;
  /** Static param schema — same shape as Canvas2D, drives Studio sliders */
  params: ParamSchema[];
  /**
   * Filter spec — required for 'filter' and 'composite' subtypes.
   * For 'motion' only, omit this.
   */
  filterSpec?: PixiFilterSpec;
  /**
   * Lifecycle hooks for motion and composite subtypes.
   * mount   → called once when effect is activated (add sprites, subscribe ticker)
   * unmount → called when effect is removed (clean up ALL resources — critical)
   * update  → called when param values change (slider moved)
   */
  mount?: (ctx: PixiEffectContext) => void;
  unmount?: (ctx: PixiEffectContext) => void;
  onParamChange?: (ctx: PixiEffectContext, key: string, value: ParamValues[string]) => void;
}

// ---------------------------------------------------------------------------
// Union type — what EffectGraph nodes contain
// ---------------------------------------------------------------------------

export type EffectDefinition = Canvas2DEffectDefinition | PixiEffectDefinition;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isCanvas2DEffect(e: EffectDefinition): e is Canvas2DEffectDefinition {
  return e.backend === "canvas2d";
}

export function isPixiEffect(e: EffectDefinition): e is PixiEffectDefinition {
  return e.backend === "pixi";
}

export function isFilterEffect(e: EffectDefinition): e is PixiEffectDefinition & { subtype: "filter" } {
  return isPixiEffect(e) && e.subtype === "filter";
}

export function isMotionEffect(e: EffectDefinition): e is PixiEffectDefinition & { subtype: "motion" } {
  return isPixiEffect(e) && e.subtype === "motion";
}

export function isCompositeEffect(e: EffectDefinition): e is PixiEffectDefinition & { subtype: "composite" } {
  return isPixiEffect(e) && e.subtype === "composite";
}
