import { ReflectionFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const ReflectionEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'reflection',
  name: 'Water Reflection',
  category: 'distortion',
  description: 'Water reflection ripple distortion on the lower half of the frame with customizable boundary, wave, and speed settings.',
  tags: ['reflection', 'water', 'ripple', 'distortion', 'mirror'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/reflection.webp',

  params: [
    { key: 'boundary',        label: 'Reflection Line', type: 'range',  value: 0.5,   min: 0.1,  max: 0.9,  step: 0.05 },
    { key: 'amplitudeStart',  label: 'Amp Start',       type: 'range',  value: 0,     min: 0,    max: 50,   step: 1 },
    { key: 'amplitudeEnd',    label: 'Amp End',         type: 'range',  value: 20,    min: 0,    max: 100,  step: 1 },
    { key: 'wavelengthStart', label: 'Wavelength Start',type: 'range',  value: 30,    min: 10,   max: 100,  step: 5 },
    { key: 'wavelengthEnd',   label: 'Wavelength End',  type: 'range',  value: 100,   min: 10,   max: 300,  step: 5 },
    { key: 'alphaStart',      label: 'Alpha Start',     type: 'range',  value: 1.0,   min: 0,    max: 1.0,  step: 0.05 },
    { key: 'alphaEnd',        label: 'Alpha End',       type: 'range',  value: 1.0,   min: 0,    max: 1.0,  step: 0.05 },
    { key: 'mirror',          label: 'Mirror Image',    type: 'toggle', value: true },
    { key: 'animated',        label: 'Animate Ripples', type: 'toggle', value: true },
    { key: 'speed',           label: 'Ripple Speed',    type: 'range',  value: 1.0,   min: 0.1,  max: 5.0,  step: 0.1 },
  ],

  filterSpec: {
    create(params: ParamValues): ReflectionFilter {
      const filter = new ReflectionFilter({
        mirror: params.mirror as boolean,
        boundary: params.boundary as number,
        amplitude: [params.amplitudeStart as number, params.amplitudeEnd as number],
        waveLength: [params.wavelengthStart as number, params.wavelengthEnd as number],
        alpha: [params.alphaStart as number, params.alphaEnd as number],
        time: 0,
      })
      return filter
    },

    updateUniforms(filter: ReflectionFilter, params: ParamValues, elapsed: number): void {
      filter.mirror = params.mirror as boolean
      filter.boundary = params.boundary as number
      filter.amplitude = [params.amplitudeStart as number, params.amplitudeEnd as number]
      filter.waveLength = [params.wavelengthStart as number, params.wavelengthEnd as number]
      filter.alpha = [params.alphaStart as number, params.alphaEnd as number]

      if (params.animated) {
        const speed = params.speed as number
        filter.time = (elapsed / 1000) * speed
      }
    },
  },
}
