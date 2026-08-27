/**
 * Canonical font families fully supported and registered by the Clypra editor
 * and its native Rust engine (clypra-native-core & clypra-render-wasm).
 *
 * The native Rust engine strictly requires fonts to be registered prior to rendering.
 * These 21 font families correspond exactly to the bundled font assets registered
 * via nativeFontRegistry.ts in the editor.
 */
export const SUPPORTED_FONT_FAMILIES = [
  "Inter",
  "Geist",
  "Outfit",
  "Space Grotesk",
  "Roboto",
  "Roboto Condensed",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Raleway",
  "Oswald",
  "Playfair Display",
  "Anton",
  "Bebas Neue",
  "Nunito",
  "Poppins",
  "Permanent Marker",
  "Bangers",
  "Press Start 2P",
  "Dancing Script",
  "Pacifico",
] as const;

export type SupportedFontFamily = (typeof SUPPORTED_FONT_FAMILIES)[number];

/**
 * Aliases and variable font identifiers accepted by the editor and Rust engine,
 * mapped to their canonical family names.
 */
export const SUPPORTED_FONT_ALIASES: Record<string, SupportedFontFamily> = {
  "inter": "Inter",
  "inter variable": "Inter",
  "geist": "Geist",
  "geist variable": "Geist",
  "outfit": "Outfit",
  "outfit variable": "Outfit",
  "space grotesk": "Space Grotesk",
  "space grotesk variable": "Space Grotesk",
  "roboto": "Roboto",
  "roboto variable": "Roboto",
  "roboto condensed": "Roboto Condensed",
  "roboto condensed variable": "Roboto Condensed",
  "open sans": "Open Sans",
  "open sans variable": "Open Sans",
  "lato": "Lato",
  "montserrat": "Montserrat",
  "montserrat variable": "Montserrat",
  "raleway": "Raleway",
  "raleway variable": "Raleway",
  "oswald": "Oswald",
  "oswald variable": "Oswald",
  "playfair display": "Playfair Display",
  "playfair display variable": "Playfair Display",
  "anton": "Anton",
  "bebas neue": "Bebas Neue",
  "nunito": "Nunito",
  "nunito variable": "Nunito",
  "poppins": "Poppins",
  "permanent marker": "Permanent Marker",
  "bangers": "Bangers",
  "press start 2p": "Press Start 2P",
  "dancing script": "Dancing Script",
  "dancing script variable": "Dancing Script",
  "pacifico": "Pacifico",
};

/**
 * Check whether a given font family is fully supported and registered by the editor and Rust engine.
 */
export function isSupportedFontFamily(family: string): boolean {
  if (!family || typeof family !== "string") return false;
  const key = family.trim().toLowerCase();
  return key in SUPPORTED_FONT_ALIASES;
}

/**
 * Normalizes a font family to its canonical registered name supported by the Rust engine.
 * Falls back to "Inter" if the family is not registered.
 */
export function normalizeSupportedFontFamily(
  family: string,
  fallback: SupportedFontFamily = "Inter",
): SupportedFontFamily {
  if (!family || typeof family !== "string") return fallback;
  const key = family.trim().toLowerCase();
  return SUPPORTED_FONT_ALIASES[key] ?? fallback;
}

// Clypra editor and its native Rust engine do NOT register or support unbundled system fonts (e.g. Arial, Georgia).
export const SYSTEM_FONTS: readonly string[] = [];

// Expose only the 21 fully supported/registered families across Studio
export const GOOGLE_FONTS: readonly string[] = [...SUPPORTED_FONT_FAMILIES];
export const ALL_FONTS: readonly string[] = [...SUPPORTED_FONT_FAMILIES];

// Single combined Google Fonts API request to prefetch and warm up cache for all supported families
export const GOOGLE_FONTS_LINK =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Inter:wght@400;500;600;700",
    "family=Geist:wght@400;500;600;700",
    "family=Outfit:wght@400;600;700",
    "family=Space+Grotesk:wght@400;500;600;700",
    "family=Roboto:wght@400;700",
    "family=Roboto+Condensed:wght@400;700",
    "family=Open+Sans:wght@400;700",
    "family=Lato:wght@400;700",
    "family=Montserrat:wght@400;700;900",
    "family=Raleway:wght@400;700",
    "family=Oswald:wght@400;700",
    "family=Playfair+Display:wght@700",
    "family=Anton",
    "family=Bebas+Neue",
    "family=Nunito:wght@700;800",
    "family=Poppins:ital,wght@0,400;0,700;1,400;1,700",
    "family=Permanent+Marker",
    "family=Bangers",
    "family=Press+Start+2P",
    "family=Dancing+Script:wght@700",
    "family=Pacifico",
  ].join("&") +
  "&display=swap";
