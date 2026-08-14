/**
 * Clypra Color Validation and Sanitization Module
 * Strict TypeScript - Pure functions with zero side-effects.
 */

import type { HSVA, ColorFormat } from '../types/color';
import { clamp, hexToRgba, hsvaToHsla, hsvaToRgba, hslaToHsva, parseColor, rgbaToHsva } from './colorUtils';

/**
 * Checks if a string is a valid Hex code.
 */
export function isValidHex(hex: string): boolean {
  const clean = hex.trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{4}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(clean);
}

/**
 * Normalizes a hex string by prepending `#` if missing and converting to uppercase.
 */
export function normalizeHex(hex: string): string {
  const clean = hex.trim().replace(/^#/, '').toUpperCase();
  if (clean.length === 3) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
  }
  if (clean.length === 4) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return `#${clean}`;
}

/**
 * Validates a single numeric channel input (e.g. R: 0-255, H: 0-360, A: 0-1 or 0-100%).
 */
export function validateChannelValue(value: string | number, min: number, max: number): number | null {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return null;
    return clamp(value, min, max);
  }

  const trimmed = value.trim();
  if (trimmed === '') return null;

  const parsed = parseFloat(trimmed);
  if (Number.isNaN(parsed)) return null;

  return clamp(parsed, min, max);
}

/**
 * Decomposes an HSVA object into individual numeric channels for the given format.
 */
export function getChannelsFromHsva(hsva: HSVA, format: ColorFormat): Record<string, number> {
  const alphaPercent = Math.round(hsva.a * 100);

  switch (format) {
    case 'hex': {
      return {
        a: alphaPercent,
      };
    }
    case 'rgb': {
      const rgba = hsvaToRgba(hsva);
      return {
        r: rgba.r,
        g: rgba.g,
        b: rgba.b,
        a: alphaPercent,
      };
    }
    case 'hsl': {
      const hsla = hsvaToHsla(hsva);
      return {
        h: Math.round(hsla.h),
        s: Math.round(hsla.s),
        l: Math.round(hsla.l),
        a: alphaPercent,
      };
    }
    case 'hsv': {
      return {
        h: Math.round(hsva.h),
        s: Math.round(hsva.s),
        v: Math.round(hsva.v),
        a: alphaPercent,
      };
    }
    default: {
      return {
        a: alphaPercent,
      };
    }
  }
}

/**
 * Reconstructs an HSVA color from channel key-value pairs based on format.
 */
export function parseChannelsToHsva(
  format: ColorFormat,
  channels: Record<string, string | number>,
  fallbackHsva: HSVA
): HSVA | null {
  const alphaRaw = channels.a !== undefined ? channels.a : fallbackHsva.a * 100;
  const alphaVal = validateChannelValue(alphaRaw, 0, 100);
  const alpha = alphaVal !== null ? alphaVal / 100 : fallbackHsva.a;

  switch (format) {
    case 'hex': {
      const hexStr = String(channels.hex ?? '');
      if (isValidHex(hexStr)) {
        const rgba = hexToRgba(hexStr);
        return rgbaToHsva({ ...rgba, a: alpha });
      }
      return null;
    }
    case 'rgb': {
      const r = validateChannelValue(channels.r ?? 0, 0, 255);
      const g = validateChannelValue(channels.g ?? 0, 0, 255);
      const b = validateChannelValue(channels.b ?? 0, 0, 255);
      if (r === null || g === null || b === null) return null;
      return rgbaToHsva({ r, g, b, a: alpha });
    }
    case 'hsl': {
      const h = validateChannelValue(channels.h ?? 0, 0, 360);
      const s = validateChannelValue(channels.s ?? 0, 0, 100);
      const l = validateChannelValue(channels.l ?? 0, 0, 100);
      if (h === null || s === null || l === null) return null;
      return hslaToHsva({ h, s, l, a: alpha });
    }
    case 'hsv': {
      const h = validateChannelValue(channels.h ?? 0, 0, 360);
      const s = validateChannelValue(channels.s ?? 0, 0, 100);
      const v = validateChannelValue(channels.v ?? 0, 0, 100);
      if (h === null || s === null || v === null) return null;
      return { h, s, v, a: alpha };
    }
    default: {
      return fallbackHsva;
    }
  }
}

/**
 * Validates and normalizes arbitrary user input string.
 */
export function validateAndParseInput(input: string): HSVA | null {
  return parseColor(input);
}
