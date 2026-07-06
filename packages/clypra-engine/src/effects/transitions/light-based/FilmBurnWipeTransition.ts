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
  uniform float uIrregularity;
  uniform float uEdgeGlow;
  uniform vec3 uBurnColor;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main(void) {
    vec2 uv = vNormalizedCoord;

    // Procedural layered noise for organic melting outline
    float n = noise(uv * 6.0) * 0.7 + noise(uv * 12.0) * 0.3;
    float burnValue = uv.x + n * uIrregularity * 0.4;

    // Map progress to sweep across the screen completely
    float threshold = uProgress * 1.4;

    // Mask for clean swap (0.0 = burnt/To, 1.0 = normal/From)
    float burnMask = smoothstep(threshold - 0.01, threshold + 0.01, burnValue);

    vec4 fromColor = texture(uFrom, uv);
    vec4 toColor   = texture(uTo, uv);
    vec4 baseColor = mix(toColor, fromColor, burnMask);

    // Glowing border along the melting front
    float edgeThickness = 0.05 * uEdgeGlow + 0.001;
    float edgeVal = abs(burnValue - threshold);
    float edge = 1.0 - smoothstep(0.0, edgeThickness, edgeVal);

    if (edge > 0.001) {
      // Hot orange outer glow, blending into hot white uBurnColor at the core
      vec3 fireGlow = vec3(1.0, 0.35, 0.05); // Hot orange
      vec3 hotEdge = mix(fireGlow, uBurnColor, smoothstep(0.5, 1.0, edge));
      baseColor.rgb = clamp(baseColor.rgb + hotEdge * edge * 1.6, 0.0, 1.0);
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

export const FilmBurnWipeTransition: TransitionDefinition = {
  id: 'film-burn-wipe',
  name: 'Film Burn Wipe',
  category: 'light-based',
  description: 'An organic, irregular burn edge eats through the outgoing clip to reveal the incoming clip, with a hot glow along the melt line.',
  tags: ['film', 'burn', 'wipe', 'glow', 'organic'],
  defaultDurationMs: 950,
  params: [
    { key: 'burnColor', label: 'Burn Color', type: 'color', value: '#FFFFFF' }, // Hot white core
    { key: 'irregularity', label: 'Irregularity', type: 'range', value: 0.6, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'edgeGlow', label: 'Edge Glow', type: 'range', value: 0.7, min: 0.0, max: 1.0, step: 0.05 }
  ],

  create(params: ParamValues): Filter {
    const colorHex = params.burnColor as string ?? '#FFFFFF'
    const colorVal = hexToVec3(colorHex)

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uIrregularity: { value: params.irregularity as number ?? 0.6, type: 'f32' },
          uEdgeGlow: { value: params.edgeGlow as number ?? 0.7, type: 'f32' },
          uBurnColor: { value: colorVal, type: 'vec3<f32>' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uIrregularity = params.irregularity as number ?? 0.6
      u.uEdgeGlow = params.edgeGlow as number ?? 0.7
      const colorHex = params.burnColor as string ?? '#FFFFFF'
      u.uBurnColor = hexToVec3(colorHex)
    }
  }
}
