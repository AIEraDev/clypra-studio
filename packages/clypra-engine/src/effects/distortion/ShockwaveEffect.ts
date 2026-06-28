import { ShockwaveFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const ShockwaveEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'shockwave',
  name: 'Shockwave',
  category: 'distortion',
  description: 'Expanding shockwave ripple from a center coordinate with custom amplitude, wavelength, and speed.',
  tags: ['shockwave', 'ripple', 'distortion', 'wave', 'refraction'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/shockwave.webp',

  params: [
    { key: 'centerX',    label: 'Center X',     type: 'range',  value: 0.5,   min: 0,    max: 1.0,  step: 0.05 },
    { key: 'centerY',    label: 'Center Y',     type: 'range',  value: 0.5,   min: 0,    max: 1.0,  step: 0.05 },
    { key: 'speed',      label: 'Wave Speed',   type: 'range',  value: 1.5,   min: 0.1,  max: 5.0,  step: 0.1 },
    { key: 'amplitude',  label: 'Amplitude',    type: 'range',  value: 30,    min: 1,    max: 100,  step: 1 },
    { key: 'wavelength', label: 'Wavelength',   type: 'range',  value: 160,   min: 10,   max: 300,  step: 5 },
    { key: 'brightness', label: 'Brightness',   type: 'range',  value: 1.0,   min: 0.5,  max: 2.0,  step: 0.05 },
    { key: 'radius',     label: 'Max Radius',   type: 'range',  value: 600,   min: 100,  max: 1000, step: 10 },
    { key: 'animated',   label: 'Animate',      type: 'toggle', value: true },
  ],

  filterSpec: {
    create(params: ParamValues): ShockwaveFilter {
      const px = (params.centerX as number) * 1280
      const py = (params.centerY as number) * 720

      const filter = new ShockwaveFilter({
        center: { x: px, y: py },
        speed: params.speed as number,
        amplitude: params.amplitude as number,
        wavelength: params.wavelength as number,
        brightness: params.brightness as number,
        radius: params.radius as number,
        time: 0,
      })
      return filter
    },

    updateUniforms(filter: ShockwaveFilter, params: ParamValues, elapsed: number): void {
      const px = (params.centerX as number) * 1280
      const py = (params.centerY as number) * 720
      
      filter.center = { x: px, y: py }
      filter.speed = params.speed as number
      filter.amplitude = params.amplitude as number
      filter.wavelength = params.wavelength as number
      filter.brightness = params.brightness as number
      filter.radius = params.radius as number

      if (params.animated) {
        // Repeatedly expand the shockwave every 2 seconds
        const speed = params.speed as number
        filter.time = ((elapsed / 1000) * speed) % 2.0
      } else {
        filter.time = 0.5 // static display in the middle of expansion
      }
    },
  },
}
