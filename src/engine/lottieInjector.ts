/**
 * Lottie Customization & Injections Engine
 * Implements real-time text and color mutations in Lottie JSON payloads.
 */

export interface TextLayerConfig {
  layerName: string;
  defaultText: string;
  maxCharacters: number;
  role: 'primary' | 'secondary' | 'accent';
}

export type TextCustomization = {
  primary: string;
  secondary: string;
  accent: string;
};

/**
 * Deep clones a Lottie JSON object and injects customized text values into
 * corresponding text layers matching mapped roles.
 */
export function injectText(
  lottieData: any,
  customization: TextCustomization,
  textLayers: TextLayerConfig[]
): any {
  if (!lottieData) return lottieData;
  
  // Deep clone to prevent mutating original parsed asset
  const clone = JSON.parse(JSON.stringify(lottieData));

  // Build a lookup map of layerName -> config
  const configMap = new Map<string, TextLayerConfig>();
  textLayers.forEach(layer => {
    configMap.set(layer.layerName, layer);
  });

  function processLayer(layer: any) {
    if (!layer) return;

    // Text layer identification (ty === 5)
    if (layer.ty === 5) {
      const config = configMap.get(layer.nm);
      if (config) {
        const rawText = customization[config.role] !== undefined
          ? customization[config.role]
          : config.defaultText;
          
        const truncatedText = rawText.slice(0, config.maxCharacters);
        const lottieCompatibleText = truncatedText.replace(/\n/g, "\r");

        // Mutate according to the target specifications
        if (layer.t && layer.t.d) {
          const d = layer.t.d;
          if (Array.isArray(d.k)) {
            d.k.forEach((kf: any) => {
              if (kf && kf.s) {
                kf.s.t = lottieCompatibleText;
              }
            });
          } else if (d.k && d.k.s) {
            d.k.s.t = lottieCompatibleText;
          }
        }
      }
    }
  }

  function traverse(layers: any[]) {
    if (!Array.isArray(layers)) return;
    layers.forEach(layer => {
      processLayer(layer);
    });
  }

  // 1. Traverse top-level layers
  if (Array.isArray(clone.layers)) {
    traverse(clone.layers);
  }

  // 2. Traverse layers in pre-compositions (assets)
  if (Array.isArray(clone.assets)) {
    clone.assets.forEach((asset: any) => {
      if (asset && Array.isArray(asset.layers)) {
        traverse(asset.layers);
      }
    });
  }

  return clone;
}

/**
 * Converts a hex color (#RRGGBB) to a Lottie normalized [r, g, b] array (values between 0.0 and 1.0)
 */
export function hexToLottieRgb(hex: string): [number, number, number] {
  // Strip '#' if present
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  
  if (cleanHex.length !== 6) {
    return [0.0, 0.0, 0.0]; // fallback
  }

  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b)),
  ];
}

/**
 * Deep clones Lottie JSON and recursively traverses standard fill shapes (ty === "fl")
 * within a specific named layer, converting hex color to normalized RGB.
 */
export function injectColor(
  lottieData: any,
  layerName: string,
  hexColor: string
): any {
  if (!lottieData || !layerName) return lottieData;

  const clone = JSON.parse(JSON.stringify(lottieData));
  const targetRgb = hexToLottieRgb(hexColor);

  function traverseShapesForFills(obj: any) {
    if (!obj || typeof obj !== "object") return;

    // Lottie fill shape is ty === "fl"
    if (obj.ty === "fl" && obj.c) {
      const c = obj.c;
      if (Array.isArray(c.k)) {
        if (c.k.length >= 3) {
          c.k[0] = targetRgb[0];
          c.k[1] = targetRgb[1];
          c.k[2] = targetRgb[2];
        } else {
          c.k = targetRgb;
        }
      }
    }

    // Recurse into all keys
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (Array.isArray(val)) {
        val.forEach(item => traverseShapesForFills(item));
      } else if (val && typeof val === "object") {
        traverseShapesForFills(val);
      }
    }
  }

  function processLayer(layer: any) {
    if (layer && layer.nm === layerName) {
      // Found the target layer! Recurse into its shapes
      traverseShapesForFills(layer);
    }
  }

  function traverseLayers(layers: any[]) {
    if (!Array.isArray(layers)) return;
    layers.forEach(layer => {
      processLayer(layer);
    });
  }

  // 1. Process top-level layers
  if (Array.isArray(clone.layers)) {
    traverseLayers(clone.layers);
  }

  // 2. Process asset layers
  if (Array.isArray(clone.assets)) {
    clone.assets.forEach((asset: any) => {
      if (asset && Array.isArray(asset.layers)) {
        traverseLayers(asset.layers);
      }
    });
  }

  return clone;
}
