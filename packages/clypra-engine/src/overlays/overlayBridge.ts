import { Sprite, Texture, ColorMatrixFilter, Container } from "pixi.js";

export interface OverlayLayerConfig {
  layerId?: string;
  blendMode?: "normal" | "screen" | "multiply" | "overlay" | "add" | "soft-light" | "hard-light" | "color-dodge" | "color-burn" | "lighten" | "darken" | "difference";
  opacity?: number;
  brightness?: number; // -1 to 1
  contrast?: number;   // -1 to 1
  saturation?: number; // 0 to 2
  hueShift?: number;   // 0 to 360 degrees
  tint?: string;       // Hex string e.g. "#ff0000"
  scale?: number;      // 0.1 to 5.0
  offsetX?: number;    // px offset X
  offsetY?: number;    // px offset Y
  flipH?: boolean;
  flipV?: boolean;
  speed?: number;      // playback rate multiplier
  loop?: boolean;
  // Timing & In/Out Trim Envelope
  timingMode?: "continuous" | "timed";
  startTime?: number; // start time in seconds (e.g. 1.0)
  endTime?: number;   // end time in seconds (e.g. 6.0)
  fadeIn?: number;    // fade in duration in seconds (e.g. 0.5)
  fadeOut?: number;   // fade out duration in seconds (e.g. 0.5)
}

export interface OverlayDefinition {
  id: string;
  name: string;
  category: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  width: number;
  height: number;
  format: string;
  blendMode?: OverlayLayerConfig["blendMode"];
  defaultOpacity?: number;
  tags?: string[];
  description?: string;
  loopable?: boolean;
}

interface OverlayBridgeEntry {
  sprite: Sprite;
  colorFilter: ColorMatrixFilter;
  videoElement?: HTMLVideoElement | HTMLCanvasElement;
  overlayId: string;
  lastCacheKey: string;
  lastSeenFrame: number;
}

const bridges = new Map<string, OverlayBridgeEntry>();

function mapPixiBlendMode(blendMode: string = "screen"): any {
  const map: Record<string, string> = {
    normal: "normal",
    screen: "screen",
    multiply: "multiply",
    overlay: "overlay",
    add: "add",
    lighten: "lighten",
    darken: "darken",
  };
  return map[blendMode] || "screen";
}

/**
 * Render or update an Overlay layer inside a PixiJS Container.
 * Shared by Clypra Overlay Studio preview and Clypra NLE Editor timeline renderer.
 */
