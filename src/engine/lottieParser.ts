/**
 * Lottie JSON Parser
 * Auto-extracts dimensions, length, framerate, and all text layers.
 */

export interface ParsedTextLayer {
  layerName: string;
  defaultText: string;
}

export interface LottieFileInfo {
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  textLayers: ParsedTextLayer[];
}

/**
 * Extracts the default text string from a Lottie layer.t.d.k structure
 */
export function getDefaultText(layer: any): string {
  if (!layer.t || !layer.t.d) return "";
  const d = layer.t.d;
  if (Array.isArray(d.k)) {
    const firstKf = d.k[0];
    if (firstKf && firstKf.s && typeof firstKf.s.t === "string") {
      return firstKf.s.t;
    }
  } else if (d.k && d.k.s && typeof d.k.s.t === "string") {
    return d.k.s.t;
  }
  return "";
}

/**
 * Recursively scans layers (including nested precompositions) for text layers (ty === 5)
 */
export function scanTextLayers(lottieData: any): ParsedTextLayer[] {
  const result: ParsedTextLayer[] = [];
  const visitedLayerNames = new Set<string>();

  function traverseLayers(layers: any[]) {
    if (!Array.isArray(layers)) return;
    for (const layer of layers) {
      if (!layer) continue;

      // Text layer is ty === 5
      if (layer.ty === 5) {
        const name = layer.nm || "Unnamed Layer";
        const defaultText = getDefaultText(layer);
        if (!visitedLayerNames.has(name)) {
          visitedLayerNames.add(name);
          result.push({
            layerName: name,
            defaultText,
          });
        }
      }
    }
  }

  // 1. Scan main layers
  if (Array.isArray(lottieData.layers)) {
    traverseLayers(lottieData.layers);
  }

  // 2. Scan layers inside assets (pre-compositions)
  if (Array.isArray(lottieData.assets)) {
    for (const asset of lottieData.assets) {
      if (asset && Array.isArray(asset.layers)) {
        traverseLayers(asset.layers);
      }
    }
  }

  return result;
}

/**
 * Parse an uploaded Lottie JSON object to extract metadata and text layers
 */
export function parseLottieJson(lottieData: any): LottieFileInfo {
  if (!lottieData || typeof lottieData !== "object") {
    throw new Error("Invalid Lottie JSON payload.");
  }

  const width = typeof lottieData.w === "number" ? lottieData.w : 1920;
  const height = typeof lottieData.h === "number" ? lottieData.h : 1080;
  const fps = typeof lottieData.fr === "number" ? lottieData.fr : 30;

  const ip = typeof lottieData.ip === "number" ? lottieData.ip : 0;
  const op = typeof lottieData.op === "number" ? lottieData.op : 100;
  const durationFrames = Math.max(1, Math.round(op - ip));

  const textLayers = scanTextLayers(lottieData);

  return {
    width,
    height,
    fps,
    durationFrames,
    textLayers,
  };
}
