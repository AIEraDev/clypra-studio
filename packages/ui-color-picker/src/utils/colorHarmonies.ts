/**
 * Clypra Color Science: Harmonies, Color Blindness Simulation, Naming & Contrast Engine
 * Strict TypeScript - 100% Pure Functions.
 */

import type { RGBA, HSVA, ColorHarmonies, ColorBlindnessType, ContrastResult } from '../types/color';
import { clamp, round, hsvaToHex, hsvaToRgba, rgbaToHsva, parseColor, getRelativeLuminance } from './colorUtils';

/**
 * Generates harmonic chords based on color theory hue rotations.
 */
export function generateHarmonies(hsva: HSVA): ColorHarmonies {
  const h = hsva.h;
  const s = hsva.s;
  const v = hsva.v;
  const a = hsva.a;

  const makeHex = (deg: number, customS = s, customV = v): string => {
    const normalizedH = ((deg % 360) + 360) % 360;
    return hsvaToHex({
      h: round(normalizedH, 1),
      s: clamp(customS, 0, 100),
      v: clamp(customV, 0, 100),
      a,
    });
  };

  return {
    complementary: makeHex(h + 180),
    analogous: [makeHex(h - 30), makeHex(h + 30)],
    triadic: [makeHex(h + 120), makeHex(h + 240)],
    tetradic: [makeHex(h + 90), makeHex(h + 180), makeHex(h + 270)],
    splitComplementary: [makeHex(h + 150), makeHex(h + 210)],
    monochromatic: [
      makeHex(h, Math.max(0, s - 30), Math.min(100, v + 20)),
      makeHex(h, s, Math.max(0, v - 25)),
      makeHex(h, Math.min(100, s + 15), Math.max(0, v - 50)),
    ],
  };
}

/**
 * Simulates color vision deficiencies (CVD) using standard linear LMS matrix transformations.
 */
export function simulateColorBlindness(rgba: RGBA, type: ColorBlindnessType): RGBA {
  if (type === 'normal') return { ...rgba };

  // Convert sRGB to linear RGB
  const toLinear = (c: number): number => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  const toSrgb = (v: number): number => {
    const clamped = clamp(v, 0, 1);
    const c = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
    return clamp(Math.round(c * 255), 0, 255);
  };

  const rLin = toLinear(rgba.r);
  const gLin = toLinear(rgba.g);
  const bLin = toLinear(rgba.b);

  let simR = rLin;
  let simG = gLin;
  let simB = bLin;

  switch (type) {
    case 'protanopia': {
      // Missing L-cones (Red blindness)
      simR = 0.56667 * rLin + 0.43333 * gLin + 0.0 * bLin;
      simG = 0.55833 * rLin + 0.44167 * gLin + 0.0 * bLin;
      simB = 0.0 * rLin + 0.24167 * gLin + 0.75833 * bLin;
      break;
    }
    case 'deuteranopia': {
      // Missing M-cones (Green blindness)
      simR = 0.625 * rLin + 0.375 * gLin + 0.0 * bLin;
      simG = 0.7 * rLin + 0.3 * gLin + 0.0 * bLin;
      simB = 0.0 * rLin + 0.3 * gLin + 0.7 * bLin;
      break;
    }
    case 'tritanopia': {
      // Missing S-cones (Blue blindness)
      simR = 0.95 * rLin + 0.05 * gLin + 0.0 * bLin;
      simG = 0.0 * rLin + 0.43333 * gLin + 0.56667 * bLin;
      simB = 0.0 * rLin + 0.475 * gLin + 0.525 * bLin;
      break;
    }
    case 'achromatopsia': {
      // Total monochromacy
      const lum = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
      simR = lum;
      simG = lum;
      simB = lum;
      break;
    }
  }

  return {
    r: toSrgb(simR),
    g: toSrgb(simG),
    b: toSrgb(simB),
    a: rgba.a,
  };
}

/**
 * Creative Named Color Dictionary for Clypra Video/Design Ecosystem.
 */
