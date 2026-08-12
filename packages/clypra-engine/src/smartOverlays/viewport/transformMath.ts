export type HandleType = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | "rot" | null;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeStartTransform extends BoundingBox {
  id: string;
  rotation: number;
}

/**
 * Hit-test 8 resize handles (4 corners, 4 midpoints) and rotation knob against document coordinates.
 */
export function hitTestTransformHandles(
  docX: number,
  docY: number,
  box: BoundingBox,
  threshold = 12
): HandleType {
  if (box.width <= 0 || box.height <= 0) return null;

  const rotX = box.x + box.width / 2;
  const rotY = box.y - 24;
  if (Math.hypot(docX - rotX, docY - rotY) <= threshold) return "rot";

  const minX = box.x;
  const minY = box.y;
  const maxX = box.x + box.width;
  const maxY = box.y + box.height;

  if (Math.hypot(docX - minX, docY - minY) <= threshold) return "tl";
  if (Math.hypot(docX - maxX, docY - minY) <= threshold) return "tr";
  if (Math.hypot(docX - minX, docY - maxY) <= threshold) return "bl";
  if (Math.hypot(docX - maxX, docY - maxY) <= threshold) return "br";

  if (Math.abs(docY - minY) <= threshold && docX >= minX && docX <= maxX) return "t";
  if (Math.abs(docY - maxY) <= threshold && docX >= minX && docX <= maxX) return "b";
  if (Math.abs(docX - minX) <= threshold && docY >= minY && docY <= maxY) return "l";
  if (Math.abs(docX - maxX) <= threshold && docY >= minY && docY <= maxY) return "r";

  return null;
}

/**
 * Compute new spatial bounds given handle type, delta mouse movement, and aspect-ratio constraint.
 */
export function calculateResizeBounds(
  start: BoundingBox,
  handle: HandleType,
  deltaX: number,
  deltaY: number,
  lockAspectRatio = false,
  minDimension = 20
): BoundingBox {
  if (!handle) return start;

  let newX = start.x;
  let newY = start.y;
  let newW = start.width;
  let newH = start.height;

  if (handle.includes("r")) newW = Math.max(minDimension, start.width + deltaX);
  if (handle.includes("b")) newH = Math.max(minDimension, start.height + deltaY);
  if (handle.includes("l")) {
    const diff = Math.min(deltaX, start.width - minDimension);
    newX = start.x + diff;
    newW = start.width - diff;
  }
  if (handle.includes("t")) {
    const diff = Math.min(deltaY, start.height - minDimension);
    newY = start.y + diff;
    newH = start.height - diff;
  }

  if (lockAspectRatio && start.width > 0 && start.height > 0) {
    const ratio = start.width / start.height;
    newH = Math.round(newW / ratio);
  }

  return {
    x: Math.round(newX),
    y: Math.round(newY),
    width: Math.round(newW),
    height: Math.round(newH)
  };
}

/**
 * Compute rotation angle (degrees 0-360) around box center, supporting 15-degree angle snapping.
 */
export function calculateRotationAngle(
  centerX: number,
  centerY: number,
  docPtX: number,
  docPtY: number,
  snap15Deg = false
): number {
  const angleRad = Math.atan2(docPtY - centerY, docPtX - centerX);
  let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);

  if (angleDeg < 0) angleDeg += 360;

  if (snap15Deg) {
    angleDeg = Math.round(angleDeg / 15) * 15;
  }

  return angleDeg % 360;
}
