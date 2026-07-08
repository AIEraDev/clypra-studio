import { describe, it, expect } from "vitest";
import { resolveConform, type ClipConform } from "../conform";

describe("Professional Conform System: resolveConform", () => {
  const canvasWidth = 1920;
  const canvasHeight = 1080;

  it("handles fit (contain) mode for wider asset (pillarbox)", () => {
    const conform: ClipConform = {
      mode: "fit",
      sourceWidth: 3840,
      sourceHeight: 1080, // Aspect ratio 3.55:1 (much wider than 16:9)
      userScale: 1,
      userOffsetX: 0,
      userOffsetY: 0,
    };

    const result = resolveConform(conform, canvasWidth, canvasHeight);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(540);
    expect(result.x).toBe(0);
    expect(result.y).toBe(270);
  });

  it("handles fit (contain) mode for taller asset (letterbox)", () => {
    const conform: ClipConform = {
      mode: "fit",
      sourceWidth: 1080,
      sourceHeight: 1920, // Aspect ratio 9:16 (vertical video)
      userScale: 1,
      userOffsetX: 0,
      userOffsetY: 0,
    };

    const result = resolveConform(conform, canvasWidth, canvasHeight);
    expect(result.height).toBe(1080);
    expect(result.width).toBe(607.5);
    expect(result.x).toBe((1920 - 607.5) / 2);
    expect(result.y).toBe(0);
  });

  it("handles fill (cover) mode for vertical video", () => {
    const conform: ClipConform = {
      mode: "fill",
      sourceWidth: 1080,
      sourceHeight: 1920,
      userScale: 1,
      userOffsetX: 0,
      userOffsetY: 0,
    };

    const result = resolveConform(conform, canvasWidth, canvasHeight);
    expect(result.width).toBe(1920);
    expect(result.height).toBeCloseTo(3413.333333, 4);
    expect(result.x).toBe(0);
    expect(result.y).toBeCloseTo((1080 - 3413.333333) / 2, 4);
  });

  it("handles none (native size) mode", () => {
    const conform: ClipConform = {
      mode: "none",
      sourceWidth: 500,
      sourceHeight: 400,
      userScale: 1,
      userOffsetX: 0,
      userOffsetY: 0,
    };

    const result = resolveConform(conform, canvasWidth, canvasHeight);
    expect(result.width).toBe(500);
    expect(result.height).toBe(400);
    expect(result.x).toBe((1920 - 500) / 2);
    expect(result.y).toBe((1080 - 400) / 2);
  });

  it("applies userScale relative to conform base scale", () => {
    const conform: ClipConform = {
      mode: "none",
      sourceWidth: 500,
      sourceHeight: 400,
      userScale: 1.5, // 150% scale nudge
      userOffsetX: 0,
      userOffsetY: 0,
    };

    const result = resolveConform(conform, canvasWidth, canvasHeight);
    expect(result.width).toBe(750);
    expect(result.height).toBe(600);
  });

  it("applies userOffsetX and userOffsetY manual nudges", () => {
    const conform: ClipConform = {
      mode: "none",
      sourceWidth: 500,
      sourceHeight: 400,
      userScale: 1,
      userOffsetX: 50,
      userOffsetY: -30,
    };

    const result = resolveConform(conform, canvasWidth, canvasHeight);
    expect(result.x).toBe((1920 - 500) / 2 + 50);
    expect(result.y).toBe((1080 - 400) / 2 - 30);
  });

  it("handles invalid or zero source dimensions gracefully", () => {
    const conform: ClipConform = {
      mode: "fit",
      sourceWidth: 0,
      sourceHeight: 0,
      userScale: 1,
      userOffsetX: 0,
      userOffsetY: 0,
    };

    const result = resolveConform(conform, canvasWidth, canvasHeight);
    expect(result.width).toBe(canvasWidth);
    expect(result.height).toBe(canvasHeight);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});
