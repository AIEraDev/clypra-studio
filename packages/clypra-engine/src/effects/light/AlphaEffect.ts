import { AlphaFilter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const AlphaEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'alpha',
  name: 'Opacity (Alpha)',
  category: 'light',
  description: 'Adjust layer opacity / alpha transparency.',
  tags: ['alpha', 'opacity', 'transparency'],
  thumbnail: '',
  params: [
    { key: 'alpha', label: 'Opacity', type: 'range', value: 1.0, min: 0.0, max: 1.0, step: 0.05 }
  ],
  filterSpec: {
    create(params: ParamValues): AlphaFilter {
      return new AlphaFilter({
        alpha: params.alpha as number
      })
    },
    updateUniforms(filter: AlphaFilter, params: ParamValues): void {
      filter.alpha = params.alpha as number
    }
  }
}
