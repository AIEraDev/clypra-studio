import { Sprite, Texture, VideoSource } from "pixi.js";
import { resolveConform, type ClipConform } from "./conform.js";

export interface MediaSpriteRecord {
  clipId: string;
  kind: "video" | "image";
  sprite: Sprite;
  texture: Texture;
  source: any; // VideoSource or ImageSource wrapper
  sourceIdentity: HTMLVideoElement | ImageBitmap | HTMLImageElement;
  lastSeenFrame: number;
  width: number;
  height: number;
  destroyed: boolean;
}

export interface RenderViewport {
  scale: number;
  offsetX: number;
  offsetY: number;
  pixelRatio: number;
  projectWidth?: number;
  projectHeight?: number;
}

const mediaRegistry = new Map<string, MediaSpriteRecord>();

export function getActiveMediaSpriteKeys(): string[] {
  return Array.from(mediaRegistry.keys());
}

export function getMediaSpriteRecord(clipId: string): MediaSpriteRecord | undefined {
  return mediaRegistry.get(clipId);
}

export function applyMediaTransform(
  sprite: Sprite,
  layer: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    sourceRotation?: number;
    opacity: number;
    conform?: ClipConform;
  },
  viewport: RenderViewport,
): void {
  const { projectWidth, projectHeight } = viewport;

  const conform = layer.conform || {
    mode: "fit" as const,
    sourceWidth: layer.width || 0,
    sourceHeight: layer.height || 0,
    userScale: 1,
    userOffsetX: 0,
    userOffsetY: 0,
  };

  const { x, y, width, height } = resolveConform(conform, projectWidth || 1920, projectHeight || 1080);
  const isTransposed = layer.sourceRotation === 90 || layer.sourceRotation === 270;

  sprite.anchor.set(0, 0);
  sprite.position.set(x, y);

  sprite.width = isTransposed ? height : width;
  sprite.height = isTransposed ? width : height;

  const sw = sprite.texture.source.width;
  const sh = sprite.texture.source.height;
  if (sw && sh) {
    const currFrame = sprite.texture.frame;
    if (currFrame && (currFrame.x !== 0 || currFrame.y !== 0 || currFrame.width !== sw || currFrame.height !== sh)) {
      sprite.texture.frame.x = 0;
      sprite.texture.frame.y = 0;
      sprite.texture.frame.width = sw;
      sprite.texture.frame.height = sh;
      sprite.texture.orig.x = 0;
      sprite.texture.orig.y = 0;
      sprite.texture.orig.width = sw;
      sprite.texture.orig.height = sh;
      if (typeof sprite.texture.updateUvs === "function") {
        sprite.texture.updateUvs();
      }
      if (typeof (sprite as any).onViewUpdate === "function") {
        (sprite as any).onViewUpdate();
      }
    }
  }

  sprite.rotation = (((layer.rotation || 0) + (layer.sourceRotation || 0)) * Math.PI) / 180;
  sprite.alpha = layer.opacity;
}

export function releaseMediaSprite(clipId: string, container: import("pixi.js").Container): void {
  const record = mediaRegistry.get(clipId);
  if (record) {
    container.removeChild(record.sprite);
    record.sprite.destroy();
    record.texture.destroy(false);
    record.destroyed = true;
    mediaRegistry.delete(clipId);
  }
}

export function getOrCreateMediaSprite(clipId: string, kind: "video" | "image", sourceElement: HTMLVideoElement | ImageBitmap | HTMLImageElement, container: import("pixi.js").Container): MediaSpriteRecord {
  let record = mediaRegistry.get(clipId);

  if (record) {
    const isVideo = kind === "video";
    const videoEl = sourceElement as HTMLVideoElement;
    const dimensionsMismatch = isVideo && videoEl.videoWidth > 0 && (record.texture.source.width !== videoEl.videoWidth || record.texture.source.height !== videoEl.videoHeight);

    if (record.sourceIdentity !== sourceElement || dimensionsMismatch) {
      releaseMediaSprite(clipId, container);
      record = undefined;
    }
  }

  if (!record) {
    let source: any;
    let texture: Texture;

    if (kind === "video") {
      source = new VideoSource({ resource: sourceElement as HTMLVideoElement, autoPlay: false });
      texture = new Texture({ source });
    } else {
      source = null;
      const baseTexture = Texture.from(sourceElement as ImageBitmap | HTMLImageElement);
      texture = new Texture({ source: baseTexture.source });
    }

    const sprite = new Sprite(texture);
    container.addChild(sprite);

    record = {
      clipId,
      kind,
      sprite,
      texture,
      source,
      sourceIdentity: sourceElement,
      lastSeenFrame: 0,
      width: sprite.width,
      height: sprite.height,
      destroyed: false,
    };
    mediaRegistry.set(clipId, record);
  } else {
    if (record.sprite.parent !== container) {
      container.addChild(record.sprite);
    }
  }

  return record;
}

export function clearAllMediaSprites(container?: import("pixi.js").Container): void {
  for (const [clipId, record] of mediaRegistry.entries()) {
    if (container && record.sprite.parent === container) {
      container.removeChild(record.sprite);
    }
    record.sprite.destroy();
    record.texture.destroy(false);
  }
  mediaRegistry.clear();
}
