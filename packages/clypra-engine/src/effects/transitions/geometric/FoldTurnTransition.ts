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
  uniform float uFoldDirection; // 0=left, 1=right, 2=top, 3=bottom
  uniform float uShadowIntensity;

  void main(void) {
    vec2 uv = vNormalizedCoord;
    vec4 toColor   = texture(uTo, uv);

    vec4 color = toColor; // Default to incoming showing behind
    float shadow = 0.0;

    if (uFoldDirection < 0.5) {
      // Left
      float split = 1.0 - uProgress;
      if (uv.x < split) {
        vec2 foldUv = vec2(uv.x / max(split, 0.001), uv.y);
        color = texture(uFrom, foldUv);
        shadow = smoothstep(split - 0.1, split, uv.x) * uShadowIntensity;
        color.rgb = mix(color.rgb, vec3(0.0), shadow);
      }
    } else if (uFoldDirection < 1.5) {
      // Right
      float split = uProgress;
      if (uv.x > split) {
        vec2 foldUv = vec2((uv.x - split) / max(1.0 - split, 0.001), uv.y);
        color = texture(uFrom, foldUv);
        shadow = smoothstep(split + 0.1, split, uv.x) * uShadowIntensity;
        color.rgb = mix(color.rgb, vec3(0.0), shadow);
      }
    } else if (uFoldDirection < 2.5) {
      // Top
      float split = 1.0 - uProgress;
      if (uv.y < split) {
        vec2 foldUv = vec2(uv.x, uv.y / max(split, 0.001));
        color = texture(uFrom, foldUv);
        shadow = smoothstep(split - 0.1, split, uv.y) * uShadowIntensity;
        color.rgb = mix(color.rgb, vec3(0.0), shadow);
      }
    } else {
      // Bottom
      float split = uProgress;
      if (uv.y > split) {
        vec2 foldUv = vec2(uv.x, (uv.y - split) / max(1.0 - split, 0.001));
        color = texture(uFrom, foldUv);
        shadow = smoothstep(split + 0.1, split, uv.y) * uShadowIntensity;
        color.rgb = mix(color.rgb, vec3(0.0), shadow);
      }
    }

    finalColor = color;
  }
`

export const FoldTurnTransition: TransitionDefinition = {
  id: 'fold-turn',
  name: 'Fold Turn',
  category: 'geometric',
  description: 'The outgoing clip skews away like a folding page, revealing the incoming clip with edge shadow depth.',
  tags: ['page', 'fold', 'geometric', 'skew', 'depth'],
  defaultDurationMs: 900,
  params: [
    { key: 'foldDirection', label: 'Fold Direction', type: 'select', value: 'left', options: ['left', 'right', 'top', 'bottom'] },
    { key: 'shadowIntensity', label: 'Shadow Intensity', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 }
  ],

  create(params: ParamValues): Filter {
    const dirStr = params.foldDirection as string || 'left'
    const dirVal = dirStr === 'left' ? 0.0 : dirStr === 'right' ? 1.0 : dirStr === 'top' ? 2.0 : 3.0
    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uFoldDirection: { value: dirVal, type: 'f32' },
          uShadowIntensity: { value: params.shadowIntensity as number ?? 0.5, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      const dirStr = params.foldDirection as string || 'left'
      u.uFoldDirection = dirStr === 'left' ? 0.0 : dirStr === 'right' ? 1.0 : dirStr === 'top' ? 2.0 : 3.0
      u.uShadowIntensity = params.shadowIntensity as number ?? 0.5
    }
  }
}
