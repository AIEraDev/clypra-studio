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
  uniform float uBandWidth;
  uniform float uAngle; // in degrees
  uniform vec3 uLeakColor;

  void main(void) {
    vec2 uv = vNormalizedCoord;

    // Convert angle to radians
    float rad = uAngle * 3.14159265 / 180.0;
    
    // Project UV onto the sweep axis
    vec2 dir = vec2(cos(rad), sin(rad));
    float linePos = dot(uv - vec2(0.5), dir) + 0.5;

    // Map sweep center position to sweep completely off edges
    float sweepCenter = mix(-uBandWidth, 1.0 + uBandWidth, uProgress);
    float dist = linePos - sweepCenter;

    // Wipe mask (0.0 = incoming, 1.0 = outgoing)
    float mask = smoothstep(-uBandWidth * 0.5, uBandWidth * 0.5, dist);

    // Light leak glow band centered at the sweep line
    float glow = smoothstep(uBandWidth, 0.0, abs(dist));

    vec4 fromColor = texture(uFrom, uv);
    vec4 toColor   = texture(uTo, uv);

    vec4 baseColor = mix(toColor, fromColor, mask);
    
    // Additive warm light leak sweep glow
    finalColor = vec4(clamp(baseColor.rgb + uLeakColor * glow * 1.3, 0.0, 1.0), baseColor.a);
  }
`

const hexToVec3 = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

export const LightLeakSweepTransition: TransitionDefinition = {
  id: 'light-leak-sweep',
  name: 'Light Leak Sweep',
  category: 'light-based',
  description: 'A warm light leak sweeps across the frame, wiping the outgoing clip into the incoming clip under the glow.',
  tags: ['light', 'leak', 'sweep', 'glow', 'warm'],
  defaultDurationMs: 900,
  params: [
    { key: 'leakColor', label: 'Leak Color', type: 'color', value: '#FF9E3B' }, // Warm amber
    { key: 'bandWidth', label: 'Band Width', type: 'range', value: 0.3, min: 0.1, max: 0.5, step: 0.01 },
    { key: 'angle', label: 'Sweep Angle', type: 'range', value: 45.0, min: 0.0, max: 90.0, step: 1.0 }
  ],

  create(params: ParamValues): Filter {
    const colorHex = params.leakColor as string ?? '#FF9E3B'
    const colorVal = hexToVec3(colorHex)

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uBandWidth: { value: params.bandWidth as number ?? 0.3, type: 'f32' },
          uAngle: { value: params.angle as number ?? 45.0, type: 'f32' },
          uLeakColor: { value: colorVal, type: 'vec3<f32>' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uBandWidth = params.bandWidth as number ?? 0.3
      u.uAngle = params.angle as number ?? 45.0
      const colorHex = params.leakColor as string ?? '#FF9E3B'
      u.uLeakColor = hexToVec3(colorHex)
    }
  }
}
