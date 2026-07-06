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
  uniform float uSoftness;
  uniform float uInvert;
  uniform float uGradient; // 0=horizontal, 1=vertical, 2=diagonal, 3=radial, 4=noise
  uniform float uEasing;

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
  
  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  float getGradient(vec2 uv, float gradientType) {
    if (gradientType < 0.5) {
      return uv.x;
    } else if (gradientType < 1.5) {
      return uv.y;
    } else if (gradientType < 2.5) {
      return (uv.x + uv.y) * 0.5;
    } else if (gradientType < 3.5) {
      vec2 center = vec2(0.5, 0.5);
      return length(uv - center) * 1.414; // normalize to 0-1
    } else {
      return rand(floor(uv * 20.0) / 20.0);
    }
  }
  
  void main(void) {
    vec2 uv = vNormalizedCoord;
    float t = applyEasing(uProgress, uEasing);
    
    float gradient = getGradient(uv, uGradient);
    
    if (uInvert > 0.5) {
      gradient = 1.0 - gradient;
    }
    
    // Scale threshold map to range [0.0 - softness, 1.0 + softness] to ensure complete wipe
    float mappedThreshold = mix(-uSoftness, 1.0 + uSoftness, t);
    
    float lower = mappedThreshold - uSoftness;
    float upper = mappedThreshold + uSoftness;
    
    float mask = smoothstep(lower, upper, gradient);
    
    vec4 colorA = texture(uFrom, uv);
    vec4 colorB = texture(uTo, uv);
    
    finalColor = mix(colorA, colorB, mask);
  }
`

export const LumaWipeTransition: TransitionDefinition = {
  id: 'luma-wipe',
  name: 'Luma Wipe',
  category: 'light-based',
  description: 'Transitions between clips based on luminance threshold using a directional, radial, or noise gradient.',
  tags: ['wipe', 'luma', 'mask', 'reveal', 'gradient'],
  defaultDurationMs: 800,
  params: [
    { key: 'gradient', label: 'Gradient Type', type: 'select', value: 'diagonal', options: ['horizontal', 'vertical', 'diagonal', 'radial', 'noise'] },
    { key: 'softness', label: 'Softness', type: 'range', value: 0.1, min: 0.0, max: 0.5, step: 0.01 },
    { key: 'invert', label: 'Invert', type: 'toggle', value: false },
    { key: 'easing', label: 'Easing', type: 'select', value: 'linear', options: ['linear', 'easeIn', 'easeOut', 'easeInOut'] }
  ],

  create(params: ParamValues): Filter {
    const gradStr = params.gradient as string || 'diagonal'
    const gradVal = gradStr === 'horizontal' ? 0.0 : gradStr === 'vertical' ? 1.0 : gradStr === 'diagonal' ? 2.0 : gradStr === 'radial' ? 3.0 : 4.0
    const easeStr = params.easing as string || 'linear'
    const easeVal = easeStr === 'linear' ? 0.0 : easeStr === 'easeIn' ? 1.0 : easeStr === 'easeOut' ? 2.0 : 3.0
    const invertVal = (params.invert as boolean ?? false) ? 1.0 : 0.0

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uSoftness: { value: params.softness as number ?? 0.1, type: 'f32' },
          uInvert: { value: invertVal, type: 'f32' },
          uGradient: { value: gradVal, type: 'f32' },
          uEasing: { value: easeVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uSoftness = params.softness as number ?? 0.1
      u.uInvert = (params.invert as boolean ?? false) ? 1.0 : 0.0
      const gradStr = params.gradient as string || 'diagonal'
      u.uGradient = gradStr === 'horizontal' ? 0.0 : gradStr === 'vertical' ? 1.0 : gradStr === 'diagonal' ? 2.0 : gradStr === 'radial' ? 3.0 : 4.0
      const easeStr = params.easing as string || 'linear'
      u.uEasing = easeStr === 'linear' ? 0.0 : easeStr === 'easeIn' ? 1.0 : easeStr === 'easeOut' ? 2.0 : 3.0
    }
  }
}
