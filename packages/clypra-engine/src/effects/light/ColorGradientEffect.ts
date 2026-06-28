import { ColorGradientFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const ColorGradientEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'color-gradient',
  name: 'Color Gradient',
  category: 'light',
  description: 'Overlay a linear or radial multi-stop color gradient.',
  tags: ['color', 'gradient', 'overlay'],
  thumbnail: '',
  params: [
    { key: 'gradientType', label: 'Gradient Type', type: 'select', value: 'Linear', options: ['Linear', 'Radial'] },
    { key: 'color1', label: 'Start Color', type: 'color', value: '#7C6FFF' },
    { key: 'color2', label: 'End Color', type: 'color', value: '#0E0E12' },
    { key: 'alpha', label: 'Alpha', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 }
  ],
  filterSpec: {
    create(params: ParamValues): ColorGradientFilter {
      const c1 = parseInt((params.color1 as string).replace('#', '0x'), 16)
      const c2 = parseInt((params.color2 as string).replace('#', '0x'), 16)
      const typeVal = params.gradientType === 'Radial' ? 1 : 0
      return new ColorGradientFilter({
        type: typeVal,
        stops: [
          { offset: 0, color: c1, alpha: 1.0 },
          { offset: 1, color: c2, alpha: 1.0 }
        ],
        alpha: params.alpha as number
      })
    },
    updateUniforms(filter: ColorGradientFilter, params: ParamValues): void {
      const c1 = parseInt((params.color1 as string).replace('#', '0x'), 16)
      const c2 = parseInt((params.color2 as string).replace('#', '0x'), 16)
      const typeVal = params.gradientType === 'Radial' ? 1 : 0
      filter.stops = [
        { offset: 0, color: c1, alpha: 1.0 },
        { offset: 1, color: c2, alpha: 1.0 }
      ]
      filter.alpha = params.alpha as number
      filter.type = typeVal
    }
  }
}
