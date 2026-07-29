import { describe, it, expect, vi } from "vitest";
import type { KeyframePoint } from "@clypra-studio/types";
import { PlaybackEngine } from "../keyframe/playback-engine";

describe("PlaybackEngine — 60FPS Timeline Loop Bridge", () => {
  it("should track property keyframe tracks and write zero-copy uniform buffer data", () => {
    const mockCreateBuffer = vi.fn().mockReturnValue({ label: "Uniform Buffer" });
    const mockWriteBuffer = vi.fn();

    const mockDevice = {
      createBuffer: mockCreateBuffer,
      queue: {
        writeBuffer: mockWriteBuffer,
      },
    } as unknown as GPUDevice;

    const engine = new PlaybackEngine(mockDevice, 256);

    const track1: KeyframePoint[] = [
      { id: "k0", time: 0.0, value: 1.0, easing: "linear" },
      { id: "k1", time: 2.0, value: 3.0, easing: "linear" },
    ];

    engine.updateTrackKeyframes("u_saturation", track1);

    // Seek to 1.0s (midpoint = 2.0)
    engine.seek(1.0);

    expect(engine.getCurrentTime()).toBe(1.0);
    expect(mockWriteBuffer).toHaveBeenCalled();
  });
});
