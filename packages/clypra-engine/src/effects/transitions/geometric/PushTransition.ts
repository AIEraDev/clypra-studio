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
  uniform float uDirection; // 0=left, 1=right, 2=up, 3=down
  uniform float uEasing;    // 0=linear, 1=easeIn, 2=easeOut, 3=easeInOut

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
  
  void main() {
    float t = applyEasing(uProgress, uEasing);
    vec2 uv = vNormalizedCoord;
    
    // Calculate offset based on direction
    vec2 offsetFrom = vec2(0.0);
    vec2 offsetTo = vec2(0.0);
    
    if (uDirection < 0.5) {
      // Push left
      offsetFrom = vec2(-t, 0.0);
      offsetTo = vec2(1.0 - t, 0.0);
    } else if (uDirection < 1.5) {
      // Push right
      offsetFrom = vec2(t, 0.0);
      offsetTo = vec2(-1.0 + t, 0.0);
    } else if (uDirection < 2.5) {
      // Push up
      offsetFrom = vec2(0.0, -t);
      offsetTo = vec2(0.0, 1.0 - t);
    } else {
      // Push down
      offsetFrom = vec2(0.0, t);
      offsetTo = vec2(0.0, -1.0 + t);
    }
    
    vec2 uvFrom = uv + offsetFrom;
    vec2 uvTo = uv + offsetTo;
    
    vec4 color;
    
    // Check which clip is visible at this UV coordinate
    if (uvFrom.x >= 0.0 && uvFrom.x <= 1.0 && uvFrom.y >= 0.0 && uvFrom.y <= 1.0) {
      color = texture(uFrom, uvFrom);
    } else if (uvTo.x >= 0.0 && uvTo.x <= 1.0 && uvTo.y >= 0.0 && uvTo.y <= 1.0) {
      color = texture(uTo, uvTo);
    } else {
      color = vec4(0.0, 0.0, 0.0, 1.0);
    }
    
    finalColor = color;
  }
`

export const PushTransition: TransitionDefinition = {
  id: 'push',
  name: 'Push',
  category: 'geometric',
  description: 'One clip pushes the other off screen in a configurable direction.',
  tags: ['push', 'slide', 'spatial', 'directional'],
  defaultDurationMs: 800,
  params: [
    { key: 'direction', label: 'Direction', type: 'select', value: 'left', options: ['left', 'right', 'up', 'down'] },
    { key: 'easing', label: 'Easing', type: 'select', value: 'easeInOut', options: ['linear', 'easeIn', 'easeOut', 'easeInOut'] }
  ],

  create(params: ParamValues): Filter {
    const dirStr = params.direction as string || 'left'
    const dirVal = dirStr === 'left' ? 0.0 : dirStr === 'right' ? 1.0 : dirStr === 'up' ? 2.0 : 3.0
    const easeStr = params.easing as string || 'easeInOut'
    const easeVal = easeStr === 'linear' ? 0.0 : easeStr === 'easeIn' ? 1.0 : easeStr === 'easeOut' ? 2.0 : 3.0

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uDirection: { value: dirVal, type: 'f32' },
          uEasing: { value: easeVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      const dirStr = params.direction as string || 'left'
      u.uDirection = dirStr === 'left' ? 0.0 : dirStr === 'right' ? 1.0 : dirStr === 'up' ? 2.0 : 3.0
      const easeStr = params.easing as string || 'easeInOut'
      u.uEasing = easeStr === 'linear' ? 0.0 : easeStr === 'easeIn' ? 1.0 : easeStr === 'easeOut' ? 2.0 : 3.0
    }
  }
}
