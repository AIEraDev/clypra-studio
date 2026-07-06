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
  uniform float uDepthCurve;      // 0=linear, 1=ease-in, 2=ease-out
  uniform float uAtmosphericFade; // 0 to 1

  float applyDepthCurve(float t, float curveType) {
    if (curveType < 0.5) return t; // linear
    if (curveType < 1.5) return t * t; // ease-in
    return t * (2.0 - t); // ease-out
  }

  void main() {
    float t = applyDepthCurve(uProgress, uDepthCurve);
    
    // uTo scales from 0.3 to 1.0 (dolly in towards uTo)
    float scaleTo = 0.3 + 0.7 * t;
    // uFrom scales from 1.0 to 1.4 (zooms past the camera)
    float scaleFrom = 1.0 + 0.4 * t;
    
    vec2 center = vec2(0.5);
    vec2 uvTo = (vNormalizedCoord - center) / scaleTo + center;
    vec2 uvFrom = (vNormalizedCoord - center) / scaleFrom + center;
    
    bool inTo = (uvTo.x >= 0.0 && uvTo.x <= 1.0 && uvTo.y >= 0.0 && uvTo.y <= 1.0);
    bool inFrom = (uvFrom.x >= 0.0 && uvFrom.x <= 1.0 && uvFrom.y >= 0.0 && uvFrom.y <= 1.0);
    
    vec4 colorFrom = vec4(0.0);
    if (inFrom) {
      colorFrom = texture(uFrom, uvFrom);
      // Darken the receding clip to simulate atmospheric/physical depth
      colorFrom.rgb *= (1.0 - t * uAtmosphericFade);
    }
    
    vec4 colorTo = vec4(0.0);
    if (inTo) {
      colorTo = texture(uTo, uvTo);
    }
    
    vec4 color;
    if (inTo) {
      // uTo is layered on top, blending in as progress increases
      color = mix(colorFrom, colorTo, t);
    } else {
      // Outside uTo bounds, show the fading uFrom
      color = colorFrom * (1.0 - t);
    }
    
    finalColor = color;
  }
`

export const DepthPushTransition: TransitionDefinition = {
  id: 'depth-push',
  name: 'Depth Push',
  category: 'depth-based',
  description: 'The incoming clip grows and brightens from deep space while the outgoing clip scales up and recedes.',
  tags: ['depth', 'dolly', '3d', 'scale'],
  defaultDurationMs: 1000,
  params: [
    { key: 'depthCurve', label: 'Depth Curve', type: 'select', value: 'ease-in', options: ['linear', 'ease-in', 'ease-out'] },
    { key: 'atmosphericFade', label: 'Atmospheric Fade', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 }
  ],

  create(params: ParamValues): Filter {
    const curveStr = params.depthCurve as string || 'ease-in'
    const curveVal = curveStr === 'linear' ? 0.0 : curveStr === 'ease-in' ? 1.0 : 2.0
    const fadeVal = params.atmosphericFade as number ?? 0.5

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uDepthCurve: { value: curveVal, type: 'f32' },
          uAtmosphericFade: { value: fadeVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      const curveStr = params.depthCurve as string || 'ease-in'
      u.uDepthCurve = curveStr === 'linear' ? 0.0 : curveStr === 'ease-in' ? 1.0 : 2.0
      u.uAtmosphericFade = params.atmosphericFade as number ?? 0.5
    }
  }
}
