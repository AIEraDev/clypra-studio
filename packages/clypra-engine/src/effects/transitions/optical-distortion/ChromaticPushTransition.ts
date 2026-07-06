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
  uniform float uSplitIntensity;

  vec4 sampleChannel(sampler2D texA, sampler2D texB, vec2 baseUv, vec2 pushA, vec2 pushB, vec2 channelShift) {
    vec2 uvA = baseUv + pushA + channelShift;
    vec2 uvB = baseUv + pushB + channelShift;
    
    if (uvA.x >= 0.0 && uvA.x <= 1.0 && uvA.y >= 0.0 && uvA.y <= 1.0) {
      return texture(texA, uvA);
    } else if (uvB.x >= 0.0 && uvB.x <= 1.0 && uvB.y >= 0.0 && uvB.y <= 1.0) {
      return texture(texB, uvB);
    }
    return vec4(0.0, 0.0, 0.0, 1.0);
  }

  void main(void) {
    vec2 uv = vNormalizedCoord;
    
    // Slide/push offset
    vec2 offsetFrom = vec2(0.0);
    vec2 offsetTo = vec2(0.0);
    
    if (uDirection < 0.5) {
      // Left
      offsetFrom = vec2(-uProgress, 0.0);
      offsetTo = vec2(1.0 - uProgress, 0.0);
    } else if (uDirection < 1.5) {
      // Right
      offsetFrom = vec2(uProgress, 0.0);
      offsetTo = vec2(-1.0 + uProgress, 0.0);
    } else if (uDirection < 2.5) {
      // Up
      offsetFrom = vec2(0.0, -uProgress);
      offsetTo = vec2(0.0, 1.0 - uProgress);
    } else {
      // Down
      offsetFrom = vec2(0.0, uProgress);
      offsetTo = vec2(0.0, -1.0 + uProgress);
    }

    // Chromatic split offset (peaks at progress = 0.5)
    float splitOffset = sin(uProgress * 3.14159265) * uSplitIntensity * 0.005;

    float r = sampleChannel(uFrom, uTo, uv, offsetFrom, offsetTo, vec2(splitOffset, 0.0)).r;
    float g = sampleChannel(uFrom, uTo, uv, offsetFrom, offsetTo, vec2(0.0, 0.0)).g;
    float b = sampleChannel(uFrom, uTo, uv, offsetFrom, offsetTo, vec2(-splitOffset, 0.0)).b;
    float a = sampleChannel(uFrom, uTo, uv, offsetFrom, offsetTo, vec2(0.0, 0.0)).a;

    finalColor = vec4(r, g, b, a);
  }
`

export const ChromaticPushTransition: TransitionDefinition = {
  id: 'chromatic-push',
  name: 'Chromatic Push',
  category: 'optical-distortion',
  description: 'A spatial push transition where R/G/B channels split and offset horizontally, peaking mid-transition.',
  tags: ['chromatic', 'push', 'glitch', 'distortion', 'split'],
  defaultDurationMs: 800,
  params: [
    { key: 'direction', label: 'Direction', type: 'select', value: 'left', options: ['left', 'right', 'up', 'down'] },
    { key: 'splitIntensity', label: 'Split Intensity', type: 'range', value: 8.0, min: 0.0, max: 20.0, step: 0.5 }
  ],

  create(params: ParamValues): Filter {
    const dirStr = params.direction as string || 'left'
    const dirVal = dirStr === 'left' ? 0.0 : dirStr === 'right' ? 1.0 : dirStr === 'up' ? 2.0 : 3.0
    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uDirection: { value: dirVal, type: 'f32' },
          uSplitIntensity: { value: params.splitIntensity as number ?? 8.0, type: 'f32' }
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
      u.uSplitIntensity = params.splitIntensity as number ?? 8.0
    }
  }
}
