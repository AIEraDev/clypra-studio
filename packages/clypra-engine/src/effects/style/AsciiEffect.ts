import { AsciiFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const AsciiEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'ascii',
  name: 'ASCII Art',
  category: 'distortion',
  description: 'Converts the video frame into interactive retro matrix ASCII text characters.',
  tags: ['ascii', 'text', 'matrix', 'terminal', 'retro'],
  thumbnail: '',
  params: [
    { key: 'size', label: 'Character Size', type: 'range', value: 8, min: 2, max: 50, step: 1 },
    { key: 'replaceColor', label: 'Solid Text Color', type: 'toggle', value: false }
  ],
  filterSpec: {
    create(params: ParamValues): AsciiFilter {
      return new AsciiFilter({
        size: params.size as number,
        replaceColor: params.replaceColor as boolean
      })
    },
    updateUniforms(filter: AsciiFilter, params: ParamValues): void {
      filter.size = params.size as number
      filter.replaceColor = params.replaceColor as boolean
    }
  }
}
