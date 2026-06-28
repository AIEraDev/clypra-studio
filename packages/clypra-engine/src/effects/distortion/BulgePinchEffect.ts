import { BulgePinchFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const BulgePinchEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'bulge-pinch',
  name: 'Bulge Pinch',
  category: 'distortion',
  description: 'Distort the frame with a spherical bulge (positive strength) or pinch warp (negative strength).',
  tags: ['distortion', 'bulge', 'pinch', 'warp', 'spherize'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/bulge-pinch.webp',

  params: [
    { key: 'centerX',  label: 'Center X',     type: 'range',  value: 0.5,   min: 0,    max: 1.0,  step: 0.05 },
    { key: 'centerY',  label: 'Center Y',     type: 'range',  value: 0.5,   min: 0,    max: 1.0,  step: 0.05 },
    { key: 'radius',   label: 'Warp Radius',  type: 'range',  value: 200,   min: 10,   max: 600,  step: 10 },
    { key: 'strength', label: 'Warp Strength', type: 'range',  value: 0.5,   min: -1.0, max: 1.0,  step: 0.05 },
    { key: 'animated', label: 'Animate Pulse', type: 'toggle', value: true },
    { key: 'speed',    label: 'Pulse Speed',  type: 'range',  value: 1.5,   min: 0.1,  max: 5.0,  step: 0.1 },
  ],

  filterSpec: {
    create(params: ParamValues): BulgePinchFilter {
      const filter = new BulgePinchFilter({
        center: { x: params.centerX as number, y: params.centerY as number },
        radius: params.radius as number,
        strength: params.strength as number,
      })
      return filter
    },

    updateUniforms(filter: BulgePinchFilter, params: ParamValues, elapsed: number): void {
      filter.center = { x: params.centerX as number, y: params.centerY as number }
      filter.radius = params.radius as number

      let strengthVal = params.strength as number
      if (params.animated) {
        const speed = params.speed as number
        strengthVal *= Math.sin((elapsed / 1000) * speed * Math.PI)
      }
      filter.strength = strengthVal
    },
  },
}
