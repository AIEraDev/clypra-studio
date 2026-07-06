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
  uniform float uEasing;
  uniform vec3 uFadeColor;
  uniform float uUseFadeColor;

  float easeIn(float t) {
    return t * t;
  }
  
  float easeOut(float t) {
    return t * (2.0 - t);
  }
  
  float easeInOut(float t) {
    return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
  }
  
  float smoothStepEase(float t) {
    return t * t * (3.0 - 2.0 * t);
  }
  
  float applyEasing(float t, float easingType) {
    if (easingType < 0.5) return t; // linear
    if (easingType < 1.5) return easeIn(t);
    if (easingType < 2.5) return easeOut(t);
    if (easingType < 3.5) return easeInOut(t);
    return smoothStepEase(t);
  }

  void main(void) {
    vec2 uv = vNormalizedCoord;
    float t = applyEasing(uProgress, uEasing);

    vec4 colorA = texture(uFrom, uv);
    vec4 colorB = texture(uTo, uv);
    vec4 result;

    if (uUseFadeColor > 0.5) {
      if (t < 0.5) {
        float fadeOut = t * 2.0;
        result = mix(colorA, vec4(uFadeColor, 1.0), fadeOut);
      } else {
        float fadeIn = (t - 0.5) * 2.0;
        result = mix(vec4(uFadeColor, 1.0), colorB, fadeIn);
      }
    } else {
      result = mix(colorA, colorB, t);
    }

    finalColor = result;
  }
`

const hexToVec3 = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

export const CrossDissolveTransition: TransitionDefinition = {
  id: 'cross-dissolve',
  name: 'Cross Dissolve',
  category: 'particle-dissolve',
  description: 'Classic fade between two clips with alpha blending or optional solid color dip.',
  tags: ['transition', 'blend', 'dissolve', 'fade', 'alpha'],
  defaultDurationMs: 800,
  params: [
    { key: 'easing', label: 'Easing', type: 'select', value: 'linear', options: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'smoothstep'] },
    { key: 'useFadeColor', label: 'Fade Through Color', type: 'toggle', value: false },
    { key: 'fadeColor', label: 'Fade Color', type: 'color', value: '#000000' }
  ],

  create(params: ParamValues): Filter {
    const easeStr = params.easing as string || 'linear'
    const easeVal = easeStr === 'linear' ? 0.0 : easeStr === 'easeIn' ? 1.0 : easeStr === 'easeOut' ? 2.0 : easeStr === 'easeInOut' ? 3.0 : 4.0
    const useFadeVal = (params.useFadeColor as boolean ?? false) ? 1.0 : 0.0
    const colorHex = params.fadeColor as string ?? '#000000'
    const colorVal = hexToVec3(colorHex)

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uEasing: { value: easeVal, type: 'f32' },
          uUseFadeColor: { value: useFadeVal, type: 'f32' },
          uFadeColor: { value: colorVal, type: 'vec3<f32>' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      const easeStr = params.easing as string || 'linear'
      u.uEasing = easeStr === 'linear' ? 0.0 : easeStr === 'easeIn' ? 1.0 : easeStr === 'easeOut' ? 2.0 : easeStr === 'easeInOut' ? 3.0 : 4.0
      u.uUseFadeColor = (params.useFadeColor as boolean ?? false) ? 1.0 : 0.0
      const colorHex = params.fadeColor as string ?? '#000000'
      u.uFadeColor = hexToVec3(colorHex)
    }
  }
}
