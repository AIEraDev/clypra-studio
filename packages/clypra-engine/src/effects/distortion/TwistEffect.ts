import { TwistFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const TwistEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'twist',
  name: 'Twist Twirl',
  category: 'distortion',
  description: 'Twirl the frame around a center offset point with customizable radius and animated twist angle.',
  tags: ['distortion', 'twist', 'twirl', 'warp', 'swirl'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/twist.webp',

  params: [
    { key: 'centerX',  label: 'Center X',    type: 'range',  value: 0.5,   min: 0,    max: 1.0,  step: 0.05 },
    { key: 'centerY',  label: 'Center Y',    type: 'range',  value: 0.5,   min: 0,    max: 1.0,  step: 0.05 },
    { key: 'radius',   label: 'Twirl Radius', type: 'range',  value: 300,   min: 50,   max: 800,  step: 10 },
    { key: 'angle',    label: 'Twist Angle',  type: 'range',  value: 4.0,   min: -15.0, max: 15.0, step: 0.5 },
    { key: 'animated', label: 'Animate',      type: 'toggle', value: true },
    { key: 'speed',    label: 'Twist Speed',  type: 'range',  value: 1.0,   min: 0.1,  max: 5.0,  step: 0.1 },
  ],

  filterSpec: {
    create(params: ParamValues): TwistFilter {
      const px = (params.centerX as number) * 1280
      const py = (params.centerY as number) * 720

      const filter = new TwistFilter({
        offset: { x: px, y: py },
        radius: params.radius as number,
        angle: params.angle as number,
      })
      return filter
    },

    updateUniforms(filter: TwistFilter, params: ParamValues, elapsed: number): void {
      const px = (params.centerX as number) * 1280
      const py = (params.centerY as number) * 720
      
      filter.offset = { x: px, y: py }
      filter.radius = params.radius as number

      let angleVal = params.angle as number
      if (params.animated) {
        const speed = params.speed as number
        angleVal *= Math.sin((elapsed / 1000) * speed)
      }
      filter.angle = angleVal
    },
  },
}
