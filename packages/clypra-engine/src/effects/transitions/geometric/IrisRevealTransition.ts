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
  uniform vec2 uCenter;
  uniform float uEdgeSoftness;
  uniform float uShape; // 0 = circle, 1 = square, 2 = hexagon

  float sdCircle(vec2 p, float r) {
    return length(p) - r;
  }

  float sdSquare(vec2 p, float r) {
    vec2 d = abs(p) - r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float sdHexagon(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
  }

  void main(void) {
    vec2 uv = vNormalizedCoord;
    vec4 fromColor = texture(uFrom, uv);
    vec4 toColor   = texture(uTo, uv);

    vec2 p = uv - uCenter;
    float r = uProgress * 1.0; // Scaled radius to fully cover screen

    float dist = 0.0;
    if (uShape < 0.5) {
      dist = sdCircle(p, r);
    } else if (uShape < 1.5) {
      dist = sdSquare(p, r);
    } else {
      dist = sdHexagon(p, r);
    }

    float mask = smoothstep(uEdgeSoftness, 0.0, dist);
    finalColor = mix(fromColor, toColor, mask);
  }
`

export const IrisRevealTransition: TransitionDefinition = {
  id: 'iris-reveal',
  name: 'Iris Reveal',
  category: 'geometric',
  description: 'A circular, square, or hexagonal mask expands from a center point to reveal the incoming clip.',
  tags: ['mask', 'geometric', 'radial', 'reveal'],
  defaultDurationMs: 800,
  params: [
    { key: 'centerX', label: 'Center X', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.01 },
    { key: 'centerY', label: 'Center Y', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.01 },
    { key: 'edgeSoftness', label: 'Edge Softness', type: 'range', value: 0.05, min: 0.0, max: 0.2, step: 0.01 },
    { key: 'shape', label: 'Shape', type: 'select', value: 'circle', options: ['circle', 'square', 'hexagon'] }
  ],

  create(params: ParamValues): Filter {
    const shapeStr = params.shape as string || 'circle'
    const shapeVal = shapeStr === 'circle' ? 0.0 : shapeStr === 'square' ? 1.0 : 2.0
    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uCenter: { value: [params.centerX as number ?? 0.5, params.centerY as number ?? 0.5], type: 'vec2<f32>' },
          uEdgeSoftness: { value: params.edgeSoftness as number ?? 0.05, type: 'f32' },
          uShape: { value: shapeVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uCenter = [params.centerX as number ?? 0.5, params.centerY as number ?? 0.5]
      u.uEdgeSoftness = params.edgeSoftness as number ?? 0.05
      const shapeStr = params.shape as string || 'circle'
      u.uShape = shapeStr === 'circle' ? 0.0 : shapeStr === 'square' ? 1.0 : 2.0
    }
  }
}
