import { Filter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

/**
 * HalationEffect — Pass 2 filter for film halation (colored bloom around highlights).
 *
 * This is a separate filter that must be chained AFTER ColorAdjustmentsEffect.
 * It samples the input at several offset positions to cheaply approximate a
 * blur without requiring a full multi-pass blur pipeline.
 *
 * IMPORTANT: Only construct this filter (add a halation-node to the EffectGraph)
 * when `halation.intensity > 0` for the active preset. It should never be an
 * unconditional second pass.
 */

const HALATION_VERTEX_SHADER = `
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uOutputTexture;

  vec4 filterVertexPosition( void )
  {
      vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
      position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
      position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
      return vec4(position, 0.0, 1.0);
  }

  vec2 filterTextureCoord( void )
  {
      return aPosition * (uOutputFrame.zw * uInputSize.zw);
  }

  void main(void)
  {
      gl_Position = filterVertexPosition();
      vTextureCoord = filterTextureCoord();
  }
`;

const HALATION_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform vec3  uHalationColor;      // warm tint, typically amber/orange
  uniform float uHalationThreshold;  // 0.0 to 1.0, brightness above which halation starts
  uniform float uHalationIntensity;  // 0.0 to 1.0

  float brightness(vec3 c) {
      return dot(c, vec3(0.299, 0.587, 0.114));
  }

  float glowAt(vec2 uv) {
      vec3 c = texture(uTexture, uv).rgb;
      return smoothstep(uHalationThreshold, 1.0, brightness(c));
  }

  void main() {
      vec4 color = texture(uTexture, vTextureCoord);

      // Multi-sample approximation of a bloom/blur on bright areas.
      // 9-tap cross pattern at 4-texel radius avoids a full two-pass blur pipeline.
      vec2 texel = 1.0 / vec2(textureSize(uTexture, 0));
      float radius = 4.0;

      float glowSum = glowAt(vTextureCoord);
      glowSum += glowAt(vTextureCoord + texel * vec2( radius,    0.0));
      glowSum += glowAt(vTextureCoord + texel * vec2(-radius,    0.0));
      glowSum += glowAt(vTextureCoord + texel * vec2(   0.0,  radius));
      glowSum += glowAt(vTextureCoord + texel * vec2(   0.0, -radius));
      glowSum += glowAt(vTextureCoord + texel * vec2( radius,  radius) * 0.707);
      glowSum += glowAt(vTextureCoord + texel * vec2(-radius,  radius) * 0.707);
      glowSum += glowAt(vTextureCoord + texel * vec2( radius, -radius) * 0.707);
      glowSum += glowAt(vTextureCoord + texel * vec2(-radius, -radius) * 0.707);
      glowSum /= 9.0;

      // Additively composite the colored glow on top of the base image
      color.rgb += uHalationColor * glowSum * uHalationIntensity;

      finalColor = color;
  }
`;

export const HalationEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'halation',
  name: 'Halation',
  category: 'light',
  description: 'Film halation — colored bloom (typically warm amber) around bright highlight areas. Chain after ColorAdjustmentsEffect. Only add when intensity > 0.',
  tags: ['halation', 'bloom', 'film', 'glow', 'highlight'],
  thumbnail: '',
  params: [
    { key: 'halationR',         label: 'Halation Color R', type: 'range', value: 1.0,  min: 0.0, max: 1.0, step: 0.01 },
    { key: 'halationG',         label: 'Halation Color G', type: 'range', value: 0.53, min: 0.0, max: 1.0, step: 0.01 },
    { key: 'halationB',         label: 'Halation Color B', type: 'range', value: 0.27, min: 0.0, max: 1.0, step: 0.01 },
    { key: 'halationThreshold', label: 'Threshold',        type: 'range', value: 0.75, min: 0.0, max: 1.0, step: 0.01 },
    { key: 'halationIntensity', label: 'Intensity',        type: 'range', value: 0.0,  min: 0.0, max: 1.0, step: 0.01 },
  ],
  filterSpec: {
    create(params: ParamValues): Filter {
      return Filter.from({
        gl: { vertex: HALATION_VERTEX_SHADER, fragment: HALATION_FRAGMENT_SHADER },
        clipToViewport: false,
        resources: {
          halationUniforms: {
            uHalationColor:     { value: [params.halationR ?? 1.0, params.halationG ?? 0.53, params.halationB ?? 0.27], type: 'vec3<f32>' },
            uHalationThreshold: { value: params.halationThreshold as number ?? 0.75, type: 'f32' },
            uHalationIntensity: { value: params.halationIntensity as number || 0.0,  type: 'f32' },
          }
        }
      })
    },
    updateUniforms(filter: Filter, params: ParamValues): void {
      type UniformGroup = { uniforms?: Record<string, unknown>; update?: () => void }
      const group = (filter as Filter & { resources?: { halationUniforms?: UniformGroup } }).resources?.halationUniforms
      const uniforms = group?.uniforms
      if (!uniforms) return
      uniforms.uHalationColor     = [params.halationR ?? 1.0, params.halationG ?? 0.53, params.halationB ?? 0.27]
      uniforms.uHalationThreshold = params.halationThreshold as number ?? 0.75
      uniforms.uHalationIntensity = params.halationIntensity as number || 0.0
      group?.update?.()
    }
  }
}
