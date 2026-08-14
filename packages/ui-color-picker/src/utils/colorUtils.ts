/**
 * Clypra Color Mathematics Utility Module
 * Strict TypeScript - Pure functions with zero side-effects.
 */

import type { RGBA, HSLA, HSVA, ColorFormat } from '../types/color';

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a number to a specified number of decimal places.
 */
export function round(value: number, decimals = 0): number {
  if (decimals === 0) return Math.round(value);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Common named CSS colors for fallback resolution.
 */
const NAMED_COLORS: Record<string, string> = {
  transparent: '#00000000',
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  maroon: '#800000',
  olive: '#808000',
  lime: '#00ff00',
  purple: '#800080',
  teal: '#008080',
  navy: '#000080',
  orange: '#ffa500',
  violet: '#8b5cf6',
  indigo: '#4b0082',
  pink: '#ffc0cb',
};

/**
 * Converts a hex color string to RGBA object.
 * Handles 3, 4, 6, and 8 digit hex formats with or without leading '#'.
 */
export function hexToRgba(hex: string): RGBA {
  const cleanHex = hex.trim().replace(/^#/, '');

  let r = 0;
  let g = 0;
  let b = 0;
  let a = 1;

  if (cleanHex.length === 3) {
    // 3 digits: RGB
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 4) {
    // 4 digits: RGBA
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
    a = round(parseInt(cleanHex[3] + cleanHex[3], 16) / 255, 3);
  } else if (cleanHex.length === 6) {
    // 6 digits: RRGGBB
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  } else if (cleanHex.length === 8) {
    // 8 digits: RRGGBBAA
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
    a = round(parseInt(cleanHex.slice(6, 8), 16) / 255, 3);
  } else {
    // Invalid fallback
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    r: Number.isNaN(r) ? 0 : clamp(r, 0, 255),
    g: Number.isNaN(g) ? 0 : clamp(g, 0, 255),
    b: Number.isNaN(b) ? 0 : clamp(b, 0, 255),
    a: Number.isNaN(a) ? 1 : clamp(a, 0, 1),
  };
}

/**
 * Formats a 0-255 number into a 2-digit uppercase hexadecimal string.
 */
function toHex2(val: number): string {
  const hex = clamp(Math.round(val), 0, 255).toString(16).padStart(2, '0');
  return hex.toUpperCase();
}

/**
 * Converts an RGBA object to a Hex color string.
 * Returns 6-digit hex if alpha is 1 and forceAlpha is false; otherwise returns 8-digit hex.
 */
export function rgbaToHex(rgba: RGBA, forceAlpha = false): string {
  const rHex = toHex2(rgba.r);
  const gHex = toHex2(rgba.g);
  const bHex = toHex2(rgba.b);

  if (!forceAlpha && rgba.a >= 0.999) {
    return `#${rHex}${gHex}${bHex}`;
  }

  const aHex = toHex2(rgba.a * 255);
  return `#${rHex}${gHex}${bHex}${aHex}`;
}

/**
 * Converts RGBA to HSLA.
 */
export function rgbaToHsla(rgba: RGBA): HSLA {
  const r = clamp(rgba.r, 0, 255) / 255;
  const g = clamp(rgba.g, 0, 255) / 255;
  const b = clamp(rgba.b, 0, 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / delta + 2) * 60;
        break;
      case b:
        h = ((r - g) / delta + 4) * 60;
        break;
    }
  }

  return {
    h: round(h % 360, 1),
    s: round(s * 100, 1),
    l: round(l * 100, 1),
    a: round(clamp(rgba.a, 0, 1), 3),
  };
}

/**
 * Converts HSLA to RGBA.
 */
export function hslaToRgba(hsla: HSLA): RGBA {
  const h = ((hsla.h % 360) + 360) % 360;
  const s = clamp(hsla.s, 0, 100) / 100;
  const l = clamp(hsla.l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: clamp(Math.round((r1 + m) * 255), 0, 255),
    g: clamp(Math.round((g1 + m) * 255), 0, 255),
    b: clamp(Math.round((b1 + m) * 255), 0, 255),
    a: round(clamp(hsla.a, 0, 1), 3),
  };
}

/**
 * Converts RGBA to HSVA (Internal representation).
 */
export function rgbaToHsva(rgba: RGBA): HSVA {
  const r = clamp(rgba.r, 0, 255) / 255;
  const g = clamp(rgba.g, 0, 255) / 255;
  const b = clamp(rgba.b, 0, 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / delta + 2) * 60;
    } else {
      h = ((r - g) / delta + 4) * 60;
    }
  }

  return {
    h: round(h % 360, 1),
    s: round(s * 100, 1),
    v: round(v * 100, 1),
    a: round(clamp(rgba.a, 0, 1), 3),
  };
}

/**
 * Converts HSVA to RGBA.
 */
