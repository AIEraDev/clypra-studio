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
  { variantName: "Arial-BoldItalic", baseFontFamily: "Arial", weight: 700, style: "italic" }
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
        { family: "Montserrat", weight: 900, style: "italic" }
      ];
      
      preloadItems.forEach(item => {
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
 * Checks if a font variant is available for rendering
 */
export function checkFontVariant(variantName: string): boolean {
  // Try to measure text with the font
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.font = `16px "${variantName}"`;
  const metrics = ctx.measureText("Test");

  // If width is 0, font probably didn't load
  return metrics.width > 0;
}
