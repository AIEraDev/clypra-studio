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
  uniform float uBandCount;
  uniform float uParallaxStrength;
  uniform float uStaggerDelay;

  void main() {
    vec2 uv = vNormalizedCoord;
    
    // Determine which horizontal band this pixel belongs to
    float bandIndex = floor(uv.y * uBandCount);
    
    // Stagger progress per band
    float delay = bandIndex * uStaggerDelay;
    float maxDelay = (uBandCount - 1.0) * uStaggerDelay;
    float denom = max(1.0 - maxDelay, 0.01);
    float t = clamp((uProgress - delay) / denom, 0.0, 1.0);
    
    // Parallax speed based on band index
    float speed = 1.0 + bandIndex * uParallaxStrength;
    
    // Shift horizontally. We shift left (adding offset to UV)
    float offset = t * speed;
    vec2 uvFrom = uv + vec2(offset, 0.0);
    
    vec4 color;
    if (uvFrom.x >= 0.0 && uvFrom.x <= 1.0) {
      color = texture(uFrom, uvFrom);
    } else {
      // Reveal the incoming clip static underneath in the gaps
      color = texture(uTo, uv);
    }
    
    finalColor = color;
  }
`

export const ParallaxLayerSplitTransition: TransitionDefinition = {
  id: 'parallax-layer-split',
  name: 'Parallax Layer Split',
  category: 'depth-based',
  description: 'Splits the frame into staggered horizontal strips shifting at different speeds to reveal the next clip.',
  tags: ['depth', 'slide', 'stagger', 'parallax'],
  defaultDurationMs: 1000,
  params: [
    { key: 'bandCount', label: 'Band Count', type: 'range', value: 3, min: 2, max: 5, step: 1.0 },
    { key: 'parallaxStrength', label: 'Parallax Strength', type: 'range', value: 0.5, min: 0.2, max: 1.0, step: 0.05 },
    { key: 'staggerDelay', label: 'Stagger Delay', type: 'range', value: 0.1, min: 0.0, max: 0.3, step: 0.05 }
  ],

  create(params: ParamValues): Filter {
    const bandVal = params.bandCount as number ?? 3.0
    const strengthVal = params.parallaxStrength as number ?? 0.5
    const delayVal = params.staggerDelay as number ?? 0.1

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uBandCount: { value: bandVal, type: 'f32' },
          uParallaxStrength: { value: strengthVal, type: 'f32' },
          uStaggerDelay: { value: delayVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uBandCount = params.bandCount as number ?? 3.0
      u.uParallaxStrength = params.parallaxStrength as number ?? 0.5
      u.uStaggerDelay = params.staggerDelay as number ?? 0.1
    }
  }
}
