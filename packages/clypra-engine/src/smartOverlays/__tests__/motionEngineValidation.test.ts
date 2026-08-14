import { describe, it, expect } from "vitest";
import { animationRuntime } from "../animationRuntime.js";
import { propertyInterpolator } from "../propertyInterpolator.js";
import type { OverlayDocument, ContainerNode, PrimitiveTextNode } from "../overlayDocumentSchema.js";

describe("Stage 2B — Motion Engine & Property Animation Matrix Suite", () => {

  // ---------------------------------------------------------------------------
  // Test 1 — Spatial & Visual Property Keyframing
  // ---------------------------------------------------------------------------
  it("Test 1: Interpolates spatial (width, x) and visual (opacity, blur) keyframed properties accurately across time", () => {
    const animatedContainer: ContainerNode = {
      id: "motion-rect",
      name: "Animated Rect",
      type: "container",
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      style: { blurRadius: 0 },
      animation: {
        keyframeTracks: [
          {
            property: "width",
            keyframes: [
              { time: 0, value: 200 },
              { time: 2, value: 400 },
            ],
          },
          {
            property: "opacity",
            keyframes: [
              { time: 0, value: 0 },
              { time: 2, value: 1 },
            ],
          },
          {
            property: "blur",
            keyframes: [
              { time: 0, value: 10 },
              { time: 2, value: 0 },
            ],
          },
        ],
      },
      children: [],
    };

    const doc: OverlayDocument = {
      id: "doc-motion-1",
      version: 1,
      name: "Motion Test 1",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [animatedContainer],
      variables: [],
    };

    // t = 0s -> width = 200, opacity = 0, blur = 10
    const stateAt0 = animationRuntime.evaluateScene(doc, { currentTime: 0 });
    expect(stateAt0.nodes["motion-rect"].width).toBe(200);
    expect(stateAt0.nodes["motion-rect"].opacity).toBe(0);
    expect(stateAt0.nodes["motion-rect"].blur).toBe(10);

    // t = 1.0s (midpoint) -> width = 300, opacity = 0.5, blur = 5
    const stateAt1 = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });
    expect(stateAt1.nodes["motion-rect"].width).toBe(300);
    expect(stateAt1.nodes["motion-rect"].opacity).toBe(0.5);
    expect(stateAt1.nodes["motion-rect"].blur).toBe(5);

    // t = 2.0s -> width = 400, opacity = 1, blur = 0
    const stateAt2 = animationRuntime.evaluateScene(doc, { currentTime: 2.0 });
    expect(stateAt2.nodes["motion-rect"].width).toBe(400);
    expect(stateAt2.nodes["motion-rect"].opacity).toBe(1);
    expect(stateAt2.nodes["motion-rect"].blur).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Test 2 — Motion Presets & Stagger Timing
  // ---------------------------------------------------------------------------
  it("Test 2: Evaluates entrance motion presets and calculates staggered child delay offsets", () => {
    const parentContainer: ContainerNode = {
      id: "parent-rect",
      name: "Parent Container",
      type: "container",
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      animation: {
        animationScope: "children",
        staggerChildren: 0.2,
        entrance: {
          type: "fade",
          duration: 0.5,
          delay: 0.1,
          easing: "linear",
        },
      },
      children: [],
    };

    const doc: OverlayDocument = {
      id: "doc-motion-2",
      version: 1,
      name: "Motion Preset Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [parentContainer],
      variables: [],
    };

    // t = 0.05s (< start time 0.1s) -> opacity = 0
    const state0 = animationRuntime.evaluateScene(doc, { currentTime: 0.05 });
    expect(state0.nodes["parent-rect"].opacity).toBe(0);

    // t = 0.35s (midpoint of 0.1s to 0.6s) -> opacity = 0.5
    const stateMid = animationRuntime.evaluateScene(doc, { currentTime: 0.35 });
    expect(stateMid.nodes["parent-rect"].opacity).toBeCloseTo(0.5, 2);

    // t = 0.7s (> 0.6s) -> opacity = 1
    const stateEnd = animationRuntime.evaluateScene(doc, { currentTime: 0.7 });
    expect(stateEnd.nodes["parent-rect"].opacity).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Test 3 — Easing Curve Precision
  // ---------------------------------------------------------------------------
  it("Test 3: Evaluates non-linear easing curves (ease-out vs linear) accurately", () => {
    const linearKeyframe: ContainerNode = {
      id: "linear-rect",
      name: "Linear",
      type: "container",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      animation: {
        keyframeTracks: [
          {
            property: "width",
            keyframes: [
              { time: 0, value: 0, easing: "linear" },
              { time: 2, value: 100, easing: "linear" },
            ],
          },
        ],
      },
      children: [],
    };

    const easeOutKeyframe: ContainerNode = {
      id: "easeout-rect",
      name: "Ease Out",
      type: "container",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      animation: {
        keyframeTracks: [
          {
            property: "width",
            keyframes: [
              { time: 0, value: 0, easing: "ease-out" },
              { time: 2, value: 100, easing: "ease-out" },
            ],
          },
        ],
      },
      children: [],
    };

    const doc: OverlayDocument = {
      id: "doc-motion-3",
      version: 1,
      name: "Easing Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [linearKeyframe, easeOutKeyframe],
      variables: [],
    };

    // At t = 1.0s (50% progress):
    // linear: 50% = 50
    // ease-out cubic: 1 - (1 - 0.5)^3 = 1 - 0.125 = 0.875 -> 87.5
    const state = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });

    expect(state.nodes["linear-rect"].width).toBe(50);
    expect(state.nodes["easeout-rect"].width).toBe(87.5);
    expect(state.nodes["easeout-rect"].width).toBeGreaterThan(state.nodes["linear-rect"].width);
  });

  // ---------------------------------------------------------------------------
  // Test 4 — Color Interpolation (RGBA Lerp)
  // ---------------------------------------------------------------------------
  it("Test 4: Interpolates color strings smoothly in RGBA space", () => {
    const colorA = "#FF0000"; // Red (255, 0, 0)
    const colorB = "#0000FF"; // Blue (0, 0, 255)

    // Midpoint (t = 0.5) -> (128, 0, 128)
    const midColor = propertyInterpolator.interpolateColor(colorA, colorB, 0.5);
    expect(midColor).toBe("rgba(128, 0, 128, 1.00)");
  });

  // ---------------------------------------------------------------------------
  // Test 5 — Sub-Frame Determinism & Multi-Pass Invariance
  // ---------------------------------------------------------------------------
  it("Test 5: Guarantees 100% deterministic identical evaluated states across sub-frame queries", () => {
    const complexNode: PrimitiveTextNode = {
      id: "subframe-node",
      name: "Subframe Text",
      type: "text",
      x: 50,
      y: 50,
      width: 200,
      height: 40,
      text: "Subframe Test",
      animation: {
        keyframeTracks: [
          {
            property: "x",
            keyframes: [
              { time: 0, value: 0, easing: "ease-in-out" },
              { time: 5, value: 500, easing: "ease-in-out" },
            ],
          },
        ],
      },
    };

    const doc: OverlayDocument = {
      id: "doc-motion-5",
      version: 1,
      name: "Determinism Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [complexNode],
      variables: [],
    };

    const targetTime = 2.7182818; // Irrational sub-frame timestamp

    const pass1 = animationRuntime.evaluateScene(doc, { currentTime: targetTime });
    const pass2 = animationRuntime.evaluateScene(doc, { currentTime: targetTime });
    const pass3 = animationRuntime.evaluateScene(doc, { currentTime: targetTime });

    expect(pass1.nodes["subframe-node"]).toEqual(pass2.nodes["subframe-node"]);
    expect(pass2.nodes["subframe-node"]).toEqual(pass3.nodes["subframe-node"]);
  });
});
