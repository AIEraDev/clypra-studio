import { Filter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

const DEFAULT_VERTEX_SHADER = `
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;

  vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    return vec4(position * uInputSize.zw * 2.0 - 1.0, 0.0, 1.0);
  }

  vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.xy);
  }

  void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
  }
`

const FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float uRadius;
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform float uTime;
  uniform bool uPulse;
  uniform float uPulseSpeed;

  void main(void) {
    vec4 original = texture(uTexture, vTextureCoord);
    
    // Radial sample points (8 directions)
    vec4 glowSum = vec4(0.0);
    float totalWeight = 0.0;
    
    // Pulse animation factor
    float pulse = uPulse ? 0.5 + 0.5 * sin(uTime * uPulseSpeed * 6.28318) : 1.0;
    float currentRadius = uRadius * 0.01 * pulse;
    
    for (int i = 0; i < 8; i++) {
      float angle = float(i) * 0.785398; // 2*PI / 8
      vec2 offset = vec2(cos(angle), sin(angle)) * currentRadius;
      vec4 sampleCol = texture(uTexture, vTextureCoord + offset);
      
      // Weight samples by their luminance / brightness
      float weight = dot(sampleCol.rgb, vec3(0.299, 0.587, 0.114));
      glowSum += sampleCol * weight;
      totalWeight += weight;
    }
    
    vec4 glowVal = (totalWeight > 0.0) ? (glowSum / totalWeight) : vec4(0.0);
    
    // Additive colorized glow
    vec3 glowColor = uColor * uIntensity * glowVal.rgb * original.a;
    
    finalColor = vec4(original.rgb + glowColor, original.a);
  }
`

export const GlowEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'glow',
  name: 'Glow',
  category: 'light',
  description: 'Custom GPU-accelerated radial glow with customizable pulsing animation.',
  tags: ['glow', 'neon', 'light', 'pulse', 'radial'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/glow.webp',

  params: [
    { key: 'radius',     label: 'Radius',      type: 'range',  value: 8,       min: 0,   max: 20,  step: 0.5 },
    { key: 'intensity',  label: 'Intensity',   type: 'range',  value: 0.8,     min: 0,   max: 3,   step: 0.05 },
    { key: 'color',      label: 'Glow Color',  type: 'color',  value: '#7C6FFF' },
    { key: 'pulse',      label: 'Animate Pulse', type: 'toggle', value: true },
    { key: 'pulseSpeed', label: 'Pulse Speed', type: 'range',  value: 1.5,     min: 0.1, max: 5,   step: 0.1 },
  ],

  filterSpec: {
    create(params: ParamValues): Filter {
      const hexToVec3 = (hex: string): [number, number, number] => [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      ]

      return Filter.from({
        gl: { vertex: DEFAULT_VERTEX_SHADER, fragment: FRAGMENT_SHADER },
        resources: {
          effectUniforms: {
            uRadius:     { value: params.radius as number, type: 'f32' },
            uIntensity:  { value: params.intensity as number, type: 'f32' },
            uColor:      { value: hexToVec3(params.color as string), type: 'vec3<f32>' },
            uTime:       { value: 0, type: 'f32' },
            uPulse:      { value: params.pulse as boolean, type: 'bool' },
            uPulseSpeed: { value: params.pulseSpeed as number, type: 'f32' },
          },
        },
      })
    },

    updateUniforms(filter: Filter, params: ParamValues, elapsed: number): void {
      const u = (filter as any).resources?.effectUniforms?.uniforms
      if (!u) return

      u.uTime       = elapsed / 1000
      u.uRadius     = params.radius as number
      u.uIntensity  = params.intensity as number
      u.uPulse      = params.pulse as boolean
      u.uPulseSpeed = params.pulseSpeed as number

      const hex = params.color as string
      u.uColor = [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      ]
    },
  },
}
