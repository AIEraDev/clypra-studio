/**
 * Color Utility Functions
 */

/**
 * Convert hex color to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Convert rgba string to individual components
 */
export function rgbaToComponents(rgba: string): { r: number; g: number; b: number; a: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

/**
 * Blend two colors together
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  const c1 = rgbaToComponents(color1);
  const c2 = rgbaToComponents(color2);

  const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
  const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
  const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
  const a = c1.a * (1 - ratio) + c2.a * ratio;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