export function hsvaToRgba(hsva: HSVA): RGBA {
  const h = ((hsva.h % 360) + 360) % 360;
  const s = clamp(hsva.s, 0, 100) / 100;
  const v = clamp(hsva.v, 0, 100) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: clamp(Math.round((r1 + m) * 255), 0, 255),
    g: clamp(Math.round((g1 + m) * 255), 0, 255),
    b: clamp(Math.round((b1 + m) * 255), 0, 255),
    a: round(clamp(hsva.a, 0, 1), 3),
  };
}

/**
 * Converts HSVA to HSLA.
 */
export function hsvaToHsla(hsva: HSVA): HSLA {
  const h = ((hsva.h % 360) + 360) % 360;
  const sV = clamp(hsva.s, 0, 100) / 100;
  const v = clamp(hsva.v, 0, 100) / 100;

  const l = v * (1 - sV / 2);
  let sL = 0;

  if (l > 0 && l < 1) {
    sL = (v - l) / Math.min(l, 1 - l);
  }

  return {
    h: round(h, 1),
    s: round(clamp(sL * 100, 0, 100), 1),
    l: round(clamp(l * 100, 0, 100), 1),
    a: round(clamp(hsva.a, 0, 1), 3),
  };
}

/**
 * Converts HSLA to HSVA.
 */
export function hslaToHsva(hsla: HSLA): HSVA {
  const h = ((hsla.h % 360) + 360) % 360;
  const sL = clamp(hsla.s, 0, 100) / 100;
  const l = clamp(hsla.l, 0, 100) / 100;

  const v = l + sL * Math.min(l, 1 - l);
  const sV = v === 0 ? 0 : 2 * (1 - l / v);

  return {
    h: round(h, 1),
    s: round(clamp(sV * 100, 0, 100), 1),
    v: round(clamp(v * 100, 0, 100), 1),
    a: round(clamp(hsla.a, 0, 1), 3),
  };
}

/**
 * Converts HSVA directly to Hex string.
 */
export function hsvaToHex(hsva: HSVA, forceAlpha = false): string {
  const rgba = hsvaToRgba(hsva);
  return rgbaToHex(rgba, forceAlpha);
}

/**
 * Converts HSVA directly to CSS rgba(...) or rgb(...) string.
 */
export function hsvaToCssRgb(hsva: HSVA): string {
  const rgba = hsvaToRgba(hsva);
  if (rgba.a < 1) {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  }
  return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
}

/**
 * Parses any supported color string (hex, rgb, rgba, hsl, hsla, hsv, hsva, named color)
 * into a normalized HSVA representation. Returns null if invalid.
 */
