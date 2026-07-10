import { Filter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

/** Pixi v8 default filter vertex — required for correct render-to-texture in MPG. */
const ADJUSTMENTS_VERTEX_SHADER = `
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

const ADJUSTMENTS_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;

  // ── Existing uniforms ─────────────────────────────────────────────────────
  uniform float uExposure;          // -1.0 to 1.0
  uniform float uBrightness;        // -1.0 to 1.0
  uniform float uContrast;          // -1.0 to 1.0
  uniform float uSaturation;        // -1.0 to 1.0
  uniform vec3  uTemperatureColor;  // warm or cool color
  uniform float uTemperatureWeight; // 0.0 to 1.0
  uniform vec3  uTintColor;         // magenta or green color
  uniform float uTintWeight;        // 0.0 to 1.0
  uniform float uSepia;             // 0.0 to 1.0
  uniform float uGrayscale;         // 0.0 to 1.0
  uniform float uHueRotate;         // radians
  uniform float uVignette;          // 0.0 to 1.0
  uniform float uInvert;            // 0.0 to 1.0

  // ── NEW: Lift ─────────────────────────────────────────────────────────────
  uniform float uLift;              // -0.2 to 0.2; positive = faded/matte, negative = crushed

  // ── NEW: Split-toning ─────────────────────────────────────────────────────
  uniform vec3  uShadowTint;        // multiplicative color for shadows (neutral = vec3(1))
  uniform float uShadowTintStrength;
  uniform vec3  uHighlightTint;     // multiplicative color for highlights (neutral = vec3(1))
  uniform float uHighlightTintStrength;
  uniform float uSplitBalance;      // 0.0-1.0, luma split point

  // ── NEW: Film grain ───────────────────────────────────────────────────────
  uniform float uGrainIntensity;    // 0.0 to 0.5
  uniform float uGrainSize;         // 0.1 to 5.0
  uniform float uTime;              // animated, incremented each frame

  // ── NEW: Channel-mix B&W ──────────────────────────────────────────────────
  uniform vec3  uChannelMix;        // R/G/B weights summing to ~1.0
  uniform float uUseChannelMix;     // 1.0 = active, 0.0 = off

  // ── NEW: Duotone ──────────────────────────────────────────────────────────
  uniform vec3  uDuotoneDark;       // color mapped to black/dark tones
  uniform vec3  uDuotoneLight;      // color mapped to white/light tones
  uniform float uUseDuotone;        // 1.0 = active, 0.0 = off

  // ── NEW: Vibrance ─────────────────────────────────────────────────────────
  uniform float uVibranceAmount;    // -1.0 to 1.0
  uniform vec3  uVibranceProtectedHue; // reference color for skin-tone protection

  // ── NEW: Cross-process ────────────────────────────────────────────────────
  uniform float uCrossProcessAmount; // 0.0 to 1.0

  // ── Helper functions ──────────────────────────────────────────────────────
  vec3 hueRotateColor(vec3 color, float angle) {
      vec3 k = vec3(0.57735, 0.57735, 0.57735);
      float c = cos(angle);
      return color * c + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - c);
  }

  vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
      vec4 texColor = texture(uTexture, vTextureCoord);
      vec3 rgb = texColor.rgb;

      // Invert
      rgb = mix(rgb, 1.0 - rgb, uInvert);

      // Exposure
      rgb = rgb * pow(2.0, uExposure);

      // Brightness
      rgb = rgb + uBrightness;

      // Lift — shift black point; applied before contrast so it interacts correctly with tonal range
      if (uLift != 0.0) {
          rgb = rgb + uLift * (1.0 - rgb);
      }

      // Contrast
      rgb = (rgb - 0.5) * (1.0 + uContrast) + 0.5;

      // Saturation (flat, distinct from vibrance)
      float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(vec3(luma), rgb, 1.0 + uSaturation);

      // Grayscale
      float lumaG = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(rgb, vec3(lumaG), uGrayscale);

      // Sepia
      if (uSepia > 0.0) {
          vec3 sep = vec3(
              dot(rgb, vec3(0.393, 0.769, 0.189)),
              dot(rgb, vec3(0.349, 0.686, 0.168)),
              dot(rgb, vec3(0.272, 0.534, 0.131))
          );
          rgb = mix(rgb, sep, uSepia);
      }

      // Hue Rotate
      if (uHueRotate != 0.0) {
          rgb = hueRotateColor(rgb, uHueRotate);
      }

      // Temperature — soft-light blend
      if (uTemperatureWeight > 0.0) {
          vec3 t = uTemperatureColor;
          rgb = mix(rgb, (1.0 - 2.0 * t) * rgb * rgb + 2.0 * t * rgb, uTemperatureWeight);
      }

      // Tint — soft-light blend
      if (uTintWeight > 0.0) {
          vec3 t = uTintColor;
          rgb = mix(rgb, (1.0 - 2.0 * t) * rgb * rgb + 2.0 * t * rgb, uTintWeight);
      }

      // ── NEW: Channel-mixed B&W ─────────────────────────────────────────────
      // Applied before duotone; mutually exclusive (both produce mono, duotone adds color back)
      if (uUseChannelMix > 0.5) {
          float mono = dot(rgb, uChannelMix);
          rgb = vec3(mono);
      }

      // ── NEW: Duotone ───────────────────────────────────────────────────────
      // Maps current luminance to a 2-color gradient; applied after channel-mix for correct mono base
      if (uUseDuotone > 0.5) {
          float duoLuma = dot(rgb, vec3(0.299, 0.587, 0.114));
          rgb = mix(uDuotoneDark, uDuotoneLight, duoLuma);
      }

      // ── NEW: Split-toning ──────────────────────────────────────────────────
      if (uShadowTintStrength > 0.0 || uHighlightTintStrength > 0.0) {
          float splitLuma = dot(rgb, vec3(0.299, 0.587, 0.114));
          float shadowW    = 1.0 - smoothstep(0.0, uSplitBalance, splitLuma);
          float highlightW = smoothstep(uSplitBalance, 1.0, splitLuma);
          rgb = mix(rgb, rgb * uShadowTint,    shadowW    * uShadowTintStrength);
          rgb = mix(rgb, rgb * uHighlightTint, highlightW * uHighlightTintStrength);
      }

      // ── NEW: Vibrance — hue-selective saturation ───────────────────────────
      // Skipped when channel-mix or duotone have flattened color information
      if (uVibranceAmount != 0.0 && uUseChannelMix < 0.5 && uUseDuotone < 0.5) {
          vec3 hsv = rgb2hsv(clamp(rgb, 0.0, 1.0));
          vec3 protHSV = rgb2hsv(uVibranceProtectedHue);
          float hueDist = abs(hsv.x - protHSV.x);
          hueDist = min(hueDist, 1.0 - hueDist); // wrap hue distance
          float protection = smoothstep(0.0, 0.15, hueDist);
          hsv.y = clamp(hsv.y + uVibranceAmount * protection, 0.0, 1.0);
          rgb = hsv2rgb(hsv);
      }

      // ── NEW: Cross-process — channel curve swap ────────────────────────────
      if (uCrossProcessAmount > 0.0) {
          float origR = rgb.r;
          float origB = rgb.b;
          rgb.r = mix(rgb.r, pow(max(origB, 0.001), 0.8), uCrossProcessAmount);
          rgb.b = mix(rgb.b, pow(max(origR, 0.001), 1.2), uCrossProcessAmount);
      }

      // ── NEW: Film grain — last before vignette ────────────────────────────
      if (uGrainIntensity > 0.0) {
          float grain = fract(sin(dot(vTextureCoord * uGrainSize + uTime, vec2(12.9898, 78.233))) * 43758.5453);
          rgb += (grain - 0.5) * uGrainIntensity;
      }

      // Vignette
      vec2 uv = vTextureCoord - 0.5;
      float vignetteVal = smoothstep(0.45, 1.0, length(uv));
      rgb = mix(rgb, vec3(0.0), vignetteVal * uVignette);

      finalColor = vec4(rgb, texColor.a);
  }
`;

/** Convert a hex color string (#RRGGBB) to a normalized [r, g, b] array. */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').padEnd(6, '0')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return [isNaN(r) ? 1 : r, isNaN(g) ? 1 : g, isNaN(b) ? 1 : b]
}

