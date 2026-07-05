import { Filter } from 'pixi.js'
import type { TransitionDefinition } from '../../../types/TransitionDefinition'
import type { ParamValues } from '../../../videoEffects/EffectDefinition'
import { defaultVertexShader } from '../defaultVertexShader'

const fragment = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform float uProgress;
  uniform float uRippleScale;
  uniform float uAmplitude;

  void main(void) {
    vec2 uv = vTextureCoord;

    // Displacement intensity peaks at progress = 0.5
    float distortion = sin(uProgress * 3.14159265);

    // Dynamic wave calculations for water/glass refraction
    float waveX = sin(uv.y * uRippleScale + uProgress * 6.28) * uAmplitude * distortion;
    float waveY = cos(uv.x * uRippleScale + uProgress * 6.28) * uAmplitude * distortion;
    
    vec2 displacedUv = clamp(uv + vec2(waveX, waveY), 0.001, 0.999);

    vec4 fromColor = texture(uFrom, displacedUv);
    vec4 toColor   = texture(uTo, displacedUv);

    // Crossfade under the displacement
    finalColor = mix(fromColor, toColor, uProgress);
  }
`

export const RefractionWarpTransition: TransitionDefinition = {
  id: 'refraction-warp',
  name: 'Refraction Warp',
  category: 'optical-distortion',
  description: 'The incoming clip melts through the outgoing clip via a rippling, glass-like refraction distortion.',
  tags: ['refraction', 'warp', 'distortion', 'melt', 'water'],
  defaultDurationMs: 900,
  params: [
    { key: 'rippleScale', label: 'Ripple Scale', type: 'range', value: 12.0, min: 1.0, max: 20.0, step: 0.5 },
    { key: 'amplitude', label: 'Amplitude', type: 'range', value: 0.05, min: 0.0, max: 0.1, step: 0.005 }
  ],

  create(params: ParamValues): Filter {
    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uRippleScale: { value: params.rippleScale as number ?? 12.0, type: 'f32' },
          uAmplitude: { value: params.amplitude as number ?? 0.05, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uRippleScale = params.rippleScale as number ?? 12.0
      u.uAmplitude = params.amplitude as number ?? 0.05
    }
  }
}
