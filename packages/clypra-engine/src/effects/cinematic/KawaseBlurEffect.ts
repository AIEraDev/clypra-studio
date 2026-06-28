import { KawaseBlurFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const KawaseBlurEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'kawase-blur',
  name: 'Kawase Blur',
  category: 'cinematic',
  description: 'Fast, high-quality multi-pass Kawase blur.',
  tags: ['blur', 'kawase', 'cinematic', 'glow'],
  thumbnail: '',
  params: [
    { key: 'blur', label: 'Blur Radius', type: 'range', value: 8, min: 0, max: 100, step: 0.5 },
    { key: 'quality', label: 'Pass Quality', type: 'range', value: 4, min: 1, max: 15, step: 1 }
  ],
  filterSpec: {
    create(params: ParamValues): KawaseBlurFilter {
      return new KawaseBlurFilter({
        strength: params.blur as number,
        quality: params.quality as number
      })
    },
    updateUniforms(filter: KawaseBlurFilter, params: ParamValues): void {
      filter.strength = params.blur as number
      filter.quality = params.quality as number
    }
  }
}
