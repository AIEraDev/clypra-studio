/**
 * Font Loader for Lottie-web
 *
 * This module ensures that font variant names (like "Poppins-Italic") work correctly
 * with lottie-web by dynamically creating @font-face rules that map variant names
 * to the actual loaded fonts with proper styling.
 */

export interface FontVariant {
  variantName: string; // e.g., "Poppins-Italic"
  baseFontFamily: string; // e.g., "Poppins"
  weight: number; // 400, 700, etc.
  style: "normal" | "italic";
}

const FONT_VARIANTS: FontVariant[] = [
  // Poppins variants
  { variantName: "Poppins-Regular", baseFontFamily: "Poppins", weight: 400, style: "normal" },
  { variantName: "Poppins-Bold", baseFontFamily: "Poppins", weight: 700, style: "normal" },
  { variantName: "Poppins-Italic", baseFontFamily: "Poppins", weight: 400, style: "italic" },
  { variantName: "Poppins-BoldItalic", baseFontFamily: "Poppins", weight: 700, style: "italic" },

  // Montserrat variants
  { variantName: "Montserrat-Regular", baseFontFamily: "Montserrat", weight: 400, style: "normal" },
  { variantName: "Montserrat-Bold", baseFontFamily: "Montserrat", weight: 700, style: "normal" },
  { variantName: "Montserrat-ExtraBold", baseFontFamily: "Montserrat", weight: 800, style: "normal" },
  { variantName: "Montserrat-Black", baseFontFamily: "Montserrat", weight: 900, style: "normal" },
  { variantName: "Montserrat-Italic", baseFontFamily: "Montserrat", weight: 400, style: "italic" },
  { variantName: "Montserrat-BoldItalic", baseFontFamily: "Montserrat", weight: 700, style: "italic" },
  { variantName: "Montserrat-ExtraBoldItalic", baseFontFamily: "Montserrat", weight: 800, style: "italic" },
  { variantName: "Montserrat-BlackItalic", baseFontFamily: "Montserrat", weight: 900, style: "italic" },

  // Arial variants (System Fonts)
  { variantName: "Arial", baseFontFamily: "Arial", weight: 400, style: "normal" },
  { variantName: "Arial-Bold", baseFontFamily: "Arial", weight: 700, style: "normal" },
  { variantName: "Arial-Italic", baseFontFamily: "Arial", weight: 400, style: "italic" },
  { variantName: "Arial-BoldItalic", baseFontFamily: "Arial", weight: 700, style: "italic" },
];

/**
 * Injects @font-face rules dynamically to create font variant aliases
 * This ensures lottie-web can find fonts by their variant names
 */
