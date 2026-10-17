import type {
  TextAnimationPreset,
  AnimatedPropertyTrack,
  EasingCurve,
  AnimatableProperty,
  StaggerConfig,
} from "../../../types/animation";

export interface EvaluatedGlyphTransform {
  opacity: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  rotation: number;
  skewX: number;
  blur: number;
  tracking: number;
}

export const DEFAULT_TRANSFORM: EvaluatedGlyphTransform = {
  opacity: 1,
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
  rotation: 0,
  skewX: 0,
  blur: 0,
  tracking: 0,
};

// ── Standard Easing Functions ──────────────────────────────────────────────

export function evaluateEasing(curve: EasingCurve | undefined, t: number): number {
  const p = Math.max(0, Math.min(1, t));
  if (!curve || curve === "linear") return p;

  if (typeof curve === "string") {
    switch (curve) {
      case "easeIn":
      case "easeInQuad":
        return p * p;
      case "easeOut":
      case "easeOutQuad":
        return p * (2 - p);
      case "easeInOut":
        return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      case "easeInCubic":
        return p * p * p;
      case "easeOutCubic": {
        const f = p - 1;
        return f * f * f + 1;
      }
      case "easeInBack": {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * p * p * p - c1 * p * p;
      }
      case "easeOutBack": {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const f = p - 1;
        return 1 + c3 * f * f * f + c1 * f * f;
      }
      case "easeOutBounce": {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (p < 1 / d1) {
          return n1 * p * p;
        } else if (p < 2 / d1) {
          const f = p - 1.5 / d1;
          return n1 * f * f + 0.75;
        } else if (p < 2.5 / d1) {
          const f = p - 2.25 / d1;
          return n1 * f * f + 0.9375;
        } else {
          const f = p - 2.625 / d1;
          return n1 * f * f + 0.984375;
        }
      }
      case "easeOutElastic": {
        if (p === 0) return 0;
        if (p === 1) return 1;
        const c4 = (2 * Math.PI) / 3;
        return Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
      }
      default:
        return p;
    }
  }

  if (curve.type === "bezier") {
    // Cubic Bézier curve evaluation (Newton-Raphson approximation)
    return evaluateCubicBezier(curve.x1, curve.y1, curve.x2, curve.y2, p);
  }

  if (curve.type === "spring") {
    // Damped harmonic oscillator approximation
    const { damping = 12, stiffness = 100, mass = 1 } = curve;
    const omega = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    if (zeta < 1) {
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      return (
        1 -
        Math.exp(-zeta * omega * p) *
          (Math.cos(omegaD * p) +
            ((zeta * omega) / omegaD) * Math.sin(omegaD * p))
      );
    }
    return 1 - Math.exp(-omega * p) * (1 + omega * p);
  }

  return p;
}

function evaluateCubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number,
): number {
  let low = 0;
  let high = 1;
  let currentT = t;

  for (let i = 0; i < 8; i++) {
    const x =
      3 * Math.pow(1 - currentT, 2) * currentT * x1 +
      3 * (1 - currentT) * Math.pow(currentT, 2) * x2 +
      Math.pow(currentT, 3);
    if (Math.abs(x - t) < 0.001) break;
    if (x < t) low = currentT;
    else high = currentT;
    currentT = (low + high) / 2;
  }

  return (
    3 * Math.pow(1 - currentT, 2) * currentT * y1 +
    3 * (1 - currentT) * Math.pow(currentT, 2) * y2 +
    Math.pow(currentT, 3)
  );
}

// ── Track Value Evaluation ──────────────────────────────────────────────────

export function evaluateTrackValue(
  track: AnimatedPropertyTrack,
  progress: number,
): number {
  const { keyframes } = track;
  if (!keyframes || keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;

  const p = Math.max(0, Math.min(1, progress));

  // Before first keyframe
  if (p <= keyframes[0].progress) return keyframes[0].value;
  // After last keyframe
  if (p >= keyframes[keyframes.length - 1].progress) {
    return keyframes[keyframes.length - 1].value;
  }

  // Find surrounding segment
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0 = keyframes[i];
    const k1 = keyframes[i + 1];

    if (p >= k0.progress && p <= k1.progress) {
      const segSpan = k1.progress - k0.progress;
      if (segSpan <= 0) return k1.value;

      const segProgress = (p - k0.progress) / segSpan;
      const easedProgress = evaluateEasing(k0.easing, segProgress);
      return k0.value + easedProgress * (k1.value - k0.value);
    }
  }

  return keyframes[keyframes.length - 1].value;
}

// ── Glyph Stagger Calculation ───────────────────────────────────────────────

export function calculateStaggerProgress(
  overallProgress: number,
  itemIndex: number,
  totalItems: number,
  stagger?: StaggerConfig,
): number {
  if (!stagger || stagger.unit === "none" || totalItems <= 1) {
    return overallProgress;
  }

  const { overlap = 0.5, order = "left-to-right" } = stagger;

  // Determine effective order index
  let seqIndex = itemIndex;
  if (order === "right-to-left") {
    seqIndex = totalItems - 1 - itemIndex;
  } else if (order === "center-out") {
    const center = (totalItems - 1) / 2;
    seqIndex = Math.abs(itemIndex - center);
  } else if (order === "random") {
    // Deterministic pseudo-random seed based on index
    seqIndex = ((itemIndex * 9301 + 49297) % 233280) % totalItems;
  }

  const clampedOverlap = Math.max(0, Math.min(0.99, overlap));
  const stepDelay = (1 - clampedOverlap) / Math.max(1, totalItems - 1);
  const durationPerItem = 1 - (totalItems - 1) * stepDelay * (1 - clampedOverlap);
  const startTime = seqIndex * stepDelay * (1 - clampedOverlap);
  const activeWindow = Math.max(0.1, 1 - startTime);

  const localT = (overallProgress - startTime) / activeWindow;
  return Math.max(0, Math.min(1, localT));
}

// ── Composite Glyph Evaluation ──────────────────────────────────────────────

export function evaluatePresetTransform(
  preset: TextAnimationPreset,
  overallProgress: number,
  glyphIndex: number = 0,
  totalGlyphs: number = 1,
): EvaluatedGlyphTransform {
  const glyphProgress = calculateStaggerProgress(
    overallProgress,
    glyphIndex,
    totalGlyphs,
    preset.stagger,
  );

  const result: EvaluatedGlyphTransform = { ...DEFAULT_TRANSFORM };

  for (const track of preset.tracks) {
    const val = evaluateTrackValue(track, glyphProgress);
    switch (track.property) {
      case "opacity":
        result.opacity = val;
        break;
      case "scale":
        result.scaleX = val;
        result.scaleY = val;
        break;
      case "scaleX":
        result.scaleX = val;
        break;
      case "scaleY":
        result.scaleY = val;
        break;
      case "translateX":
        result.translateX = val;
        break;
      case "translateY":
        result.translateY = val;
        break;
      case "rotation":
        result.rotation = val;
        break;
      case "skewX":
        result.skewX = val;
        break;
      case "blur":
        result.blur = val;
        break;
      case "tracking":
        result.tracking = val;
        break;
    }
  }

  return result;
}
