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
  uniform float uMaxBlur;
  uniform float uFocusOffset;

  #define PI 3.14159265359

  // Smooth 8-tap single-pass blur mimicking Kawase blur
  vec4 sampleBlur(sampler2D tex, vec2 uv, float blurAmount) {
    if (blurAmount < 0.1) {
      return texture(tex, uv);
    }
    
    vec4 sum = vec4(0.0);
    float offset = blurAmount * 0.0008; 
    
    // First ring
    sum += texture(tex, uv + vec2(-1.0, -1.0) * offset) * 0.125;
    sum += texture(tex, uv + vec2(1.0, -1.0) * offset) * 0.125;
    sum += texture(tex, uv + vec2(-1.0, 1.0) * offset) * 0.125;
    sum += texture(tex, uv + vec2(1.0, 1.0) * offset) * 0.125;
    
    // Second ring (simulating deeper multi-pass blur offsets)
    float offset2 = offset * 2.0;
    sum += texture(tex, uv + vec2(-1.5, 0.0) * offset2) * 0.125;
    sum += texture(tex, uv + vec2(1.5, 0.0) * offset2) * 0.125;
    sum += texture(tex, uv + vec2(0.0, -1.5) * offset2) * 0.125;
    sum += texture(tex, uv + vec2(0.0, 1.5) * offset2) * 0.125;
    
    return sum;
  }

  void main() {
    // Offset the bell curves for each clip to break symmetry and shift the focus peak
    float tFrom = clamp(uProgress + uFocusOffset, 0.0, 1.0);
    float tTo = clamp(uProgress - uFocusOffset, 0.0, 1.0);
    
    float blurFrom = uMaxBlur * sin(tFrom * PI);
    float blurTo = uMaxBlur * sin(tTo * PI);
    
    vec2 uv = vNormalizedCoord;
    
    vec4 colorFrom = sampleBlur(uFrom, uv, blurFrom);
    vec4 colorTo = sampleBlur(uTo, uv, blurTo);
    
    // Smooth crossfade underneath the blur
    finalColor = mix(colorFrom, colorTo, uProgress);
  }
`

export const RackFocusBlendTransition: TransitionDefinition = {
  id: 'rack-focus-blend',
  name: 'Rack Focus Blend',
  category: 'depth-based',
  description: 'Defocuses the outgoing clip and sharpens the incoming clip, shifting the focal plane near the midpoint.',
  tags: ['depth', 'blur', 'lens', 'focus'],
  defaultDurationMs: 1200,
  params: [
    { key: 'maxBlur', label: 'Max Blur', type: 'range', value: 12, min: 4, max: 24, step: 1.0 },
    { key: 'focusOffset', label: 'Focus Offset', type: 'range', value: 0.0, min: -0.3, max: 0.3, step: 0.05 }
  ],

  create(params: ParamValues): Filter {
    const maxBlurVal = params.maxBlur as number ?? 12.0
    const offsetVal = params.focusOffset as number ?? 0.0

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uMaxBlur: { value: maxBlurVal, type: 'f32' },
          uFocusOffset: { value: offsetVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uMaxBlur = params.maxBlur as number ?? 12.0
      u.uFocusOffset = params.focusOffset as number ?? 0.0
    }
  }
}
