import {
  drawComicBurst,
  drawChalkSpeechBubble,
  drawThoughtCloud,
  renderBubbleAssetDefinition,
  renderBubbleBackground,
  renderBubblePresetBackground,
  type TextBubblePreset,
} from "@clypra-studio/engine";
import { renderRoughBubble } from "./renderRoughBubble";

type BubbleCanvas = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Studio-side direction for the small, curated catalog. Every artwork shape
 * is rendered by the shared engine, so the Studio preview and editor use the
 * same deterministic geometry rather than separate, look-alike drawings.
 */
export function renderCuratedBubble(
  ctx: BubbleCanvas,
  preset: TextBubblePreset,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.save();

  if (preset.definition) {
    const canvas = (ctx as CanvasRenderingContext2D).canvas;
    if (preset.definition.layers.outline.roughness > 0 && canvas instanceof HTMLCanvasElement) {
      renderRoughBubble(ctx as CanvasRenderingContext2D, preset.definition, x, y, width, height);
    } else {
      renderBubbleAssetDefinition(ctx, preset.definition, x, y, width, height);
    }
    ctx.restore();
    return;
  }

  if (preset.appearance) {
    renderBubblePresetBackground(ctx, preset, x, y, width, height);
    ctx.restore();
    return;
  }

  switch (preset.id) {
    case "bubble-speech-chalk-rose":
      drawChalkSpeechBubble(ctx, x, y, width, height);
      break;
    case "bubble-comic-bam":
      drawComicBurst(ctx, x, y, width, height, "#ffd449", "#1d1a17", 4);
      break;
    case "bubble-cloud-dotted":
      ctx.shadowColor = "rgba(67, 48, 76, 0.16)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      drawThoughtCloud(ctx, x, y, width, height, "#dcd3ff", "#44344d", 3);
      break;
    default:
      renderBubbleBackground(ctx, preset.id, x, y, width, height, { color: "#ffffff" });
      break;
  }

  ctx.restore();
}
