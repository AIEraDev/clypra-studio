import { PixelateFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const PixelateEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'pixelate',
  name: 'Pixelate Mosaic',
  category: 'distortion',
  description: 'Pixelate the video frame into large blocky mosaic cells.',
  tags: ['pixelate', 'mosaic', 'censor', 'retro', '8bit'],
  thumbnail: '',
  params: [
    { key: 'sizeX', label: 'Cell Width', type: 'range', value: 10, min: 1, max: 200, step: 1 },
    { key: 'sizeY', label: 'Cell Height', type: 'range', value: 10, min: 1, max: 200, step: 1 }
  ],
  filterSpec: {
    create(params: ParamValues): PixelateFilter {
      return new PixelateFilter([params.sizeX as number, params.sizeY as number])
    },
    updateUniforms(filter: PixelateFilter, params: ParamValues): void {
      filter.size = [params.sizeX as number, params.sizeY as number]
    }
  }
}
