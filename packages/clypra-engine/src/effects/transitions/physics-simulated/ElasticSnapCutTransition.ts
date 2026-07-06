import { Filter } from 'pixi.js'
import type { TransitionDefinition } from '../../../types/TransitionDefinition'
import type { ParamValues } from '../../../videoEffects/EffectDefinition'
import { defaultVertexShader } from '../defaultVertexShader'

const fragment = `
  in vec2 vNormalizedCoord;
  out vec4 finalColor;

  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform float uProgress;
  uniform float uAmplitude;
  uniform float uDamping;
  uniform float uFrequency;

  #define TWO_PI 6.28318530718

  void main() {
    float t = uProgress;
    vec4 color;
    
    // Snap to the incoming clip at the end of the transition (progress >= 0.99)
    if (t >= 0.99) {
      color = texture(uTo, vNormalizedCoord);
    } else {
      // Damped harmonic oscillation curve
      float scale = 1.0 + uAmplitude * exp(-uDamping * t) * sin(uFrequency * t * TWO_PI);
      
      // Squash and stretch relative to center (preserving volume/area)
      float scaleX = scale;
      float scaleY = 2.0 - scale;
      
      vec2 center = vec2(0.5);
      vec2 uv = (vNormalizedCoord - center) / vec2(scaleX, scaleY) + center;
      
      if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        color = texture(uFrom, uv);
      } else {
        // Fallback to black for out-of-bounds UV coordinates
        color = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
    
    finalColor = color;
  }
`

export const ElasticSnapCutTransition: TransitionDefinition = {
  id: 'elastic-snap-cut',
  name: 'Elastic Snap Cut',
  category: 'physics-simulated',
  description: 'Squashes and stretches the outgoing clip under spring-dampener physics before snapping to a clean cut.',
  tags: ['physics', 'stretch', 'bounce', 'spring'],
  defaultDurationMs: 800,
  params: [
    { key: 'amplitude', label: 'Amplitude', type: 'range', value: 0.15, min: 0.05, max: 0.3, step: 0.01 },
    { key: 'damping', label: 'Damping', type: 'range', value: 4.0, min: 1.0, max: 8.0, step: 0.1 },
    { key: 'frequency', label: 'Frequency', type: 'range', value: 5.0, min: 2.0, max: 10.0, step: 0.5 }
  ],

  create(params: ParamValues): Filter {
    const ampVal = params.amplitude as number ?? 0.15
    const dampVal = params.damping as number ?? 4.0
    const freqVal = params.frequency as number ?? 5.0

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uAmplitude: { value: ampVal, type: 'f32' },
          uDamping: { value: dampVal, type: 'f32' },
          uFrequency: { value: freqVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uAmplitude = params.amplitude as number ?? 0.15
      u.uDamping = params.damping as number ?? 4.0
      u.uFrequency = params.frequency as number ?? 5.0
    }
  }
}
