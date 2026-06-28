import { DotFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const DotEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'dot',
  name: 'Halftone Dots',
  category: 'distortion',
  description: 'Halftone dot raster pattern, simulating newspaper or comic book prints.',
  tags: ['dot', 'halftone', 'raster', 'comic', 'retro', 'style'],
  thumbnail: '',
  params: [
    { key: 'scale', label: 'Dot Scale', type: 'range', value: 1.0, min: 0.1, max: 10.0, step: 0.1 },
    { key: 'angle', label: 'Pattern Angle', type: 'range', value: 1.0, min: 0.0, max: 6.28, step: 0.05 },
    { key: 'grayscale', label: 'Monochrome Grayscale', type: 'toggle', value: true }
  ],
  filterSpec: {
    create(params: ParamValues): DotFilter {
      return new DotFilter({
        scale: params.scale as number,
        angle: params.angle as number,
        grayscale: params.grayscale as boolean
      })
    },
    updateUniforms(filter: DotFilter, params: ParamValues): void {
      filter.scale = params.scale as number
      filter.angle = params.angle as number
      filter.grayscale = params.grayscale as boolean
    }
  }
}
