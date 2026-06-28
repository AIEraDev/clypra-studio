import { RadialBlurFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const RadialBlurEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'radial-blur',
  name: 'Radial Blur',
  category: 'cinematic',
  description: 'Radial spin blur around a focal center point.',
  tags: ['blur', 'radial', 'cinematic', 'spin'],
  thumbnail: '',
  params: [
    { key: 'angle', label: 'Spin Angle', type: 'range', value: 10, min: -180, max: 180, step: 1 },
    { key: 'centerX', label: 'Center X', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'centerY', label: 'Center Y', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'kernelSize', label: 'Blur Kernel', type: 'range', value: 9, min: 3, max: 25, step: 2 },
    { key: 'radius', label: 'Max Radius', type: 'range', value: -1, min: -1, max: 1200, step: 10 }
  ],
  filterSpec: {
    create(params: ParamValues): RadialBlurFilter {
      return new RadialBlurFilter({
        angle: params.angle as number,
        center: { x: (params.centerX as number) * 1920, y: (params.centerY as number) * 1080 },
        kernelSize: params.kernelSize as number,
        radius: params.radius as number
      })
    },
    updateUniforms(filter: RadialBlurFilter, params: ParamValues): void {
      filter.angle = params.angle as number
      filter.center = { x: (params.centerX as number) * 1920, y: (params.centerY as number) * 1080 }
      filter.radius = params.radius as number
    }
  }
}
