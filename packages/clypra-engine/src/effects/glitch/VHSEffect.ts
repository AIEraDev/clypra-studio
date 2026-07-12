import { Filter, Graphics, Ticker } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'
import { pixiVertexShader } from '@clypra-studio/shaders'

const FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float uNoise;
  uniform bool  uScanlines;
  uniform float uLineAlpha;
  uniform float uHShift;
  uniform float uTime;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main(void) {
    vec2 uv = vTextureCoord;

    // Horizontal shift on random bands
    float bandY = floor(uv.y * 240.0) / 240.0;
    float shift = (rand(vec2(bandY, floor(uTime * 15.0))) - 0.5) * uHShift;
    uv.x += shift;

    vec4 color = texture(uTexture, clamp(uv, 0.0, 1.0));

    // Noise grain
    float grain = rand(uv + uTime) * uNoise;
    color.rgb += grain;

    // Scanlines
    if (uScanlines) {
      float line = step(0.5, fract(vTextureCoord.y * 240.0));
      color.rgb = mix(color.rgb, color.rgb * 0.7, line * uLineAlpha);
    }

    // washed-out tape color grading
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(luma), color.rgb, 0.75);

    finalColor = color;
  }
`

export const VHSEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'composite',
  id: 'vhs',
  name: 'VHS',
  category: 'glitch',
  description: 'Retro VHS tape effect with scanlines, noise, horizontal line shifting, and a moving tracking band.',
  tags: ['vhs', 'retro', 'glitch', 'scanlines', 'noise', 'tape'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/vhs.webp',

  params: [
    { key: 'noise',      label: 'Noise',       type: 'range',  value: 0.08,  min: 0,    max: 0.3,  step: 0.01 },
    { key: 'scanlines',  label: 'Scanlines',   type: 'toggle', value: true },
    { key: 'lineAlpha',  label: 'Line alpha',  type: 'range',  value: 0.25,  min: 0,    max: 1,    step: 0.05 },
    { key: 'hShift',     label: 'H-shift',     type: 'range',  value: 0.003, min: 0,    max: 0.02, step: 0.001 },
    { key: 'bandSpeed',  label: 'Band speed',  type: 'range',  value: 1.2,   min: 0.1,  max: 5,    step: 0.1 },
    { key: 'bandAlpha',  label: 'Band alpha',  type: 'range',  value: 0.35,  min: 0,    max: 1,    step: 0.05 },
  ],

  filterSpec: {
    create(params: ParamValues) {
      return Filter.from({
        gl: { vertex: pixiVertexShader, fragment: FRAGMENT_SHADER },
        resources: {
          uniforms: {
            uNoise:     { value: params.noise,     type: 'f32' },
            uScanlines: { value: params.scanlines, type: 'bool' },
            uLineAlpha: { value: params.lineAlpha, type: 'f32' },
            uHShift:    { value: params.hShift,    type: 'f32' },
            uTime:      { value: 0,                type: 'f32' },
          },
        },
      })
    },

    updateUniforms(filter, params, elapsed) {
      const uniforms = (filter as any).resources?.uniforms?.uniforms
      if (!uniforms) return
      uniforms.uTime      = elapsed / 1000
      uniforms.uNoise     = params.noise
      uniforms.uScanlines = params.scanlines
      uniforms.uLineAlpha = params.lineAlpha
      uniforms.uHShift    = params.hShift
    },
  },

  mount(ctx) {
    const band = new Graphics()
    ;(ctx as any)._vhsBand = band
    ;(ctx as any)._bandY = Math.random() * ctx.height

    const draw = () => {
      band.clear()
      band.rect(0, (ctx as any)._bandY, ctx.width, 8)
      band.fill({ color: 0xffffff, alpha: ctx.params.bandAlpha as number })
    }
    draw()
    ctx.container.addChild(band)

    ;(ctx as any)._tickerFn = (ticker: Ticker) => {
      ;(ctx as any)._bandY += (ctx.params.bandSpeed as number) * ticker.deltaTime
      if ((ctx as any)._bandY > ctx.height + 20) (ctx as any)._bandY = -20
      draw()
    }
    ctx.ticker.add((ctx as any)._tickerFn)
  },

  unmount(ctx) {
    if ((ctx as any)._tickerFn) ctx.ticker.remove((ctx as any)._tickerFn)
    if ((ctx as any)._vhsBand) {
      ctx.container.removeChild((ctx as any)._vhsBand)
      ;(ctx as any)._vhsBand.destroy()
    }
  },

  onParamChange(ctx, key) {
    // bandAlpha is read live in the ticker fn via ctx.params
  },
}
