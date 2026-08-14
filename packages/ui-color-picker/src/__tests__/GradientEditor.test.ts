import { describe, it, expect } from 'vitest';
import { generateCssGradient } from '../components/GradientEditor';
import type { GradientValue } from '../types/color';

describe('GradientEditor logic', () => {
  it('generates linear-gradient CSS string', () => {
    const grad: GradientValue = {
      type: 'linear',
      angle: 90,
      stops: [
        { id: '1', position: 0, color: '#FF0000' },
        { id: '2', position: 1, color: '#0000FF' },
      ],
      interpolation: 'oklab',
    };

    const css = generateCssGradient(grad);
    expect(css).toContain('linear-gradient(90deg');
    expect(css).toContain('#FF0000 0%');
    expect(css).toContain('#0000FF 100%');
  });

  it('generates radial and conic gradient CSS strings', () => {
    const radialGrad: GradientValue = {
      type: 'radial',
      angle: 0,
      stops: [
        { id: '1', position: 0, color: '#FFFFFF' },
        { id: '2', position: 1, color: '#000000' },
      ],
      interpolation: 'srgb',
    };
    expect(generateCssGradient(radialGrad)).toContain('radial-gradient(circle at center');

    const conicGrad: GradientValue = {
      type: 'conic',
      angle: 180,
      stops: [
        { id: '1', position: 0, color: '#FF0000' },
        { id: '2', position: 1, color: '#00FF00' },
      ],
      interpolation: 'oklab',
    };
    expect(generateCssGradient(conicGrad)).toContain('conic-gradient(from 180deg at center');
  });
});
