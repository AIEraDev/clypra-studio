import { GlowFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const NeonGlowEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'neon-glow',
  name: 'Neon Glow (Community)',
  category: 'light',
  description: 'Wrap your visual features in a premium neon glow outline using community GlowFilter.',
  tags: ['light', 'glow', 'outline', 'neon'],
  thumbnail: '',
  params: [
    { key: 'distance', label: 'Glow Distance', type: 'range', value: 15, min: 1, max: 100, step: 1 },
    { key: 'innerStrength', label: 'Inner Strength', type: 'range', value: 1.0, min: 0.0, max: 10.0, step: 0.2 },
    { key: 'outerStrength', label: 'Outer Strength', type: 'range', value: 2.0, min: 0.0, max: 10.0, step: 0.2 },
    { key: 'color', label: 'Glow Color', type: 'color', value: '#7C6FFF' },
    { key: 'quality', label: 'Render Quality', type: 'range', value: 0.1, min: 0.01, max: 1.0, step: 0.05 },
    { key: 'knockout', label: 'Knockout Source', type: 'toggle', value: false }
  ],
  filterSpec: {
    create(params: ParamValues): GlowFilter {
      const c = parseInt((params.color as string).replace('#', '0x'), 16)
      return new GlowFilter({
        distance: params.distance as number,
        innerStrength: params.innerStrength as number,
        outerStrength: params.outerStrength as number,
        color: c,
        quality: params.quality as number,
        knockout: params.knockout as boolean
      })
    },
    updateUniforms(filter: GlowFilter, params: ParamValues): void {
      const c = parseInt((params.color as string).replace('#', '0x'), 16)
      filter.distance = params.distance as number
      filter.innerStrength = params.innerStrength as number
      filter.outerStrength = params.outerStrength as number
      filter.color = c
      // GlowFilter has quality set on constructor, but knockout/color can be changed
      filter.knockout = params.knockout as boolean
    }
  }
}
