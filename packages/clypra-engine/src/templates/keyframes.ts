import { TemplateKeyframe, AnimatableValue, TemplateEasingFunction } from "../types";

/**
 * Check if a value is keyframed
 */
export function isKeyframed<T>(value: AnimatableValue<T>): value is { keyframes: TemplateKeyframe<T>[] } {
  return typeof value === "object" && value !== null && "keyframes" in value && Array.isArray(value.keyframes);
}

/**
 * Get the static value or evaluate keyframes at a specific time
 */
export function evaluateAnimatable<T>(value: AnimatableValue<T>, time: number, templateDuration: number): T {
  if (!isKeyframed(value)) {
    return value;
  }

  const { keyframes } = value;

  if (keyframes.length === 0) {
    throw new Error("Keyframes array cannot be empty");
  }

  if (keyframes.length === 1) {
    return keyframes[0].value;
  }

  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0].time) {
    return sorted[0].value;
  }

  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value;
  }

  // Find the two keyframes to interpolate between
  let leftIdx = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      leftIdx = i;
      break;
    }
  }

  const left = sorted[leftIdx];
  const right = sorted[leftIdx + 1];

  // Calculate interpolation factor
  const range = right.time - left.time;
  const t = range === 0 ? 0 : (time - left.time) / range;

  // Apply easing
  const easedT = applyEasing(t, right.easing || "linear");

  // Interpolate based on value type
  return interpolateValue(left.value, right.value, easedT);
}

/**
 * Apply easing function to interpolation factor
 */
function applyEasing(t: number, easing: TemplateEasingFunction): number {
  switch (easing) {
    case "linear":
      return t;
    case "ease-in":
      return t * t;
    case "ease-out":
      return t * (2 - t);
    case "ease-in-out":
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case "ease":
      // Default ease (cubic-bezier approximation)
      return t * t * (3 - 2 * t);
    default:
      return t;
  }
}

/**
 * Interpolate between two values
 */
function interpolateValue<T>(from: T, to: T, t: number): T {
  // Handle numbers
  if (typeof from === "number" && typeof to === "number") {
    return (from + (to - from) * t) as T;
  }

  // Handle colors (hex format)
  if (typeof from === "string" && typeof to === "string" && from.startsWith("#") && to.startsWith("#")) {
    return interpolateColor(from, to, t) as T;
  }

  // For other types, snap to target at midpoint
  return t < 0.5 ? from : to;
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(from: string, to: string, t: number): string {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);

  if (!fromRgb || !toRgb) {
    return t < 0.5 ? from : to;
  }

  const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t);
  const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t);
  const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t);

  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Helper to create a keyframed value
 */
export function createKeyframed<T>(keyframes: TemplateKeyframe<T>[]): { keyframes: TemplateKeyframe<T>[] } {
  return { keyframes };
}

/**
 * Helper to add a keyframe to an animatable value
 */
export function addKeyframe<T>(value: AnimatableValue<T>, time: number, newValue: T, easing: TemplateEasingFunction = "ease-in-out"): { keyframes: TemplateKeyframe<T>[] } {
  const existing: TemplateKeyframe<T>[] = isKeyframed(value) ? value.keyframes : [{ time: 0, value: value as T, easing: "linear" as TemplateEasingFunction }];

  // Check if keyframe already exists at this time
  const existingIndex = existing.findIndex((kf) => Math.abs(kf.time - time) < 0.01);

  if (existingIndex >= 0) {
    // Update existing keyframe
    const updated = [...existing];
    updated[existingIndex] = { time, value: newValue, easing };
    return { keyframes: updated.sort((a, b) => a.time - b.time) };
  }

  // Add new keyframe
  return {
    keyframes: [...existing, { time, value: newValue, easing }].sort((a, b) => a.time - b.time),
  };
}

/**
 * Helper to remove a keyframe at a specific time
 */
export function removeTemplateKeyframe<T>(value: AnimatableValue<T>, time: number): AnimatableValue<T> {
  if (!isKeyframed(value)) {
    return value;
  }

  const filtered = value.keyframes.filter((kf) => Math.abs(kf.time - time) >= 0.01);

  if (filtered.length === 0) {
    throw new Error("Cannot remove all keyframes");
  }

  if (filtered.length === 1) {
    return filtered[0].value;
  }

  return { keyframes: filtered };
}
