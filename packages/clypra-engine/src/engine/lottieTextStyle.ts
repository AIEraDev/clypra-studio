/**
 * Lottie Per-Layer Text Style Engine
 * Provides rich text styling (font, fill, gradient, stroke, shadow, glow, tracking)
 * that maps directly to Lottie JSON text document properties.
 */

export type TextAlign = "left" | "center" | "right" | "justify";
export type FillType = "solid" | "gradient";
export type GradientDir = "horizontal" | "vertical" | "diagonal" | "radial";

export interface LottieGradientStop {
  color: string; // hex
  position: number; // 0–1
}

export interface TextLayerStyle {
  // Typography
  fontName: string; // Lottie fName e.g. "Poppins-Bold"
  fontFamily: string; // CSS family e.g. "Poppins"
  fontWeight: number; // 100–900
  fontStyle: "normal" | "italic";
  fontSize: number; // px
  tracking: number; // letter spacing (Lottie tr units = 1/1000 em)
  lineHeight: number; // multiplier
  align: TextAlign;

  // Fill
  fillType: FillType;
  fillColor: string; // hex, used when fillType === "solid"
  gradientStops: LottieGradientStop[];
  gradientDir: GradientDir;

  // Stroke
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number; // px
  strokeOpacity: number; // 0–100

  // Shadow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number; // 0–100

  // Glow (simulated via multiple shadow passes)
  glowEnabled: boolean;
  glowColor: string;
  glowBlur: number;
  glowOpacity: number; // 0–100

  // Transform
  posX: number; // offset from layer anchor (px)
  posY: number;
  scaleX: number; // 0–200 (%)
  scaleY: number;
  rotation: number; // degrees
  opacity: number; // 0–100
}

