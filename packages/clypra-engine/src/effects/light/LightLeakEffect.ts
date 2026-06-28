import { GodrayFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const LightLeakEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'light-leak',
  name: 'Light Leak',
  category: 'light',
  description: 'Animated gradient sweep across the frame using light rays.',
  tags: ['light', 'leak', 'cinematic', 'vintage', 'rays'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/light-leak.webp',

  params: [
    { key: 'gain',        label: 'Gain',        type: 'range',  value: 0.6,   min: 0,   max: 1,   step: 0.05 },
    { key: 'lacunarity',  label: 'Lacunarity',  type: 'range',  value: 2.5,   min: 0,   max: 5,   step: 0.1 },
    { key: 'alpha',       label: 'Alpha',       type: 'range',  value: 0.8,   min: 0,   max: 1,   step: 0.05 },
    { key: 'angle',       label: 'Angle',       type: 'range',  value: 30,    min: -180, max: 180, step: 5 },
    { key: 'speed',       label: 'Sweep Speed', type: 'range',  value: 1.0,   min: 0,   max: 5,   step: 0.1 },
    { key: 'animated',    label: 'Animate',     type: 'toggle', value: true },
  ],

  filterSpec: {
    create(params: ParamValues): GodrayFilter {
      const filter = new GodrayFilter({
        gain: params.gain as number,
        lacunarity: params.lacunarity as number,
        alpha: params.alpha as number,
        angle: (params.angle as number) * Math.PI / 180,
        center: [0.5, -0.2],
        parallel: true,
        time: 0,
      })
      return filter
    },

    updateUniforms(filter: GodrayFilter, params: ParamValues, elapsed: number): void {
      filter.gain = params.gain as number
      filter.lacunarity = params.lacunarity as number
      filter.alpha = params.alpha as number
      filter.angle = (params.angle as number) * Math.PI / 180

      if (params.animated) {
        const speed = params.speed as number
        filter.time = (elapsed / 1000) * speed
      }
    },
  },
}
