import { DropShadowFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const DropShadowEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'drop-shadow',
  name: 'Drop Shadow',
  category: 'cinematic',
  description: 'Apply an adjustable drop shadow overlay onto your layer.',
  tags: ['shadow', 'drop', 'cinematic', 'overlay'],
  thumbnail: '',
  params: [
    { key: 'blur', label: 'Shadow Blur', type: 'range', value: 4, min: 0, max: 50, step: 0.5 },
    { key: 'alpha', label: 'Shadow Alpha', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'offsetX', label: 'Offset X', type: 'range', value: 4, min: -100, max: 100, step: 1 },
    { key: 'offsetY', label: 'Offset Y', type: 'range', value: 4, min: -100, max: 100, step: 1 },
    { key: 'color', label: 'Shadow Color', type: 'color', value: '#000000' },
    { key: 'shadowOnly', label: 'Shadow Only', type: 'toggle', value: false }
  ],
  filterSpec: {
    create(params: ParamValues): DropShadowFilter {
      const c = parseInt((params.color as string).replace('#', '0x'), 16)
      return new DropShadowFilter({
        blur: params.blur as number,
        alpha: params.alpha as number,
        offset: { x: params.offsetX as number, y: params.offsetY as number },
        color: c,
        shadowOnly: params.shadowOnly as boolean
      })
    },
    updateUniforms(filter: DropShadowFilter, params: ParamValues): void {
      const c = parseInt((params.color as string).replace('#', '0x'), 16)
      filter.blur = params.blur as number
      filter.alpha = params.alpha as number
      filter.offset = { x: params.offsetX as number, y: params.offsetY as number }
      filter.color = c
      filter.shadowOnly = params.shadowOnly as boolean
    }
  }
}
