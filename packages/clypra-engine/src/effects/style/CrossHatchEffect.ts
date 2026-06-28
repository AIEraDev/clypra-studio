import { CrossHatchFilter } from 'pixi-filters'
import type { PixiEffectDefinition } from '../../videoEffects/EffectDefinition'

export const CrossHatchEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'cross-hatch',
  name: 'Cross Hatch Sketch',
  category: 'distortion',
  description: 'Simulates a crosshatched pencil sketch on paper.',
  tags: ['cross-hatch', 'sketch', 'pencil', 'drawing', 'style'],
  thumbnail: '',
  params: [],
  filterSpec: {
    create(): CrossHatchFilter {
      return new CrossHatchFilter()
    },
    updateUniforms(): void {}
  }
}
