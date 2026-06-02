/**
 * Google Fonts loader for the Lottie Studio.
 * Scans a Lottie composition for all font families used, then injects
 * the appropriate Google Fonts stylesheet + @font-face rules so
 * lottie-web can resolve them by fName.
 */

// ─── Font family → Google Fonts slug mapping ─────────────────────────────────

/** Families that ship with the OS — no Google Fonts needed */
const SYSTEM_FONTS = new Set(["Arial", "Arial Black", "Comic Sans MS", "Courier New", "Georgia", "Impact", "Times New Roman", "Trebuchet MS", "Verdana", "Helvetica", "Helvetica Neue", "Tahoma", "Palatino"]);

/** Weight names used in Lottie fName → numeric weight */
const WEIGHT_MAP: Record<string, number> = {
  Thin: 100,
  ExtraLight: 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
  Bold: 700,
  ExtraBold: 800,
  Black: 900,
};

export interface LottieFontUsage {
  fName: string; // e.g. "Poppins-Bold"
  fFamily: string; // e.g. "Poppins"
  fWeight: number; // e.g. 700
  fStyle: "normal" | "italic";
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

/**
 * Scan a Lottie JSON object and return all unique font usages.
 */
export function scanLottieFonts(lottieData: any): LottieFontUsage[] {
  if (!lottieData?.fonts?.list) return [];

  const usages: LottieFontUsage[] = [];
  const seen = new Set<string>();

  for (const entry of lottieData.fonts.list) {
    const fName: string = entry.fName || entry.asName || "";
    if (!fName || seen.has(fName)) continue;
    seen.add(fName);

    const fFamily: string = entry.fFamily || parseFamilyFromName(fName);
    const { weight, italic } = parseVariantFromName(fName);

    usages.push({
      fName,
      fFamily,
      fWeight: weight,
      fStyle: italic ? "italic" : "normal",
    });
  }

  return usages;
}

function parseFamilyFromName(fName: string): string {
  // "Poppins-Bold" → "Poppins", "Open Sans-Regular" → "Open Sans"
  const dashIdx = fName.lastIndexOf("-");
  return dashIdx > 0 ? fName.slice(0, dashIdx) : fName;
}

function parseVariantFromName(fName: string): { weight: number; italic: boolean } {
  const dashIdx = fName.lastIndexOf("-");
  const variant = dashIdx > 0 ? fName.slice(dashIdx + 1) : "Regular";
  const italic = variant.toLowerCase().includes("italic");
  const clean = variant.replace(/italic/i, "").trim();
  const weight = WEIGHT_MAP[clean] ?? 400;
  return { weight, italic };
}

// ─── Loader ──────────────────────────────────────────────────────────────────

const loadedFamilies = new Set<string>();

/**
 * Inject Google Fonts stylesheets for all non-system fonts found in a Lottie.
 * Also injects @font-face rules that map Lottie fName → CSS font-family.
 * Safe to call multiple times — deduplicates by family.
 */
export function loadLottieFonts(lottieData: any): void {
  if (typeof document === "undefined") return;

  const usages = scanLottieFonts(lottieData);
  const googleFamilies = new Map<string, Set<string>>(); // family → set of "weight" or "weight italic"

  for (const usage of usages) {
    if (SYSTEM_FONTS.has(usage.fFamily)) continue;
    if (!googleFamilies.has(usage.fFamily)) googleFamilies.set(usage.fFamily, new Set());
    const variant = usage.fStyle === "italic" ? `${usage.fWeight}italic` : `${usage.fWeight}`;
    googleFamilies.get(usage.fFamily)!.add(variant);
  }

  for (const [family, variants] of googleFamilies) {
    if (loadedFamilies.has(family)) continue;
    loadedFamilies.add(family);

    // Build Google Fonts v2 URL
    const slug = family.replace(/\s+/g, "+");
    const weights = Array.from(variants)
      .map((v) => v.replace("italic", ""))
      .filter(Boolean)
      .join(";");
    const url = `https://fonts.googleapis.com/css2?family=${slug}:ital,wght@${buildGoogleFontsAxes(variants)}&display=swap`;

    const linkId = `gfont-lottie-${family.replace(/\s+/g, "-").toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  }

  // Inject @font-face rules that map Lottie fName to the loaded CSS family
  injectFontFaceRules(usages);
}

function buildGoogleFontsAxes(variants: Set<string>): string {
  // Build "ital,wght@0,400;0,700;1,400" style axes
  const axes: string[] = [];
  for (const v of variants) {
    const isItalic = v.includes("italic");
    const weight = v.replace("italic", "") || "400";
    axes.push(`${isItalic ? 1 : 0},${weight}`);
  }
  return axes.sort().join(";");
}

const injectedFontFaces = new Set<string>();

function injectFontFaceRules(usages: LottieFontUsage[]): void {
  if (typeof document === "undefined") return;

  const rules: string[] = [];

  for (const usage of usages) {
    if (injectedFontFaces.has(usage.fName)) continue;
    injectedFontFaces.add(usage.fName);

    // lottie-web looks up fonts by font-family matching fName exactly.
    // We create a @font-face that aliases fName → the actual loaded family.
    rules.push(
      `
@font-face {
  font-family: "${usage.fName}";
  src: local("${usage.fFamily}");
  font-weight: ${usage.fWeight};
  font-style: ${usage.fStyle};
}
    `.trim(),
    );
  }

  if (rules.length === 0) return;

  const styleId = "clypra-lottie-fontfaces";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent += "\n" + rules.join("\n");
}

/**
 * Wait for all fonts currently in the document to be loaded.
 * Useful before capturing thumbnails or exporting frames.
 */
export async function waitForFontsReady(): Promise<void> {
  if (typeof document === "undefined") return;
  if (document.fonts?.ready) {
    await document.fonts.ready;
  } else {
    await new Promise<void>((r) => setTimeout(r, 300));
  }
}

/**
 * Preload a specific Google Font family with given weights.
 * Useful for the Style Editor font picker.
 */
export function preloadGoogleFont(family: string, weights: number[] = [400, 700]): void {
  if (typeof document === "undefined") return;
  if (SYSTEM_FONTS.has(family)) return;

  const linkId = `gfont-picker-${family.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(linkId)) return;

  const slug = family.replace(/\s+/g, "+");
  const wStr = weights.join(";");
  const url = `https://fonts.googleapis.com/css2?family=${slug}:wght@${wStr}&display=swap`;

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Clear the font loading cache (useful for testing).
 */
export function clearFontCache(): void {
  loadedFamilies.clear();
  injectedFontFaces.clear();
}
