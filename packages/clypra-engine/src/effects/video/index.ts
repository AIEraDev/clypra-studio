/**
 * Video Effects Library
 *
 * Collection of single-input video effects for the Video Lab.
 * Phase 3 Week 6 - 5 Production-Quality Effects
 */

export { filmGrainEffect } from "./filmGrain";
export { vhsEffect } from "./vhs";
export { bloomEffect } from "./bloom";
export { chromaticAberrationEffect } from "./chromaticAberration";
export { heatDistortionEffect } from "./heatDistortion";

import { filmGrainEffect } from "./filmGrain";
import { vhsEffect } from "./vhs";
import { bloomEffect } from "./bloom";
import { chromaticAberrationEffect } from "./chromaticAberration";
import { heatDistortionEffect } from "./heatDistortion";

/**
 * All video effects available in the Video Lab
 */
export const videoEffects = [filmGrainEffect, vhsEffect, bloomEffect, chromaticAberrationEffect, heatDistortionEffect];

/**
 * Video effects registry by ID
 */
export const videoEffectsById = {
  "video.film-grain": filmGrainEffect,
  "video.vhs": vhsEffect,
  "video.bloom": bloomEffect,
  "video.chromatic-aberration": chromaticAberrationEffect,
  "video.heat-distortion": heatDistortionEffect,
};

/**
 * Get effect by ID
 */
export function getVideoEffect(id: string) {
  return videoEffectsById[id as keyof typeof videoEffectsById];
}
