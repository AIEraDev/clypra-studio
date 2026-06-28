import { Filter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

const DEFAULT_VERTEX_SHADER = `
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;

  vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    return vec4(position * uInputSize.zw * 2.0 - 1.0, 0.0, 1.0);
  }

  vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.xy);
  }

  void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
  }
`

const FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float uSize;
  uniform float uAmount;
  uniform float uRoundness;
  uniform float uSmoothness;

  void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    
    // Center is (0.5, 0.5)
    vec2 uv = vTextureCoord - 0.5;
    
    // Adjust for roundness (oval mapping)
    uv.y *= mix(1.0, 1.6, 1.0 - uRoundness);
    
    float dist = length(uv);
    
    // Size maps vignette boundary
    float start = uSize * 0.5;
    float end = start + mix(0.01, 0.5, uSmoothness);
    
    // Calculate vignette intensity
    float vignette = smoothstep(start, end, dist);
    
    // Darken the color
    color.rgb = mix(color.rgb, color.rgb * (1.0 - uAmount), vignette);
    
    finalColor = color;
  }
`

export const VignetteEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'vignette',
  name: 'Vignette',
  category: 'light',
  description: 'GPU-accelerated edge darkening with shape roundness and edge smoothness controls.',
  tags: ['vignette', 'light', 'cinematic', 'retro'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/vignette.webp',

  params: [
    { key: 'size',       label: 'Size',        type: 'range', value: 0.4,  min: 0,    max: 1.0,  step: 0.05 },
    { key: 'amount',     label: 'Amount',      type: 'range', value: 0.6,  min: 0,    max: 1.0,  step: 0.05 },
    { key: 'roundness',  label: 'Roundness',   type: 'range', value: 0.8,  min: 0,    max: 1.0,  step: 0.05 },
    { key: 'smoothness', label: 'Smoothness',  type: 'range', value: 0.5,  min: 0.01, max: 1.0,  step: 0.05 },
  ],

  filterSpec: {
    create(params: ParamValues): Filter {
      return Filter.from({
        gl: { vertex: DEFAULT_VERTEX_SHADER, fragment: FRAGMENT_SHADER },
        resources: {
          effectUniforms: {
            uSize:       { value: params.size as number, type: 'f32' },
            uAmount:     { value: params.amount as number, type: 'f32' },
            uRoundness:  { value: params.roundness as number, type: 'f32' },
            uSmoothness: { value: params.smoothness as number, type: 'f32' },
          },
        },
      })
    },

    updateUniforms(filter: Filter, params: ParamValues): void {
      const u = (filter as any).resources?.effectUniforms?.uniforms
      if (!u) return

      u.uSize       = params.size as number
      u.uAmount     = params.amount as number
      u.uRoundness  = params.roundness as number
      u.uSmoothness = params.smoothness as number
    },
  },
}
