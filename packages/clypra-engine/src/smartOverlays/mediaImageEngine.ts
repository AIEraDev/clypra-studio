import type { FocalPoint } from "../assets/types.js";

export type ImageFitMode = "cover" | "contain" | "fill" | "none";

export interface SizingDimensionInput {
  specifiedWidth?: number | string;   // e.g. 320, "auto", "100%"
  specifiedHeight?: number | string;  // e.g. 240, "auto", "100%"
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface ResolvedImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  isAutoWidth: boolean;
  isAutoHeight: boolean;
}

export interface ImageFittingInput {
  containerWidth: number;
  containerHeight: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
  fitMode?: ImageFitMode;
  focalPoint?: FocalPoint;
}

export interface ImageFittingResult {
  // Region of the intrinsic image to sample from (for 2D canvas drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight))
  sourceCrop: {
    sx: number;
    sy: number;
    sWidth: number;
    sHeight: number;
  };
  // Destination box inside the container
  destinationBox: {
    dx: number;
    dy: number;
    dWidth: number;
    dHeight: number;
  };
  scale: number;
  scaleX: number;
  scaleY: number;
}

/**
 * MediaImage Sizing & Focal Point Engine
 *
 * Implements deterministic aspect-ratio math, 4-mode sizing matrix resolution,
 * and focal-point smart cropping for leaf media and avatar primitives.
 */
export class MediaImageEngine {
  /**
   * Resolve node dimensions based on the 4-mode sizing matrix:
   * 1. (auto, auto)   -> intrinsic dimensions
   * 2. (fixed, auto)  -> width locked, height preserves aspect ratio
   * 3. (auto, fixed)  -> height locked, width preserves aspect ratio
   * 4. (fixed, fixed) -> container locked
   */
  public static resolveDimensions(input: SizingDimensionInput): ResolvedImageDimensions {
    const defaultW = input.defaultWidth ?? 1920;
    const defaultH = input.defaultHeight ?? 1080;

    const intW = input.intrinsicWidth && input.intrinsicWidth > 0 ? input.intrinsicWidth : defaultW;
    const intH = input.intrinsicHeight && input.intrinsicHeight > 0 ? input.intrinsicHeight : defaultH;
    const ar = intW / intH;

    const isAutoW = input.specifiedWidth === undefined || input.specifiedWidth === "auto" || input.specifiedWidth === null || input.specifiedWidth === 0;
    const isAutoH = input.specifiedHeight === undefined || input.specifiedHeight === "auto" || input.specifiedHeight === null || input.specifiedHeight === 0;

    let numW: number | undefined;
    if (typeof input.specifiedWidth === "number") {
      numW = input.specifiedWidth;
    } else if (typeof input.specifiedWidth === "string" && input.specifiedWidth.endsWith("%") && input.containerWidth) {
      const pct = parseFloat(input.specifiedWidth) / 100;
      numW = input.containerWidth * pct;
    }

    let numH: number | undefined;
    if (typeof input.specifiedHeight === "number") {
      numH = input.specifiedHeight;
    } else if (typeof input.specifiedHeight === "string" && input.specifiedHeight.endsWith("%") && input.containerHeight) {
      const pct = parseFloat(input.specifiedHeight) / 100;
      numH = input.containerHeight * pct;
    }

    let finalW: number;
    let finalH: number;

    if (isAutoW && isAutoH) {
      // 1. (auto, auto)
      finalW = intW;
      finalH = intH;
    } else if (!isAutoW && isAutoH && numW !== undefined) {
      // 2. (fixed, auto)
      finalW = numW;
      finalH = numW / ar;
    } else if (isAutoW && !isAutoH && numH !== undefined) {
      // 3. (auto, fixed)
      finalW = numH * ar;
      finalH = numH;
    } else {
      // 4. (fixed, fixed)
      finalW = numW ?? intW;
      finalH = numH ?? intH;
    }

    return {
      width: Math.round(finalW * 100) / 100,
      height: Math.round(finalH * 100) / 100,
      aspectRatio: ar,
      isAutoWidth: isAutoW,
      isAutoHeight: isAutoH,
    };
  }

