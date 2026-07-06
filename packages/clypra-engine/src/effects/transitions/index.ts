import { PushTransition } from './geometric/PushTransition'
import { IrisRevealTransition } from './geometric/IrisRevealTransition'
import { FoldTurnTransition } from './geometric/FoldTurnTransition'
import { ZoomTransition } from './optical-distortion/ZoomTransition'
import { ChromaticPushTransition } from './optical-distortion/ChromaticPushTransition'
import { RefractionWarpTransition } from './optical-distortion/RefractionWarpTransition'
import { GlitchTransition } from './temporal/GlitchTransition'
import { StrobeCutTransition } from './temporal/StrobeCutTransition'
import { FrameHoldStutterTransition } from './temporal/FrameHoldStutterTransition'
import { CrossDissolveTransition } from './particle-dissolve/CrossDissolveTransition'
import { DirectionalDissolveTransition } from './particle-dissolve/DirectionalDissolveTransition'
import { PixelateCollapseTransition } from './particle-dissolve/PixelateCollapseTransition'
import { LumaWipeTransition } from './light-based/LumaWipeTransition'
import { LightLeakSweepTransition } from './light-based/LightLeakSweepTransition'
import { FilmBurnWipeTransition } from './light-based/FilmBurnWipeTransition'

// Depth-based Transitions
import { DepthPushTransition } from './depth-based/DepthPushTransition'
import { RackFocusBlendTransition } from './depth-based/RackFocusBlendTransition'
import { ParallaxLayerSplitTransition } from './depth-based/ParallaxLayerSplitTransition'

// Physics-simulated Transitions
import { ShatterBurstTransition } from './physics-simulated/ShatterBurstTransition'
import { ElasticSnapCutTransition } from './physics-simulated/ElasticSnapCutTransition'
import { GravityDropTransition } from './physics-simulated/GravityDropTransition'

import type { TransitionDefinition } from '../../types/TransitionDefinition'

export * from './geometric/PushTransition'
export * from './geometric/IrisRevealTransition'
export * from './geometric/FoldTurnTransition'
export * from './optical-distortion/ZoomTransition'
export * from './optical-distortion/ChromaticPushTransition'
export * from './optical-distortion/RefractionWarpTransition'
export * from './temporal/GlitchTransition'
export * from './temporal/StrobeCutTransition'
export * from './temporal/FrameHoldStutterTransition'
export * from './particle-dissolve/CrossDissolveTransition'
export * from './particle-dissolve/DirectionalDissolveTransition'
export * from './particle-dissolve/PixelateCollapseTransition'
export * from './light-based/LumaWipeTransition'
export * from './light-based/LightLeakSweepTransition'
export * from './light-based/FilmBurnWipeTransition'

// Depth-based Transitions Export
export * from './depth-based/DepthPushTransition'
export * from './depth-based/RackFocusBlendTransition'
export * from './depth-based/ParallaxLayerSplitTransition'

// Physics-simulated Transitions Export
export * from './physics-simulated/ShatterBurstTransition'
export * from './physics-simulated/ElasticSnapCutTransition'
export * from './physics-simulated/GravityDropTransition'

export const ALL_TRANSITIONS: TransitionDefinition[] = [
  PushTransition,
  IrisRevealTransition,
  FoldTurnTransition,
  ZoomTransition,
  ChromaticPushTransition,
  RefractionWarpTransition,
  GlitchTransition,
  StrobeCutTransition,
  FrameHoldStutterTransition,
  CrossDissolveTransition,
  DirectionalDissolveTransition,
  PixelateCollapseTransition,
  LumaWipeTransition,
  LightLeakSweepTransition,
  FilmBurnWipeTransition,
  DepthPushTransition,
  RackFocusBlendTransition,
  ParallaxLayerSplitTransition,
  ShatterBurstTransition,
  ElasticSnapCutTransition,
  GravityDropTransition
]

// For backward compatibility in other indices/files
export const transitionEffects = ALL_TRANSITIONS
export const transitionEffectsById = Object.fromEntries(
  ALL_TRANSITIONS.map(t => [t.id, t])
)
export function getTransitionEffect(id: string) {
  return transitionEffectsById[id]
}

