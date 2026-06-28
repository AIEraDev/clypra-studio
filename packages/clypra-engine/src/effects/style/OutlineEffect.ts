import { OutlineFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const OutlineEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'outline',
  name: 'Outline Overlay',
  category: 'distortion', // Map to distortion category in UI since it's an edge distortion/boundary shader
  description: 'Draws a solid colored outline around the non-transparent boundaries of the layer.',
  tags: ['outline', 'stroke', 'style', 'artistic'],
  thumbnail: '',
  params: [
    { key: 'thickness', label: 'Thickness', type: 'range', value: 3, min: 0, max: 20, step: 1 },
    { key: 'color', label: 'Outline Color', type: 'color', value: '#7C6FFF' },
    { key: 'quality', label: 'Render Quality', type: 'range', value: 0.1, min: 0.01, max: 1.0, step: 0.05 },
    { key: 'alpha', label: 'Opacity', type: 'range', value: 1.0, min: 0.0, max: 1.0, step: 0.05 }
  ],
  filterSpec: {
    create(params: ParamValues): OutlineFilter {
      const c = parseInt((params.color as string).replace('#', '0x'), 16)
      return new OutlineFilter({
        thickness: params.thickness as number,
        color: c,
        quality: params.quality as number,
        alpha: params.alpha as number
      })
    },
    updateUniforms(filter: OutlineFilter, params: ParamValues): void {
      const c = parseInt((params.color as string).replace('#', '0x'), 16)
      filter.thickness = params.thickness as number
      filter.color = c
      filter.alpha = params.alpha as number
    }
  }
}