  /**
   * Compute source crop and destination mapping given container bounds,
   * intrinsic image dimensions, fit mode, and normalized focal point.
   */
  public static computeFitting(input: ImageFittingInput): ImageFittingResult {
    const {
      containerWidth: cw,
      containerHeight: ch,
      intrinsicWidth: iw,
      intrinsicHeight: ih,
      fitMode = "cover",
      focalPoint = { x: 0.5, y: 0.5 },
    } = input;

    // Clamp focal points
    const fx = Math.max(0, Math.min(1, focalPoint.x));
    const fy = Math.max(0, Math.min(1, focalPoint.y));

    if (fitMode === "fill") {
      return {
        sourceCrop: { sx: 0, sy: 0, sWidth: iw, sHeight: ih },
        destinationBox: { dx: 0, dy: 0, dWidth: cw, dHeight: ch },
        scale: 1,
        scaleX: cw / iw,
        scaleY: ch / ih,
      };
    }

    if (fitMode === "none") {
      const sx = Math.max(0, Math.min(iw - cw, fx * iw - cw / 2));
      const sy = Math.max(0, Math.min(ih - ch, fy * ih - ch / 2));
      const sWidth = Math.min(iw, cw);
      const sHeight = Math.min(ih, ch);
      return {
        sourceCrop: { sx, sy, sWidth, sHeight },
        destinationBox: { dx: 0, dy: 0, dWidth: sWidth, dHeight: sHeight },
        scale: 1,
        scaleX: 1,
        scaleY: 1,
      };
    }

    if (fitMode === "contain") {
      const scale = Math.min(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      // Center letterboxed result
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      return {
        sourceCrop: { sx: 0, sy: 0, sWidth: iw, sHeight: ih },
        destinationBox: {
          dx: Math.round(dx * 100) / 100,
          dy: Math.round(dy * 100) / 100,
          dWidth: Math.round(dw * 100) / 100,
          dHeight: Math.round(dh * 100) / 100,
        },
        scale,
        scaleX: scale,
        scaleY: scale,
      };
    }

    // Default: "cover" (with Focal-Point Preserving Crop)
    const scale = Math.max(cw / iw, ch / ih);
    const visibleSourceW = cw / scale;
    const visibleSourceH = ch / scale;

    // Focal point anchoring in intrinsic source coordinates:
    // Ideal source center: fx * iw, fy * ih
    let sx = fx * iw - visibleSourceW / 2;
    let sy = fy * ih - visibleSourceH / 2;

    // Clamp so source rect stays strictly within [0, iw] and [0, ih]
    sx = Math.max(0, Math.min(iw - visibleSourceW, sx));
    sy = Math.max(0, Math.min(ih - visibleSourceH, sy));

    return {
      sourceCrop: {
        sx: Math.round(sx * 100) / 100,
        sy: Math.round(sy * 100) / 100,
        sWidth: Math.round(visibleSourceW * 100) / 100,
        sHeight: Math.round(visibleSourceH * 100) / 100,
      },
      destinationBox: {
        dx: 0,
        dy: 0,
        dWidth: cw,
        dHeight: ch,
      },
      scale,
      scaleX: scale,
      scaleY: scale,
    };
  }

  /**
   * Convenience circular avatar fitting calculation.
   */
  public static computeCircularAvatarFitting(
    diameter: number,
    intrinsicWidth: number,
    intrinsicHeight: number,
    focalPoint?: FocalPoint
  ): ImageFittingResult {
    return this.computeFitting({
      containerWidth: diameter,
      containerHeight: diameter,
      intrinsicWidth,
      intrinsicHeight,
      fitMode: "cover",
      focalPoint,
    });
  }
}
