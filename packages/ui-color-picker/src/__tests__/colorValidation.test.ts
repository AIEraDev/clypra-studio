import { describe, it, expect } from 'vitest';
import {
  isValidHex,
  normalizeHex,
  validateChannelValue,
  getChannelsFromHsva,
  parseChannelsToHsva,
} from '../utils/colorValidation';

describe('colorValidation utilities', () => {
  describe('isValidHex and normalizeHex', () => {
    it('validates 3, 4, 6, 8 digit hex codes', () => {
      expect(isValidHex('#fff')).toBe(true);
      expect(isValidHex('fff')).toBe(true);
      expect(isValidHex('#ffff')).toBe(true);
      expect(isValidHex('#ffffff')).toBe(true);
      expect(isValidHex('ffffff80')).toBe(true);
      expect(isValidHex('xyz')).toBe(false);
      expect(isValidHex('#12345')).toBe(false);
    });

    it('normalizes hex codes to uppercase with # prefix', () => {
      expect(normalizeHex('fff')).toBe('#FFFFFF');
      expect(normalizeHex('#f0a')).toBe('#FF00AA');
      expect(normalizeHex('#8b5cf6')).toBe('#8B5CF6');
    });
  });

  describe('validateChannelValue', () => {
    it('validates and clamps numbers', () => {
      expect(validateChannelValue(300, 0, 255)).toBe(255);
      expect(validateChannelValue(-20, 0, 100)).toBe(0);
      expect(validateChannelValue('128', 0, 255)).toBe(128);
      expect(validateChannelValue('abc', 0, 255)).toBeNull();
      expect(validateChannelValue('', 0, 255)).toBeNull();
    });
  });

  describe('getChannelsFromHsva and parseChannelsToHsva', () => {
    it('decomposes and reconstructs RGB channels', () => {
      const hsva = { h: 0, s: 100, v: 100, a: 1 };
      const channels = getChannelsFromHsva(hsva, 'rgb');
      expect(channels.r).toBe(255);
      expect(channels.g).toBe(0);
      expect(channels.b).toBe(0);

      const reconstructed = parseChannelsToHsva('rgb', { r: 255, g: 0, b: 0, a: 100 }, hsva);
      expect(reconstructed?.h).toBe(0);
      expect(reconstructed?.s).toBe(100);
      expect(reconstructed?.v).toBe(100);
    });

    it('decomposes and reconstructs HSL channels', () => {
      const hsva = { h: 120, s: 100, v: 100, a: 0.8 };
      const channels = getChannelsFromHsva(hsva, 'hsl');
      expect(channels.h).toBe(120);
      expect(channels.s).toBe(100);
      expect(channels.l).toBe(50);
      expect(channels.a).toBe(80);

      const reconstructed = parseChannelsToHsva('hsl', { h: 120, s: 100, l: 50, a: 80 }, hsva);
      expect(reconstructed?.h).toBe(120);
      expect(reconstructed?.a).toBeCloseTo(0.8, 2);
    });
  });
});
