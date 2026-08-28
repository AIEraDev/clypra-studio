import { getFontLoader, type FontDescriptor } from "@clypra-studio/engine";
import { normalizeSupportedFontFamily, isSupportedFontFamily, type SupportedFontFamily } from "../constants/fonts";

export interface StudioFontSummary {
  family?: string;
  weight?: string | number;
  style?: "normal" | "italic";
}

function descriptorFor(family: string, weight: string | number = 400, style: "normal" | "italic" = "normal"): FontDescriptor | null {
  if (!isSupportedFontFamily(family)) return null;
  return { family: normalizeSupportedFontFamily(family), weight, style };
}

export async function ensureStudioFontLoaded(
  family: string | undefined,
  weight: string | number = 400,
  style: "normal" | "italic" = "normal",
): Promise<boolean> {
  if (!family || typeof document === "undefined" || !document.fonts) return false;
  const descriptor = descriptorFor(family, weight, style);
  if (!descriptor) return false;

  const result = await getFontLoader().ensureFont(descriptor);
  if (!result.loaded) return false;
  await document.fonts.load(`${style} ${weight} 16px "${descriptor.family}"`);
  return true;
}

/**
 * Hydrate the complete effect catalog without delaying the active effect.
 * The active family is awaited first; the remaining families are scheduled
 * in the background and share the engine loader's request de-duplication.
 */
export async function preloadStudioFontFamilies(
  families: Iterable<string>,
  activeFamily?: string,
): Promise<void> {
  const normalized = new Set<SupportedFontFamily>();
  for (const family of families) {
    if (typeof family === "string" && isSupportedFontFamily(family)) {
      normalized.add(normalizeSupportedFontFamily(family));
    }
  }

  if (activeFamily && isSupportedFontFamily(activeFamily)) {
    normalized.delete(normalizeSupportedFontFamily(activeFamily));
    await ensureStudioFontLoaded(activeFamily);
  }

  const remaining = Array.from(normalized);
  if (remaining.length === 0) return;

  await new Promise<void>((resolve) => {
    const schedule = () => {
      void Promise.allSettled(remaining.map((family) => ensureStudioFontLoaded(family))).then(() => resolve());
    };
    if (typeof queueMicrotask === "function") queueMicrotask(schedule);
    else setTimeout(schedule, 0);
  });
}
