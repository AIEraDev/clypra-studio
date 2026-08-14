import type { EvaluatedTransform } from "../runtime/evaluatedScene.js";
import type { EvaluatedVideoStateAtTime, BoundingRegion } from "../context/videoContext.js";

export type AvoidRegionKind = "face" | "subtitle" | "watermark" | "safe-zone";

export interface SpatialConstraintSpec {
  anchorTo?: string; // e.g. "speaker", "subject.primary", "face", or subject ID
  preferPlacement?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "lower-third" | "side-right" | "side-left";
  avoidRegions?: AvoidRegionKind[];
  collisionPolicy?: "avoid" | "push" | "stack";
  safeMargin?: number;
  offsetPixelX?: number;
  offsetPixelY?: number;
}

/**
 * Pure evaluator that resolves semantic spatial constraints (anchorTo, avoid, prefer, offset)
 * into deterministic EvaluatedTransform coordinates at frame time `t`.
 */
export function resolveSpatialConstraints(
  initialTransform: EvaluatedTransform,
  constraints: SpatialConstraintSpec,
  videoState?: EvaluatedVideoStateAtTime,
  canvasWidth = 1280,
  canvasHeight = 720
): EvaluatedTransform {
  if (!constraints || (!constraints.anchorTo && !constraints.avoidRegions && !constraints.preferPlacement && constraints.safeMargin === undefined)) {
    return initialTransform;
  }

  const resolved = { ...initialTransform };
  let anchorBox: BoundingRegion | undefined = undefined;

  // 1. Resolve anchor target from VideoState if present
  if (constraints.anchorTo && videoState?.activeSubjects) {
    if (constraints.anchorTo === "speaker" && videoState.activeSpeakerId) {
      anchorBox = videoState.activeSubjects[videoState.activeSpeakerId];
    } else if (constraints.anchorTo === "subject.primary") {
      const firstSubjectKey = Object.keys(videoState.activeSubjects)[0];
      if (firstSubjectKey) {
        anchorBox = videoState.activeSubjects[firstSubjectKey];
      }
    } else if (videoState.activeSubjects[constraints.anchorTo]) {
      anchorBox = videoState.activeSubjects[constraints.anchorTo];
    }
  }

  // 2. Position relative to resolved anchor target
  if (anchorBox) {
    const offsetX = constraints.offsetPixelX ?? 20;
    const offsetY = constraints.offsetPixelY ?? 0;

    switch (constraints.preferPlacement) {
      case "side-left":
        resolved.x = anchorBox.x - resolved.width - offsetX;
        resolved.y = anchorBox.y + offsetY;
        break;
      case "top-left":
        resolved.x = anchorBox.x - offsetX;
        resolved.y = anchorBox.y - resolved.height - offsetY;
        break;
      case "top-right":
        resolved.x = anchorBox.x + anchorBox.width + offsetX;
        resolved.y = anchorBox.y - resolved.height - offsetY;
        break;
      case "side-right":
      default:
        resolved.x = anchorBox.x + anchorBox.width + offsetX;
        resolved.y = anchorBox.y + offsetY;
        break;
    }
  }

  // 3. Evaluate region avoidance (e.g. avoid face, avoid subtitle region)
  if (constraints.avoidRegions && constraints.avoidRegions.length > 0 && videoState) {
    for (const avoidKind of constraints.avoidRegions) {
      if (avoidKind === "subtitle" && videoState.subtitleRegion) {
        const sub = videoState.subtitleRegion;
        // Check for vertical overlap with subtitle region
        if (
          resolved.x < sub.x + sub.width &&
          resolved.x + resolved.width > sub.x &&
          resolved.y < sub.y + sub.height &&
          resolved.y + resolved.height > sub.y
        ) {
          // Push overlay above subtitle region
          resolved.y = sub.y - resolved.height - 16;
        }
      } else if (avoidKind === "face" && videoState.activeSubjects) {
        for (const subjKey of Object.keys(videoState.activeSubjects)) {
          const faceBox = videoState.activeSubjects[subjKey];
          // Check rectangle intersection
          if (
            resolved.x < faceBox.x + faceBox.width &&
            resolved.x + resolved.width > faceBox.x &&
            resolved.y < faceBox.y + faceBox.height &&
            resolved.y + resolved.height > faceBox.y
          ) {
            // Push overlay to the right of face box
            resolved.x = faceBox.x + faceBox.width + 24;
          }
        }
      }
    }
  }

  // 4. Clamp to canvas boundaries with configurable safeMargin (default 16px)
  const margin = constraints.safeMargin ?? 16;
  resolved.x = Math.max(margin, Math.min(canvasWidth - resolved.width - margin, resolved.x));
  resolved.y = Math.max(margin, Math.min(canvasHeight - resolved.height - margin, resolved.y));

  return resolved;
}
