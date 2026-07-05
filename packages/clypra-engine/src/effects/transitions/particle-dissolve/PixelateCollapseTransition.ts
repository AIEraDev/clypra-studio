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
  uniform float uMaxBlockSize;
  uniform float uSymmetry;
  uniform vec2 uResolution;

  void main(void) {
    vec2 uv = vTextureCoord;
    
    // Calculate bell curve for block size peaking at progress = 0.5
    float bellCurve = 0.0;
    if (uProgress < 0.5) {
      bellCurve = uProgress * 2.0;
    } else {
      // If asymmetric, make B resolve faster (decay speed = 4.0 instead of 2.0)
      float decayFactor = (uSymmetry > 0.5) ? 2.0 : 4.0;
      bellCurve = max(0.0, 1.0 - (uProgress - 0.5) * decayFactor);
    }

    // Determine current pixel block size (1.0 = no pixelation)
    float currentBlockSize = mix(1.0, uMaxBlockSize, bellCurve);

    // Quantize texture coordinates
    vec2 blockResolution = uResolution / currentBlockSize;
    vec2 pixelatedUv = floor(uv * blockResolution) / blockResolution;

    vec4 color;
    if (uProgress < 0.5) {
      color = texture(uFrom, pixelatedUv);
    } else {
      color = texture(uTo, pixelatedUv);
    }

    finalColor = color;
  }
`

export const PixelateCollapseTransition: TransitionDefinition = {
  id: 'pixelate-collapse',
  name: 'Pixelate Collapse',
  category: 'particle-dissolve',
  description: 'The outgoing clip breaks into increasingly large pixel blocks before collapsing into the incoming clip.',
  tags: ['pixelate', 'collapse', 'particle', 'grid', 'pixel'],
  defaultDurationMs: 800,
  params: [
    { key: 'maxBlockSize', label: 'Max Block Size', type: 'range', value: 32.0, min: 8.0, max: 64.0, step: 1.0 },
    { key: 'symmetry', label: 'Symmetric Resolution', type: 'toggle', value: true }
  ],

  create(params: ParamValues): Filter {
    const symmetryVal = (params.symmetry as boolean ?? true) ? 1.0 : 0.0

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uMaxBlockSize: { value: params.maxBlockSize as number ?? 32.0, type: 'f32' },
          uSymmetry: { value: symmetryVal, type: 'f32' },
          uResolution: { value: [1280.0, 720.0], type: 'vec2<f32>' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uMaxBlockSize = params.maxBlockSize as number ?? 32.0
      u.uSymmetry = (params.symmetry as boolean ?? true) ? 1.0 : 0.0
    }
  }
}
