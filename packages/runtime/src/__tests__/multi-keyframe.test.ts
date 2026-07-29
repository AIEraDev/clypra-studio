import { describe, it, expect } from "vitest";
import type { KeyframePoint } from "@clypra-studio/types";
import { MultiKeyframeEvaluator } from "../keyframe/multi-keyframe-evaluator";
import { resolveHandleConstraints } from "../keyframe/handle-constraints";

describe("MultiKeyframeEvaluator & Handle Constraints", () => {
  it("should evaluate continuous multi-segment curves across time", () => {
    const evaluator = new MultiKeyframeEvaluator();

    const keyframes: KeyframePoint[] = [
      { id: "k0", time: 0.0, value: 0.0, easing: "linear" },
      { id: "k1", time: 2.0, value: 10.0, easing: "linear" },
      { id: "k2", time: 4.0, value: 0.0, easing: "linear" },
    ];

    expect(evaluator.evaluate(keyframes, -1.0)).toBe(0.0);
    expect(evaluator.evaluate(keyframes, 0.0)).toBe(0.0);
    expect(evaluator.evaluate(keyframes, 1.0)).toBeCloseTo(5.0);
    expect(evaluator.evaluate(keyframes, 2.0)).toBe(10.0);
    expect(evaluator.evaluate(keyframes, 3.0)).toBeCloseTo(5.0);
    expect(evaluator.evaluate(keyframes, 5.0)).toBe(0.0);
  });

  it("should enforce handle constraints for aligned, mirrored, and broken modes", () => {
    const kf: KeyframePoint = {
      id: "k0",
      time: 1.0,
      value: 5.0,
      easing: "cubic-bezier",
      handleMode: "aligned",
      handleIn: { dt: -0.5, dv: -0.5 },
      handleOut: { dt: 0.5, dv: 0.5 },
    };

    // Aligned mode: opposite handle locks to 180 deg angle, preserving length
    const alignedRes = resolveHandleConstraints(kf, "handleOut", { dt: 1.0, dv: 0.0 });
    expect(alignedRes.handleOut).toEqual({ dt: 1.0, dv: 0.0 });
    expect(alignedRes.handleIn?.dt).toBeLessThan(0);
    expect(alignedRes.handleIn?.dv).toBeCloseTo(0);

    // Mirrored mode: opposite handle mirrors both angle AND magnitude
    const mirroredKf = { ...kf, handleMode: "mirrored" as const };
    const mirroredRes = resolveHandleConstraints(mirroredKf, "handleOut", { dt: 2.0, dv: 0.0 });
    expect(mirroredRes.handleIn).toEqual({ dt: -2.0, dv: 0.0 });

    // Broken mode: independent cusp handles
    const brokenKf = { ...kf, handleMode: "broken" as const };
    const brokenRes = resolveHandleConstraints(brokenKf, "handleOut", { dt: 2.0, dv: 2.0 });
    expect(brokenRes.handleIn).toEqual({ dt: -0.5, dv: -0.5 });
  });
});
