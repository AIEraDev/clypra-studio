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
  uniform float uFlashRate;
  uniform float uUseFlashColor;
  uniform vec3 uFlashColor;

  void main(void) {
    vec2 uv = vTextureCoord;
    
    // Flash rate accelerates as progress goes 0 -> 1
    float currentRate = mix(4.0, uFlashRate, uProgress);
    
    // Calculate strobe state: 0.0 or 1.0
    float strobeVal = fract(uProgress * currentRate * 3.0);
    float choice = step(strobeVal, 0.5);

    vec4 fromColor = texture(uFrom, uv);
    vec4 toColor   = texture(uTo, uv);

    // Hard cut/switch based on strobe choice
    // But as progress approaches 1.0, we lean more towards toColor
    float blendVal = mix(choice, 1.0, uProgress * uProgress);
    vec4 baseColor = mix(fromColor, toColor, step(0.5, blendVal));

    if (uUseFlashColor > 0.5) {
      // Flash glow intensity spikes at strobe peaks
      float flashGlow = sin(strobeVal * 3.14159) * (1.0 - abs(uProgress - 0.5) * 2.0);
      baseColor = mix(baseColor, vec4(uFlashColor, 1.0), flashGlow * 0.5);
    }

    finalColor = baseColor;
  }
`

const hexToVec3 = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

export const StrobeCutTransition: TransitionDefinition = {
  id: 'strobe-cut',
  name: 'Strobe Cut',
  category: 'temporal',
  description: 'Rapidly strobes between outgoing and incoming clips at an accelerating rate with optional color flashes.',
  tags: ['temporal', 'strobe', 'flash', 'cut', 'rhythm'],
  defaultDurationMs: 400, // Accelerating strobe cut works best in short duration
  params: [
    { key: 'flashRate', label: 'Flash Rate', type: 'range', value: 12.0, min: 4.0, max: 24.0, step: 1.0 },
    { key: 'useFlashColor', label: 'Use Flash Color', type: 'toggle', value: true },
    { key: 'flashColor', label: 'Flash Color', type: 'color', value: '#FFFFFF' }
  ],

  create(params: ParamValues): Filter {
    const useColor = (params.useFlashColor as boolean ?? true) ? 1.0 : 0.0
    const colorHex = params.flashColor as string ?? '#FFFFFF'
    const colorVal = hexToVec3(colorHex)

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uFlashRate: { value: params.flashRate as number ?? 12.0, type: 'f32' },
          uUseFlashColor: { value: useColor, type: 'f32' },
          uFlashColor: { value: colorVal, type: 'vec3<f32>' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uFlashRate = params.flashRate as number ?? 12.0
      u.uUseFlashColor = (params.useFlashColor as boolean ?? true) ? 1.0 : 0.0
      const colorHex = params.flashColor as string ?? '#FFFFFF'
      u.uFlashColor = hexToVec3(colorHex)
    }
  }
}
