import { describe, it, expect } from "vitest";
import { LOTTIE_ANIM_PRESETS, ENTRANCE_PRESETS, EXIT_PRESETS, LOOP_PRESETS, EMPHASIS_PRESETS, bakeAnimationIntoLayer, clearAnimationFromLayer, getAnimPreset } from "./lottieTextAnimations";
import { createBlankLottie, addTextLayer } from "./lottieEditor";

function makeTestLottie() {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addTextLayer(l, "Test Text", "HELLO");
  return l;
}

describe("lottieTextAnimations", () => {
  it("exports the correct number of presets per category", () => {
    expect(ENTRANCE_PRESETS.length).toBeGreaterThanOrEqual(10);
    expect(EXIT_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(LOOP_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(EMPHASIS_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(LOTTIE_ANIM_PRESETS.length).toBeGreaterThanOrEqual(25);
  });

  it("getAnimPreset returns correct preset by id", () => {
    const preset = getAnimPreset("fade-in");
    expect(preset).toBeDefined();
    expect(preset?.name).toBe("Fade In");
    expect(preset?.category).toBe("entrance");
  });

  it("getAnimPreset returns undefined for unknown id", () => {
    expect(getAnimPreset("nonexistent-preset")).toBeUndefined();
  });

  it("bakeAnimationIntoLayer applies opacity keyframes for fade-in", () => {
    const lottie = makeTestLottie();
    const preset = getAnimPreset("fade-in")!;
    const result = bakeAnimationIntoLayer(lottie, 0, preset, {
      startFrame: 0,
      endFrame: 20,
      totalFrames: 120,
      compW: 1920,
      compH: 1080,
    });

    const layer = result.layers[0];
    expect(layer.ks.o.a).toBe(1); // animated
    expect(Array.isArray(layer.ks.o.k)).toBe(true);
    expect(layer.ks.o.k.length).toBeGreaterThanOrEqual(2);
    // First keyframe should be 0 opacity
    expect(layer.ks.o.k[0].s).toBe(0);
    // Last keyframe should be 100 opacity
    const last = layer.ks.o.k[layer.ks.o.k.length - 1];
    expect(last.s).toBe(100);
  });

  it("bakeAnimationIntoLayer applies position keyframes for slide-up", () => {
    const lottie = makeTestLottie();
    const preset = getAnimPreset("slide-up")!;
    const result = bakeAnimationIntoLayer(lottie, 0, preset, {
      startFrame: 0,
      endFrame: 25,
      totalFrames: 120,
      compW: 1920,
      compH: 1080,
    });

    const layer = result.layers[0];
    expect(layer.ks.p.a).toBe(1); // animated
    expect(Array.isArray(layer.ks.p.k)).toBe(true);
  });

  it("bakeAnimationIntoLayer applies scale keyframes for zoom-in", () => {
    const lottie = makeTestLottie();
    const preset = getAnimPreset("zoom-in")!;
    const result = bakeAnimationIntoLayer(lottie, 0, preset, {
      startFrame: 0,
      endFrame: 22,
      totalFrames: 120,
      compW: 1920,
      compH: 1080,
    });

    const layer = result.layers[0];
    expect(layer.ks.s.a).toBe(1); // animated
    const firstKf = layer.ks.s.k[0];
    expect(Array.isArray(firstKf.s)).toBe(true);
    expect(firstKf.s[0]).toBe(0); // starts at 0 scale
  });

  it("bakeAnimationIntoLayer applies rotation keyframes for rotate-in", () => {
    const lottie = makeTestLottie();
    const preset = getAnimPreset("rotate-in")!;
    const result = bakeAnimationIntoLayer(lottie, 0, preset, {
      startFrame: 0,
      endFrame: 28,
      totalFrames: 120,
      compW: 1920,
      compH: 1080,
    });

    const layer = result.layers[0];
    expect(layer.ks.r.a).toBe(1); // animated
    expect(layer.ks.r.k[0].s).toBe(-90); // starts at -90 degrees
  });

  it("clearAnimationFromLayer reverts animated properties to static", () => {
    const lottie = makeTestLottie();
    const preset = getAnimPreset("fade-in")!;
    let result = bakeAnimationIntoLayer(lottie, 0, preset, {
      startFrame: 0,
      endFrame: 20,
      totalFrames: 120,
      compW: 1920,
      compH: 1080,
    });

    // Verify it's animated
    expect(result.layers[0].ks.o.a).toBe(1);

    // Clear it
    result = clearAnimationFromLayer(result, 0, ["ks.o"]);
    expect(result.layers[0].ks.o.a).toBe(0); // back to static
  });

  it("bakeAnimationIntoLayer does not mutate original lottie data", () => {
    const lottie = makeTestLottie();
    const original = JSON.stringify(lottie);
    const preset = getAnimPreset("fade-in")!;
    bakeAnimationIntoLayer(lottie, 0, preset, {
      startFrame: 0,
      endFrame: 20,
      totalFrames: 120,
      compW: 1920,
      compH: 1080,
    });
    expect(JSON.stringify(lottie)).toBe(original);
  });

  it("all presets have required fields", () => {
    for (const preset of LOTTIE_ANIM_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.category).toMatch(/^(entrance|exit|loop|emphasis)$/);
      expect(preset.defaultDurationFrames).toBeGreaterThan(0);
      expect(typeof preset.buildTracks).toBe("function");
    }
  });

  it("all presets produce at least one track", () => {
    for (const preset of LOTTIE_ANIM_PRESETS) {
      const tracks = preset.buildTracks({
        layerIndex: 0,
        startFrame: 0,
        endFrame: preset.defaultDurationFrames,
        totalFrames: 120,
        compW: 1920,
        compH: 1080,
      });
      expect(tracks.length).toBeGreaterThan(0);
      for (const track of tracks) {
        expect(track.path).toBeTruthy();
        expect(track.keyframes.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
