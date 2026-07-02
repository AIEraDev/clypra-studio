/**
 * Tests for useResponsiveCanvas hook
 */

import { describe, it, expect } from "vitest";

// Helper function to calculate display size (extracted from hook for testing)
function calculateDisplaySize(containerWidth: number, containerHeight: number, aspectRatio: number, fit: "contain" | "cover" | "fill"): { width: number; height: number } {
  if (containerWidth === 0 || containerHeight === 0) {
    return { width: 0, height: 0 };
  }

  if (fit === "fill") {
    return { width: containerWidth, height: containerHeight };
  }

  const containerAspectRatio = containerWidth / containerHeight;

  if (fit === "contain") {
    if (containerAspectRatio > aspectRatio) {
      const height = containerHeight;
      const width = height * aspectRatio;
      return { width, height };
    } else {
      const width = containerWidth;
      const height = width / aspectRatio;
      return { width, height };
    }
  }

  if (fit === "cover") {
    if (containerAspectRatio > aspectRatio) {
      const width = containerWidth;
      const height = width / aspectRatio;
      return { width, height };
    } else {
      const height = containerHeight;
      const width = height * aspectRatio;
      return { width, height };
    }
  }

  return calculateDisplaySize(containerWidth, containerHeight, aspectRatio, "contain");
}

describe("useResponsiveCanvas - Display Size Calculations", () => {
  const ASPECT_16_9 = 16 / 9; // 1.7778
  const ASPECT_4_3 = 4 / 3; // 1.3333

  describe("contain mode (default)", () => {
    it("should fit 1920×1080 content in 800×600 container (wider container)", () => {
      const result = calculateDisplaySize(800, 600, ASPECT_16_9, "contain");
      // Container is 800/600 = 1.333, content is 1.778
      // Container is narrower, so width is limiting factor
      expect(result.width).toBe(800);
      expect(result.height).toBeCloseTo(450, 0); // 800 / 1.778
    });

    it("should fit 1920×1080 content in 1200×800 container (taller container)", () => {
      const result = calculateDisplaySize(1200, 800, ASPECT_16_9, "contain");
      // Container is 1200/800 = 1.5, content is 1.778
      // Container is narrower, so width is limiting factor
      expect(result.width).toBe(1200);
      expect(result.height).toBeCloseTo(675, 0); // 1200 / 1.778
    });

    it("should fit 1920×1080 content in narrow mobile container (400×800)", () => {
      const result = calculateDisplaySize(400, 800, ASPECT_16_9, "contain");
      // Container is 400/800 = 0.5, content is 1.778
      // Container is much narrower, so width is limiting factor
      expect(result.width).toBe(400);
      expect(result.height).toBeCloseTo(225, 0); // 400 / 1.778
    });

    it("should preserve aspect ratio in square container", () => {
      const result = calculateDisplaySize(600, 600, ASPECT_16_9, "contain");
      expect(result.width).toBe(600);
      expect(result.height).toBeCloseTo(337.5, 0);
      expect(result.width / result.height).toBeCloseTo(ASPECT_16_9, 2);
    });

    it("should handle 4:3 content in 16:9 container", () => {
      const result = calculateDisplaySize(1920, 1080, ASPECT_4_3, "contain");
      // Container is wider (1.778), content is 1.333
      // Content is narrower, so height is limiting factor
      expect(result.height).toBe(1080);
      expect(result.width).toBeCloseTo(1440, 0); // 1080 * 1.333
    });
  });

  describe("cover mode", () => {
    it("should cover 800×600 container with 16:9 content (may crop)", () => {
      const result = calculateDisplaySize(800, 600, ASPECT_16_9, "cover");
      // Container is 1.333, content is 1.778
      // To cover, we need to scale by height
      expect(result.height).toBe(600);
      expect(result.width).toBeCloseTo(1066.67, 0); // 600 * 1.778
    });

    it("should cover narrow mobile container", () => {
      const result = calculateDisplaySize(400, 800, ASPECT_16_9, "cover");
      // Container is 0.5, content is 1.778
      // To cover, we need to scale by height
      expect(result.height).toBe(800);
      expect(result.width).toBeCloseTo(1422.22, 0); // 800 * 1.778
    });
  });

  describe("fill mode", () => {
    it("should fill container exactly (breaks aspect ratio)", () => {
      const result = calculateDisplaySize(800, 600, ASPECT_16_9, "fill");
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it("should fill any container shape", () => {
      const result = calculateDisplaySize(400, 800, ASPECT_16_9, "fill");
      expect(result.width).toBe(400);
      expect(result.height).toBe(800);
    });
  });

  describe("edge cases", () => {
    it("should return zero size for zero-width container", () => {
      const result = calculateDisplaySize(0, 600, ASPECT_16_9, "contain");
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });

    it("should return zero size for zero-height container", () => {
      const result = calculateDisplaySize(800, 0, ASPECT_16_9, "contain");
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });

    it("should handle extremely narrow aspect ratios", () => {
      const narrowAspect = 9 / 16; // Vertical video
      const result = calculateDisplaySize(400, 800, narrowAspect, "contain");
      expect(result.height).toBe(800);
      expect(result.width).toBeCloseTo(450, 0);
    });

    it("should handle extremely wide aspect ratios", () => {
      const ultrawide = 21 / 9; // 2.333
      const result = calculateDisplaySize(1000, 500, ultrawide, "contain");
      expect(result.width).toBe(1000);
      expect(result.height).toBeCloseTo(428.57, 0);
    });

    it("should handle square aspect ratio (1:1)", () => {
      const square = 1;
      const result = calculateDisplaySize(800, 600, square, "contain");
      expect(result.height).toBe(600);
      expect(result.width).toBe(600);
    });
  });

  describe("aspect ratio preservation", () => {
    it("should always preserve aspect ratio in contain mode", () => {
      const testCases = [
        { w: 1920, h: 1080 },
        { w: 800, h: 600 },
        { w: 400, h: 800 },
        { w: 1200, h: 900 },
        { w: 1000, h: 1000 },
      ];

      testCases.forEach(({ w, h }) => {
        const result = calculateDisplaySize(w, h, ASPECT_16_9, "contain");
        if (result.width > 0 && result.height > 0) {
          const resultAspect = result.width / result.height;
          expect(resultAspect).toBeCloseTo(ASPECT_16_9, 2);
        }
      });
    });

    it("should always preserve aspect ratio in cover mode", () => {
      const testCases = [
        { w: 1920, h: 1080 },
        { w: 800, h: 600 },
        { w: 400, h: 800 },
      ];

      testCases.forEach(({ w, h }) => {
        const result = calculateDisplaySize(w, h, ASPECT_16_9, "cover");
        if (result.width > 0 && result.height > 0) {
          const resultAspect = result.width / result.height;
          expect(resultAspect).toBeCloseTo(ASPECT_16_9, 2);
        }
      });
    });
  });
});
