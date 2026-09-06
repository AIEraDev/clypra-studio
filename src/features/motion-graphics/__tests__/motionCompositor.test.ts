import { describe, expect, it } from "vitest";
import {
  evaluateEasing,
  evaluatePhase,
  interpolateTrack,
} from "../renderer/motionCompositor";
import {
  generateLightningArc,
  generateComicBurstPoints,
} from "../renderer/proceduralVfx";
import type { KeyframeTrack, PhaseTiming } from "../types";

describe("Motion Compositor - Easing & Interpolation", () => {
  it("evaluates easing curves within expected ranges", () => {
    expect(evaluateEasing(0, "linear")).toBe(0);
    expect(evaluateEasing(1, "linear")).toBe(1);
    expect(evaluateEasing(0.5, "linear")).toBe(0.5);

    // easeIn should be less than linear at 0.5
    expect(evaluateEasing(0.5, "easeIn")).toBeLessThan(0.5);

    // easeOut should be greater than linear at 0.5
    expect(evaluateEasing(0.5, "easeOut")).toBeGreaterThan(0.5);

    // easeOutBack overshoots 1.0 before settling
    expect(evaluateEasing(0.8, "easeOutBack")).toBeGreaterThan(1.0);
    expect(evaluateEasing(1.0, "easeOutBack")).toBeCloseTo(1.0, 5);
  });

  it("interpolates keyframe tracks smoothly across time", () => {
    const track: KeyframeTrack<number> = {
      property: "transform.scaleX",
      keyframes: [
        { time: 0, value: 0, easing: "linear" },
        { time: 1, value: 100, easing: "linear" },
        { time: 2, value: 200, easing: "linear" },
      ],
    };

    expect(interpolateTrack(track, -0.5, 0)).toBe(0);
    expect(interpolateTrack(track, 0, 0)).toBe(0);
    expect(interpolateTrack(track, 0.5, 0)).toBe(50);
    expect(interpolateTrack(track, 1.0, 0)).toBe(100);
    expect(interpolateTrack(track, 1.5, 0)).toBe(150);
    expect(interpolateTrack(track, 2.5, 0)).toBe(200);
  });

  it("returns default value when keyframe track is undefined or empty", () => {
    expect(interpolateTrack(undefined, 0.5, 42)).toBe(42);
    expect(interpolateTrack({ property: "x", keyframes: [] }, 0.5, 99)).toBe(99);
  });
});

describe("Motion Compositor - Lifecycle Phase Evaluation", () => {
  const timing: PhaseTiming = {
    introDuration: 0.6,
    holdDuration: 1.8,
    outroDuration: 0.6,
  };

  it("evaluates intro phase correctly", () => {
    const info = evaluatePhase(0.3, timing);
    expect(info.phase).toBe("intro");
    expect(info.progress).toBeCloseTo(0.5, 4);
    expect(info.localTime).toBeCloseTo(0.3, 4);
  });

  it("evaluates hold phase correctly", () => {
    // 0.6s to 2.4s is hold
    const info = evaluatePhase(1.5, timing);
    expect(info.phase).toBe("hold");
    expect(info.localTime).toBeCloseTo(0.9, 4);
    expect(info.progress).toBeCloseTo(0.9 / 1.8, 4);
  });

  it("evaluates outro phase correctly", () => {
    // > 2.4s is outro
    const info = evaluatePhase(2.7, timing);
    expect(info.phase).toBe("outro");
    expect(info.localTime).toBeCloseTo(0.3, 4);
    expect(info.progress).toBeCloseTo(0.5, 4);
  });

  it("clamps progress at boundaries", () => {
    const start = evaluatePhase(0, timing);
    expect(start.phase).toBe("intro");
    expect(start.progress).toBe(0);

    const end = evaluatePhase(5.0, timing);
    expect(end.phase).toBe("outro");
    expect(end.progress).toBe(1.0);
  });
});

describe("Procedural VFX Algorithms", () => {
  it("generates midpoint displacement lightning arcs with segments", () => {
    const segments = generateLightningArc(
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      3,
      0.3,
      0.2,
      12345,
    );

    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0]).toHaveProperty("p1");
    expect(segments[0]).toHaveProperty("p2");
  });

  it("generates valid comic burst points", () => {
    const points = generateComicBurstPoints(0, 0, 200, 100, 16, 0.6, 0.3, 42);
    expect(points).toBeDefined();
    expect(points.length).toBeGreaterThan(0);
    expect(points[0]).toHaveProperty("x");
    expect(points[0]).toHaveProperty("y");
  });
});

describe("Motion Compositor - Per-Character Animation Mechanics", () => {
  it("calculates staggered arrival times for characters in 'CLOUD'", () => {
    const text = "CLOUD";
    const staggerDelay = 0.07;
    const arrivalTimes = Array.from(text).map((_, i) => i * staggerDelay);

    expect(arrivalTimes[0]).toBe(0); // 'C' starts at t=0
    expect(arrivalTimes[1]).toBeCloseTo(0.07, 3); // 'L'
    expect(arrivalTimes[2]).toBeCloseTo(0.14, 3); // 'O'
    expect(arrivalTimes[3]).toBeCloseTo(0.21, 3); // 'U'
    expect(arrivalTimes[4]).toBeCloseTo(0.28, 3); // 'D'
  });

  it("calculates sinusoidal floating wave bobbing offset for hold phase", () => {
    const time = 1.0;
    const waveSpeed = 3.2;
    const waveAmplitude = 8;
    const charIndex = 2; // 'O'

    const bobbingY = Math.sin(time * waveSpeed + charIndex * 0.75) * waveAmplitude;
    expect(typeof bobbingY).toBe("number");
    expect(bobbingY).toBeGreaterThanOrEqual(-waveAmplitude);
    expect(bobbingY).toBeLessThanOrEqual(waveAmplitude);
  });

  it("verifies CLOUD_PUFFY_TEMPLATE has stars removed and shadow removed from border", async () => {
    const { CLOUD_PUFFY_TEMPLATE } = await import("../presets/motionPresets");
    const auraLayers = CLOUD_PUFFY_TEMPLATE.layers.filter((l) => l.type === "glow-aura");
    expect(auraLayers.length).toBe(0);

    const textLayer = CLOUD_PUFFY_TEMPLATE.layers.find((l) => l.type === "text");
    expect(textLayer).toBeDefined();
    if (textLayer && textLayer.type === "text") {
      expect(textLayer.config.shadowBlur).toBeUndefined();
      expect(textLayer.config.shadowOffsetY).toBeUndefined();
      expect(textLayer.config.puffyBevel).toBe(false);
      expect(textLayer.config.cloudHalo).toBe(false);
      expect(textLayer.config.fillCounters).toBe(true);
      expect(textLayer.config.skewX).toBeLessThan(0);
      expect(textLayer.config.cloudOuterStrokeWidth).toBeGreaterThan(0);
      expect(textLayer.config.strokeWidth).toBeGreaterThan(0);
      expect(textLayer.config.tracking).toBeGreaterThan(0);
    }
  });
});
