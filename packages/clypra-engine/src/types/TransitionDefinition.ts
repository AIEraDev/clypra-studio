import type { Filter, Texture } from 'pixi.js'
import type { ParamSchema, ParamValues } from '../videoEffects/EffectDefinition'

export type GPUEffectTransitionCategory =
  | 'geometric'
  | 'optical-distortion'
  | 'temporal'
  | 'particle-dissolve'
  | 'light-based'
  | 'depth-based'
  | 'physics-simulated'


export interface TransitionContext {
  /** Outgoing clip texture — sampled as uFrom in the shader */
  fromTexture: Texture
  /** Incoming clip texture — sampled as uTo in the shader */
  toTexture: Texture
  /** 0 at transition start, 1 at transition end — driven by the Studio timeline scrubber */
  progress: number
  width: number
  height: number
}

export interface TransitionDefinition {
  id: string                    // kebab-case, e.g. 'iris-reveal'
  name: string                  // Display name, e.g. 'Iris Reveal'
  category: GPUEffectTransitionCategory
  description: string           // One sentence — the mechanism, not the mood
  tags: string[]
  thumbnail?: string
  /** Default duration in ms — used as the starting value in Studio, editable per-cut in Desktop */
  defaultDurationMs: number
  params: ParamSchema[]         // Drives Studio sliders — direction, intensity, color, etc.

  /** Called once — builds the dual-texture filter */
  create(params: ParamValues): Filter

  /**
   * Called every frame during the transition window.
   * progress goes 0 → 1 over defaultDurationMs (or the user-set cut duration).
   */
  updateProgress(filter: Filter, progress: number, params: ParamValues): void
}
