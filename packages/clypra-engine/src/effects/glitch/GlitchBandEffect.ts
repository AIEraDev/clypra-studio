import { GlitchFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const GlitchBandEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'glitch-band',
  name: 'Glitch Band',
  category: 'glitch',
  description: 'Digital glitch displacement bands with adjustable slices, offset, and RGB split offsets.',
  tags: ['glitch', 'digital', 'rgb', 'distortion', 'tv'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/glitch-band.webp',

  params: [
    { key: 'slices',     label: 'Slice Count',  type: 'range',  value: 15,   min: 2,   max: 80,  step: 1 },
    { key: 'offset',     label: 'Glitch Offset', type: 'range',  value: 80,   min: 0,   max: 400, step: 5 },
    { key: 'direction',  label: 'Direction',    type: 'range',  value: 0,    min: 0,   max: 360, step: 5 },
    { key: 'animated',   label: 'Animate',      type: 'toggle', value: true },
    { key: 'redX',       label: 'Red X',        type: 'range',  value: -3,   min: -20, max: 20,  step: 1 },
    { key: 'redY',       label: 'Red Y',        type: 'range',  value: 0,    min: -20, max: 20,  step: 1 },
    { key: 'blueX',      label: 'Blue X',       type: 'range',  value: 3,    min: -20, max: 20,  step: 1 },
    { key: 'blueY',      label: 'Blue Y',       type: 'range',  value: 0,    min: -20, max: 20,  step: 1 },
  ],

  filterSpec: {
    create(params: ParamValues): GlitchFilter {
      const filter = new GlitchFilter({
        slices:    params.slices as number,
        offset:    params.offset as number,
        direction: params.direction as number,
        red:       [params.redX as number,  params.redY as number],
        blue:      [params.blueX as number, params.blueY as number],
        green:     [0, 0],
        fillMode:  0,   // TRANSPARENT
      })
      return filter
    },

    updateUniforms(filter: GlitchFilter, params: ParamValues): void {
      filter.slices    = params.slices as number
      filter.offset    = params.offset as number
      filter.direction = params.direction as number
      filter.red       = [params.redX as number, params.redY as number]
      filter.blue      = [params.blueX as number, params.blueY as number]

      if (params.animated) {
        // Twitch glitch seed based on random values
        filter.seed = Math.random()
      }
    },
  },
}
