import { TiltShiftFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const TiltShiftEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'tilt-shift',
  name: 'Tilt Shift',
  category: 'cinematic',
  description: 'Cinematic miniature effect with focus range and gradient blur controls.',
  tags: ['tilt-shift', 'miniature', 'blur', 'cinematic'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/tilt-shift.webp',

  params: [
    { key: 'blur',         label: 'Edge Blur',      type: 'range', value: 40,   min: 0,    max: 100,  step: 1 },
    { key: 'gradientBlur', label: 'Gradient Blur',  type: 'range', value: 300,  min: 50,   max: 800,  step: 10 },
    { key: 'focusY',       label: 'Focus Position', type: 'range', value: 0.5,  min: 0.0,  max: 1.0,  step: 0.05 },
    { key: 'focusRange',   label: 'Focus Range',    type: 'range', value: 0.15, min: 0.05, max: 0.4,  step: 0.05 },
  ],

  filterSpec: {
    create(params: ParamValues): TiltShiftFilter {
      const centerY = (params.focusY as number) * 720
      const range = (params.focusRange as number) * 720
      
      const filter = new TiltShiftFilter({
        blur: params.blur as number,
        gradientBlur: params.gradientBlur as number,
        start: { x: 0, y: centerY - range },
        end: { x: 0, y: centerY + range },
      })
      return filter
    },

    updateUniforms(filter: TiltShiftFilter, params: ParamValues): void {
      filter.blur = params.blur as number
      filter.gradientBlur = params.gradientBlur as number
      
      const centerY = (params.focusY as number) * 720
      const range = (params.focusRange as number) * 720
      
      // Update start and end points
      filter.start = { x: 0, y: centerY - range }
      filter.end = { x: 0, y: centerY + range }
    },
  },
}
