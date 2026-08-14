import { describe, it, expect } from 'vitest';
import {
  generateHarmonies,
  simulateColorBlindness,
  getColorName,
  calculateContrast,
} from '../utils/colorHarmonies';

describe('colorHarmonies and science engine', () => {
  describe('generateHarmonies', () => {
    it('generates complementary, analogous, and triadic chords', () => {
      const hsva = { h: 260, s: 80, v: 90, a: 1 };
      const harmonies = generateHarmonies(hsva);

      expect(harmonies.complementary).toBeDefined();
      expect(harmonies.complementary.startsWith('#')).toBe(true);

      expect(harmonies.analogous.length).toBe(2);
      expect(harmonies.triadic.length).toBe(2);
      expect(harmonies.monochromatic.length).toBe(3);
    });
  });

  describe('simulateColorBlindness', () => {
    const red = { r: 255, g: 0, b: 0, a: 1 };

    it('simulates protanopia and deuteranopia without crashing', () => {
      const protan = simulateColorBlindness(red, 'protanopia');
      expect(protan.r).toBeGreaterThan(0);
      expect(protan.g).toBeGreaterThan(0);

      const deutan = simulateColorBlindness(red, 'deuteranopia');
      expect(deutan.r).toBeGreaterThan(0);

      const achrom = simulateColorBlindness(red, 'achromatopsia');
      expect(achrom.r).toBe(achrom.g);
      expect(achrom.g).toBe(achrom.b);
    });
  });

  describe('getColorName', () => {
    it('identifies nearest named colors', () => {
      expect(getColorName('#8B5CF6')).toBe('Clypra Electric Violet');
      expect(getColorName('#FFFFFF')).toBe('Pure Snow');
      expect(getColorName('#09090b')).toBe('Obsidian Void');
      expect(getColorName('#EF4444')).toBe('Crimson Wave');
    });
  });

  describe('calculateContrast', () => {
    it('calculates WCAG AAA contrast for white on black', () => {
      const white = { r: 255, g: 255, b: 255, a: 1 };
      const black = { r: 0, g: 0, b: 0, a: 1 };
      const res = calculateContrast(white, black);

      expect(res.wcagRatio).toBeGreaterThan(20);
      expect(res.wcagLevel).toBe('AAA');
      expect(res.isSafeForCaptions).toBe(true);
    });

    it('detects low contrast for dark gray on black', () => {
      const darkGray = { r: 35, g: 35, b: 35, a: 1 };
      const black = { r: 0, g: 0, b: 0, a: 1 };
      const res = calculateContrast(darkGray, black);

      expect(res.wcagLevel).toBe('Fail');
      expect(res.isSafeForCaptions).toBe(false);
    });
  });
});
