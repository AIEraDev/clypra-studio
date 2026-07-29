import type { KeyframePoint } from "@clypra-studio/types";

export function generateMultiKeyframeSVGPath(
  keyframes: readonly KeyframePoint[],
  toPx: (t: number, v: number) => { x: number; y: number }
): string {
  if (keyframes.length === 0) return "";
  if (keyframes.length === 1) {
    const p = toPx(keyframes[0].time, keyframes[0].value);
    return `M ${p.x},${p.y}`;
  }

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  let path = "";

  const startPt = toPx(sorted[0].time, sorted[0].value);
  path += `M ${startPt.x},${startPt.y} `;

  for (let i = 0; i < sorted.length - 1; i++) {
    const k0 = sorted[i];
    const k1 = sorted[i + 1];

    const p0 = toPx(k0.time, k0.value);
    const p1 = toPx(k1.time, k1.value);

    if (k0.easing === "hold") {
      path += `L ${p1.x},${p0.y} L ${p1.x},${p1.y} `;
    } else if (k0.easing === "linear" || !k0.handleOut || !k1.handleIn) {
      path += `L ${p1.x},${p1.y} `;
    } else {
      const cp1 = toPx(k0.time + k0.handleOut.dt, k0.value + k0.handleOut.dv);
      const cp2 = toPx(k1.time + k1.handleIn.dt, k1.value + k1.handleIn.dv);

      path += `C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${p1.x},${p1.y} `;
    }
  }

  return path;
}
