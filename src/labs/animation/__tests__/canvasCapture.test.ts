import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { captureAnimationThumbnail, captureAnimationVideo } from "../services/canvasCapture";
import { STARTER_ANIMATION_PRESETS } from "../data/starterPresets";

// ── Test 1: captureAnimationVideo returns null in happy-dom (no MediaRecorder) ──

describe("captureAnimationVideo", () => {
  it("returns null in happy-dom because MediaRecorder is not available", async () => {
    // happy-dom does not implement MediaRecorder — the guard in the service
    // should detect this and return null immediately.
    const preset = STARTER_ANIMATION_PRESETS[0];
    const result = await captureAnimationVideo(preset, "Hello", 0.1);
    expect(result).toBeNull();
  });

  it("returns null with STARTER_ANIMATION_PRESETS[0] and duration=0.5 in happy-dom", async () => {
    // Confirms the best-effort guard works regardless of preset or duration.
    const preset = STARTER_ANIMATION_PRESETS[0];
    const result = await captureAnimationVideo(preset, "ABC123", 0.5);
    expect(result).toBeNull();
  });
});

// ── Test 2: captureAnimationThumbnail returns a File named 'thumbnail.png' ────

describe("captureAnimationThumbnail", () => {
  beforeEach(() => {
    // Mock URL.createObjectURL / revokeObjectURL (not implemented in happy-dom)
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });

    // Mock HTMLCanvasElement.prototype.toBlob to invoke the callback with a fake Blob
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (callback: BlobCallback) {
        const fakeBlob = new Blob(["fake-png-data"], { type: "image/png" });
        callback(fakeBlob);
      },
    );

    // Mock Image so that onload fires synchronously after src assignment
    const OriginalImage = globalThis.Image;
    vi.stubGlobal(
      "Image",
      class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: ((e: unknown) => void) | null = null;
        private _src = "";

        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          // Fire onload asynchronously so the Promise chain resolves
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      },
    );
    void OriginalImage; // suppress unused warning
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns a File named 'thumbnail.png' with type 'image/png'", async () => {
    // Provide a minimal div element with a bounding rect
    const div = document.createElement("div");
    div.style.width = "200px";
    div.style.height = "100px";
    document.body.appendChild(div);

    // Override getBoundingClientRect to return non-zero dimensions
    vi.spyOn(div, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const file = await captureAnimationThumbnail(div);

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("thumbnail.png");
    expect(file.type).toBe("image/png");

    document.body.removeChild(div);
  });
});