export async function renderOverlayLayerBridged(
  layer: {
    layerId: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    opacity?: number;
    blendMode?: OverlayLayerConfig["blendMode"];
    sourceTime?: number;
    overlayConfig?: OverlayLayerConfig;
  },
  videoSource: HTMLVideoElement | HTMLCanvasElement | Texture,
  frameId: number,
  container: Container,
  viewport: { scale: number; offsetX: number; offsetY: number; pixelRatio: number },
  renderOrder: number = 10,
  overlayId: string = "default-overlay"
): Promise<Sprite | null> {
  const { scale, offsetX, offsetY, pixelRatio } = viewport;
  const layerWidth = layer.width || 1920;
  const layerHeight = layer.height || 1080;
  const width = layerWidth * scale;
  const height = layerHeight * scale;

  let bridge = bridges.get(layer.layerId);

  // Re-create sprite/texture if source or overlay ID changes
  const needsRebind =
    !bridge ||
    bridge.overlayId !== overlayId ||
    ((videoSource instanceof HTMLVideoElement || videoSource instanceof HTMLCanvasElement) && bridge.videoElement !== videoSource);

  if (needsRebind) {
    if (bridge) {
      unmountOverlayLayerBridge(layer.layerId, container);
    }

    try {
      let texture: Texture;
      let videoEl: HTMLVideoElement | HTMLCanvasElement | undefined;

      if (videoSource instanceof HTMLVideoElement || videoSource instanceof HTMLCanvasElement) {
        videoEl = videoSource;
        texture = Texture.from(videoSource);
      } else {
        texture = videoSource;
      }

      const sprite = new Sprite(texture);
      const colorFilter = new ColorMatrixFilter();
      sprite.filters = [colorFilter];
      container.addChild(sprite);

      bridge = {
        sprite,
        colorFilter,
        videoElement: videoEl,
        overlayId,
        lastCacheKey: "",
        lastSeenFrame: frameId,
      };
      bridges.set(layer.layerId, bridge);
    } catch (err) {
      console.error("[OverlayBridge] Failed to initialize overlay sprite:", err);
      return null;
    }
  }

  bridge.lastSeenFrame = frameId;
  const config = layer.overlayConfig || {};
  let currentOpacity = layer.opacity ?? config.opacity ?? 1.0;
  const blendMode = layer.blendMode || config.blendMode || "screen";

  // In/Out Timing Trim & Smooth Opacity Envelope (Fade In / Fade Out)
  const currentTime = layer.sourceTime ?? 0;
  if (config.timingMode === "timed") {
    const start = config.startTime ?? 1.0;
    const end = config.endTime ?? 6.0;
    const fadeIn = config.fadeIn ?? 0.5;
    const fadeOut = config.fadeOut ?? 0.5;

    if (currentTime < start || currentTime > end) {
      bridge.sprite.visible = false;
      return bridge.sprite;
    }

    if (fadeIn > 0 && currentTime < start + fadeIn) {
      currentOpacity *= (currentTime - start) / fadeIn;
    } else if (fadeOut > 0 && currentTime > end - fadeOut) {
      currentOpacity *= (end - currentTime) / fadeOut;
    }
  }

  // Update texture frame if video or canvas source
  if (bridge.videoElement) {
    bridge.sprite.texture.source.update();
  }

  // Position and transform
  const layerX = layer.x ?? 0;
  const layerY = layer.y ?? 0;
  const centerX = layerX + layerWidth / 2 + (config.offsetX || 0);
  const centerY = layerY + layerHeight / 2 + (config.offsetY || 0);
  const physCenterX = (centerX * scale + offsetX) * pixelRatio;
  const physCenterY = (centerY * scale + offsetY) * pixelRatio;

  const sprite = bridge.sprite;
  sprite.anchor.set(0.5);
  sprite.position.set(physCenterX, physCenterY);
  sprite.rotation = ((layer.rotation || 0) * Math.PI) / 180;
  sprite.alpha = Math.max(0, Math.min(1, currentOpacity));

  const scaleMultiplier = config.scale || 1.0;
  const flipHMult = config.flipH ? -1 : 1;
  const flipVMult = config.flipV ? -1 : 1;

  sprite.width = width * pixelRatio * scaleMultiplier * flipHMult;
  sprite.height = height * pixelRatio * scaleMultiplier * flipVMult;
  sprite.blendMode = mapPixiBlendMode(blendMode);
  sprite.zIndex = renderOrder;
  sprite.visible = true;

  // Apply GPU Color Matrix Adjustments
  const filter = bridge.colorFilter;
  filter.reset();

  if (typeof config.contrast === "number" && config.contrast !== 0) {
    filter.contrast(config.contrast, true);
  }
  if (typeof config.saturation === "number" && config.saturation !== 1) {
    filter.saturate(config.saturation, true);
  }
  if (typeof config.hueShift === "number" && config.hueShift !== 0) {
    filter.hue(config.hueShift, true);
  }
  if (typeof config.brightness === "number" && config.brightness !== 0) {
    filter.brightness(1 + config.brightness, true);
  }

  return sprite;
}

/**
 * Remove an overlay layer bridge from the PixiJS container.
 */
export function unmountOverlayLayerBridge(layerId: string, container: Container): void {
  const bridge = bridges.get(layerId);
  if (bridge) {
    if (bridge.sprite.parent === container) {
      container.removeChild(bridge.sprite);
    }
    if (bridge.sprite.texture) {
      bridge.sprite.texture.destroy(false);
    }
    bridge.sprite.destroy();
    bridges.delete(layerId);
  }
}

/**
 * Clean up unseen overlay bridges at end of frame cycle.
 */
export function endOverlayFrame(frameId: number, container: Container): void {
  for (const [layerId, bridge] of bridges.entries()) {
    if (bridge.lastSeenFrame !== frameId) {
      bridge.sprite.visible = false;
    }
    if (frameId - bridge.lastSeenFrame > 180) {
      unmountOverlayLayerBridge(layerId, container);
    }
  }
}

/**
 * Clear all overlay bridges.
 */
export function clearAllOverlayBridges(container?: Container): void {
  for (const [layerId, bridge] of bridges.entries()) {
    if (container && bridge.sprite.parent === container) {
      container.removeChild(bridge.sprite);
    }
    if (bridge.sprite.texture) {
      bridge.sprite.texture.destroy(false);
    }
    bridge.sprite.destroy();
  }
  bridges.clear();
}

