import { PixiRenderer } from "../videoEffects/PixiRenderer.js";
import { clearAllTextBridges } from "../text/textBridge.js";
import { clearAllStickerBridges } from "../stickers/stickerBridge.js";

const registry = new WeakMap<any, { renderer: PixiRenderer; generation: number }>();

export function getSharedPixiRenderer(canvas: any, width: number, height: number): PixiRenderer {
  let entry = registry.get(canvas);
  if (!entry) {
    const renderer = new PixiRenderer();
    entry = { renderer, generation: 1 };
    registry.set(canvas, entry);
    // Void init promise (caller awaits renderer.isReady / app setup)
    void renderer.init(canvas, width, height);
  } else {
    const app = entry.renderer.getApp();
    if (app && (app.screen.width !== width || app.screen.height !== height)) {
      entry.renderer.resize(width, height);
    }
  }
  return entry.renderer;
}

export function releaseSharedPixiRenderer(canvas: any): void {
  const entry = registry.get(canvas);
  if (entry) {
    registry.delete(canvas);
    const overlayContainer = entry.renderer.getOverlayContainer();
    if (overlayContainer) {
      clearAllTextBridges(overlayContainer);
      clearAllStickerBridges(overlayContainer);
    }
    entry.renderer.destroy();
  }
}
