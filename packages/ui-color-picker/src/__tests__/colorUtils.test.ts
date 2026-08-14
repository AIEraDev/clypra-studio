import { describe, it, expect } from 'vitest';
import {
  hexToRgba,
  rgbaToHex,
  rgbaToHsva,
  hsvaToRgba,
  hsvaToHsla,
  hslaToHsva,
  parseColor,
  formatColor,
  isValidColor,
  getContrastColor,
  clamp,
  round,
} from '../utils/colorUtils';

describe('colorUtils math functions', () => {
  describe('clamp and round', () => {
    it('clamps numbers within range', () => {
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(NaN, 0, 100)).toBe(0);
    });

    it('rounds numbers to precision', () => {
      expect(round(3.14159, 2)).toBe(3.14);
      expect(round(3.5)).toBe(4);
      expect(round(123.456, 1)).toBe(123.5);
    });
  });

  describe('hexToRgba', () => {
    it('parses 6-digit hex with #', () => {
      expect(hexToRgba('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      expect(hexToRgba('#00ff00')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
      expect(hexToRgba('#0000ff')).toEqual({ r: 0, g: 0, b: 255, a: 1 });
    });

    it('parses 6-digit hex without #', () => {
      expect(hexToRgba('ffffff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
      expect(hexToRgba('000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    });

    it('parses 3-digit shorthand hex', () => {
      expect(hexToRgba('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      expect(hexToRgba('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    });

    it('parses 4-digit shorthand hex with alpha', () => {
      const result = hexToRgba('#f008');
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
      expect(result.a).toBeCloseTo(0.533, 2);
    });

    it('parses 8-digit hex with alpha', () => {
      expect(hexToRgba('#ff000080')).toEqual({ r: 255, g: 0, b: 0, a: 0.502 });
      expect(hexToRgba('#00000000')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    });

    it('handles invalid hex gracefully', () => {
      expect(hexToRgba('invalid')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    });
  });

  describe('rgbaToHex', () => {
    it('converts full opacity rgba to 6-digit hex', () => {
      expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe('#FF0000');
      expect(rgbaToHex({ r: 0, g: 255, b: 0, a: 1 })).toBe('#00FF00');
      expect(rgbaToHex({ r: 0, g: 0, b: 255, a: 1 })).toBe('#0000FF');
      expect(rgbaToHex({ r: 139, g: 92, b: 246, a: 1 })).toBe('#8B5CF6');
    });

    it('converts transparent rgba to 8-digit hex', () => {
      expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('#FF000080');
      expect(rgbaToHex({ r: 255, g: 255, b: 255, a: 0 })).toBe('#FFFFFF00');
    });

    it('forces alpha when requested', () => {
      expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 1 }, true)).toBe('#FF0000FF');
    });
  });

  describe('HSVA and RGBA bidirectional conversion', () => {
    it('converts pure colors correctly', () => {
      // Red
      const redHsva = rgbaToHsva({ r: 255, g: 0, b: 0, a: 1 });
      expect(redHsva.h).toBe(0);
      expect(redHsva.s).toBe(100);
      expect(redHsva.v).toBe(100);
      expect(hsvaToRgba(redHsva)).toEqual({ r: 255, g: 0, b: 0, a: 1 });

      // Green
      const greenHsva = rgbaToHsva({ r: 0, g: 255, b: 0, a: 1 });
      expect(greenHsva.h).toBe(120);
      expect(greenHsva.s).toBe(100);
      expect(greenHsva.v).toBe(100);
      expect(hsvaToRgba(greenHsva)).toEqual({ r: 0, g: 255, b: 0, a: 1 });

      // Blue
      const blueHsva = rgbaToHsva({ r: 0, g: 0, b: 255, a: 1 });
      expect(blueHsva.h).toBe(240);
      expect(blueHsva.s).toBe(100);
      expect(blueHsva.v).toBe(100);
      expect(hsvaToRgba(blueHsva)).toEqual({ r: 0, g: 0, b: 255, a: 1 });

      // Black
      const blackHsva = rgbaToHsva({ r: 0, g: 0, b: 0, a: 1 });
      expect(blackHsva.v).toBe(0);
      expect(hsvaToRgba(blackHsva)).toEqual({ r: 0, g: 0, b: 0, a: 1 });

      // White
      const whiteHsva = rgbaToHsva({ r: 255, g: 255, b: 255, a: 1 });
      expect(whiteHsva.s).toBe(0);
      expect(whiteHsva.v).toBe(100);
      expect(hsvaToRgba(whiteHsva)).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    });
  });

  describe('HSVA and HSLA bidirectional conversion', () => {
    it('converts between HSVA and HSLA', () => {
      const hsva = { h: 260, s: 60, v: 80, a: 0.9 };
      const hsla = hsvaToHsla(hsva);
      const backToHsva = hslaToHsva(hsla);

      expect(backToHsva.h).toBeCloseTo(hsva.h, 0);
      expect(backToHsva.s).toBeCloseTo(hsva.s, 0);
      expect(backToHsva.v).toBeCloseTo(hsva.v, 0);
      expect(backToHsva.a).toBe(hsva.a);
    });
  });

  describe('parseColor', () => {
    it('parses hex colors', () => {
      const parsed = parseColor('#8B5CF6');
      expect(parsed).not.toBeNull();
      expect(parsed?.h).toBeCloseTo(258, 0);
      expect(parsed?.a).toBe(1);
    });

    it('parses rgb and rgba functions', () => {
      const rgb = parseColor('rgb(255, 128, 0)');
      expect(rgb).not.toBeNull();
      expect(rgb?.h).toBeCloseTo(30, 0);
      expect(rgb?.a).toBe(1);

      const rgba = parseColor('rgba(255, 128, 0, 0.5)');
      expect(rgba).not.toBeNull();
      expect(rgba?.a).toBe(0.5);
    });

    it('parses hsl and hsla functions', () => {
      const hsl = parseColor('hsl(240, 100%, 50%)');
      expect(hsl).not.toBeNull();
      expect(hsl?.h).toBe(240);
      expect(hsl?.s).toBe(100);
      expect(hsl?.v).toBe(100);

      const hsla = parseColor('hsla(120, 100%, 50%, 0.75)');
      expect(hsla).not.toBeNull();
      expect(hsla?.h).toBe(120);
      expect(hsla?.a).toBe(0.75);
    });

    it('parses named colors', () => {
      const red = parseColor('red');
      expect(red).not.toBeNull();
      expect(red?.h).toBe(0);

      const violet = parseColor('violet');
      expect(violet).not.toBeNull();
    });

    it('returns null on invalid inputs', () => {
      expect(parseColor('')).toBeNull();
      expect(parseColor('not-a-color-12345')).toBeNull();
      expect(parseColor('#xyz')).toBeNull();
    });
  });

  describe('formatColor', () => {
    const testHsva = { h: 260, s: 80, v: 90, a: 0.75 };

    it('formats as hex', () => {
      const hexWithAlpha = formatColor(testHsva, 'hex', true);
      expect(hexWithAlpha.startsWith('#')).toBe(true);
      expect(hexWithAlpha.length).toBe(9); // #RRGGBBAA

      const hexWithoutAlpha = formatColor(testHsva, 'hex', false);
      expect(hexWithoutAlpha.length).toBe(7); // #RRGGBB
    });

    it('formats as rgb and rgba', () => {
      const rgbaStr = formatColor(testHsva, 'rgb', true);
      expect(rgbaStr.startsWith('rgba(')).toBe(true);
      expect(rgbaStr.includes('0.75')).toBe(true);

      const rgbStr = formatColor(testHsva, 'rgb', false);
      expect(rgbStr.startsWith('rgb(')).toBe(true);
    });

    it('formats as hsl and hsla', () => {
      const hslaStr = formatColor(testHsva, 'hsl', true);
      expect(hslaStr.startsWith('hsla(')).toBe(true);

      const hslStr = formatColor(testHsva, 'hsl', false);
      expect(hslStr.startsWith('hsl(')).toBe(true);
    });

    it('formats as hsv and hsva', () => {
      const hsvaStr = formatColor(testHsva, 'hsv', true);
      expect(hsvaStr.startsWith('hsva(')).toBe(true);

      const hsvStr = formatColor(testHsva, 'hsv', false);
      expect(hsvStr.startsWith('hsv(')).toBe(true);
    });
  });

  describe('getContrastColor', () => {
    it('returns black text for bright colors and white text for dark colors', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#000000');
      expect(getContrastColor('#FFFF00')).toBe('#000000');
      expect(getContrastColor('#000000')).toBe('#ffffff');
      expect(getContrastColor('#18181b')).toBe('#ffffff');
    });
  });

  describe('isValidColor', () => {
    it('validates color strings properly', () => {
      expect(isValidColor('#8B5CF6')).toBe(true);
      expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(isValidColor('hsl(200, 50%, 50%)')).toBe(true);
      expect(isValidColor('yellow')).toBe(true);
      expect(isValidColor('foo-bar-baz')).toBe(false);
    });
  });
});
