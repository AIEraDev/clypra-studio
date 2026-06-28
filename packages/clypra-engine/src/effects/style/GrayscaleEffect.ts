import { GrayscaleFilter } from 'pixi-filters'
import type { PixiEffectDefinition } from '../../videoEffects/EffectDefinition'

export const GrayscaleEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'grayscale',
  name: 'Grayscale',
  category: 'cinematic', // Map to cinematic category
  description: 'Converts the layer to monochrome black and white.',
  tags: ['grayscale', 'monochrome', 'black-and-white', 'retro'],
  thumbnail: '',
  params: [],
  filterSpec: {
    create(): GrayscaleFilter {
      return new GrayscaleFilter()
    },
    updateUniforms(): void {}
  }
}
