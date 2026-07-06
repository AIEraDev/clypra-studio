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
  uniform float uDirection; // 0=in, 1=out
  uniform float uIntensity;
  uniform float uEasing;
  uniform float uBlur;

  // Easing functions
  float easeIn(float t) {
    return t * t;
  }
  
  float easeOut(float t) {
    return t * (2.0 - t);
  }
  
  float easeInOut(float t) {
    return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
  }
  
  float applyEasing(float t, float easingType) {
    if (easingType < 0.5) return t; // linear
    if (easingType < 1.5) return easeIn(t);
    if (easingType < 2.5) return easeOut(t);
    return easeInOut(t);
  }
  
  vec4 sampleWithBlur(sampler2D tex, vec2 uv, float blurAmount) {
    if (uBlur < 0.5 || blurAmount < 0.01) {
      return texture(tex, uv);
    }
    
    // Simple 5-tap blur
    vec4 color = vec4(0.0);
    float offset = blurAmount * 0.01;
    
    color += texture(tex, uv) * 0.4;
    color += texture(tex, uv + vec2(offset, 0.0)) * 0.15;
    color += texture(tex, uv - vec2(offset, 0.0)) * 0.15;
    color += texture(tex, uv + vec2(0.0, offset)) * 0.15;
    color += texture(tex, uv - vec2(0.0, offset)) * 0.15;
    
    return color;
  }
  
  void main() {
    float t = applyEasing(uProgress, uEasing);
    vec2 center = vec2(0.5, 0.5);
    
    // Calculate zoom scales
    float scaleA, scaleB;
    
    if (uDirection < 0.5) {
      // Zoom in: A shrinks, B grows from small
      scaleA = 1.0 + t * uIntensity;
      scaleB = 1.0 - (1.0 - t) * uIntensity;
    } else {
      // Zoom out: A grows, B shrinks to small
      scaleA = 1.0 - t * uIntensity * 0.5;
      scaleB = 1.0 + (1.0 - t) * uIntensity;
    }
    
    // Apply zoom
    vec2 uvA = (vNormalizedCoord - center) / scaleA + center;
    vec2 uvB = (vNormalizedCoord - center) / scaleB + center;
    
    // Blur amount based on zoom speed
    float blurAmountA = abs(scaleA - 1.0) * 2.0;
    float blurAmountB = abs(scaleB - 1.0) * 2.0;
    
    // Sample with optional blur
    vec4 colorA = sampleWithBlur(uFrom, uvA, blurAmountA);
    vec4 colorB = sampleWithBlur(uTo, uvB, blurAmountB);
    
    // Handle out-of-bounds UVs
    if (uvA.x < 0.0 || uvA.x > 1.0 || uvA.y < 0.0 || uvA.y > 1.0) {
      colorA = vec4(0.0);
    }
    if (uvB.x < 0.0 || uvB.x > 1.0 || uvB.y < 0.0 || uvB.y > 1.0) {
      colorB = vec4(0.0);
    }
    
    // Blend
    finalColor = mix(colorA, colorB, t);
  }
`

export const ZoomTransition: TransitionDefinition = {
  id: 'zoom',
  name: 'Zoom',
  category: 'optical-distortion',
  description: 'Zoom in or out while transitioning between clips with dynamic scaling and motion blur.',
  tags: ['zoom', 'scale', 'dynamic', 'motion'],
  defaultDurationMs: 800,
  params: [
    { key: 'direction', label: 'Direction', type: 'select', value: 'in', options: ['in', 'out'] },
    { key: 'intensity', label: 'Intensity', type: 'range', value: 0.5, min: 0.0, max: 2.0, step: 0.1 },
    { key: 'easing', label: 'Easing', type: 'select', value: 'easeInOut', options: ['linear', 'easeIn', 'easeOut', 'easeInOut'] },
    { key: 'blur', label: 'Motion Blur', type: 'toggle', value: true }
  ],

  create(params: ParamValues): Filter {
    const dirStr = params.direction as string || 'in'
    const dirVal = dirStr === 'in' ? 0.0 : 1.0
    const easeStr = params.easing as string || 'easeInOut'
    const easeVal = easeStr === 'linear' ? 0.0 : easeStr === 'easeIn' ? 1.0 : easeStr === 'easeOut' ? 2.0 : 3.0
    const blurVal = (params.blur as boolean ?? true) ? 1.0 : 0.0

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uDirection: { value: dirVal, type: 'f32' },
          uIntensity: { value: params.intensity as number ?? 0.5, type: 'f32' },
          uEasing: { value: easeVal, type: 'f32' },
          uBlur: { value: blurVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      const dirStr = params.direction as string || 'in'
      u.uDirection = dirStr === 'in' ? 0.0 : 1.0
      u.uIntensity = params.intensity as number ?? 0.5
      const easeStr = params.easing as string || 'easeInOut'
      u.uEasing = easeStr === 'linear' ? 0.0 : easeStr === 'easeIn' ? 1.0 : easeStr === 'easeOut' ? 2.0 : 3.0
      u.uBlur = (params.blur as boolean ?? true) ? 1.0 : 0.0
    }
  }
}
