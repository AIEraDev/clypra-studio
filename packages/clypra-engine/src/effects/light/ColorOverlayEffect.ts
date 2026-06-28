import { ColorOverlayFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const ColorOverlayEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'color-overlay',
  name: 'Color Overlay',
  category: 'light',
  description: 'Overlay a solid tint color onto the frame.',
  tags: ['color', 'overlay', 'tint'],
  thumbnail: '',
  params: [
    { key: 'color', label: 'Overlay Color', type: 'color', value: '#7C6FFF' },
    { key: 'alpha', label: 'Opacity', type: 'range', value: 0.3, min: 0.0, max: 1.0, step: 0.05 }
  ],
  filterSpec: {
    create(params: ParamValues): ColorOverlayFilter {
      const c = parseInt((params.color as string).replace('#', '0x'), 16)
      return new ColorOverlayFilter({
        color: c,
        alpha: params.alpha as number
      })
    },
    updateUniforms(filter: ColorOverlayFilter, params: ParamValues): void {
      const c = parseInt((params.color as string).replace('#', '0x'), 16)
      filter.color = c
      filter.alpha = params.alpha as number
    }
  }
}
