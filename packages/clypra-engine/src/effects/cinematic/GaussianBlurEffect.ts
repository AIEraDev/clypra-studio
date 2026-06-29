import { BlurFilter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const GaussianBlurEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'gaussian-blur',
  name: 'Gaussian Blur',
  category: 'cinematic',
  description: 'Classic high-fidelity Gaussian blur filter.',
  tags: ['blur', 'gaussian', 'cinematic', 'soften'],
  thumbnail: '',
  params: [
    { key: 'blur', label: 'Blur Strength', type: 'range', value: 8, min: 0, max: 100, step: 0.5 },
    { key: 'quality', label: 'Quality Passes', type: 'range', value: 4, min: 1, max: 15, step: 1 }
  ],
  filterSpec: {
    create(params: ParamValues): BlurFilter {
      const filter = new BlurFilter({
        strength: params.blur as number,
        quality: params.quality as number
      })
      return filter
    },
    updateUniforms(filter: BlurFilter, params: ParamValues): void {
      filter.strength = params.blur as number
      filter.quality = params.quality as number
    }
  }
}
