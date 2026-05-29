import { describe, expect, it } from "vitest";
import { createEmptyScene } from "./schema";
import { getWebMFrameCount, WEBM_EXPORT_MAX_FRAMES } from "./export";

describe("WebM export helpers", () => {
  it("computes frame count from timeline", () => {
    const doc = createEmptyScene({
      timeline: { duration: 2, fps: 30, loop: true, tracks: [] },
      canvas: { width: 800, height: 200, background: "transparent" },
    });
    expect(getWebMFrameCount(doc)).toBe(60);
  });

  it("respects duration override", () => {
    const doc = createEmptyScene({
      timeline: { duration: 10, fps: 30, loop: false, tracks: [] },
    });
    expect(getWebMFrameCount(doc, { duration: 1, fps: 24 })).toBe(24);
  });

  it("documents max frame guard threshold", () => {
    expect(WEBM_EXPORT_MAX_FRAMES).toBeGreaterThanOrEqual(300);
  });
});
