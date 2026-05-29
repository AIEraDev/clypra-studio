import type { SceneDocument } from "./schema";

/** Apply rectangular wipe reveal (MVP mask) on composed canvas */
export function applyMaskReveal(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  doc: SceneDocument,
  width: number,
  height: number
): void {
  const maskLayer = doc.effectLayers.find((l) => l.type === "mask" && l.enabled);
  if (!maskLayer) return;

  const maskType = (maskLayer.params.maskType as string) || "alphaText";
  const progress = Math.max(0, Math.min(1, (maskLayer.params.revealProgress as number) ?? 1));
  if (progress >= 1) return;

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";

  if (maskType === "rectReveal") {
    const w = width * progress;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, height);
  } else {
    // alphaText: horizontal reveal as MVP stand-in until glyph masks exist
    const w = width * progress;
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(Math.max(0, progress - 0.02), "rgba(255,255,255,1)");
    grad.addColorStop(Math.min(1, progress + 0.02), "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}