export const DEFAULT_TEXT_STYLE: TextLayerStyle = {
  fontName: "Poppins-Bold",
  fontFamily: "Poppins",
  fontWeight: 700,
  fontStyle: "normal",
  fontSize: 72,
  tracking: 0,
  lineHeight: 1.2,
  align: "center",
  fillType: "solid",
  fillColor: "#FFFFFF",
  gradientStops: [
    { color: "#FFFFFF", position: 0 },
    { color: "#AAAAAA", position: 1 },
  ],
  gradientDir: "vertical",
  strokeEnabled: false,
  strokeColor: "#000000",
  strokeWidth: 2,
  strokeOpacity: 100,
  shadowEnabled: false,
  shadowColor: "#000000",
  shadowBlur: 8,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  shadowOpacity: 60,
  glowEnabled: false,
  glowColor: "#7C6FFF",
  glowBlur: 20,
  glowOpacity: 80,
  posX: 0,
  posY: 0,
  scaleX: 100,
  scaleY: 100,
  rotation: 0,
  opacity: 100,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert #RRGGBB to Lottie normalized [r, g, b] (0–1) */
export function hexToLottieColor(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return [parseInt(clean.slice(0, 2), 16) / 255, parseInt(clean.slice(2, 4), 16) / 255, parseInt(clean.slice(4, 6), 16) / 255];
}

/** Convert Lottie [r,g,b] (0–1) back to #RRGGBB */
export function lottieColorToHex(rgb: number[]): string {
  const r = Math.round((rgb[0] ?? 0) * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round((rgb[1] ?? 0) * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round((rgb[2] ?? 0) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`.toUpperCase();
}

/** Map CSS font-weight + style to a Lottie fName */
export function buildLottieFontName(family: string, weight: number, style: "normal" | "italic"): string {
  const isItalic = style === "italic";
  const isBold = weight >= 700;
  const isExtraBold = weight >= 800;
  const isBlack = weight >= 900;

  if (isBlack) return isItalic ? `${family}-BlackItalic` : `${family}-Black`;
  if (isExtraBold) return isItalic ? `${family}-ExtraBoldItalic` : `${family}-ExtraBold`;
  if (isBold) return isItalic ? `${family}-BoldItalic` : `${family}-Bold`;
  return isItalic ? `${family}-Italic` : `${family}-Regular`;
}

/** Lottie text alignment: 0=left, 1=center, 2=right, 3=justify */
export function alignToLottieJ(align: TextAlign): number {
  switch (align) {
    case "left":
      return 0;
    case "center":
      return 1;
    case "right":
      return 2;
    case "justify":
      return 3;
    default:
      return 1;
  }
}

export function lottieJToAlign(j: number): TextAlign {
  switch (j) {
    case 0:
      return "left";
    case 1:
      return "center";
    case 2:
      return "right";
    case 3:
      return "justify";
    default:
      return "center";
  }
}

// ─── Read style from Lottie layer ────────────────────────────────────────────

/**
 * Extract a TextLayerStyle from an existing Lottie text layer (ty === 5).
 * Falls back to defaults for any missing properties.
 */
export function readStyleFromLottieLayer(layer: any): TextLayerStyle {
  const style: TextLayerStyle = { ...DEFAULT_TEXT_STYLE };
  if (!layer || layer.ty !== 5) return style;

  // Transform
  const ks = layer.ks || {};
  const pos = ks.p?.k;
  if (Array.isArray(pos)) {
    style.posX = pos[0] ?? 0;
    style.posY = pos[1] ?? 0;
  }
  const scale = ks.s?.k;
  if (Array.isArray(scale)) {
    style.scaleX = scale[0] ?? 100;
    style.scaleY = scale[1] ?? 100;
  }
  const rot = ks.r?.k;
  if (typeof rot === "number") style.rotation = rot;
  const op = ks.o?.k;
  if (typeof op === "number") style.opacity = op;

  // Text document
  const td = layer.t?.d;
  if (!td) return style;
  const kf0 = Array.isArray(td.k) ? td.k[0]?.s : td.k?.s;
  if (!kf0) return style;

  if (typeof kf0.s === "number") style.fontSize = kf0.s;
  if (typeof kf0.f === "string") {
    style.fontName = kf0.f;
    // Parse family from fName
    const parts = kf0.f.split("-");
    style.fontFamily = parts[0] ?? "Poppins";
    const variant = parts[1]?.toLowerCase() ?? "";
    style.fontStyle = variant.includes("italic") ? "italic" : "normal";
    style.fontWeight = variant.includes("black") ? 900 : variant.includes("extrabold") ? 800 : variant.includes("bold") ? 700 : 400;
  }
  if (typeof kf0.j === "number") style.align = lottieJToAlign(kf0.j);
  if (typeof kf0.tr === "number") style.tracking = kf0.tr;
  if (typeof kf0.lh === "number") style.lineHeight = kf0.lh / (kf0.s || 72);

  // Fill color
  if (Array.isArray(kf0.fc) && kf0.fc.length >= 3) {
    style.fillColor = lottieColorToHex(kf0.fc);
    style.fillType = "solid";
  }

  // Stroke
  if (Array.isArray(kf0.sc) && kf0.sc.length >= 3) {
    style.strokeEnabled = true;
    style.strokeColor = lottieColorToHex(kf0.sc);
    style.strokeWidth = typeof kf0.sw === "number" ? kf0.sw : 0;
    style.strokeEnabled = style.strokeWidth > 0;
  }

  return style;
}

// ─── Write style into Lottie layer ───────────────────────────────────────────

/**
 * Apply a TextLayerStyle to a Lottie text layer (ty === 5).
 * Returns a new deep-cloned layer with all style properties applied.
 */
export function applyStyleToLottieLayer(layer: any, style: TextLayerStyle): any {
  const clone = JSON.parse(JSON.stringify(layer));
  if (!clone || clone.ty !== 5) return clone;

  // ── Transform ──
  const ks = clone.ks || {};
  // Position (additive offset from current anchor)
  if (ks.p) {
    if (ks.p.a === 0) {
      const base = Array.isArray(ks.p.k) ? ks.p.k : [0, 0, 0];
      ks.p.k = [style.posX || base[0], style.posY || base[1], base[2] ?? 0];
    }
  }
  // Scale
  if (ks.s) {
    if (ks.s.a === 0) {
      ks.s.k = [style.scaleX, style.scaleY, 100];
    }
  }
  // Rotation
  if (ks.r) {
    if (ks.r.a === 0) ks.r.k = style.rotation;
  }
  // Opacity
  if (ks.o) {
    if (ks.o.a === 0) ks.o.k = style.opacity;
  }
  clone.ks = ks;

  // ── Text Document ──
  const td = clone.t?.d;
  if (!td) return clone;

  const applyToDoc = (doc: any) => {
    if (!doc) return;
    doc.s = style.fontSize;
    doc.f = style.fontName || buildLottieFontName(style.fontFamily, style.fontWeight, style.fontStyle);
    doc.j = alignToLottieJ(style.align);
    doc.tr = style.tracking;
    doc.lh = style.fontSize * style.lineHeight;

    // Fill color
    doc.fc = hexToLottieColor(style.fillColor);

    // Stroke
    if (style.strokeEnabled && style.strokeWidth > 0) {
      doc.sc = hexToLottieColor(style.strokeColor);
      doc.sw = style.strokeWidth;
      doc.of = false; // stroke over fill
    } else {
      doc.sw = 0;
    }
  };

  if (Array.isArray(td.k)) {
    td.k.forEach((kf: any) => {
      if (kf?.s) applyToDoc(kf.s);
    });
  } else if (td.k?.s) {
    applyToDoc(td.k.s);
  }

  return clone;
}

/**
 * Apply a TextLayerStyle to a full Lottie composition at a given layer index.
 */
export function applyStyleToLottie(lottieData: any, layerIndex: number, style: TextLayerStyle): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  if (!clone.layers?.[layerIndex]) return clone;
  clone.layers[layerIndex] = applyStyleToLottieLayer(clone.layers[layerIndex], style);
  return clone;
}

// ─── Font registry ───────────────────────────────────────────────────────────

export interface LottieFontEntry {
  fName: string;
  fFamily: string;
  fWeight: string;
  fStyle: string;
  asName: string;
  googleFont?: boolean;
}

/** Ensure a font is registered in the Lottie fonts list */
export function ensureFontInLottie(lottieData: any, entry: LottieFontEntry): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  if (!clone.fonts) clone.fonts = { list: [] };
  if (!Array.isArray(clone.fonts.list)) clone.fonts.list = [];
  const exists = clone.fonts.list.some((f: any) => f.fName === entry.fName);
  if (!exists) clone.fonts.list.push(entry);
  return clone;
}

/** Full set of supported fonts with all variants */
export const SUPPORTED_FONT_FAMILIES: string[] = ["Poppins", "Montserrat", "Inter", "Roboto", "Open Sans", "Lato", "Raleway", "Oswald", "Bebas Neue", "Anton", "Playfair Display", "Merriweather", "Nunito", "Ubuntu", "Source Sans Pro", "PT Sans", "Noto Sans", "Exo 2", "Barlow", "Kanit", "Righteous", "Pacifico", "Lobster", "Dancing Script", "Satisfy", "Permanent Marker", "Arial", "Georgia", "Times New Roman", "Courier New"];

export const FONT_WEIGHT_OPTIONS = [
  { label: "Thin", value: 100 },
  { label: "Light", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "SemiBold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "ExtraBold", value: 800 },
  { label: "Black", value: 900 },
];

/** Build all Lottie font entries for a given family */
export function buildFontEntries(family: string): LottieFontEntry[] {
  const variants: Array<{ weight: string; style: string; suffix: string }> = [
    { weight: "400", style: "Regular", suffix: "Regular" },
    { weight: "700", style: "Bold", suffix: "Bold" },
    { weight: "400", style: "Italic", suffix: "Italic" },
    { weight: "700", style: "Bold Italic", suffix: "BoldItalic" },
    { weight: "800", style: "ExtraBold", suffix: "ExtraBold" },
    { weight: "900", style: "Black", suffix: "Black" },
  ];
  return variants.map((v) => ({
    fName: `${family}-${v.suffix}`,
    fFamily: family,
    fWeight: v.weight,
    fStyle: v.style,
    asName: `${family}-${v.suffix}`,
    googleFont: !["Arial", "Georgia", "Times New Roman", "Courier New"].includes(family),
  }));
}
