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
  uniform float uDirection; // 0=horizontal, 1=vertical, 2=diagonal
  uniform float uNoiseScale;
  uniform float uEdgeSharpness;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main(void) {
    vec2 uv = vTextureCoord;
    
    // Directional gradient
    float grad = 0.0;
    if (uDirection < 0.5) {
      grad = uv.x;
    } else if (uDirection < 1.5) {
      grad = uv.y;
    } else {
      grad = (uv.x + uv.y) * 0.5;
    }
    
    // Pixelated noise map
    float noiseVal = hash(floor(uv * uNoiseScale));
    
    // Combine gradient and noise
    float value = grad + (noiseVal - 0.5) * 0.3;
    
    // Map progress from 0.0 -> 1.3 to ensure clean complete state at both ends
    float progressMapped = uProgress * 1.3;
    
    // Sharpness control
    float width = 0.2 * (1.0 - uEdgeSharpness) + 0.001;
    float alpha = smoothstep(progressMapped - width, progressMapped + width, value);
    
    vec4 fromColor = texture(uFrom, uv);
    vec4 toColor   = texture(uTo, uv);
    
    finalColor = mix(toColor, fromColor, alpha);
  }
`

export const DirectionalDissolveTransition: TransitionDefinition = {
  id: 'directional-dissolve',
  name: 'Directional Dissolve',
  category: 'particle-dissolve',
  description: 'Dissolves outgoing clip into incoming clip using a noise threshold that sweeps in a specified direction.',
  tags: ['particle', 'dissolve', 'noise', 'sweep', 'wave'],
  defaultDurationMs: 900,
  params: [
    { key: 'direction', label: 'Direction', type: 'select', value: 'horizontal', options: ['horizontal', 'vertical', 'diagonal'] },
    { key: 'noiseScale', label: 'Noise Scale', type: 'range', value: 15.0, min: 1.0, max: 30.0, step: 1.0 },
    { key: 'edgeSharpness', label: 'Edge Sharpness', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 }
  ],

  create(params: ParamValues): Filter {
    const dirStr = params.direction as string || 'horizontal'
    const dirVal = dirStr === 'horizontal' ? 0.0 : dirStr === 'vertical' ? 1.0 : 2.0

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uDirection: { value: dirVal, type: 'f32' },
          uNoiseScale: { value: params.noiseScale as number ?? 15.0, type: 'f32' },
          uEdgeSharpness: { value: params.edgeSharpness as number ?? 0.5, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      const dirStr = params.direction as string || 'horizontal'
      u.uDirection = dirStr === 'horizontal' ? 0.0 : dirStr === 'vertical' ? 1.0 : 2.0
      u.uNoiseScale = params.noiseScale as number ?? 15.0
      u.uEdgeSharpness = params.edgeSharpness as number ?? 0.5
    }
  }
}
