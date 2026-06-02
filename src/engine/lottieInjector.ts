/**
 * Lottie Customization & Injections Engine
 * Implements real-time text, color, and full per-layer style mutations.
 */

export interface TextLayerConfig {
  layerName: string;
  defaultText: string;
  maxCharacters: number;
  role: "primary" | "secondary" | "accent";
}

export type TextCustomization = {
  primary: string;
  secondary: string;
  accent: string;
};

/** Full per-layer text style override — all fields optional */
export interface TextStyleOverride {
  text?: string;
  fontName?: string; // Lottie fName e.g. "Poppins-Bold"
  fontSize?: number;
  fillColor?: string; // hex
  strokeColor?: string; // hex
  strokeWidth?: number;
  tracking?: number; // Lottie tr
  lineHeight?: number; // Lottie lh (absolute px)
  align?: 0 | 1 | 2 | 3; // 0=left 1=center 2=right 3=justify
  opacity?: number; // 0–100
  scaleX?: number; // 0–200 %
  scaleY?: number;
  posX?: number;
  posY?: number;
  rotation?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert #RRGGBB to Lottie normalized [r, g, b] (0–1).
 */
export function hexToLottieRgb(hex: string): [number, number, number] {
  const clean = (hex.startsWith("#") ? hex.slice(1) : hex).padEnd(6, "0");
  if (clean.length !== 6) return [0, 0, 0];
  return [Math.max(0, Math.min(1, parseInt(clean.slice(0, 2), 16) / 255)), Math.max(0, Math.min(1, parseInt(clean.slice(2, 4), 16) / 255)), Math.max(0, Math.min(1, parseInt(clean.slice(4, 6), 16) / 255))];
}

function applyToTextDoc(doc: any, override: TextStyleOverride): void {
  if (!doc) return;
  if (override.text !== undefined) doc.t = override.text.replace(/\n/g, "\r");
  if (override.fontName !== undefined) doc.f = override.fontName;
  if (override.fontSize !== undefined) doc.s = override.fontSize;
  if (override.tracking !== undefined) doc.tr = override.tracking;
  if (override.lineHeight !== undefined) doc.lh = override.lineHeight;
  if (override.align !== undefined) doc.j = override.align;
  if (override.fillColor !== undefined) doc.fc = hexToLottieRgb(override.fillColor);
  if (override.strokeColor !== undefined && override.strokeWidth !== undefined) {
    doc.sc = hexToLottieRgb(override.strokeColor);
    doc.sw = override.strokeWidth;
  } else if (override.strokeWidth !== undefined) {
    doc.sw = override.strokeWidth;
  }
}

function applyToLayerTransform(layer: any, override: TextStyleOverride): void {
  const ks = layer.ks;
  if (!ks) return;
  if (override.opacity !== undefined && ks.o?.a === 0) ks.o.k = override.opacity;
  if (override.rotation !== undefined && ks.r?.a === 0) ks.r.k = override.rotation;
  if (override.scaleX !== undefined && override.scaleY !== undefined && ks.s?.a === 0) {
    ks.s.k = [override.scaleX, override.scaleY, 100];
  }
  if (override.posX !== undefined && override.posY !== undefined && ks.p?.a === 0) {
    const z = Array.isArray(ks.p.k) ? (ks.p.k[2] ?? 0) : 0;
    ks.p.k = [override.posX, override.posY, z];
  }
}

function mutateTextLayer(layer: any, override: TextStyleOverride): void {
  if (!layer || layer.ty !== 5) return;
  applyToLayerTransform(layer, override);
  const td = layer.t?.d;
  if (!td) return;
  if (Array.isArray(td.k)) {
    td.k.forEach((kf: any) => {
      if (kf?.s) applyToTextDoc(kf.s, override);
    });
  } else if (td.k?.s) {
    applyToTextDoc(td.k.s, override);
  }
}

function traverseAllLayers(lottieData: any, fn: (layer: any) => void): void {
  if (Array.isArray(lottieData.layers)) lottieData.layers.forEach(fn);
  if (Array.isArray(lottieData.assets)) {
    lottieData.assets.forEach((asset: any) => {
      if (Array.isArray(asset.layers)) asset.layers.forEach(fn);
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Inject text content into mapped text layers by role.
 */
export function injectText(lottieData: any, customization: TextCustomization, textLayers: TextLayerConfig[]): any {
  if (!lottieData) return lottieData;
  const clone = JSON.parse(JSON.stringify(lottieData));
  const configMap = new Map(textLayers.map((l) => [l.layerName, l]));

  traverseAllLayers(clone, (layer) => {
    if (layer.ty !== 5) return;
    const config = configMap.get(layer.nm);
    if (!config) return;
    const raw = customization[config.role] ?? config.defaultText;
    const text = raw.slice(0, config.maxCharacters);
    mutateTextLayer(layer, { text });
  });

  return clone;
}

/**
 * Inject a full style override into a specific named text layer.
 */
export function injectTextStyle(lottieData: any, layerName: string, override: TextStyleOverride): any {
  if (!lottieData) return lottieData;
  const clone = JSON.parse(JSON.stringify(lottieData));

  traverseAllLayers(clone, (layer) => {
    if (layer.ty !== 5 || layer.nm !== layerName) return;
    mutateTextLayer(layer, override);
  });

  return clone;
}

/**
 * Inject style overrides into ALL text layers at once.
 * Useful for applying a global font/color change.
 */
export function injectGlobalTextStyle(lottieData: any, override: Omit<TextStyleOverride, "text" | "posX" | "posY">): any {
  if (!lottieData) return lottieData;
  const clone = JSON.parse(JSON.stringify(lottieData));

  traverseAllLayers(clone, (layer) => {
    if (layer.ty !== 5) return;
    mutateTextLayer(layer, override);
  });

  return clone;
}

/**
 * Inject fill color into shape layers (ty === "fl") within a named layer.
 */
export function injectColor(lottieData: any, layerName: string, hexColor: string): any {
  if (!lottieData || !layerName) return lottieData;
  const clone = JSON.parse(JSON.stringify(lottieData));
  const targetRgb = hexToLottieRgb(hexColor);

  function traverseShapes(obj: any): void {
    if (!obj || typeof obj !== "object") return;
    if (obj.ty === "fl" && obj.c) {
      const c = obj.c;
      if (Array.isArray(c.k) && c.k.length >= 3) {
        c.k[0] = targetRgb[0];
        c.k[1] = targetRgb[1];
        c.k[2] = targetRgb[2];
      } else {
        c.k = [...targetRgb];
      }
    }
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (Array.isArray(val)) val.forEach(traverseShapes);
      else if (val && typeof val === "object") traverseShapes(val);
    }
  }

  traverseAllLayers(clone, (layer) => {
    if (layer.nm === layerName) traverseShapes(layer);
  });

  return clone;
}

/**
 * Inject solid layer background color (ty === 1).
 */
export function injectSolidColor(lottieData: any, layerName: string, hexColor: string): any {
  if (!lottieData) return lottieData;
  const clone = JSON.parse(JSON.stringify(lottieData));

  traverseAllLayers(clone, (layer) => {
    if (layer.ty === 1 && layer.nm === layerName) {
      layer.sc = hexColor;
    }
  });

  return clone;
}

/**
 * Batch inject multiple overrides in one pass — most efficient for live preview.
 */
export interface BatchInjection {
  textCustomization?: { customization: TextCustomization; layers: TextLayerConfig[] };
  styleOverrides?: Array<{ layerName: string; override: TextStyleOverride }>;
  colorOverrides?: Array<{ layerName: string; color: string }>;
  solidOverrides?: Array<{ layerName: string; color: string }>;
  hiddenLayers?: Set<number>;
}

export function injectBatch(lottieData: any, batch: BatchInjection): any {
  if (!lottieData) return lottieData;
  let clone = JSON.parse(JSON.stringify(lottieData));

  // Apply visibility toggles
  if (batch.hiddenLayers && Array.isArray(clone.layers)) {
    clone.layers.forEach((layer: any, idx: number) => {
      layer.hd = batch.hiddenLayers!.has(idx);
    });
  }

  // Text content injection
  if (batch.textCustomization) {
    const { customization, layers } = batch.textCustomization;
    const configMap = new Map(layers.map((l) => [l.layerName, l]));
    traverseAllLayers(clone, (layer) => {
      if (layer.ty !== 5) return;
      const config = configMap.get(layer.nm);
      if (!config) return;
      const raw = customization[config.role] ?? config.defaultText;
      mutateTextLayer(layer, { text: raw.slice(0, config.maxCharacters) });
    });
  }

  // Per-layer style overrides
  if (batch.styleOverrides) {
    const styleMap = new Map(batch.styleOverrides.map((s) => [s.layerName, s.override]));
    traverseAllLayers(clone, (layer) => {
      if (layer.ty !== 5) return;
      const override = styleMap.get(layer.nm);
      if (override) mutateTextLayer(layer, override);
    });
  }

  // Shape color overrides
  if (batch.colorOverrides) {
    for (const { layerName, color } of batch.colorOverrides) {
      clone = injectColor(clone, layerName, color);
    }
  }

  // Solid layer color overrides
  if (batch.solidOverrides) {
    for (const { layerName, color } of batch.solidOverrides) {
      clone = injectSolidColor(clone, layerName, color);
    }
  }

  return clone;
}
