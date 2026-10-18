import { describe, it, expect } from "vitest";
import {
  evaluateEasing,
  evaluateTrackValue,
  calculateStaggerProgress,
  evaluatePresetTransform,
} from "../services/animationEvaluator";
import { STARTER_ANIMATION_PRESETS } from "../data/starterPresets";
import type { TextAnimationPreset } from "../../../types/animation";

describe("Animation Lab Evaluator & Motion Engine", () => {
  describe("Easing Curves", () => {
    it("evaluates linear easing as identity", () => {
      expect(evaluateEasing("linear", 0.0)).toBe(0.0);
      expect(evaluateEasing("linear", 0.5)).toBe(0.5);
      expect(evaluateEasing("linear", 1.0)).toBe(1.0);
    });

    it("evaluates easeInQuad and easeOutQuad correctly", () => {
      expect(evaluateEasing("easeInQuad", 0.5)).toBe(0.25);
      expect(evaluateEasing("easeOutQuad", 0.5)).toBe(0.75);
    });

    it("evaluates easeOutBack with expected overshoot (> 1.0)", () => {
      const mid = evaluateEasing("easeOutBack", 0.8);
      expect(mid).toBeGreaterThan(1.0); // Overshoots
      expect(evaluateEasing("easeOutBack", 1.0)).toBeCloseTo(1.0, 2);
    });

    it("evaluates cubic Bézier curve approximation", () => {
      const curve = { type: "bezier" as const, x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 };
      expect(evaluateEasing(curve, 0.0)).toBeCloseTo(0.0, 2);
      expect(evaluateEasing(curve, 1.0)).toBeCloseTo(1.0, 2);
      expect(evaluateEasing(curve, 0.5)).toBeGreaterThan(0.5);
    });
  });

  describe("Track Value Interpolation", () => {
    const track = {
      property: "translateY" as const,
      keyframes: [
        { progress: 0.0, value: 60, easing: "linear" as const },
        { progress: 1.0, value: 0 },
      ],
    };

    it("returns boundary values at t=0 and t=1", () => {
      expect(evaluateTrackValue(track, 0.0)).toBe(60);
      expect(evaluateTrackValue(track, 1.0)).toBe(0);
    });

    it("linearly interpolates at midpoint", () => {
      expect(evaluateTrackValue(track, 0.5)).toBe(30);
    });

    it("clamps values before t=0 and after t=1", () => {
      expect(evaluateTrackValue(track, -0.2)).toBe(60);
      expect(evaluateTrackValue(track, 1.5)).toBe(0);
    });
  });

  describe("Glyph Stagger Sequencing", () => {
    it("returns overall progress when stagger is disabled", () => {
      expect(calculateStaggerProgress(0.5, 0, 5, undefined)).toBe(0.5);
      expect(calculateStaggerProgress(0.5, 3, 5, { unit: "none", overlap: 0.5, order: "left-to-right" })).toBe(0.5);
    });

    it("delays later glyphs in left-to-right stagger order", () => {
      const stagger = { unit: "character" as const, overlap: 0.2, order: "left-to-right" as const };
      const char0Progress = calculateStaggerProgress(0.3, 0, 4, stagger);
      const char3Progress = calculateStaggerProgress(0.3, 3, 4, stagger);

      // Character 0 starts earlier than Character 3
      expect(char0Progress).toBeGreaterThan(char3Progress);
    });

    it("delays earlier glyphs in right-to-left stagger order", () => {
      const stagger = { unit: "character" as const, overlap: 0.2, order: "right-to-left" as const };
      const char0Progress = calculateStaggerProgress(0.3, 0, 4, stagger);
      const char3Progress = calculateStaggerProgress(0.3, 3, 4, stagger);

      // Character 3 starts earlier than Character 0
      expect(char3Progress).toBeGreaterThan(char0Progress);
    });

    it("gives every glyph the same local timing window", () => {
      const stagger = { unit: "character" as const, overlap: 0.5, order: "left-to-right" as const };
      expect(calculateStaggerProgress(1, 0, 6, stagger)).toBe(1);
      expect(calculateStaggerProgress(1, 5, 6, stagger)).toBe(1);
    });
  });

  describe("Starter Preset Evaluation", () => {
    it("evaluates Slide Up entrance preset correctly across lifecycle", () => {
      const slideUp = STARTER_ANIMATION_PRESETS.find((p) => p.id === "anim-in-slide-up")!;
      expect(slideUp).toBeDefined();

      const start = evaluatePresetTransform(slideUp, 0.0);
      expect(start.opacity).toBe(0);
      expect(start.translateY).toBe(60);

      const end = evaluatePresetTransform(slideUp, 1.0);
      expect(end.opacity).toBe(1);
      expect(end.translateY).toBe(0);
    });

    it("evaluates Fade Out exit preset correctly across lifecycle", () => {
      const fadeOut = STARTER_ANIMATION_PRESETS.find((p) => p.id === "anim-out-fade")!;
      expect(fadeOut).toBeDefined();

      const start = evaluatePresetTransform(fadeOut, 0.0);
      expect(start.opacity).toBe(1);

      const end = evaluatePresetTransform(fadeOut, 1.0);
      expect(end.opacity).toBe(0);
    });

    it("evaluates Pulse loop preset returning to scale 1.0 at full cycle", () => {
      const pulse = STARTER_ANIMATION_PRESETS.find((p) => p.id === "anim-loop-pulse")!;
      expect(pulse).toBeDefined();

      const start = evaluatePresetTransform(pulse, 0.0);
      expect(start.scaleX).toBe(1.0);

      const mid = evaluatePresetTransform(pulse, 0.5);
      expect(mid.scaleX).toBeGreaterThan(1.05); // Pulsed up

      const end = evaluatePresetTransform(pulse, 1.0);
      expect(end.scaleX).toBeCloseTo(1.0, 2); // Returned to base
    });

    it("ships every requested CapCut-inspired preset with editable tracks", () => {
      const names = [
        "Blur to the Left", "Pixel Cursor", "Flip Bounce", "Chroma Water",
        "3D Neon Turn", "Halved Text", "Flame Puff", "Sunset Rush",
        "Ember Breath", "Flying Up", "Glitter Comet", "Double Cursor",
        "Letter Reveal", "Flying In", "Electric Stream", "Cut Echoes",
        "LED Text BG", "Offset Typing", "Petal Swish", "Dot Cursor",
        "Center Splash", "Slanted Open", "Reflection Glitch", "Star Wiggle",
        "Cyber Line", "Display Shine", "Dust Shine", "Coal Scrub-In",
      ];

      for (const name of names) {
        const preset = STARTER_ANIMATION_PRESETS.find((candidate) => candidate.name === name);
        expect(preset, `${name} should be included in the starter catalog`).toBeDefined();
        expect(preset?.tracks.length).toBeGreaterThan(0);
      }
    });
  });
});
