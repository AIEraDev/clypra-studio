import { ColorMatrixFilter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const ColorMatrixEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'color-matrix',
  name: 'Color Matrix Presets',
  category: 'light',
  description: 'Color grading adjustments and retro filter presets.',
  tags: ['color', 'matrix', 'grading', 'sepia', 'vintage', 'kodachrome'],
  thumbnail: '',
  params: [
    { key: 'brightness', label: 'Brightness', type: 'range', value: 1.0, min: 0.0, max: 2.0, step: 0.05 },
    { key: 'contrast', label: 'Contrast', type: 'range', value: 1.0, min: 0.0, max: 2.0, step: 0.05 },
    { key: 'saturation', label: 'Saturation', type: 'range', value: 1.0, min: 0.0, max: 2.0, step: 0.05 },
    { key: 'hue', label: 'Hue Rotation', type: 'range', value: 0, min: -180, max: 180, step: 2 },
    { key: 'mode', label: 'Film Preset', type: 'select', value: 'none', options: [
      'none',
      'sepia',
      'vintage',
      'technicolor',
      'polaroid',
      'kodachrome',
      'blackAndWhite',
      'negative',
      'night',
      'predator',
      'lsd'
    ] }
  ],
  filterSpec: {
    create(params: ParamValues): ColorMatrixFilter {
      const filter = new ColorMatrixFilter()
      this.updateUniforms(filter, params)
      return filter
    },
    updateUniforms(filter: ColorMatrixFilter, params: ParamValues): void {
      filter.reset()
      if (params.brightness !== 1.0) filter.brightness(params.brightness as number, true)
      if (params.contrast !== 1.0) filter.contrast(params.contrast as number, true)
      if (params.saturation !== 1.0) filter.saturate(params.saturation as number, true)
      if (params.hue !== 0) filter.hue(params.hue as number, true)

      const mode = params.mode as string
      if (mode !== 'none') {
        if (mode === 'sepia') filter.sepia(true)
        else if (mode === 'vintage') filter.vintage(true)
        else if (mode === 'technicolor') filter.technicolor(true)
        else if (mode === 'polaroid') filter.polaroid(true)
        else if (mode === 'kodachrome') filter.kodachrome(true)
        else if (mode === 'blackAndWhite') filter.blackAndWhite(true)
        else if (mode === 'negative') filter.negative(true)
        else if (mode === 'night') filter.night(1.0, true)
        else if (mode === 'predator') filter.predator(1.0, true)
        else if (mode === 'lsd') filter.lsd(true)
      }
    }
  }
}
