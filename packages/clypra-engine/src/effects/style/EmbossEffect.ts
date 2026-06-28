import { EmbossFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const EmbossEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'emboss',
  name: 'Emboss Relief',
  category: 'distortion',
  description: 'Simulates an embossed 3D relief depth on the frame.',
  tags: ['emboss', 'relief', 'depth', 'style', 'artistic'],
  thumbnail: '',
  params: [
    { key: 'strength', label: 'Relief Strength', type: 'range', value: 5.0, min: 0.0, max: 20.0, step: 0.5 }
  ],
  filterSpec: {
    create(params: ParamValues): EmbossFilter {
      return new EmbossFilter(params.strength as number)
    },
    updateUniforms(filter: EmbossFilter, params: ParamValues): void {
      filter.strength = params.strength as number
    }
  }
}