/**
 * HTML5 Canvas 2D fallback compositing utility for external canvas pipelines.
 */
export function compositeOverlay2D(
  ctx: CanvasRenderingContext2D,
  videoElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  config: OverlayLayerConfig,
  targetWidth: number,
  targetHeight: number
): void {
  ctx.save();

  const blendMode = config.blendMode || "screen";
  ctx.globalCompositeOperation = (blendMode === "add" ? "lighter" : blendMode) as GlobalCompositeOperation;
  ctx.globalAlpha = Math.max(0, Math.min(1, config.opacity ?? 1.0));

  const scale = config.scale || 1.0;
  const offsetX = config.offsetX || 0;
  const offsetY = config.offsetY || 0;
  const flipH = config.flipH ? -1 : 1;
  const flipV = config.flipV ? -1 : 1;

  ctx.translate(targetWidth / 2 + offsetX, targetHeight / 2 + offsetY);
  ctx.scale(scale * flipH, scale * flipV);

  // Apply CSS Filter string if supported
  const filters: string[] = [];
  if (typeof config.contrast === "number" && config.contrast !== 0) {
    filters.push(`contrast(${100 + config.contrast * 100}%)`);
  }
  if (typeof config.saturation === "number" && config.saturation !== 1) {
    filters.push(`saturate(${config.saturation * 100}%)`);
  }
  if (typeof config.hueShift === "number" && config.hueShift !== 0) {
    filters.push(`hue-rotate(${config.hueShift}deg)`);
  }
  if (typeof config.brightness === "number" && config.brightness !== 0) {
    filters.push(`brightness(${100 + config.brightness * 100}%)`);
  }

  if (filters.length > 0) {
    ctx.filter = filters.join(" ");
  }

  ctx.drawImage(videoElement, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
  ctx.restore();
}

/**
 * Generate CSS style object for overlay compositing in web apps.
 */
export function generateOverlayCssStyle(config: OverlayLayerConfig): Record<string, string> {
  const blendModeMap: Record<string, string> = {
    normal: "normal",
    screen: "screen",
    multiply: "multiply",
    overlay: "overlay",
    add: "plus-lighter",
    "soft-light": "soft-light",
    "hard-light": "hard-light",
    "color-dodge": "color-dodge",
    "color-burn": "color-burn",
    lighten: "lighten",
    darken: "darken",
    difference: "difference",
  };

  const filters: string[] = [];
  if (typeof config.contrast === "number" && config.contrast !== 0) {
    filters.push(`contrast(${100 + config.contrast * 100}%)`);
  }
  if (typeof config.saturation === "number" && config.saturation !== 1) {
    filters.push(`saturate(${config.saturation * 100}%)`);
  }
  if (typeof config.hueShift === "number" && config.hueShift !== 0) {
    filters.push(`hue-rotate(${config.hueShift}deg)`);
  }
  if (typeof config.brightness === "number" && config.brightness !== 0) {
    filters.push(`brightness(${100 + config.brightness * 100}%)`);
  }

  const transformParts: string[] = [];
  if (config.scale && config.scale !== 1) transformParts.push(`scale(${config.scale})`);
  if (config.flipH || config.flipV) transformParts.push(`scale(${config.flipH ? -1 : 1}, ${config.flipV ? -1 : 1})`);
  if (config.offsetX || config.offsetY) transformParts.push(`translate(${config.offsetX || 0}px, ${config.offsetY || 0}px)`);

  return {
    mixBlendMode: blendModeMap[config.blendMode || "screen"] || "screen",
    opacity: String(config.opacity ?? 1.0),
    filter: filters.length ? filters.join(" ") : "none",
    transform: transformParts.length ? transformParts.join(" ") : "none",
  };
}

/**
 * Generate WebGPU uniform layout object for shaders.
 */
export function generateOverlayWebGpuUniforms(config: OverlayLayerConfig) {
  return {
    uOpacity: config.opacity ?? 1.0,
    uBlendMode: config.blendMode || "screen",
    uContrast: config.contrast ?? 0.0,
    uSaturation: config.saturation ?? 1.0,
    uHueShift: ((config.hueShift ?? 0) * Math.PI) / 180,
    uBrightness: config.brightness ?? 0.0,
    uScale: [config.scale ?? 1.0, config.scale ?? 1.0],
    uOffset: [config.offsetX ?? 0, config.offsetY ?? 0],
    uFlip: [config.flipH ? -1 : 1, config.flipV ? -1 : 1],
  };
}
