import { Sprite, Texture } from "pixi.js";

interface TextLayerBridge {
  sprite: Sprite;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  lastCacheKey: string;
  lastSeenFrame: number;
}

const bridges = new Map<string, TextLayerBridge>();

function mapPixiBlendMode(blendMode: string): any {
  const map: Record<string, any> = {
    normal: "normal",
    multiply: "multiply",
    screen: "screen",
    overlay: "overlay",
    darken: "darken",
    lighten: "lighten",
    add: "add",
  };
  return map[blendMode] || "normal";
}

export function beginTextFrame(container: import("pixi.js").Container): void {
  container.sortableChildren = true;
  for (const child of container.children) {
    child.visible = false;
  }
}

export async function renderTextLayerBridged(layer: any, frameId: number, container: import("pixi.js").Container, viewport: { scale: number; offsetX: number; offsetY: number; pixelRatio: number }, renderOrder: number, bleed: { x: number; y: number }, rasterizeTextCallback: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => Promise<void> | void, cacheKey: string): Promise<Sprite> {
  const { scale, offsetX, offsetY, pixelRatio } = viewport;
  const width = layer.width * scale;
  const height = layer.height * scale;

  const effectPaddingX = bleed.x * scale;
  const effectPaddingY = bleed.y * scale;

  const offW = Math.max(1, Math.ceil(width + effectPaddingX * 2));
  const offH = Math.max(1, Math.ceil(height + effectPaddingY * 2));

  const physOffW = Math.ceil(offW * pixelRatio);
  const physOffH = Math.ceil(offH * pixelRatio);

  let bridge = bridges.get(layer.layerId);

  if (!bridge) {
    const canvas = document.createElement("canvas");
    canvas.width = physOffW;
    canvas.height = physOffH;
    const ctx = canvas.getContext("2d")!;
    const texture = Texture.from(canvas);
    const sprite = new Sprite(texture);
    container.addChild(sprite);

    bridge = {
      sprite,
      canvas,
      ctx,
      lastCacheKey: "",
      lastSeenFrame: frameId,
    };
    bridges.set(layer.layerId, bridge);
  } else {
    if (bridge.canvas.width !== physOffW || bridge.canvas.height !== physOffH) {
      bridge.canvas.width = physOffW;
      bridge.canvas.height = physOffH;
      bridge.sprite.texture.destroy(false);
      bridge.sprite.texture = Texture.from(bridge.canvas);
    }
    if (bridge.sprite.parent !== container) {
      container.addChild(bridge.sprite);
    }
  }

  bridge.lastSeenFrame = frameId;

  if (bridge.lastCacheKey !== cacheKey) {
    const ctx = bridge.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bridge.canvas.width, bridge.canvas.height);

    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);
    ctx.translate(width / 2 + effectPaddingX, height / 2 + effectPaddingY);

    await rasterizeTextCallback(ctx);

    ctx.restore();

    bridge.lastCacheKey = cacheKey;
    bridge.sprite.texture.source.update();
  }

  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;
  const physCenterX = (centerX * scale + offsetX) * pixelRatio;
  const physCenterY = (centerY * scale + offsetY) * pixelRatio;

  const sprite = bridge.sprite;
  sprite.anchor.set(0.5);
  sprite.position.set(physCenterX, physCenterY);
  sprite.rotation = (layer.rotation * Math.PI) / 180;
  sprite.alpha = layer.opacity;
  sprite.width = offW * pixelRatio;
  sprite.height = offH * pixelRatio;
  sprite.blendMode = mapPixiBlendMode(layer.blendMode);
  sprite.zIndex = renderOrder;
  sprite.visible = true;

  return sprite;
}

export function unmountTextLayerBridge(layerId: string, container: import("pixi.js").Container): void {
  const bridge = bridges.get(layerId);
  if (bridge) {
    container.removeChild(bridge.sprite);
    bridge.sprite.destroy();
    bridge.sprite.texture.destroy(false);
    bridges.delete(layerId);
  }
}

export function endTextFrame(frameId: number, container: import("pixi.js").Container): void {
  for (const [layerId, bridge] of bridges.entries()) {
    if (bridge.lastSeenFrame !== frameId) {
      bridge.sprite.visible = false;
    }

    if (frameId - bridge.lastSeenFrame > 180) {
      unmountTextLayerBridge(layerId, container);
    }
  }
}

export function clearAllTextBridges(container?: import("pixi.js").Container): void {
  for (const [layerId, bridge] of bridges.entries()) {
    if (container && bridge.sprite.parent === container) {
      container.removeChild(bridge.sprite);
    }
    bridge.sprite.destroy();
    bridge.sprite.texture.destroy(false);
  }
  bridges.clear();
}
