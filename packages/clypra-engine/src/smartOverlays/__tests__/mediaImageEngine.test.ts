import { describe, it, expect } from "vitest";
import { MediaImageEngine } from "../mediaImageEngine.js";

describe("MediaImageEngine", () => {
  describe("Sizing Matrix Resolution", () => {
    const intrinsic16x9 = { intrinsicWidth: 1920, intrinsicHeight: 1080 }; // AR = 1.7777...

    it("should resolve (auto, auto) to intrinsic dimensions", () => {
      const res = MediaImageEngine.resolveDimensions({
        specifiedWidth: "auto",
        specifiedHeight: "auto",
        ...intrinsic16x9,
      });

      expect(res.width).toBe(1920);
      expect(res.height).toBe(1080);
      expect(res.aspectRatio).toBeCloseTo(16 / 9);
      expect(res.isAutoWidth).toBe(true);
      expect(res.isAutoHeight).toBe(true);
    });

    it("should resolve (fixed, auto) preserving aspect ratio", () => {
      const res = MediaImageEngine.resolveDimensions({
        specifiedWidth: 320,
        specifiedHeight: "auto",
        ...intrinsic16x9,
      });

      expect(res.width).toBe(320);
      expect(res.height).toBe(180); // 320 / (16/9) = 180
      expect(res.isAutoWidth).toBe(false);
      expect(res.isAutoHeight).toBe(true);
    });

    it("should resolve (auto, fixed) preserving aspect ratio", () => {
      const res = MediaImageEngine.resolveDimensions({
        specifiedWidth: "auto",
        specifiedHeight: 200,
        ...intrinsic16x9,
      });

      expect(res.height).toBe(200);
      expect(res.width).toBe(355.56); // 200 * (16/9) = 355.555...
      expect(res.isAutoWidth).toBe(true);
      expect(res.isAutoHeight).toBe(false);
    });

    it("should resolve (fixed, fixed) container-locked", () => {
      const res = MediaImageEngine.resolveDimensions({
        specifiedWidth: 400,
        specifiedHeight: 300,
        ...intrinsic16x9,
      });

      expect(res.width).toBe(400);
      expect(res.height).toBe(300);
      expect(res.isAutoWidth).toBe(false);
      expect(res.isAutoHeight).toBe(false);
    });

    it("should resolve percentage width based on container bounds", () => {
      const res = MediaImageEngine.resolveDimensions({
        specifiedWidth: "50%",
        specifiedHeight: "auto",
        containerWidth: 1000,
        containerHeight: 600,
        ...intrinsic16x9,
      });

      expect(res.width).toBe(500);
      expect(res.height).toBe(281.25); // 500 / (16/9) = 281.25
    });

    it("should correctly handle vertical 9:16 portrait images", () => {
      const portrait = { intrinsicWidth: 1080, intrinsicHeight: 1920 };
      const res = MediaImageEngine.resolveDimensions({
        specifiedWidth: 270,
        specifiedHeight: "auto",
        ...portrait,
      });

      expect(res.width).toBe(270);
      expect(res.height).toBe(480); // 270 / (9/16) = 480
    });
  });

  describe("Object-Fit & Smart Cropping", () => {
    const intrinsic = { intrinsicWidth: 1920, intrinsicHeight: 1080 };

    it("should compute fit: fill stretching to destination", () => {
      const res = MediaImageEngine.computeFitting({
        containerWidth: 400,
        containerHeight: 400,
        ...intrinsic,
        fitMode: "fill",
      });

      expect(res.destinationBox).toEqual({ dx: 0, dy: 0, dWidth: 400, dHeight: 400 });
      expect(res.sourceCrop).toEqual({ sx: 0, sy: 0, sWidth: 1920, sHeight: 1080 });
      expect(res.scaleX).toBe(400 / 1920);
      expect(res.scaleY).toBe(400 / 1080);
    });

    it("should compute fit: contain letterboxed and centered", () => {
      const res = MediaImageEngine.computeFitting({
        containerWidth: 400,
        containerHeight: 400,
        ...intrinsic,
        fitMode: "contain",
      });

      // Scale constrained by width: 400 / 1920 = 0.20833
      // Height = 1080 * (400/1920) = 225
      // dy = (400 - 225) / 2 = 87.5
      expect(res.destinationBox.dx).toBe(0);
      expect(res.destinationBox.dy).toBe(87.5);
      expect(res.destinationBox.dWidth).toBe(400);
      expect(res.destinationBox.dHeight).toBe(225);
    });

    it("should compute fit: cover with default center focal point (0.5, 0.5)", () => {
      const res = MediaImageEngine.computeFitting({
        containerWidth: 400,
        containerHeight: 400,
        ...intrinsic,
        fitMode: "cover",
      });

      // Scale constrained by height: 400 / 1080 = 0.37037...
      // Visible source width: 400 / scale = 1080
      // sx center = (1920 - 1080) / 2 = 420
      expect(res.sourceCrop.sWidth).toBe(1080);
      expect(res.sourceCrop.sHeight).toBe(1080);
      expect(res.sourceCrop.sx).toBe(420);
      expect(res.sourceCrop.sy).toBe(0);
    });

    it("should respect focal point preserving subject off-center", () => {
      // Subject face is on the left side of wide image (fx = 0.2)
      const res = MediaImageEngine.computeFitting({
        containerWidth: 400,
        containerHeight: 400,
        ...intrinsic,
        fitMode: "cover",
        focalPoint: { x: 0.2, y: 0.5 },
      });

      // Ideal center: 0.2 * 1920 = 384
      // sx = 384 - (1080 / 2) = 384 - 540 = -156 -> clamped to 0
      expect(res.sourceCrop.sx).toBe(0);
      expect(res.sourceCrop.sWidth).toBe(1080);
    });

    it("should compute circular avatar fitting cleanly", () => {
      const avatarRes = MediaImageEngine.computeCircularAvatarFitting(
        64, // 64px avatar
        800,
        600, // 4:3 image
        { x: 0.5, y: 0.2 } // Face near top
      );

      expect(avatarRes.destinationBox).toEqual({ dx: 0, dy: 0, dWidth: 64, dHeight: 64 });
      // Scale: 64 / 600 = 0.10666...
      // Visible source: 600 x 600
      expect(avatarRes.sourceCrop.sWidth).toBe(600);
      expect(avatarRes.sourceCrop.sHeight).toBe(600);
      // sx center: (800 - 600) / 2 = 100
      expect(avatarRes.sourceCrop.sx).toBe(100);
      // sy face at 0.2 -> 0.2 * 600 = 120 -> 120 - 300 = -180 -> clamped to 0
      expect(avatarRes.sourceCrop.sy).toBe(0);
    });
  });
});
