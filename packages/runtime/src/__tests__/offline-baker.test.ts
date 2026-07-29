import { describe, it, expect } from "vitest";
import { OfflineAudioSpectrumBaker } from "../audio/offline-audio-baker";

describe("OfflineAudioSpectrumBaker — Deterministic Offline Spectrum Baker", () => {
  it("should bake spectrum frames deterministically from Float32 PCM audio data", () => {
    const baker = new OfflineAudioSpectrumBaker();

    // Create 2 seconds of 44100Hz audio (88200 PCM samples)
    const pcmData = new Float32Array(88200);

    // Generate a 100Hz sine wave (bass frequency)
    for (let i = 0; i < pcmData.length; i++) {
      pcmData[i] = Math.sin((2 * Math.PI * 100 * i) / 44100);
    }

    const duration = baker.loadRawPCMData(44100, pcmData);
    expect(duration).toBeCloseTo(2.0);

    // Bake at 30 fps -> 60 total frames
    const baked = baker.bakeSpectrumForExport(30, 512);

    expect(baked).toHaveLength(60);
    expect(baked[0].frameIndex).toBe(0);
    expect(baked[0].timestamp).toBe(0.0);
    expect(baked[0].bass).toBeGreaterThan(0.0);
    expect(baked[30].frameIndex).toBe(30);
    expect(baked[30].timestamp).toBe(1.0);
  });
});
