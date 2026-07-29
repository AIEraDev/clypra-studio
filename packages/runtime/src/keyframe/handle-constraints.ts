import type { KeyframePoint } from "@clypra-studio/types";

/**
 * Computes updated handle coordinates based on keyframe symmetry mode.
 */
export function resolveHandleConstraints(
  kf: KeyframePoint,
  draggedHandle: "handleIn" | "handleOut",
  targetOffset: { dt: number; dv: number }
): { handleIn?: { dt: number; dv: number }; handleOut?: { dt: number; dv: number } } {
  const mode = kf.handleMode || "aligned";

  // 1. Broken / Free Mode: Handles move completely independently
  if (mode === "broken") {
    return {
      [draggedHandle]: targetOffset,
      [draggedHandle === "handleOut" ? "handleIn" : "handleOut"]:
        draggedHandle === "handleOut" ? kf.handleIn : kf.handleOut,
    };
  }

  const isOut = draggedHandle === "handleOut";
  const oppositeHandleKey = isOut ? "handleIn" : "handleOut";
  const currentOpposite = isOut ? kf.handleIn : kf.handleOut;

  // Active handle length & direction vector
  const lenActive = Math.hypot(targetOffset.dt, targetOffset.dv);
  if (lenActive < 1e-5) {
    return { [draggedHandle]: targetOffset, [oppositeHandleKey]: currentOpposite };
  }

  // Unit vector pointing in opposite direction (-180 degrees)
  const rawDt = -targetOffset.dt / lenActive;
  const rawDv = -targetOffset.dv / lenActive;

  const dirOpposite = {
    dt: Math.abs(rawDt) < 1e-9 ? 0 : rawDt,
    dv: Math.abs(rawDv) < 1e-9 ? 0 : rawDv,
  };

  // 2. Mirrored Mode: Opposite handle mirrors both angle AND magnitude
  if (mode === "mirrored") {
    const dt = dirOpposite.dt * lenActive;
    const dv = dirOpposite.dv * lenActive;
    return {
      [draggedHandle]: targetOffset,
      [oppositeHandleKey]: {
        dt: Math.abs(dt) < 1e-9 ? 0 : dt,
        dv: Math.abs(dv) < 1e-9 ? 0 : dv,
      },
    };
  }

  // 3. Aligned Mode: Opposite handle locks to 180° angle, but preserves its current length
  const lenOpposite = currentOpposite
    ? Math.hypot(currentOpposite.dt, currentOpposite.dv)
    : lenActive;

  const dtAligned = dirOpposite.dt * lenOpposite;
  const dvAligned = dirOpposite.dv * lenOpposite;

  return {
    [draggedHandle]: targetOffset,
    [oppositeHandleKey]: {
      dt: Math.abs(dtAligned) < 1e-9 ? 0 : dtAligned,
      dv: Math.abs(dvAligned) < 1e-9 ? 0 : dvAligned,
    },
  };
}
