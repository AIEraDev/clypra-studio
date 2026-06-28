import { MotionBlurFilter } from 'pixi-filters'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

export const MotionBlurEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'motion-blur',
  name: 'Motion Blur',
  category: 'cinematic',
  description: 'Apply directional motion blur to simulate speed and camera movement.',
  tags: ['motion', 'blur', 'cinematic', 'speed', 'directional'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/motion-blur.webp',

  params: [
    { key: 'velocityX',  label: 'Velocity X',  type: 'range', value: 20, min: -80, max: 80, step: 1 },
    { key: 'velocityY',  label: 'Velocity Y',  type: 'range', value: 0,  min: -80, max: 80, step: 1 },
    { key: 'kernelSize', label: 'Kernel Size', type: 'range', value: 9,  min: 5,   max: 25, step: 2 },
    { key: 'offset',     label: 'Offset',      type: 'range', value: 0,  min: 0,   max: 10, step: 1 },
  ],

  filterSpec: {
    create(params: ParamValues): MotionBlurFilter {
      const filter = new MotionBlurFilter({
        velocity: [params.velocityX as number, params.velocityY as number],
        kernelSize: params.kernelSize as number,
        offset: params.offset as number,
      })
      return filter
    },

    updateUniforms(filter: MotionBlurFilter, params: ParamValues): void {
      filter.velocity = [params.velocityX as number, params.velocityY as number]
      filter.kernelSize = params.kernelSize as number
      filter.offset = params.offset as number
    },
  },
}
