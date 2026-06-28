import { CRTFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const CRTEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'crt',
  name: 'CRT Monitor',
  category: 'glitch',
  description: 'Simulate a vintage CRT television screen with curvature, scanlines, and phosphor noise.',
  tags: ['crt', 'retro', 'glitch', 'tv', 'scanlines', 'noise'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/crt.webp',

  params: [
    { key: 'curvature',    label: 'Curvature',     type: 'range',  value: 1.0,   min: 0,    max: 6.0,  step: 0.1 },
    { key: 'lineWidth',    label: 'Line Width',    type: 'range',  value: 1.0,   min: 0,    max: 5.0,  step: 0.5 },
    { key: 'lineContrast', label: 'Line Contrast', type: 'range',  value: 0.25,  min: 0,    max: 1.0,  step: 0.05 },
    { key: 'noise',        label: 'Noise Amount',  type: 'range',  value: 0.15,  min: 0,    max: 0.8,  step: 0.05 },
    { key: 'vignetting',   label: 'Vignette Size', type: 'range',  value: 0.3,   min: 0,    max: 0.8,  step: 0.05 },
    { key: 'flicker',      label: 'Flicker Amount', type: 'range',  value: 0.15,  min: 0,    max: 0.5,  step: 0.05 },
    { key: 'animated',     label: 'Animate',       type: 'toggle', value: true },
  ],

  filterSpec: {
    create(params: ParamValues): CRTFilter {
      return new CRTFilter({
        curvature: params.curvature as number,
        lineWidth: params.lineWidth as number,
        lineContrast: params.lineContrast as number,
        noise: params.noise as number,
        vignetting: params.vignetting as number,
        verticalLine: false,
        time: 0,
      })
    },

    updateUniforms(filter: CRTFilter, params: ParamValues, elapsed: number): void {
      filter.curvature = params.curvature as number
      filter.lineWidth = params.lineWidth as number
      filter.lineContrast = params.lineContrast as number
      filter.vignetting = params.vignetting as number

      if (params.animated) {
        filter.time = elapsed / 1000
        
        // Add dynamic flicker to the noise value
        const flickerVal = (Math.random() - 0.5) * (params.flicker as number)
        filter.noise = Math.max(0, (params.noise as number) + flickerVal * 0.4)
      } else {
        filter.noise = params.noise as number
      }
    },
  },
}
