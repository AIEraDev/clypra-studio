/**
 * Transition Effects Library
 *
 * Collection of dual-input transition effects for the Transition Lab.
 * Phase 4 Week 7 - 5 Production-Quality Transitions
 */

export { crossDissolveTransition } from "./crossDissolve";
export { pushTransition } from "./push";
export { zoomTransition } from "./zoom";
export { lumaWipeTransition } from "./lumaWipe";
export { glitchTransition } from "./glitch";

import { crossDissolveTransition } from "./crossDissolve";
import { pushTransition } from "./push";
import { zoomTransition } from "./zoom";
import { lumaWipeTransition } from "./lumaWipe";
import { glitchTransition } from "./glitch";

/**
 * All transition effects available in the Transition Lab
 */
export const transitionEffects = [crossDissolveTransition, pushTransition, zoomTransition, lumaWipeTransition, glitchTransition];

/**
 * Transition effects registry by ID
 */
export const transitionEffectsById = {
  "transition.cross-dissolve": crossDissolveTransition,
  "transition.push": pushTransition,
  "transition.zoom": zoomTransition,
  "transition.luma-wipe": lumaWipeTransition,
  "transition.glitch": glitchTransition,
};

/**
 * Get transition by ID
 */
export function getTransitionEffect(id: string) {
  return transitionEffectsById[id as keyof typeof transitionEffectsById];
}
