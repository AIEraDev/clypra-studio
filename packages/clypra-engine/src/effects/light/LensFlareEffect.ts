import { Filter } from 'pixi.js'
import { GodrayFilter } from 'pixi-filters'
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

const STARBURST_FRAGMENT = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float uFlareIntensity;
  uniform vec3 uFlareColor;
  uniform float uTime;

  void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    
    // Starburst center (0.5, 0.5)
    vec2 center = vec2(0.5, 0.5);
    vec2 toCenter = vTextureCoord - center;
    float dist = length(toCenter);
    
    // Starburst rays rotation & frequency
    float angle = atan(toCenter.y, toCenter.x);
    float rays = sin(angle * 8.0 + uTime * 2.0) * 0.5 + 0.5;
    rays += sin(angle * 5.0 - uTime * 1.5) * 0.5 + 0.5;
    
    // Circular halo
    float halo = smoothstep(0.06, 0.0, abs(dist - 0.22));
    
    // Combine rays + halo
    float flare = (rays * smoothstep(0.35, 0.0, dist) * 0.7) + (halo * 0.3);
    flare *= uFlareIntensity;
    
    // Additive blend
    vec3 flareRGB = uFlareColor * flare * color.a;
    
    finalColor = vec4(color.rgb + flareRGB, color.a);
  }
`

export const LensFlareEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'composite', // Stacked filter chain
  id: 'lens-flare',
  name: 'Lens Flare',
  category: 'light',
  description: 'Double-stage lens flare: Godray filter coupled with an animated GPU starburst shader.',
  tags: ['light', 'flare', 'cinematic', 'rays', 'starburst'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/lens-flare.webp',

  params: [
    { key: 'godrayGain',     label: 'Rays Gain',       type: 'range',  value: 0.4,   min: 0,   max: 1.0,  step: 0.05 },
    { key: 'godrayAlpha',    label: 'Rays Alpha',      type: 'range',  value: 0.5,   min: 0,   max: 1.0,  step: 0.05 },
    { key: 'flareIntensity', label: 'Flare Intensity', type: 'range',  value: 0.8,   min: 0,   max: 3.0,  step: 0.05 },
    { key: 'flareColor',     label: 'Flare Color',     type: 'color',  value: '#7C6FFF' },
    { key: 'speed',          label: 'Animation Speed', type: 'range',  value: 1.0,   min: 0,   max: 4.0,  step: 0.1 },
    { key: 'animated',       label: 'Animate Flare',   type: 'toggle', value: true },
  ],

  filterSpec: {
    create(params: ParamValues): Filter[] {
      const hexToVec3 = (hex: string): [number, number, number] => [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      ]

      // Stage 1: Godray
      const godray = new GodrayFilter({
        gain: params.godrayGain as number,
        alpha: params.godrayAlpha as number,
        center: [0.5, 0.5],
        parallel: false,
        time: 0,
      })

      // Stage 2: Custom Starburst
      const starburst = Filter.from({
        gl: { vertex: DEFAULT_VERTEX_SHADER, fragment: STARBURST_FRAGMENT },
        resources: {
          flareUniforms: {
            uFlareIntensity: { value: params.flareIntensity as number, type: 'f32' },
            uFlareColor:     { value: hexToVec3(params.flareColor as string), type: 'vec3<f32>' },
            uTime:           { value: 0, type: 'f32' },
          },
        },
      })

      return [godray, starburst]
    },

    updateUniforms(filters: Filter[], params: ParamValues, elapsed: number): void {
      const [godray, starburst] = filters as [GodrayFilter, Filter]
      if (!godray || !starburst) return

      // Update Godray properties
      godray.gain = params.godrayGain as number
      godray.alpha = params.godrayAlpha as number

      const speed = params.speed as number
      const timeVal = (elapsed / 1000) * speed

      if (params.animated) {
        godray.time = timeVal
      }

      // Update Custom Starburst uniforms
      const u = (starburst as any).resources?.flareUniforms?.uniforms
      if (u) {
        u.uTime = params.animated ? timeVal : 0
        u.uFlareIntensity = params.flareIntensity as number

        const hex = params.flareColor as string
        u.uFlareColor = [
          parseInt(hex.slice(1, 3), 16) / 255,
          parseInt(hex.slice(3, 5), 16) / 255,
          parseInt(hex.slice(5, 7), 16) / 255,
        ]
      }
    },
  },
}