const CLYPRA_COLOR_NAMES: Array<{ name: string; r: number; g: number; b: number }> = [
  { name: 'Clypra Electric Violet', r: 139, g: 92, b: 246 },
  { name: 'Deep Amethyst', r: 109, g: 40, b: 217 },
  { name: 'Neon Indigo', r: 99, g: 102, b: 241 },
  { name: 'Cosmic Blue', r: 59, g: 130, b: 246 },
  { name: 'Cyber Cyan', r: 6, g: 182, b: 212 },
  { name: 'Emerald Surge', r: 16, g: 185, b: 129 },
  { name: 'Laser Lime', r: 132, g: 204, b: 22 },
  { name: 'Sunset Amber', r: 245, g: 158, b: 11 },
  { name: 'Solar Orange', r: 249, g: 115, b: 22 },
  { name: 'Crimson Wave', r: 239, g: 68, b: 68 },
  { name: 'Ruby Blaze', r: 225, g: 29, b: 72 },
  { name: 'Neon Pink', r: 236, g: 72, b: 153 },
  { name: 'Pure Snow', r: 255, g: 255, b: 255 },
  { name: 'Studio Silver', r: 212, g: 212, b: 216 },
  { name: 'Zinc Slate', r: 113, g: 113, b: 122 },
  { name: 'Carbon Neutral', r: 39, g: 39, b: 42 },
  { name: 'Obsidian Void', r: 9, g: 9, b: 11 },
];

/**
 * Calculates human-friendly color name by finding nearest palette neighbor.
 */
export function getColorName(input: RGBA | HSVA | string): string {
  let rgba: RGBA;

  if (typeof input === 'string') {
    const parsed = parseColor(input);
    rgba = parsed ? hsvaToRgba(parsed) : { r: 139, g: 92, b: 246, a: 1 };
  } else if ('v' in input) {
    rgba = hsvaToRgba(input);
  } else {
    rgba = input;
  }

  let closestName = 'Custom Tone';
  let minDistance = Number.POSITIVE_INFINITY;

  for (const item of CLYPRA_COLOR_NAMES) {
    // Weighted Euclidean RGB distance
    const dist = Math.sqrt(
      0.299 * (rgba.r - item.r) ** 2 +
      0.587 * (rgba.g - item.g) ** 2 +
      0.114 * (rgba.b - item.b) ** 2
    );

    if (dist < minDistance) {
      minDistance = dist;
      closestName = item.name;
    }
  }

  return closestName;
}

/**
 * Computes WCAG 2.1 Contrast Ratio and estimated APCA score between foreground and background.
 */
export function calculateContrast(foreground: RGBA, background: RGBA): ContrastResult {
  const fgLum = getRelativeLuminance(foreground);
  const bgLum = getRelativeLuminance(background);

  const l1 = Math.max(fgLum, bgLum);
  const l2 = Math.min(fgLum, bgLum);

  const ratio = round((l1 + 0.05) / (l2 + 0.05), 2);

  let wcagLevel: 'AAA' | 'AA' | 'AA-Large' | 'Fail' = 'Fail';
  if (ratio >= 7.0) {
    wcagLevel = 'AAA';
  } else if (ratio >= 4.5) {
    wcagLevel = 'AA';
  } else if (ratio >= 3.0) {
    wcagLevel = 'AA-Large';
  }

  // APCA (Accessible Perceptual Contrast Algorithm) estimated scoring
  const apcaScore = round(Math.abs(fgLum ** 0.56 - bgLum ** 0.56) * 110, 1);
  let apcaRating: 'Optimal' | 'Good' | 'Fair' | 'Poor' = 'Poor';

  if (apcaScore >= 75) {
    apcaRating = 'Optimal';
  } else if (apcaScore >= 60) {
    apcaRating = 'Good';
  } else if (apcaScore >= 45) {
    apcaRating = 'Fair';
  }

  return {
    wcagRatio: ratio,
    wcagLevel,
    apcaScore,
    apcaRating,
    isSafeForCaptions: ratio >= 4.5,
  };
}
