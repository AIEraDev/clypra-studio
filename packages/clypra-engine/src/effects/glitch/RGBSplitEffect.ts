import { RGBSplitFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const RGBSplitEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'rgb-split',
  name: 'RGB Split',
  category: 'glitch',
  description: 'Chromatic aberration splitting red, green, and blue color channels.',
  tags: ['rgb', 'split', 'glitch', 'chromatic', 'aberration'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/rgb-split.webp',

  params: [
    { key: 'redX',     label: 'Red X Shift',   type: 'range',  value: 4,     min: -50,  max: 50,  step: 0.5 },
    { key: 'redY',     label: 'Red Y Shift',   type: 'range',  value: 0,     min: -50,  max: 50,  step: 0.5 },
    { key: 'blueX',    label: 'Blue X Shift',  type: 'range',  value: -4,    min: -50,  max: 50,  step: 0.5 },
    { key: 'blueY',    label: 'Blue Y Shift',  type: 'range',  value: 0,     min: -50,  max: 50,  step: 0.5 },
    { key: 'greenX',   label: 'Green X Shift', type: 'range',  value: 0,     min: -50,  max: 50,  step: 0.5 },
    { key: 'greenY',   label: 'Green Y Shift', type: 'range',  value: 0,     min: -50,  max: 50,  step: 0.5 },
    { key: 'animated', label: 'Animate Pulse', type: 'toggle', value: true },
    { key: 'speed',    label: 'Pulse Speed',   type: 'range',  value: 1.5,   min: 0.1,  max: 5.0, step: 0.1 },
  ],

  filterSpec: {
    create(params: ParamValues): RGBSplitFilter {
      const filter = new RGBSplitFilter({
        red: { x: params.redX as number, y: params.redY as number },
        blue: { x: params.blueX as number, y: params.blueY as number },
        green: { x: params.greenX as number, y: params.greenY as number },
      })
      return filter
    },

    updateUniforms(filter: RGBSplitFilter, params: ParamValues, elapsed: number): void {
      const pulse = params.animated 
        ? 0.5 + 0.5 * Math.sin((elapsed / 1000) * (params.speed as number) * 6.28318)
        : 1.0

      filter.red = {
        x: (params.redX as number) * pulse,
        y: (params.redY as number) * pulse
      }
      filter.blue = {
        x: (params.blueX as number) * pulse,
        y: (params.blueY as number) * pulse
      }
      filter.green = {
        x: (params.greenX as number) * pulse,
        y: (params.greenY as number) * pulse
      }
    },
  },
}