export function parseColor(input: string): HSVA | null {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim().toLowerCase();

  // 1. Check named colors
  if (NAMED_COLORS[str]) {
    return rgbaToHsva(hexToRgba(NAMED_COLORS[str]));
  }

  // 2. Hex color (#rgb, #rgba, #rrggbb, #rrggbbaa or without #)
  const hexMatch = str.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    return rgbaToHsva(hexToRgba(hexMatch[0]));
  }

  // 3. RGB / RGBA: rgb(255, 0, 0), rgba(255, 0, 0, 0.5), rgb(255 0 0 / 0.5)
  const rgbMatch = str.match(/^rgba?\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i);
  if (rgbMatch) {
    const parseVal = (v: string, max: number): number => {
      if (v.endsWith('%')) {
        return (parseFloat(v) / 100) * max;
      }
      return parseFloat(v);
    };

    const r = clamp(Math.round(parseVal(rgbMatch[1], 255)), 0, 255);
    const g = clamp(Math.round(parseVal(rgbMatch[2], 255)), 0, 255);
    const b = clamp(Math.round(parseVal(rgbMatch[3], 255)), 0, 255);

    let a = 1;
    if (rgbMatch[4] !== undefined) {
      if (rgbMatch[4].endsWith('%')) {
        a = clamp(parseFloat(rgbMatch[4]) / 100, 0, 1);
      } else {
        a = clamp(parseFloat(rgbMatch[4]), 0, 1);
      }
    }

    return rgbaToHsva({ r, g, b, a: round(a, 3) });
  }

  // 4. HSL / HSLA: hsl(240, 100%, 50%), hsla(240deg 100% 50% / 0.5)
  const hslMatch = str.match(/^hsla?\(\s*([\d.]+(?:deg|rad|turn)?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i);
  if (hslMatch) {
    let h = 0;
    const hRaw = hslMatch[1];
    if (hRaw.endsWith('turn')) {
      h = parseFloat(hRaw) * 360;
    } else if (hRaw.endsWith('rad')) {
      h = (parseFloat(hRaw) * 180) / Math.PI;
    } else {
      h = parseFloat(hRaw.replace('deg', ''));
    }

    const s = parseFloat(hslMatch[2].replace('%', ''));
    const l = parseFloat(hslMatch[3].replace('%', ''));

    let a = 1;
    if (hslMatch[4] !== undefined) {
      if (hslMatch[4].endsWith('%')) {
        a = clamp(parseFloat(hslMatch[4]) / 100, 0, 1);
      } else {
        a = clamp(parseFloat(hslMatch[4]), 0, 1);
      }
    }

    return hslaToHsva({
      h: ((h % 360) + 360) % 360,
      s: clamp(s, 0, 100),
      l: clamp(l, 0, 100),
      a: round(a, 3),
    });
  }

  // 5. HSV / HSVA: hsv(240, 100%, 50%), hsva(240, 100%, 50%, 0.5)
  const hsvMatch = str.match(/^hsva?\(\s*([\d.]+(?:deg)?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i);
  if (hsvMatch) {
    const h = parseFloat(hsvMatch[1].replace('deg', ''));
    const s = parseFloat(hsvMatch[2].replace('%', ''));
    const v = parseFloat(hsvMatch[3].replace('%', ''));

    let a = 1;
    if (hsvMatch[4] !== undefined) {
      if (hsvMatch[4].endsWith('%')) {
        a = clamp(parseFloat(hsvMatch[4]) / 100, 0, 1);
      } else {
        a = clamp(parseFloat(hsvMatch[4]), 0, 1);
      }
    }

    return {
      h: ((h % 360) + 360) % 360,
      s: clamp(s, 0, 100),
      v: clamp(v, 0, 100),
      a: round(a, 3),
    };
  }

  return null;
}

/**
 * Formats a normalized HSVA color into the specified ColorFormat string.
 */
export function formatColor(hsva: HSVA, format: ColorFormat = 'hex', showAlpha = true): string {
  const effectiveAlpha = showAlpha ? hsva.a : 1;
  const normalizedHsva: HSVA = { ...hsva, a: effectiveAlpha };

  switch (format) {
    case 'hex': {
      return hsvaToHex(normalizedHsva, showAlpha && effectiveAlpha < 0.999);
    }
    case 'rgb': {
      const rgba = hsvaToRgba(normalizedHsva);
      if (showAlpha && effectiveAlpha < 0.999) {
        return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${round(effectiveAlpha, 2)})`;
      }
      return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
    }
    case 'hsl': {
      const hsla = hsvaToHsla(normalizedHsva);
      if (showAlpha && effectiveAlpha < 0.999) {
        return `hsla(${Math.round(hsla.h)}, ${Math.round(hsla.s)}%, ${Math.round(hsla.l)}%, ${round(effectiveAlpha, 2)})`;
      }
      return `hsl(${Math.round(hsla.h)}, ${Math.round(hsla.s)}%, ${Math.round(hsla.l)}%)`;
    }
    case 'hsv': {
      if (showAlpha && effectiveAlpha < 0.999) {
        return `hsva(${Math.round(normalizedHsva.h)}, ${Math.round(normalizedHsva.s)}%, ${Math.round(normalizedHsva.v)}%, ${round(effectiveAlpha, 2)})`;
      }
      return `hsv(${Math.round(normalizedHsva.h)}, ${Math.round(normalizedHsva.s)}%, ${Math.round(normalizedHsva.v)}%)`;
    }
    case 'oklch': {
      const l = round(normalizedHsva.v / 100, 2);
      const c = round((normalizedHsva.s / 100) * 0.35, 3);
      const h = Math.round(normalizedHsva.h);
      if (showAlpha && effectiveAlpha < 0.999) {
        return `oklch(${l} ${c} ${h} / ${round(effectiveAlpha, 2)})`;
      }
      return `oklch(${l} ${c} ${h})`;
    }
    default: {
      return hsvaToHex(normalizedHsva, showAlpha && effectiveAlpha < 0.999);
    }
  }
}

/**
 * Checks if a color string is valid.
 */
export function isValidColor(input: string): boolean {
  return parseColor(input) !== null;
}

/**
 * Calculates WCAG relative luminance of an RGBA color.
 * Range: 0 (pure black) to 1 (pure white).
 */
export function getRelativeLuminance(rgba: RGBA): number {
  const transform = (channel: number): number => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };

  const r = transform(rgba.r);
  const g = transform(rgba.g);
  const b = transform(rgba.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determines whether black ('#000000') or white ('#ffffff') text/ring
 * has higher contrast against the provided color string or HSVA.
 */
export function getContrastColor(background: string | HSVA | RGBA): '#000000' | '#ffffff' {
  let rgba: RGBA;

  if (typeof background === 'string') {
    const parsed = parseColor(background);
    rgba = parsed ? hsvaToRgba(parsed) : { r: 0, g: 0, b: 0, a: 1 };
  } else if ('v' in background) {
    rgba = hsvaToRgba(background);
  } else {
    rgba = background;
  }

  // Account for transparency over dark background (dark video editor UI background #18181b)
  const bgR = 24;
  const bgG = 24;
  const bgB = 27;

  const blendedR = rgba.r * rgba.a + bgR * (1 - rgba.a);
  const blendedG = rgba.g * rgba.a + bgG * (1 - rgba.a);
  const blendedB = rgba.b * rgba.a + bgB * (1 - rgba.a);

  const luminance = getRelativeLuminance({ r: blendedR, g: blendedG, b: blendedB, a: 1 });

  // Threshold 0.38 gives optimal readability in dark video editor themes
  return luminance > 0.38 ? '#000000' : '#ffffff';
}
