import { describe, it, expect } from "vitest";
import type { AnimatedProperty } from "@clypra-studio/types";
import { KeyframeEvaluator } from "../keyframe/keyframe-evaluator";

describe("KeyframeEvaluator — Interpolation & Bezier Easing Engine", () => {
  const evaluator = new KeyframeEvaluator();

  it("should evaluate step hold easing", () => {
    const prop: AnimatedProperty = {
      id: "u_opacity",
      type: "float",
      defaultValue: 1.0,
      keyframes: [
        { time: 0.0, value: 0.0, easing: "hold" },
        { time: 2.0, value: 1.0, easing: "hold" },
      ],
    };

    expect(evaluator.evaluate(prop, -1.0)).toBe(0.0);
    expect(evaluator.evaluate(prop, 0.0)).toBe(0.0);
    expect(evaluator.evaluate(prop, 1.0)).toBe(0.0);
    expect(evaluator.evaluate(prop, 2.0)).toBe(1.0);
    expect(evaluator.evaluate(prop, 3.0)).toBe(1.0);
  });

  it("should evaluate linear interpolation", () => {
    const prop: AnimatedProperty = {
      id: "u_brightness",
      type: "float",
      defaultValue: 0.0,
      keyframes: [
        { time: 1.0, value: 10.0, easing: "linear" },
        { time: 3.0, value: 30.0, easing: "linear" },
      ],
    };

    expect(evaluator.evaluate(prop, 1.0)).toBe(10.0);
    expect(evaluator.evaluate(prop, 2.0)).toBe(20.0);
    expect(evaluator.evaluate(prop, 3.0)).toBe(30.0);
  });

  it("should evaluate cubic-bezier ease-in-out curve using Newton-Raphson solver", () => {
    const prop: AnimatedProperty = {
      id: "u_zoom",
      type: "float",
      defaultValue: 1.0,
      keyframes: [
        {
          time: 0.0,
          value: 0.0,
          easing: "cubic-bezier",
          controlPoints: [0.42, 0.0, 0.58, 1.0], // Symmetric ease-in-out
        },
        { time: 1.0, value: 100.0, easing: "linear" },
      ],
    };

    const midVal = evaluator.evaluate(prop, 0.5);
    expect(midVal).toBeCloseTo(50.0, 1);
  });
});
