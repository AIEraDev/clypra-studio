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
  uniform float uStutterCount;
  uniform float uHoldRatio;

  void main(void) {
    vec2 uv = vTextureCoord;
    
    vec4 color;
    
    if (uProgress < uHoldRatio) {
      // Calculate fraction of current stutter step for pulse effects
      float stepProgress = fract(uProgress * uStutterCount / uHoldRatio);
      float shift = sin(stepProgress * 3.14159) * 0.015;
      
      // Sample outgoing clip with chromatic stutter pulse
      float r = texture(uFrom, uv + vec2(shift, 0.0)).r;
      float g = texture(uFrom, uv).g;
      float b = texture(uFrom, uv - vec2(shift, 0.0)).b;
      color = vec4(r, g, b, 1.0);
    } else {
      // Hard cut to incoming clip in the final percentage
      color = texture(uTo, uv);
    }
    
    finalColor = color;
  }
`

export const FrameHoldStutterTransition: TransitionDefinition = {
  id: 'frame-hold-stutter',
  name: 'Frame Hold Stutter',
  category: 'temporal',
  description: 'Freezes and stutters the outgoing clip rhythmically before cutting hard to the incoming clip.',
  tags: ['temporal', 'stutter', 'freeze', 'hold', 'rhythm'],
  defaultDurationMs: 600,
  params: [
    { key: 'stutterCount', label: 'Stutter Count', type: 'range', value: 3.0, min: 2.0, max: 5.0, step: 1.0 },
    { key: 'holdRatio', label: 'Hold Ratio', type: 'range', value: 0.7, min: 0.5, max: 0.9, step: 0.05 }
  ],

  create(params: ParamValues): Filter {
    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uStutterCount: { value: params.stutterCount as number ?? 3.0, type: 'f32' },
          uHoldRatio: { value: params.holdRatio as number ?? 0.7, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      const holdRatio = params.holdRatio as number ?? 0.7
      const stutterCount = params.stutterCount as number ?? 3.0
      
      // Quantize progress to freeze/stutter in steps during the hold window
      let displayProgress = progress
      if (progress < holdRatio) {
        const step = Math.floor(progress * stutterCount / holdRatio) / stutterCount
        displayProgress = step * holdRatio
      }
      
      u.uProgress = displayProgress
      u.uStutterCount = stutterCount
      u.uHoldRatio = holdRatio
    }
  }
}
