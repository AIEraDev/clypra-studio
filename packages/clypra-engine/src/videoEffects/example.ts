/**
 * @clypra/engine — example effects
 *
 * Three fully-worked examples covering every PixiJS subtype.
 * Copy these as templates when authoring new effects.
 *
 *   1. NeonGlowEffect     — 'filter'    — GPU shader, no ticker needed
 *   2. ParticleBurstEffect — 'motion'   — ticker-driven animation, no shader
 *   3. VHSCompositeEffect  — 'composite' — shader + animated overlay together
 */

import { Filter, Container, Graphics, Ticker } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from './EffectDefinition'

// Helper to convert hex to RGB normalization
const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

const hexToDec = (hex: string) => parseInt(hex.replace('#', ''), 16)

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
`;

// ============================================================================
// 1. NeonGlowEffect — filter subtype
//    Pure GLSL: chromatic aberration + soft glow, animated via elapsed time
// ============================================================================

export const NeonGlowEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'neon-glow',
  name: 'Neon Glow',
  category: 'neon',
  description: 'GPU chromatic aberration with pulsing glow. Zero CPU cost per frame.',
  tags: ['glow', 'neon', 'chromatic', 'aberration', 'rgb'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/neon-glow.webp',

  params: [
    { key: 'spread',    label: 'Spread',     type: 'range', value: 4,        min: 0, max: 20,  step: 0.5 },
    { key: 'strength',  label: 'Glow strength', type: 'range', value: 0.6,   min: 0, max: 1,   step: 0.01 },
    { key: 'color',     label: 'Glow color', type: 'color', value: '#7C6FFF' },
    { key: 'pulse',     label: 'Pulse',      type: 'toggle', value: true },
    { key: 'pulseSpeed', label: 'Pulse speed', type: 'range', value: 1.5,    min: 0.1, max: 5, step: 0.1 },
  ],

  filterSpec: {
    create(params: ParamValues) {
      // GLSL ES 3.0 (PixiJS v8 style)
      const fragment = `
        in vec2 vTextureCoord;
        out vec4 finalColor;

        uniform sampler2D uTexture;
        uniform float uSpread;
        uniform float uStrength;
        uniform vec3  uGlowColor;
        uniform float uTime;
        uniform bool  uPulse;
        uniform float uPulseSpeed;

        void main(void) {
          vec2 uv = vTextureCoord;

          // Chromatic aberration — shift R and B channels outward from center
          vec2 dir = uv - 0.5;
          float dist = length(dir) * uSpread * 0.01;
          vec2 redUV   = uv + dir * dist;
          vec2 blueUV  = uv - dir * dist;

          float r = texture(uTexture, redUV).r;
          float g = texture(uTexture, uv).g;
          float b = texture(uTexture, blueUV).b;
          float a = texture(uTexture, uv).a;

          vec4 base = vec4(r, g, b, a);

          // Soft glow overlay — animated pulse
          float pulse = uPulse
            ? 0.5 + 0.5 * sin(uTime * uPulseSpeed * 6.28318)
            : 1.0;
          float glow = uStrength * pulse;

          // Additive blend of glow color onto base
          vec3 glowContrib = uGlowColor * glow * base.a;
          finalColor = vec4(base.rgb + glowContrib, base.a);
        }
      `

      const rgb = hexToRgb(params.color as string)

      return Filter.from({
        gl: { vertex: DEFAULT_VERTEX_SHADER, fragment },
        resources: {
          uniforms: {
            uSpread:     { value: params.spread,     type: 'f32' },
            uStrength:   { value: params.strength,   type: 'f32' },
            uGlowColor:  { value: rgb,               type: 'vec3<f32>' },
            uTime:       { value: 0,                 type: 'f32' },
            uPulse:      { value: params.pulse,      type: 'bool' },
            uPulseSpeed: { value: params.pulseSpeed, type: 'f32' },
          },
        },
      })
    },

    updateUniforms(filter, params, elapsed) {
      // elapsed is ms — convert to seconds for the shader
      const uniforms = (filter as any).resources?.uniforms?.uniforms
      if (!uniforms) return

      uniforms.uTime       = elapsed / 1000
      uniforms.uSpread     = params.spread
      uniforms.uStrength   = params.strength
      uniforms.uPulse      = params.pulse
      uniforms.uPulseSpeed = params.pulseSpeed

      // Rebuild color only when it changes (avoid string parse every frame)
      const hex = params.color as string
      uniforms.uGlowColor = hexToRgb(hex)
    },
  },
}

// ============================================================================
// 2. ParticleBurstEffect — motion subtype
//    JS + PixiJS Container — no GLSL, pure scene-graph animation
// ============================================================================

export const ParticleBurstEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'motion',
  id: 'particle-burst',
  name: 'Particle Burst',
  category: 'particle',
  description: 'Ticker-driven particle system. Emits from center, fades out on edges.',
  tags: ['particle', 'burst', 'motion', 'overlay'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/particle-burst.webp',

  params: [
    { key: 'count',   label: 'Particle count', type: 'range',  value: 80,      min: 10, max: 300, step: 10 },
    { key: 'speed',   label: 'Speed',          type: 'range',  value: 2,        min: 0.5, max: 8, step: 0.5 },
    { key: 'size',    label: 'Size',           type: 'range',  value: 4,        min: 1, max: 12,  step: 1 },
    { key: 'color',   label: 'Particle color', type: 'color',  value: '#7C6FFF' },
    { key: 'fade',    label: 'Fade out',       type: 'toggle', value: true },
  ],

  mount(ctx) {
    // Store refs on ctx so unmount can clean up
    ;(ctx as any)._particleContainer = new Container()
    ctx.container.addChild((ctx as any)._particleContainer)
    const particles: Array<{
      gfx: Graphics
      vx: number
      vy: number
      life: number
      maxLife: number
    }> = []
    ;(ctx as any)._particles = particles

    const emit = () => {
      const count = ctx.params.count as number
      while (particles.length < count) {
        const angle = Math.random() * Math.PI * 2
        const speed = (ctx.params.speed as number) * (0.5 + Math.random())
        const gfx = new Graphics()
        gfx.circle(0, 0, ctx.params.size as number)
        gfx.fill({ color: hexToDec(ctx.params.color as string), alpha: 0.9 })
        gfx.x = ctx.width / 2 + (Math.random() - 0.5) * ctx.width * 0.3
        gfx.y = ctx.height / 2 + (Math.random() - 0.5) * ctx.height * 0.3
        ;(ctx as any)._particleContainer.addChild(gfx)
        const maxLife = 60 + Math.random() * 60
        particles.push({ gfx, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: maxLife, maxLife })
      }
    }

    ;(ctx as any)._tickerFn = (ticker: Ticker) => {
      emit()
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.gfx.x += p.vx
        p.gfx.y += p.vy
        p.life -= ticker.deltaTime
        if (ctx.params.fade) {
          p.gfx.alpha = Math.max(0, p.life / p.maxLife)
        }
        // Reset particle when life expires or it leaves canvas
        if (p.life <= 0 || p.gfx.x < -20 || p.gfx.x > ctx.width + 20 || p.gfx.y < -20 || p.gfx.y > ctx.height + 20) {
          p.life = p.maxLife
          p.gfx.x = ctx.width / 2 + (Math.random() - 0.5) * ctx.width * 0.3
          p.gfx.y = ctx.height / 2 + (Math.random() - 0.5) * ctx.height * 0.3
          p.gfx.alpha = 1
        }
      }
    }

    ctx.ticker.add((ctx as any)._tickerFn)
  },

  unmount(ctx) {
    // CRITICAL: always clean up ticker listeners and display objects
    if ((ctx as any)._tickerFn) {
      ctx.ticker.remove((ctx as any)._tickerFn)
    }
    if ((ctx as any)._particleContainer) {
      ctx.container.removeChild((ctx as any)._particleContainer)
      ;(ctx as any)._particleContainer.destroy({ children: true })
    }
  },

  onParamChange(ctx, key, value) {
    // Speed and size require rebuilding particles — easier to just let the ticker handle it
    // Color change: update all existing particle graphics
    if (key === 'color') {
      for (const p of (ctx as any)._particles ?? []) {
        p.gfx.clear()
        p.gfx.circle(0, 0, ctx.params.size as number)
        p.gfx.fill({ color: hexToDec(value as string), alpha: 0.9 })
      }
    }
  },
}

// ============================================================================
// 3. VHSCompositeEffect — composite subtype
//    Filter: noise/scanline GLSL shader
//    Motion: animated horizontal glitch band overlay
// ============================================================================

export const VHSCompositeEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'composite',
  id: 'vhs-composite',
  name: 'VHS',
  category: 'retro',
  description: 'Classic VHS look: scanlines + noise shader with animated glitch band overlay.',
  tags: ['vhs', 'retro', 'glitch', 'scanlines', 'noise', 'composite'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/vhs-composite.webp',

  params: [
    { key: 'noise',      label: 'Noise',       type: 'range',  value: 0.08,  min: 0,    max: 0.3,  step: 0.01 },
    { key: 'scanlines',  label: 'Scanlines',   type: 'toggle', value: true },
    { key: 'lineAlpha',  label: 'Line alpha',  type: 'range',  value: 0.25,  min: 0,    max: 1,    step: 0.05 },
    { key: 'hShift',     label: 'H-shift',     type: 'range',  value: 0.003, min: 0,    max: 0.02, step: 0.001 },
    { key: 'bandSpeed',  label: 'Band speed',  type: 'range',  value: 1.2,   min: 0.1,  max: 5,    step: 0.1 },
    { key: 'bandAlpha',  label: 'Band alpha',  type: 'range',  value: 0.35,  min: 0,    max: 1,    step: 0.05 },
  ],

  // ── Filter part ──────────────────────────────────────────────────────────

  filterSpec: {
    create(params: ParamValues) {
      const fragment = `
        in vec2 vTextureCoord;
        out vec4 finalColor;

        uniform sampler2D uTexture;
        uniform float uNoise;
        uniform bool  uScanlines;
        uniform float uLineAlpha;
        uniform float uHShift;
        uniform float uTime;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main(void) {
          vec2 uv = vTextureCoord;

          // Horizontal shift on random bands
          float bandY = floor(uv.y * 240.0) / 240.0;
          float shift = (rand(vec2(bandY, floor(uTime * 15.0))) - 0.5) * uHShift;
          uv.x += shift;

          vec4 color = texture(uTexture, clamp(uv, 0.0, 1.0));

          // Noise grain
          float grain = rand(uv + uTime) * uNoise;
          color.rgb += grain;

          // Scanlines
          if (uScanlines) {
            float line = step(0.5, fract(vTextureCoord.y * 240.0));
            color.rgb = mix(color.rgb, color.rgb * 0.7, line * uLineAlpha);
          }

          // Slight desaturation for the washed-out VHS look
          float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = mix(vec3(luma), color.rgb, 0.75);

          finalColor = color;
        }
      `

      return Filter.from({
        gl: { vertex: DEFAULT_VERTEX_SHADER, fragment },
        resources: {
          uniforms: {
            uNoise:     { value: params.noise,     type: 'f32' },
            uScanlines: { value: params.scanlines, type: 'bool' },
            uLineAlpha: { value: params.lineAlpha, type: 'f32' },
            uHShift:    { value: params.hShift,    type: 'f32' },
            uTime:      { value: 0,                type: 'f32' },
          },
        },
      })
    },

    updateUniforms(filter, params, elapsed) {
      const uniforms = (filter as any).resources?.uniforms?.uniforms
      if (!uniforms) return
      uniforms.uTime     = elapsed / 1000
      uniforms.uNoise    = params.noise
      uniforms.uScanlines = params.scanlines
      uniforms.uLineAlpha = params.lineAlpha
      uniforms.uHShift   = params.hShift
    },
  },

  // ── Motion part (animated glitch band) ───────────────────────────────────

  mount(ctx) {
    const band = new Graphics()
    ;(ctx as any)._vhsBand = band
    ;(ctx as any)._bandY = Math.random() * ctx.height

    const draw = () => {
      band.clear()
      band.rect(0, (ctx as any)._bandY, ctx.width, 8)
      band.fill({ color: 0xffffff, alpha: ctx.params.bandAlpha as number })
    }
    draw()
    ctx.container.addChild(band)

    ;(ctx as any)._tickerFn = (ticker: Ticker) => {
      ;(ctx as any)._bandY += (ctx.params.bandSpeed as number) * ticker.deltaTime
      if ((ctx as any)._bandY > ctx.height + 20) (ctx as any)._bandY = -20
      draw()
    }
    ctx.ticker.add((ctx as any)._tickerFn)
  },

  unmount(ctx) {
    if ((ctx as any)._tickerFn) ctx.ticker.remove((ctx as any)._tickerFn)
    if ((ctx as any)._vhsBand) {
      ctx.container.removeChild((ctx as any)._vhsBand)
      ;(ctx as any)._vhsBand.destroy()
    }
  },

  onParamChange(ctx, key) {
    // bandAlpha is read live in the ticker fn via ctx.params — no extra work needed
  },
}