export const ColorAdjustmentsEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'color-adjustments',
  name: 'Color Adjustments',
  category: 'light',
  description: 'Adjust exposure, brightness, contrast, saturation, temperature, tint, sepia, grayscale, hue, invert, vignette, lift, split-toning, grain, channel-mix, duotone, vibrance, and cross-process.',
  tags: ['color', 'adjustments', 'brightness', 'contrast', 'saturation', 'temperature', 'tint', 'vignette', 'grain', 'duotone', 'vibrance'],
  thumbnail: '',
  params: [
    // ── Existing ───────────────────────────────────────────────────────────
    { key: 'exposure',    label: 'Exposure',    type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'brightness',  label: 'Brightness',  type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'contrast',    label: 'Contrast',    type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'saturation',  label: 'Saturation',  type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'temperature', label: 'Temperature', type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'tint',        label: 'Tint',        type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'sepia',       label: 'Sepia',       type: 'range', value: 0.0, min:  0.0, max: 1.0, step: 0.01 },
    { key: 'grayscale',   label: 'Grayscale',   type: 'range', value: 0.0, min:  0.0, max: 1.0, step: 0.01 },
    { key: 'hueRotate',   label: 'Hue Rotate',  type: 'range', value: 0.0, min:  0.0, max: 6.28318, step: 0.01 },
    { key: 'vignette',    label: 'Vignette',    type: 'range', value: 0.0, min:  0.0, max: 1.0, step: 0.01 },
    { key: 'invert',      label: 'Invert',      type: 'range', value: 0.0, min:  0.0, max: 1.0, step: 0.01 },
    // ── NEW ────────────────────────────────────────────────────────────────
    { key: 'lift',                   label: 'Lift',             type: 'range', value: 0.0,  min: -0.5,  max: 0.5,   step: 0.01 },
    { key: 'shadowTintR',            label: 'Shadow Tint R',    type: 'range', value: 1.0,  min:  0.0,  max: 2.0,   step: 0.01 },
    { key: 'shadowTintG',            label: 'Shadow Tint G',    type: 'range', value: 1.0,  min:  0.0,  max: 2.0,   step: 0.01 },
    { key: 'shadowTintB',            label: 'Shadow Tint B',    type: 'range', value: 1.0,  min:  0.0,  max: 2.0,   step: 0.01 },
    { key: 'shadowTintStrength',     label: 'Shadow Strength',  type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'highlightTintR',         label: 'Hi Tint R',        type: 'range', value: 1.0,  min:  0.0,  max: 2.0,   step: 0.01 },
    { key: 'highlightTintG',         label: 'Hi Tint G',        type: 'range', value: 1.0,  min:  0.0,  max: 2.0,   step: 0.01 },
    { key: 'highlightTintB',         label: 'Hi Tint B',        type: 'range', value: 1.0,  min:  0.0,  max: 2.0,   step: 0.01 },
    { key: 'highlightTintStrength',  label: 'Hi Strength',      type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'splitBalance',           label: 'Split Balance',    type: 'range', value: 0.5,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'grainIntensity',         label: 'Grain Intensity',  type: 'range', value: 0.0,  min:  0.0,  max: 0.5,   step: 0.01 },
    { key: 'grainSize',              label: 'Grain Size',       type: 'range', value: 1.0,  min:  0.1,  max: 5.0,   step: 0.1  },
    { key: 'channelMixR',            label: 'Channel Mix R',    type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'channelMixG',            label: 'Channel Mix G',    type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'channelMixB',            label: 'Channel Mix B',    type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'useChannelMix',          label: 'Use Channel Mix',  type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 1.0  },
    { key: 'duotoneDarkR',           label: 'Duo Dark R',       type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'duotoneDarkG',           label: 'Duo Dark G',       type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'duotoneDarkB',           label: 'Duo Dark B',       type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'duotoneLightR',          label: 'Duo Light R',      type: 'range', value: 1.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'duotoneLightG',          label: 'Duo Light G',      type: 'range', value: 1.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'duotoneLightB',          label: 'Duo Light B',      type: 'range', value: 1.0,  min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'useDuotone',             label: 'Use Duotone',      type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 1.0  },
    { key: 'vibranceAmount',         label: 'Vibrance',         type: 'range', value: 0.0,  min: -1.0,  max: 1.0,   step: 0.01 },
    { key: 'vibranceProtectedHueR',  label: 'Vib Protect R',   type: 'range', value: 0.91, min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'vibranceProtectedHueG',  label: 'Vib Protect G',   type: 'range', value: 0.69, min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'vibranceProtectedHueB',  label: 'Vib Protect B',   type: 'range', value: 0.55, min:  0.0,  max: 1.0,   step: 0.01 },
    { key: 'crossProcessAmount',     label: 'Cross Process',    type: 'range', value: 0.0,  min:  0.0,  max: 1.0,   step: 0.01 },
  ],
  filterSpec: {
    create(params: ParamValues): Filter {
      const temperature = params.temperature as number || 0.0
      const tempWeight  = Math.abs(temperature)
      const tempColor   = temperature > 0.0 ? [1.0, 0.55, 0.16] : [0.16, 0.47, 1.0]
      const tint        = params.tint as number || 0.0
      const tintWeight  = Math.abs(tint)
      const tintColor   = tint > 0.0 ? [1.0, 0.16, 0.71] : [0.16, 1.0, 0.39]

      return Filter.from({
        gl: { vertex: ADJUSTMENTS_VERTEX_SHADER, fragment: ADJUSTMENTS_FRAGMENT_SHADER },
        clipToViewport: false,
        resources: {
          adjustmentsUniforms: {
            // ── Existing ──────────────────────────────────────────────────
            uExposure:          { value: params.exposure as number          || 0.0, type: 'f32' },
            uBrightness:        { value: params.brightness as number        || 0.0, type: 'f32' },
            uContrast:          { value: params.contrast as number          || 0.0, type: 'f32' },
            uSaturation:        { value: params.saturation as number        || 0.0, type: 'f32' },
            uTemperatureColor:  { value: tempColor,                                 type: 'vec3<f32>' },
            uTemperatureWeight: { value: tempWeight,                                type: 'f32' },
            uTintColor:         { value: tintColor,                                 type: 'vec3<f32>' },
            uTintWeight:        { value: tintWeight,                                type: 'f32' },
            uSepia:             { value: params.sepia as number             || 0.0, type: 'f32' },
            uGrayscale:         { value: params.grayscale as number         || 0.0, type: 'f32' },
            uHueRotate:         { value: params.hueRotate as number         || 0.0, type: 'f32' },
            uVignette:          { value: params.vignette as number          || 0.0, type: 'f32' },
            uInvert:            { value: params.invert as number            || 0.0, type: 'f32' },
            // ── NEW ───────────────────────────────────────────────────────
            uLift:                  { value: params.lift as number                 || 0.0,                                                                           type: 'f32' },
            uShadowTint:            { value: [params.shadowTintR ?? 1.0,            params.shadowTintG ?? 1.0,            params.shadowTintB ?? 1.0],            type: 'vec3<f32>' },
            uShadowTintStrength:    { value: params.shadowTintStrength as number   || 0.0,                                                                           type: 'f32' },
            uHighlightTint:         { value: [params.highlightTintR ?? 1.0,         params.highlightTintG ?? 1.0,         params.highlightTintB ?? 1.0],         type: 'vec3<f32>' },
            uHighlightTintStrength: { value: params.highlightTintStrength as number|| 0.0,                                                                           type: 'f32' },
            uSplitBalance:          { value: params.splitBalance as number          ?? 0.5,                                                                           type: 'f32' },
            uGrainIntensity:        { value: params.grainIntensity as number       || 0.0,                                                                           type: 'f32' },
            uGrainSize:             { value: params.grainSize as number             ?? 1.0,                                                                           type: 'f32' },
            uTime:                  { value: 0.0,                                                                                                                    type: 'f32' },
            uChannelMix:            { value: [params.channelMixR ?? 0.0,            params.channelMixG ?? 0.0,            params.channelMixB ?? 0.0],            type: 'vec3<f32>' },
            uUseChannelMix:         { value: params.useChannelMix as number        || 0.0,                                                                           type: 'f32' },
            uDuotoneDark:           { value: [params.duotoneDarkR ?? 0.0,           params.duotoneDarkG ?? 0.0,           params.duotoneDarkB ?? 0.0],           type: 'vec3<f32>' },
            uDuotoneLight:          { value: [params.duotoneLightR ?? 1.0,          params.duotoneLightG ?? 1.0,          params.duotoneLightB ?? 1.0],          type: 'vec3<f32>' },
            uUseDuotone:            { value: params.useDuotone as number           || 0.0,                                                                           type: 'f32' },
            uVibranceAmount:        { value: params.vibranceAmount as number       || 0.0,                                                                           type: 'f32' },
            uVibranceProtectedHue:  { value: [params.vibranceProtectedHueR ?? 0.91, params.vibranceProtectedHueG ?? 0.69, params.vibranceProtectedHueB ?? 0.55], type: 'vec3<f32>' },
            uCrossProcessAmount:    { value: params.crossProcessAmount as number   || 0.0,                                                                           type: 'f32' },
          }
        }
      })
    },

    updateUniforms(filter: Filter, params: ParamValues): void {
      type UniformGroup = { uniforms?: Record<string, unknown>; update?: () => void }
      const group = (filter as Filter & { resources?: { adjustmentsUniforms?: UniformGroup } }).resources?.adjustmentsUniforms
      const uniforms = group?.uniforms
      if (!uniforms) return

      const temperature = params.temperature as number || 0.0
      const tempWeight  = Math.abs(temperature)
      const tempColor   = temperature > 0.0 ? [1.0, 0.55, 0.16] : [0.16, 0.47, 1.0]
      const tint        = params.tint as number || 0.0
      const tintWeight  = Math.abs(tint)
      const tintColor   = tint > 0.0 ? [1.0, 0.16, 0.71] : [0.16, 1.0, 0.39]

      // ── Existing ────────────────────────────────────────────────────────
      uniforms.uExposure          = params.exposure as number          || 0.0
      uniforms.uBrightness        = params.brightness as number        || 0.0
      uniforms.uContrast          = params.contrast as number          || 0.0
      uniforms.uSaturation        = params.saturation as number        || 0.0
      uniforms.uTemperatureColor  = tempColor
      uniforms.uTemperatureWeight = tempWeight
      uniforms.uTintColor         = tintColor
      uniforms.uTintWeight        = tintWeight
      uniforms.uSepia             = params.sepia as number             || 0.0
      uniforms.uGrayscale         = params.grayscale as number         || 0.0
      uniforms.uHueRotate         = params.hueRotate as number         || 0.0
      uniforms.uVignette          = params.vignette as number          || 0.0
      uniforms.uInvert            = params.invert as number            || 0.0
      // ── NEW ──────────────────────────────────────────────────────────
      uniforms.uLift                  = params.lift as number                  || 0.0
      uniforms.uShadowTint            = [params.shadowTintR ?? 1.0,            params.shadowTintG ?? 1.0,            params.shadowTintB ?? 1.0]
      uniforms.uShadowTintStrength    = params.shadowTintStrength as number    || 0.0
      uniforms.uHighlightTint         = [params.highlightTintR ?? 1.0,         params.highlightTintG ?? 1.0,         params.highlightTintB ?? 1.0]
      uniforms.uHighlightTintStrength = params.highlightTintStrength as number || 0.0
      uniforms.uSplitBalance          = params.splitBalance as number           ?? 0.5
      uniforms.uGrainIntensity        = params.grainIntensity as number        || 0.0
      uniforms.uGrainSize             = params.grainSize as number              ?? 1.0
      uniforms.uTime                  = ((uniforms.uTime as number || 0.0) + 0.016) % 100.0
      uniforms.uChannelMix            = [params.channelMixR ?? 0.0,            params.channelMixG ?? 0.0,            params.channelMixB ?? 0.0]
      uniforms.uUseChannelMix         = params.useChannelMix as number         || 0.0
      uniforms.uDuotoneDark           = [params.duotoneDarkR ?? 0.0,           params.duotoneDarkG ?? 0.0,           params.duotoneDarkB ?? 0.0]
      uniforms.uDuotoneLight          = [params.duotoneLightR ?? 1.0,          params.duotoneLightG ?? 1.0,          params.duotoneLightB ?? 1.0]
      uniforms.uUseDuotone            = params.useDuotone as number            || 0.0
      uniforms.uVibranceAmount        = params.vibranceAmount as number        || 0.0
      uniforms.uVibranceProtectedHue  = [params.vibranceProtectedHueR ?? 0.91, params.vibranceProtectedHueG ?? 0.69, params.vibranceProtectedHueB ?? 0.55]
      uniforms.uCrossProcessAmount    = params.crossProcessAmount as number    || 0.0
      group?.update?.()
    }
  }
}
