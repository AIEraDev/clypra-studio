export type Size = {
  width: number;
  height: number;
};

export type MediaFitMode = "cover" | "contain" | "stretch" | "original";

export interface ResolvedFit {
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface NormalizedCrop {
  left: number; // 0..1
  top: number; // 0..1
  right: number; // 0..1
  bottom: number; // 0..1
}

export interface FocalPoint {
  x: number; // 0..1
  y: number; // 0..1
}

export interface MediaLayout {
  fit: MediaFitMode;
  focalPoint: FocalPoint;
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
  crop?: NormalizedCrop;
}

export interface ResolvedMediaLayout {
  fit: MediaFitMode;
  focalPoint: FocalPoint;
  sourceRect: { x: number; y: number; width: number; height: number };
  width: number; // base fit width in project coordinates
  height: number; // base fit height in project coordinates
  x: number; // center X in project coordinates
  y: number; // center Y in project coordinates
  scaleX: number; // composite scale X (fit scale * manual scale)
  scaleY: number; // composite scale Y (fit scale * manual scale)
  rotation: number; // composite rotation in degrees
}

export function calculateMediaFit(source: Size, target: Size, mode: MediaFitMode): ResolvedFit {
  if (source.width <= 0 || source.height <= 0 || target.width <= 0 || target.height <= 0) {
    return {
      scaleX: 1,
      scaleY: 1,
      width: target.width,
      height: target.height,
      x: 0,
      y: 0,
    };
  }

  if (mode === "stretch") {
    const scaleX = target.width / source.width;
    const scaleY = target.height / source.height;
    return {
      scaleX,
      scaleY,
      width: target.width,
      height: target.height,
      x: 0,
      y: 0,
    };
  }

  if (mode === "original") {
    return {
      scaleX: 1,
      scaleY: 1,
      width: source.width,
      height: source.height,
      x: (target.width - source.width) / 2,
      y: (target.height - source.height) / 2,
    };
  }

  const scaleX = target.width / source.width;
  const scaleY = target.height / source.height;

  const scale = mode === "cover" ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

  const width = source.width * scale;
  const height = source.height * scale;

  return {
    scaleX: scale,
    scaleY: scale,
    width,
    height,
    x: (target.width - width) / 2,
    y: (target.height - height) / 2,
  };
}

export function calculateDefaultCoverCrop(source: Size, target: Size): NormalizedCrop {
  if (source.width <= 0 || source.height <= 0 || target.width <= 0 || target.height <= 0) {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  const scaleX = target.width / source.width;
  const scaleY = target.height / source.height;
  const scale = Math.max(scaleX, scaleY);

  const visibleWidthFraction = Math.min(1, target.width / (source.width * scale));
  const visibleHeightFraction = Math.min(1, target.height / (source.height * scale));

  const cropX = 1 - visibleWidthFraction;
  const cropY = 1 - visibleHeightFraction;

  return {
    left: cropX / 2,
    top: cropY / 2,
    right: cropX / 2,
    bottom: cropY / 2,
  };
}

export function getSourceCropRect(source: Size, crop?: NormalizedCrop): { x: number; y: number; width: number; height: number } {
  if (!crop) {
    return { x: 0, y: 0, width: source.width, height: source.height };
  }

  const left = Math.max(0, Math.min(1, crop.left));
  const top = Math.max(0, Math.min(1, crop.top));
  const right = Math.max(0, Math.min(1, crop.right));
  const bottom = Math.max(0, Math.min(1, crop.bottom));

  if (left + right >= 1 || top + bottom >= 1) {
    return { x: 0, y: 0, width: source.width, height: source.height };
  }

  const x = left * source.width;
  const y = top * source.height;
  const width = (1 - left - right) * source.width;
  const height = (1 - top - bottom) * source.height;

  return { x, y, width, height };
}

export function rotateCrop(crop: NormalizedCrop, rotation?: number): NormalizedCrop {
  if (!rotation || rotation === 0) return crop;
  const rot = (rotation + 360) % 360;
  if (rot === 90) {
    return {
      left: crop.bottom,
      top: crop.left,
      right: crop.top,
      bottom: crop.right,
    };
  }
  if (rot === 180) {
    return {
      left: crop.right,
      top: crop.bottom,
      right: crop.left,
      bottom: crop.top,
    };
  }
  if (rot === 270) {
    return {
      left: crop.top,
      top: crop.right,
      right: crop.bottom,
      bottom: crop.left,
    };
  }
  return crop;
}

export function calculateCropFromFocalPoint(source: Size, target: Size, focalPoint: FocalPoint): NormalizedCrop {
  if (source.width <= 0 || source.height <= 0 || target.width <= 0 || target.height <= 0) {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  const scaleX = target.width / source.width;
  const scaleY = target.height / source.height;
  const scale = Math.max(scaleX, scaleY);

  const visibleWidthFraction = Math.min(1, target.width / (source.width * scale));
  const visibleHeightFraction = Math.min(1, target.height / (source.height * scale));

  const fx = Math.max(0, Math.min(1, focalPoint.x));
  const fy = Math.max(0, Math.min(1, focalPoint.y));

  let left = fx - visibleWidthFraction / 2;
  let top = fy - visibleHeightFraction / 2;

  left = Math.max(0, Math.min(left, 1 - visibleWidthFraction));
  top = Math.max(0, Math.min(top, 1 - visibleHeightFraction));

  const right = Math.max(0, 1 - left - visibleWidthFraction);
  const bottom = Math.max(0, 1 - top - visibleHeightFraction);

  return {
    left,
    top,
    right,
    bottom,
  };
}

export function resolveMediaLayout(params: { sourceSize: Size; projectFrame: Size; layout?: MediaLayout }): ResolvedMediaLayout {
  const { sourceSize, projectFrame, layout } = params;

  const fit = layout?.fit ?? "cover";
  const focalPoint = layout?.focalPoint ?? { x: 0.5, y: 0.5 };
  const transform = layout?.transform ?? {
    x: projectFrame.width / 2,
    y: projectFrame.height / 2,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  };

  let crop = layout?.crop;
  if (!crop && fit === "cover") {
    crop = calculateCropFromFocalPoint(sourceSize, projectFrame, focalPoint);
  }

  const sourceRect = getSourceCropRect(sourceSize, crop);
  const fitResult = calculateMediaFit({ width: sourceRect.width, height: sourceRect.height }, projectFrame, fit);

  const scaleX = fitResult.scaleX * transform.scaleX;
  const scaleY = fitResult.scaleY * transform.scaleY;
  const rotation = transform.rotation;

  return {
    fit,
    focalPoint,
    sourceRect,
    width: sourceRect.width * fitResult.scaleX,
    height: sourceRect.height * fitResult.scaleY,
    x: transform.x,
    y: transform.y,
    scaleX,
    scaleY,
    rotation,
  };
}

export function getClipLayout(
  clip: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    fitMode?: any;
    layout?: any;
  },
  sourceSize: Size,
  projectFrame: Size,
): MediaLayout {
  const fitMode = clip.fitMode ?? "cover";
  const fitModeClean = fitMode === "fill" ? "cover" : fitMode;

  const fitResult = calculateMediaFit(sourceSize, projectFrame, fitModeClean);

  const fitW = fitResult.width || projectFrame.width || 1;
  const fitH = fitResult.height || projectFrame.height || 1;

  return {
    fit: fitModeClean,
    focalPoint: clip.layout?.focalPoint ?? { x: 0.5, y: 0.5 },
    transform: {
      x: clip.x + clip.width / 2,
      y: clip.y + clip.height / 2,
      scaleX: clip.width / fitW,
      scaleY: clip.height / fitH,
      rotation: clip.rotation,
    },
    crop: clip.layout?.crop,
  };
}
