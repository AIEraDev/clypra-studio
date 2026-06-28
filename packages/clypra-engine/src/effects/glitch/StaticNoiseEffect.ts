import { NoiseFilter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const StaticNoiseEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'static-noise',
  name: 'Static Noise',
  category: 'glitch',
  description: 'Classic static analog noise/grain filter.',
  tags: ['noise', 'grain', 'glitch', 'static'],
  thumbnail: '',
  params: [
    { key: 'noise', label: 'Noise Density', type: 'range', value: 0.15, min: 0.0, max: 1.0, step: 0.02 },
    { key: 'animated', label: 'Animated Seed', type: 'toggle', value: true }
  ],
  filterSpec: {
    create(params: ParamValues): NoiseFilter {
      return new NoiseFilter({
        noise: params.noise as number,
        seed: Math.random()
      })
    },
    updateUniforms(filter: NoiseFilter, params: ParamValues): void {
      filter.noise = params.noise as number
      if (params.animated) {
        filter.seed = Math.random()
      }
    }
  }
}
