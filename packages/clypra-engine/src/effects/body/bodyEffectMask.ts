import { Texture } from "pixi.js";

const maskTextures = new Map<string, Texture>();

export function applyBodyEffectMask(clipId: string, maskData: ImageData | HTMLCanvasElement | ImageBitmap): Texture {
  let maskTexture = maskTextures.get(clipId);
  if (!maskTexture) {
    maskTexture = Texture.from(maskData);
    maskTextures.set(clipId, maskTexture);
  } else {
    // If we receive a new instance or texture details, update it
    maskTexture.source.update();
  }
  return maskTexture;
}

export function clearBodyEffectMask(clipId: string): void {
  const maskTexture = maskTextures.get(clipId);
  if (maskTexture) {
    maskTexture.destroy(true);
    maskTextures.delete(clipId);
  }
}

export function clearAllBodyEffectMasks(): void {
  for (const [clipId, texture] of maskTextures.entries()) {
    texture.destroy(true);
  }
  maskTextures.clear();
}
