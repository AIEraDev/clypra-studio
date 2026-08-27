import React, { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  PreviewCanvas,
  getPreviewRenderDimensions,
} from "../PreviewCanvas";
import { defaultConfig } from "@clypra-studio/engine";

describe("getPreviewRenderDimensions", () => {
  it("scales dimensions proportionally with 400% deep zoom", () => {
    const { renderW, renderH, renderScale } = getPreviewRenderDimensions(
      1280,
      720,
      400,
    );
    expect(renderScale).toBe(4);
    expect(renderW).toBe(5120);
    expect(renderH).toBe(2880);
  });

  it("maintains at least 1x baseline resolution when fitted below 100%", () => {
    const { renderW, renderH, renderScale } = getPreviewRenderDimensions(
      1280,
      720,
      50,
    );
    expect(renderScale).toBeGreaterThanOrEqual(1);
    expect(renderW).toBeGreaterThanOrEqual(1280);
    expect(renderH).toBeGreaterThanOrEqual(720);
  });

  it("clamps to max dimension on ultra-wide or 4K resolutions", () => {
    const { renderW, renderH, renderScale } = getPreviewRenderDimensions(
      3840,
      2160,
      400,
    );
    expect(renderW).toBeLessThanOrEqual(5120);
    expect(renderH).toBeLessThanOrEqual(2880);
    expect(renderScale).toBeLessThan(4);
  });
});

describe("PreviewCanvas Component", () => {
  it("renders canvas element with scaled resolution attributes at 400% zoom", () => {
    const canvasRef = createRef<HTMLCanvasElement>();
    const config = {
      ...defaultConfig,
      canvasWidth: 1280,
      canvasHeight: 720,
    };

    const { container } = render(
      <PreviewCanvas
        canvasRef={canvasRef}
        config={config}
        bgMode="checkerboard"
        zoom={400}
        zoomMode="manual"
        onZoomChange={() => {}}
        onZoomModeChange={() => {}}
        onBgModeChange={() => {}}
      />,
    );

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    // In happy-dom with window.devicePixelRatio, renderScale is 4 at 400%
    expect(canvas?.width).toBe(5120);
    expect(canvas?.height).toBe(2880);
  });
});
