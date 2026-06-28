import { HslAdjustmentFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const HslAdjustmentEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'hsl-adjustment',
  name: 'HSL Adjustment',
  category: 'light',
  description: 'Adjust hue, saturation, and lightness of the video.',
  tags: ['hsl', 'color', 'adjust', 'hue', 'saturation'],
  thumbnail: '',
  params: [
    { key: 'hue', label: 'Hue Rotation', type: 'range', value: 0, min: -180, max: 180, step: 1 },
    { key: 'saturation', label: 'Saturation', type: 'range', value: 0, min: -1.0, max: 1.0, step: 0.05 },
    { key: 'lightness', label: 'Lightness', type: 'range', value: 0, min: -1.0, max: 1.0, step: 0.05 },
    { key: 'colorize', label: 'Colorize Mode', type: 'toggle', value: false },
    { key: 'alpha', label: 'Alpha Strength', type: 'range', value: 1.0, min: 0.0, max: 1.0, step: 0.05 }
  ],
  filterSpec: {
    create(params: ParamValues): HslAdjustmentFilter {
      return new HslAdjustmentFilter({
        hue: params.hue as number,
        saturation: params.saturation as number,
        lightness: params.lightness as number,
        colorize: params.colorize as boolean,
        alpha: params.alpha as number
      })
    },
    updateUniforms(filter: HslAdjustmentFilter, params: ParamValues): void {
      filter.hue = params.hue as number
      filter.saturation = params.saturation as number
      filter.lightness = params.lightness as number
      filter.colorize = params.colorize as boolean
      filter.alpha = params.alpha as number
    }
  }
}
