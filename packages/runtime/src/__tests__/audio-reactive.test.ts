import { describe, it, expect } from "vitest";
import type { AnimatedProperty, AudioBinding } from "@clypra-studio/types";
import { AudioSpectrumAnalyzer } from "../audio/audio-spectrum-analyzer";
import { AudioReactiveKeyframeEngine } from "../audio/audio-reactive-engine";

describe("AudioSpectrumAnalyzer & AudioReactiveKeyframeEngine", () => {
  it("should calculate FFT band energy for bass, mids, and treble", () => {
    const analyzer = new AudioSpectrumAnalyzer();

    // Create 256 FFT frequency bins
    const mockFreqData = new Uint8Array(256);
    // Fill bass bins with high energy (200 out of 255)
    for (let i = 0; i < 10; i++) {
      mockFreqData[i] = 200;
    }

    const bassEnergy = analyzer.getBandEnergy("bass", undefined, 44100, mockFreqData);
    expect(bassEnergy).toBeGreaterThan(0.5);
  });

  it("should combine keyframe values with audio spectrum modulation", () => {
    const analyzer = new AudioSpectrumAnalyzer();
    const engine = new AudioReactiveKeyframeEngine(analyzer);

    const prop: AnimatedProperty = {
      id: "u_bloom_intensity",
      type: "float",
      defaultValue: 1.0,
      keyframes: [{ time: 0.0, value: 1.0, easing: "linear" }],
    };

    const mockFreqData = new Uint8Array(256);
    mockFreqData.fill(200);

    const binding: AudioBinding = {
      propertyId: "u_bloom_intensity",
      band: "bass",
      sensitivity: 2.0,
      minThreshold: 0.1,
      smoothing: 0.0, // Instant
      blendMode: "add",
    };

    const evaluated = engine.evaluateProperty(prop, 0.0, binding, mockFreqData);
    expect(evaluated).toBeGreaterThan(1.0);
  });
});
