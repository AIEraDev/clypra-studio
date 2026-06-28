import { ZoomBlurFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const ZoomBlurEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'zoom-blur',
  name: 'Zoom Blur',
  category: 'cinematic',
  description: 'Radial focal zoom blur emanating from a point.',
  tags: ['blur', 'zoom', 'cinematic', 'focus'],
  thumbnail: '',
  params: [
    { key: 'strength', label: 'Blur Strength', type: 'range', value: 0.15, min: 0.0, max: 1.0, step: 0.02 },
    { key: 'centerX', label: 'Center X', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'centerY', label: 'Center Y', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'innerRadius', label: 'Inner Radius', type: 'range', value: 0, min: 0, max: 600, step: 10 },
    { key: 'radius', label: 'Outer Radius', type: 'range', value: 400, min: 50, max: 1200, step: 10 }
  ],
  filterSpec: {
    create(params: ParamValues): ZoomBlurFilter {
      return new ZoomBlurFilter({
        strength: params.strength as number,
        center: { x: (params.centerX as number) * 1920, y: (params.centerY as number) * 1080 },
        innerRadius: params.innerRadius as number,
        radius: params.radius as number
      })
    },
    updateUniforms(filter: ZoomBlurFilter, params: ParamValues): void {
      filter.strength = params.strength as number
      filter.center = { x: (params.centerX as number) * 1920, y: (params.centerY as number) * 1080 }
      filter.innerRadius = params.innerRadius as number
      filter.radius = params.radius as number
    }
  }
}
