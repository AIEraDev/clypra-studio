import { OldFilmFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const OldFilmEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'old-film',
  name: 'Old Film',
  category: 'cinematic',
  description: 'Simulates vintage cinema projector noise, sepia tint, vignette, and film scratches.',
  tags: ['old', 'film', 'cinematic', 'retro', 'vintage', 'scratches'],
  thumbnail: '',
  params: [
    { key: 'sepia', label: 'Sepia Tint', type: 'range', value: 0.3, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'noise', label: 'Noise Density', type: 'range', value: 0.15, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'noiseSize', label: 'Noise Size', type: 'range', value: 1.0, min: 0.2, max: 5.0, step: 0.1 },
    { key: 'scratchDensity', label: 'Scratch Density', type: 'range', value: 0.3, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'scratchWidth', label: 'Scratch Width', type: 'range', value: 1.0, min: 0.5, max: 6.0, step: 0.2 },
    { key: 'vignetting', label: 'Vignette Amount', type: 'range', value: 0.3, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'vignettingAlpha', label: 'Vignette Alpha', type: 'range', value: 1.0, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'vignettingBlur', label: 'Vignette Blur', type: 'range', value: 0.3, min: 0.0, max: 1.0, step: 0.05 }
  ],
  filterSpec: {
    create(params: ParamValues): OldFilmFilter {
      return new OldFilmFilter({
        sepia: params.sepia as number,
        noise: params.noise as number,
        noiseSize: params.noiseSize as number,
        scratchDensity: params.scratchDensity as number,
        scratchWidth: params.scratchWidth as number,
        vignetting: params.vignetting as number,
        vignettingAlpha: params.vignettingAlpha as number,
        vignettingBlur: params.vignettingBlur as number,
        scratch: Math.random()
      })
    },
    updateUniforms(filter: OldFilmFilter, params: ParamValues): void {
      filter.sepia = params.sepia as number
      filter.noise = params.noise as number
      filter.noiseSize = params.noiseSize as number
      filter.scratchDensity = params.scratchDensity as number
      filter.scratchWidth = params.scratchWidth as number
      filter.vignetting = params.vignetting as number
      filter.vignettingAlpha = params.vignettingAlpha as number
      filter.vignettingBlur = params.vignettingBlur as number
      // Animate scratches
      filter.scratch = Math.random() * 2.0 - 1.0
    }
  }
}
