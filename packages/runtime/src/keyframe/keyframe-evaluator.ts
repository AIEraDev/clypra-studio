import type { AnimatedProperty, Keyframe } from "@clypra-studio/types";

export class KeyframeEvaluator {
  /**
   * Evaluates an animated property at a given time `time` (in seconds).
   */
  public evaluate(prop: AnimatedProperty, time: number): number {
    const kfs = prop.keyframes;

    // 1. Edge Cases: No keyframes or time outside keyframe bounds
    if (!kfs || kfs.length === 0) {
      return typeof prop.defaultValue === "number" ? prop.defaultValue : prop.defaultValue[0];
    }
    if (time <= kfs[0].time) {
      return this.extractScalarValue(kfs[0].value);
    }
    if (time >= kfs[kfs.length - 1].time) {
      return this.extractScalarValue(kfs[kfs.length - 1].value);
    }

    // 2. Binary Search to find current interval [k0, k1] where k0.time <= time < k1.time
    let low = 0;
    let high = kfs.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (kfs[mid].time <= time) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const k0 = kfs[high];
    const k1 = kfs[low];

    // 3. Calculate Normalized Progress Ratio tRatio in [0.0, 1.0]
    const duration = k1.time - k0.time;
    if (duration <= 0) return this.extractScalarValue(k0.value);

    const tRatio = (time - k0.time) / duration;
    const v0 = this.extractScalarValue(k0.value);
    const v1 = this.extractScalarValue(k1.value);

    // 4. Apply Easing Mode
    switch (k0.easing) {
      case "hold":
        return v0;

      case "linear":
        return v0 + (v1 - v0) * tRatio;

      case "cubic-bezier": {
        const cp = k0.controlPoints || [0.42, 0.0, 0.58, 1.0]; // Default ease-in-out
        const progress = this.solveCubicBezier(cp[0], cp[1], cp[2], cp[3], tRatio);
        return v0 + (v1 - v0) * progress;
      }

      default:
        return v0;
    }
  }

  /**
   * Solves Cubic Bézier Y-factor for a given X time progress using Newton-Raphson iteration.
   */
  public solveCubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
    let u = x; // Initial guess

    // Newton-Raphson iterations to solve for u given x
    for (let i = 0; i < 8; i++) {
      const currentX = this.calcBezierComponent(x1, x2, u) - x;
      const dx = this.calcBezierDerivative(x1, x2, u);
      if (Math.abs(dx) < 1e-6) break;
      u -= currentX / dx;
    }

    u = Math.min(Math.max(u, 0.0), 1.0);
    return this.calcBezierComponent(y1, y2, u);
  }

  private calcBezierComponent(p1: number, p2: number, u: number): number {
    const oneMinusU = 1.0 - u;
    return 3 * oneMinusU * oneMinusU * u * p1 + 3 * oneMinusU * u * u * p2 + u * u * u;
  }

  private calcBezierDerivative(p1: number, p2: number, u: number): number {
    const oneMinusU = 1.0 - u;
    return 3 * oneMinusU * oneMinusU * p1 + 6 * oneMinusU * u * (p2 - p1) + 3 * u * u * (1.0 - p2);
  }

  private extractScalarValue(val: number | number[]): number {
    return Array.isArray(val) ? val[0] : val;
  }
}