export function injectFontVariantRules(): void {
  // Check if already injected
  if (document.getElementById("lottie-font-variants")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "lottie-font-variants";

  let css = "/* Dynamically injected font variants for lottie-web */\n";

  FONT_VARIANTS.forEach((variant) => {
    css += `
@font-face {
  font-family: "${variant.variantName}";
  src: local("${variant.baseFontFamily}");
  font-weight: ${variant.weight};
  font-style: ${variant.style};
  font-display: swap;
}
`;
  });

  style.textContent = css;
  document.head.appendChild(style);

  console.log("✅ Font variant rules injected for lottie-web");
}

/**
 * Waits for base fonts to load, then injects variant rules
 */
export async function initializeFontSystem(): Promise<void> {
  try {
    // Dynamically insert invisible font preloader spans to force browser download
    const preloaderId = "font-system-preloader";
    if (!document.getElementById(preloaderId) && document.body) {
      const preloader = document.createElement("div");
      preloader.id = preloaderId;
      preloader.style.position = "absolute";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      preloader.style.zIndex = "-9999";

      const preloadItems = [
        { family: "Poppins", weight: 400, style: "normal" },
        { family: "Poppins", weight: 700, style: "normal" },
        { family: "Poppins", weight: 400, style: "italic" },
        { family: "Poppins", weight: 700, style: "italic" },
        { family: "Montserrat", weight: 400, style: "normal" },
        { family: "Montserrat", weight: 700, style: "normal" },
        { family: "Montserrat", weight: 800, style: "normal" },
        { family: "Montserrat", weight: 900, style: "normal" },
        { family: "Montserrat", weight: 400, style: "italic" },
        { family: "Montserrat", weight: 700, style: "italic" },
        { family: "Montserrat", weight: 800, style: "italic" },
        { family: "Montserrat", weight: 900, style: "italic" },
      ];

      preloadItems.forEach((item) => {
        const span = document.createElement("span");
        span.style.fontFamily = `'${item.family}'`;
        span.style.fontWeight = String(item.weight);
        span.style.fontStyle = item.style;
        span.innerText = "preload";
        preloader.appendChild(span);
      });

      document.body.appendChild(preloader);
    }

    // Wait for Poppins to load from Google Fonts
    await document.fonts.load("400 16px Poppins");
    await document.fonts.load("700 16px Poppins");
    await document.fonts.load("italic 400 16px Poppins");
    await document.fonts.load("italic 700 16px Poppins");

    // Wait for Montserrat to load from Google Fonts
    await document.fonts.load("400 16px Montserrat");
    await document.fonts.load("700 16px Montserrat");
    await document.fonts.load("800 16px Montserrat");
    await document.fonts.load("900 16px Montserrat");
    await document.fonts.load("italic 400 16px Montserrat");
    await document.fonts.load("italic 700 16px Montserrat");
    await document.fonts.load("italic 800 16px Montserrat");
    await document.fonts.load("italic 900 16px Montserrat");

    // Inject variant rules
    injectFontVariantRules();

    console.log("✅ Font system initialized (Poppins + Montserrat)");
  } catch (error) {
    console.warn("⚠️  Font loading warning:", error);
    // Still inject rules even if loading fails
    injectFontVariantRules();
  }
}

/**
 * Checks if a font variant is available for rendering.
 * Uses document.fonts.check() which is the correct API for font availability —
 * unlike measureText() which silently falls back to the system font and always
 * returns a non-zero width regardless of whether the named font loaded.
 */
export function checkFontVariant(variantName: string): boolean {
  if (typeof document === "undefined" || !document.fonts) return false;
  return document.fonts.check(`16px "${variantName}"`);
}

/**
 * Font descriptor for loading.
 */
export interface FontDescriptor {
  family: string;
  weight?: string | number;
  style?: "normal" | "italic";
}

/**
 * Font loading result.
 */
export interface FontLoadResult {
  font: FontDescriptor;
  loaded: boolean;
  error?: string;
  loadTimeMs: number;
}

interface FontLoaderState {
  loading: Set<string>;
  loaded: Set<string>;
  failed: Map<string, string>;
  promises: Map<string, Promise<FontLoadResult>>;
}

export class FontLoader {
  private state: FontLoaderState = {
    loading: new Set(),
    loaded: new Set(),
    failed: new Map(),
    promises: new Map(),
  };

  async ensureFont(descriptor: FontDescriptor): Promise<FontLoadResult> {
    const key = this.getFontKey(descriptor);

    if (this.state.loaded.has(key)) {
      return {
        font: descriptor,
        loaded: true,
        loadTimeMs: 0,
      };
    }

    if (this.state.failed.has(key)) {
      return {
        font: descriptor,
        loaded: false,
        error: this.state.failed.get(key),
        loadTimeMs: 0,
      };
    }

    if (this.state.promises.has(key)) {
      return this.state.promises.get(key)!;
    }

    const promise = this.loadFont(descriptor);
    this.state.promises.set(key, promise);

    return promise;
  }

  async ensureFonts(descriptors: FontDescriptor[]): Promise<FontLoadResult[]> {
    return Promise.all(descriptors.map((desc) => this.ensureFont(desc)));
  }

  async waitForFontsReady(): Promise<void> {
    if (typeof document === "undefined" || !document.fonts) {
      return;
    }
    await document.fonts.ready;
  }

  isLoaded(descriptor: FontDescriptor): boolean {
    const key = this.getFontKey(descriptor);
    return this.state.loaded.has(key);
  }

  getStats() {
    return {
      loaded: this.state.loaded.size,
      loading: this.state.loading.size,
      failed: this.state.failed.size,
    };
  }

  clear(): void {
    this.state.loading.clear();
    this.state.loaded.clear();
    this.state.failed.clear();
    this.state.promises.clear();
  }

  private async loadFont(descriptor: FontDescriptor): Promise<FontLoadResult> {
    const key = this.getFontKey(descriptor);
    const startTime = performance.now();

    this.state.loading.add(key);

    const SYSTEM_FONTS = new Set([
      "arial", "georgia", "times new roman", "courier new", "arial rounded mt bold", 
      "impact", "helvetica", "sans-serif", "serif", "monospace"
    ]);

    const isGoogleFont = (family: string): boolean => {
      return !SYSTEM_FONTS.has(family.toLowerCase());
    };

    const injectGoogleFontLink = (family: string): void => {
      if (typeof document === "undefined") return;
      const fontId = `gfont-${family.replace(/\s+/g, "-").toLowerCase()}`;
      if (document.getElementById(fontId)) return;

      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
      console.log(`[FontLoader] Dynamically injected Google Fonts stylesheet for: ${family}`);
    };

    try {
      if (typeof document === "undefined" || !document.fonts) {
        throw new Error("Font API not available");
      }

      const weight = this.normalizeFontWeight(descriptor.weight);
      const style = descriptor.style || "normal";
      const fontFace = `${style} ${weight} 16px "${descriptor.family}"`;

      if (isGoogleFont(descriptor.family)) {
        injectGoogleFontLink(descriptor.family);
      }

      if (document.fonts.check(fontFace)) {
        this.state.loaded.add(key);
        this.state.loading.delete(key);
        this.state.promises.delete(key);

        return {
          font: descriptor,
          loaded: true,
          loadTimeMs: performance.now() - startTime,
        };
      }

      await document.fonts.load(fontFace);

      if (!document.fonts.check(fontFace)) {
        // Fallback check: if weight is not 400, check if weight 400 is loaded/available
        const fallbackFontFace = `${style} 400 16px "${descriptor.family}"`;
        if (weight !== 400 && document.fonts.check(fallbackFontFace)) {
          console.log(`[FontLoader] Strict check failed for "${fontFace}", but weight 400 is loaded. Accepting fallback.`);
        } else {
          throw new Error(`Font "${descriptor.family}" failed to load`);
        }
      }

      this.state.loaded.add(key);
      this.state.loading.delete(key);
      this.state.promises.delete(key);

      return {
        font: descriptor,
        loaded: true,
        loadTimeMs: performance.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      this.state.failed.set(key, errorMessage);
      this.state.loading.delete(key);
      this.state.promises.delete(key);

      return {
        font: descriptor,
        loaded: false,
        error: errorMessage,
        loadTimeMs: performance.now() - startTime,
      };
    }
  }

  private getFontKey(descriptor: FontDescriptor): string {
    const weight = this.normalizeFontWeight(descriptor.weight);
    const style = descriptor.style || "normal";
    return `${descriptor.family}|${weight}|${style}`;
  }

  private normalizeFontWeight(weight?: string | number): number {
    if (typeof weight === "number") {
      return weight;
    }
    if (!weight) return 400;

    const asNum = parseInt(weight, 10);
    if (!isNaN(asNum) && asNum >= 100 && asNum <= 900) {
      return asNum;
    }

    const weightMap: Record<string, number> = {
      normal: 400,
      bold: 700,
      lighter: 300,
      bolder: 700,
    };

    return weightMap[weight] ?? 400;
  }
}

let globalFontLoader: FontLoader | null = null;

export function getFontLoader(): FontLoader {
  if (!globalFontLoader) {
    globalFontLoader = new FontLoader();
  }
  return globalFontLoader;
}

export function resetFontLoader(): void {
  globalFontLoader = null;
}

export async function ensureFontsLoaded(descriptors: FontDescriptor[]): Promise<FontLoadResult[]> {
  const loader = getFontLoader();
  return loader.ensureFonts(descriptors);
}

