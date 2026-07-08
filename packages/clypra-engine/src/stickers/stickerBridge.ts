import { Sprite, Texture } from "pixi.js";
import lottie from "lottie-web";

interface StickerBridge {
  sprite: Sprite;
  canvas: HTMLCanvasElement;
  container: HTMLDivElement;
  anim: any;
  stickerId: string;
  lastCacheKey: string;
  lastSeenFrame: number;
}

const bridges = new Map<string, StickerBridge>();

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

export function beginStickerFrame(container: import("pixi.js").Container): void {
  container.sortableChildren = true;
}

export async function renderStickerLayerBridged(
  layer: any,
  lottieData: any, // Decoupled: caller resolves and reads Lottie JSON
  frameId: number,
  container: import("pixi.js").Container,
  viewport: { scale: number; offsetX: number; offsetY: number; pixelRatio: number },
  renderOrder: number,
  stickerId: string,
): Promise<Sprite | null> {
  const { scale, offsetX, offsetY, pixelRatio } = viewport;
  const width = layer.width * scale;
  const height = layer.height * scale;

  const physW = Math.max(1, Math.ceil(width * pixelRatio));
  const physH = Math.max(1, Math.ceil(height * pixelRatio));

  let bridge = bridges.get(layer.layerId);

  if (!bridge || bridge.stickerId !== stickerId) {
    if (bridge) {
      unmountStickerLayerBridge(layer.layerId, container);
    }

    try {
      const htmlContainer = document.createElement("div");
      htmlContainer.style.width = `${physW}px`;
      htmlContainer.style.height = `${physH}px`;
      htmlContainer.style.position = "absolute";
      htmlContainer.style.left = "-9999px";
      htmlContainer.style.top = "-9999px";
      document.body.appendChild(htmlContainer);

      const anim = lottie.loadAnimation({
        container: htmlContainer,
        renderer: "canvas",
        autoplay: false,
        loop: true,
        animationData: JSON.parse(JSON.stringify(lottieData)),
      });

      anim.goToAndStop(0, true);
      await Promise.resolve();

      const canvas = htmlContainer.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) {
        anim.destroy();
        htmlContainer.remove();
        return null;
      }

      const texture = Texture.from(canvas);
      const sprite = new Sprite(texture);
      container.addChild(sprite);

      bridge = {
        sprite,
        canvas,
        container: htmlContainer,
        anim,
        stickerId,
        lastCacheKey: "",
        lastSeenFrame: frameId,
      };
      bridges.set(layer.layerId, bridge);
    } catch (err) {
      console.error("[StickerBridge] Failed to initialize sticker animation:", err);
      return null;
    }
  } else {
    if (bridge.canvas.width !== physW || bridge.canvas.height !== physH) {
      bridge.container.style.width = `${physW}px`;
      bridge.container.style.height = `${physH}px`;
      bridge.anim.resize();
      bridge.sprite.texture.destroy(false);
      bridge.sprite.texture = Texture.from(bridge.canvas);
    }

    if (bridge.sprite.parent !== container) {
      container.addChild(bridge.sprite);
    }
  }

  bridge.lastSeenFrame = frameId;

  const totalFrames = bridge.anim.totalFrames;
  const frameRate = bridge.anim.frameRate || 30;
  const speed = layer.stickerSettings?.speed ?? 1.0;
  const loop = layer.stickerSettings?.loop ?? true;

  let animFrame = Math.floor(layer.sourceTime * speed * frameRate);
  if (loop) {
    animFrame = animFrame % totalFrames;
  } else {
    animFrame = Math.min(animFrame, totalFrames - 1);
  }

  const cacheKey = `${layer.layerId}_${physW}_${physH}_${animFrame}_${layer.opacity}_${layer.blendMode}`;

  if (bridge.lastCacheKey !== cacheKey) {
    bridge.anim.goToAndStop(animFrame, true);
    await Promise.resolve();

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
  sprite.width = width * pixelRatio;
  sprite.height = height * pixelRatio;
  sprite.blendMode = mapPixiBlendMode(layer.blendMode);
  sprite.zIndex = renderOrder;
  sprite.visible = true;

  return sprite;
}

export function unmountStickerLayerBridge(layerId: string, container: import("pixi.js").Container): void {
  const bridge = bridges.get(layerId);
  if (bridge) {
    container.removeChild(bridge.sprite);
    bridge.sprite.destroy();
    bridge.sprite.texture.destroy(false);
    try {
      bridge.anim.destroy();
    } catch {
      // safe destroy
    }
    bridge.container.remove();
    bridges.delete(layerId);
  }
}

export function endStickerFrame(frameId: number, container: import("pixi.js").Container): void {
  for (const [layerId, bridge] of bridges.entries()) {
    if (bridge.lastSeenFrame !== frameId) {
      bridge.sprite.visible = false;
    }

    if (frameId - bridge.lastSeenFrame > 180) {
      unmountStickerLayerBridge(layerId, container);
    }
  }
}

export function clearAllStickerBridges(container?: import("pixi.js").Container): void {
  for (const [layerId, bridge] of bridges.entries()) {
    if (container && bridge.sprite.parent === container) {
      container.removeChild(bridge.sprite);
    }
    bridge.sprite.destroy();
    bridge.sprite.texture.destroy(false);
    try {
      bridge.anim.destroy();
    } catch {
      // safe destroy
    }
    bridge.container.remove();
  }
  bridges.clear();
}
