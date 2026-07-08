export type ConformMode = 'fit' | 'fill' | 'none' | 'smart';

export interface ClipConform {
  mode: ConformMode;
  /** Captured ONCE when the source's real dimensions become known — never re-read live */
  sourceWidth: number;
  sourceHeight: number;
  /** User-adjustable on top of the conform base — matches FCP's "Scale" slider on top of Spatial Conform */
  userScale: number;   // 1.0 = 100%, relative to whatever the conform mode already computed
  userOffsetX: number; // manual nudge on top of the conform-computed centered position
  userOffsetY: number;
}

/**
 * Computes a clip's final position/size against the project canvas.
 * This is the ONLY place fit math should happen — never inline at a render call site.
 * Mirrors FCP's Fit/Fill/None and Resolve's Scale-to-Fit exactly.
 */
export function resolveConform(
  conform: ClipConform,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; width: number; height: number } {
  const { mode, sourceWidth: sw, sourceHeight: sh, userScale, userOffsetX, userOffsetY } = conform;

  if (!sw || !sh) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }

  let baseScale: number;
  switch (mode) {
    case 'fit':
      // Contain — matches FCP's Fit: scales within canvas, may letterbox/pillarbox
      baseScale = Math.min(canvasWidth / sw, canvasHeight / sh);
      break;
    case 'fill':
    case 'smart':
      // Cover — matches FCP's Fill: scales to fill canvas, may crop
      baseScale = Math.max(canvasWidth / sw, canvasHeight / sh);
      break;
    case 'none':
      // Native — matches FCP's None: no scaling, may extend beyond canvas bounds
      baseScale = 1;
      break;
    default:
      baseScale = Math.min(canvasWidth / sw, canvasHeight / sh);
  }

  const finalScale = baseScale * userScale;
  const width = sw * finalScale;
  const height = sh * finalScale;
  const x = (canvasWidth - width) / 2 + userOffsetX;
  const y = (canvasHeight - height) / 2 + userOffsetY;

  return { x, y, width, height };
}
