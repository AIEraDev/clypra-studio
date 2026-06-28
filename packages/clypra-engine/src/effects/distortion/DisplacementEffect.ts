import { DisplacementFilter, Texture, Sprite } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

function createDisplacementTexture(): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const imgData = ctx.createImageData(256, 256)
    for (let i = 0; i < imgData.data.length; i += 4) {
      const x = (i / 4) % 256
      const y = Math.floor((i / 4) / 256)
      
      // Procedural sine waves in Red and Green channels for displacement mapping
      const r = Math.floor(128 + 127 * Math.sin(x * 0.1 + y * 0.05))
      const g = Math.floor(128 + 127 * Math.cos(x * 0.05 - y * 0.1))
      
      imgData.data[i] = r
      imgData.data[i + 1] = g
      imgData.data[i + 2] = 0 // Blue not used
      imgData.data[i + 3] = 255 // Alpha
    }
    ctx.putImageData(imgData, 0, 0)
  }
  return Texture.from(canvas)
}

export const DisplacementEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'displacement',
  name: 'Displacement Map',
  category: 'distortion',
  description: 'Warp and distort the frame using a procedural noise displacement sprite.',
  tags: ['displacement', 'warp', 'distort', 'liquid'],
  thumbnail: '',
  params: [
    { key: 'scaleX', label: 'Horiz Scale', type: 'range', value: 20, min: -200, max: 200, step: 1 },
    { key: 'scaleY', label: 'Vert Scale', type: 'range', value: 20, min: -200, max: 200, step: 1 },
    { key: 'animated', label: 'Flow Motion', type: 'toggle', value: true },
    { key: 'speed', label: 'Flow Speed', type: 'range', value: 1.0, min: 0.1, max: 5.0, step: 0.1 }
  ],
  filterSpec: {
    create(params: ParamValues): DisplacementFilter {
      const tex = createDisplacementTexture()
      const sprite = new Sprite(tex)
      const filter = new DisplacementFilter({
        sprite,
        scale: { x: params.scaleX as number, y: params.scaleY as number }
      })
      // Attach the sprite reference so we can update it in updateUniforms
      ;(filter as any)._displacementSprite = sprite
      return filter
    },
    updateUniforms(filter: DisplacementFilter, params: ParamValues, elapsed: number): void {
      filter.scale.x = params.scaleX as number
      filter.scale.y = params.scaleY as number
      const sprite = (filter as any)._displacementSprite
      if (sprite && params.animated) {
        // Animate coordinates to give flowing motion
        const speed = params.speed as number
        sprite.x = (elapsed / 1000) * speed * 80
        sprite.y = (elapsed / 1000) * speed * 50
      }
    }
  }
}
