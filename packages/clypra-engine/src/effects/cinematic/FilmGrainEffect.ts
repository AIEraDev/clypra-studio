import { Filter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'
import { pixiVertexShader } from '@clypra-studio/shaders'

const FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float uIntensity;
  uniform float uSize;
  uniform float uTime;
  uniform float uSeed;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main(void) {
    vec4 original = texture(uTexture, vTextureCoord);
    
    // Scale coords to control grain size
    float resolutionFactor = 1000.0 / max(uSize, 0.1);
    vec2 uvNoise = floor(vTextureCoord * resolutionFactor) / resolutionFactor;
    
    // Compute pseudo-random noise
    float noise = rand(uvNoise + uTime + uSeed) * 2.0 - 1.0;
    
    // Add grain contribution scaled by intensity
    vec3 grain = vec3(noise * uIntensity * 0.15);
    
    finalColor = vec4(original.rgb + grain * original.a, original.a);
  }
`

export const FilmGrainEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'film-grain',
  name: 'Film Grain',
  category: 'cinematic',
  description: 'GPU-accelerated cinema film grain with custom size, intensity, and seed animation.',
  tags: ['cinematic', 'film', 'grain', 'retro', 'noise'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/film-grain.webp',

  params: [
    { key: 'intensity', label: 'Grain Intensity', type: 'range',  value: 0.25, min: 0,   max: 1.0, step: 0.05 },
    { key: 'size',      label: 'Grain Size',      type: 'range',  value: 2.0,  min: 0.5, max: 6.0, step: 0.1 },
    { key: 'animated',  label: 'Animate Noise',   type: 'toggle', value: true },
  ],

  filterSpec: {
    create(params: ParamValues): Filter {
      return Filter.from({
        gl: { vertex: pixiVertexShader, fragment: FRAGMENT_SHADER },
        resources: {
          effectUniforms: {
            uIntensity: { value: params.intensity as number, type: 'f32' },
            uSize:      { value: params.size as number, type: 'f32' },
            uTime:      { value: 0, type: 'f32' },
            uSeed:      { value: Math.random(), type: 'f32' },
          },
        },
      })
    },

    updateUniforms(filter: Filter, params: ParamValues, elapsed: number): void {
      const u = (filter as any).resources?.effectUniforms?.uniforms
      if (!u) return

      u.uIntensity = params.intensity as number
      u.uSize      = params.size as number

      if (params.animated) {
        u.uTime = elapsed / 1000
        u.uSeed = Math.random() // animate seed per-frame for jittering
      }
    },
  },
}
