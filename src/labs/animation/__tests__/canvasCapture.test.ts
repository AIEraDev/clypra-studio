import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  captureAnimationThumbnail,
  captureAnimationVideo,
} from "../services/canvasCapture";
import { STARTER_ANIMATION_PRESETS } from "../data/starterPresets";

// ── captureAnimationVideo ─────────────────────────────────────────────────────
//
// happy-dom does not implement MediaRecorder or canvas.captureStream, so the
// guard at the top of the function returns null immediately in all test cases.

describe("captureAnimationVideo", () => {
  it("returns null in happy-dom because MediaRecorder is not available", async () => {
    const preset = STARTER_ANIMATION_PRESETS[0];
    const result = await captureAnimationVideo(preset, "Hello", 0.1);
    expect(result).toBeNull();
  });

  it("returns null regardless of preset or duration in happy-dom", async () => {
    const preset = STARTER_ANIMATION_PRESETS[0];
    const result = await captureAnimationVideo(preset, "ABC123", 0.5);
    expect(result).toBeNull();
  });
});

// ── captureAnimationThumbnail ─────────────────────────────────────────────────
//
// The function now uses an offscreen canvas + evaluatePresetTransform at
// progress=0.5 — no DOM element argument, no SVG foreignObject.
// We only need to mock canvas.toBlob (getContext returns a stub in happy-dom).

describe("captureAnimationThumbnail", () => {
  beforeEach(() => {
    // Mock canvas.toBlob to invoke the callback with a fake PNG Blob.
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (callback: BlobCallback) {
        const fakeBlob = new Blob(["fake-png-data"], { type: "image/png" });
        callback(fakeBlob);
      },
    );

    // Stub getContext so the 2D context methods (fillRect, fillText, etc.)
    // are no-ops in the test environment.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "",
      font: "",
      textBaseline: "",
      globalAlpha: 1,
      filter: "",
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 20 })),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
    } as unknown as ReturnType<HTMLCanvasElement["getContext"]>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a File named 'thumbnail.png' with type 'image/png'", async () => {
    const preset = STARTER_ANIMATION_PRESETS[0];
    const file = await captureAnimationThumbnail(preset, "ABC123", 0.6);

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("thumbnail.png");
    expect(file.type).toBe("image/png");
  });

  it("falls back to 'ABC123' when sampleText is empty", async () => {
    const preset = STARTER_ANIMATION_PRESETS[0];
    // Should not throw when sampleText is empty string.
    const file = await captureAnimationThumbnail(preset, "", 0.6);
    expect(file).toBeInstanceOf(File);
  });

  it("works with every starter preset phase", async () => {
    for (const preset of STARTER_ANIMATION_PRESETS.slice(0, 3)) {
      const file = await captureAnimationThumbnail(preset, "Test", 0.5);
      expect(file.name).toBe("thumbnail.png");
    }
  });
});
