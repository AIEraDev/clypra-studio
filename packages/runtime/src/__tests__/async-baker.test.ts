import { describe, it, expect } from "vitest";
import { AsyncAudioBakerClient } from "../audio/async-audio-baker-client";
import { SharedSpectrumBuffer } from "../audio/shared-spectrum-buffer";

describe("AsyncAudioBakerClient & SharedSpectrumBuffer", () => {
  it("should bake spectrum frames asynchronously via fallback when no Web Worker is present", async () => {
    const client = new AsyncAudioBakerClient();
    const pcmData = new Float32Array(44100);

    for (let i = 0; i < pcmData.length; i++) {
      pcmData[i] = Math.sin((2 * Math.PI * 100 * i) / 44100);
    }

    const baked = await client.bakeAudio(pcmData, 44100, 30, 512);
    expect(baked).toHaveLength(30);
    expect(baked[0].bass).toBeGreaterThan(0);
    client.terminate();
  });

  it("should store and retrieve spectrum frame values using SharedSpectrumBuffer", () => {
    const buffer = new SharedSpectrumBuffer(10);
    expect(buffer.totalFrames).toBe(10);

    buffer.setFrameSpectrum(2, 0.8, 0.4, 0.2);
    const retrieved = buffer.getFrameSpectrum(2);

    expect(retrieved.bass).toBeCloseTo(0.8);
    expect(retrieved.mids).toBeCloseTo(0.4);
    expect(retrieved.treble).toBeCloseTo(0.2);
  });
});
