import type { KeyframePoint } from "@clypra-studio/types";

export class MultiKeyframeEvaluator {
  /**
   * Evaluates a multi-segment curve at timestamp `t` (seconds).
   */
  public evaluate(keyframes: readonly KeyframePoint[], t: number): number {
    if (keyframes.length === 0) return 0;

    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    // Clamp before first keyframe or after last keyframe
    if (t <= sorted[0].time) return sorted[0].value;
    if (t >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

    // 1. Binary Search for active segment interval [k0, k1]
    let low = 0;
    let high = sorted.length - 1;
    while (low <= high - 1) {
      const mid = (low + high) >> 1;
      if (sorted[mid].time <= t && sorted[mid + 1].time >= t) {
        low = mid;
        break;
      } else if (sorted[mid].time < t) {
        low = mid;
      } else {
        high = mid;
      }
    }

    const k0 = sorted[low];
    const k1 = sorted[low + 1];

    // 2. Step / Hold Easing
    if (k0.easing === "hold") return k0.value;

    // 3. Linear Easing
    if (k0.easing === "linear" || !k0.handleOut || !k1.handleIn) {
      const alpha = (t - k0.time) / (k1.time - k0.time);
      return k0.value + alpha * (k1.value - k0.value);
    }

    // 4. Cubic Bézier Easing
    const p0 = { x: k0.time, y: k0.value };
    const p1 = { x: k0.time + k0.handleOut.dt, y: k0.value + k0.handleOut.dv };
    const p2 = { x: k1.time + k1.handleIn.dt, y: k1.value + k1.handleIn.dv };
    const p3 = { x: k1.time, y: k1.value };

    // Solve for curve parameter u where X(u) == t
    const u = this.solveCubicBézTime(p0.x, p1.x, p2.x, p3.x, t);

    // Evaluate Y(u)
    return this.cubicBéz(p0.y, p1.y, p2.y, p3.y, u);
  }

  private cubicBéz(p0: number, p1: number, p2: number, p3: number, u: number): number {
    const oneMinusU = 1 - u;
    return (
      oneMinusU * oneMinusU * oneMinusU * p0 +
      3 * oneMinusU * oneMinusU * u * p1 +
      3 * oneMinusU * u * u * p2 +
      u * u * u * p3
    );
  }

  private solveCubicBézTime(x0: number, x1: number, x2: number, x3: number, targetT: number): number {
    let u = (targetT - x0) / (x3 - x0); // Initial linear guess

    // Newton-Raphson Iterations
    for (let i = 0; i < 8; i++) {
      const currentX = this.cubicBéz(x0, x1, x2, x3, u) - targetT;
      if (Math.abs(currentX) < 1e-6) break;

      const oneMinusU = 1 - u;
      const dX =
        3 * oneMinusU * oneMinusU * (x1 - x0) +
        6 * oneMinusU * u * (x2 - x1) +
        3 * u * u * (x3 - x2);

      if (Math.abs(dX) < 1e-6) break;
      u -= currentX / dX;
      u = Math.max(0, Math.min(1, u)); // Clamp
    }
    return u;
  }
}
