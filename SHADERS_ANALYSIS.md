# @clypra-studio/shaders Usage Analysis & Recommendations

## Current State

### Package Structure

The `@clypra-studio/shaders` package exists at `packages/shaders/` with the following exports:

**Available:**

- ✅ `utils` - GLSL utility functions (hash, noise, RGB↔HSV, luminance, vignette, posterize)
- ✅ `noise` - Noise shaders (film grain, perlin, simplex, cellular)

**Declared but Not Implemented:**

- ❌ `color` - Color effects (hue shift, saturation, contrast, etc.)
- ❌ `blur` - Blur effects (gaussian, motion, radial)
- ❌ `distortion` - Distortion effects (fisheye, wave, ripple)
- ❌ `composite` - Compositing operations (blend modes, masking)

### Critical Finding: **ZERO USAGE** 🚨

The `@clypra-studio/shaders` package is **NOT being used anywhere** in the codebase:

- ❌ No imports found in `clypra-studio/apps/`
- ❌ No imports found in `clypra-studio/packages/clypra-engine/`
- ❌ No imports found in `clypra-studio/packages/runtime/`
- ❌ Not listed as a dependency in any package.json files

### Shader Duplication Problem

Instead of using the centralized shader library, **every effect duplicates shader code:**

**Example 1: Vertex Shader Duplication** The same vertex shader is copy-pasted across 15+ files:

```typescript
const DEFAULT_VERTEX_SHADER = `
  in vec2 aPosition;
  out vec2 vTextureCoord;
  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  // ... identical code repeated everywhere
`;
```

Found in:

- `FilmGrainEffect.ts`
- `VignetteEffect.ts`
- `GlowEffect.ts`
- `HalationEffect.ts`
- `VHSEffect.ts`
- `LensFlareEffect.ts`
- `ColorAdjustmentsEffect.ts`
- `example.ts`
- And more...

**Example 2: Film Grain Implementation** The shaders package has `filmGrainShader` but it's NOT used by `FilmGrainEffect.ts`, which reimplements the same logic with slight variations.

**Example 3: Utility Function Duplication** Functions like `hash()`, `noise()`, `luminance()` are copy-pasted inline instead of using `glslUtils` from the shaders package.

---

## Recommendations

### 1. **Immediate Actions** (High Impact, Low Effort)

#### A. Make `@clypra-studio/shaders` a Dependency

Add to `packages/clypra-engine/package.json`:

```json
{
  "dependencies": {
    "@clypra-studio/shaders": "workspace:*"
  }
}
```

#### B. Refactor Vertex Shader Usage

Create a single source of truth:

**In `@clypra-studio/shaders/src/utils/index.ts`:**

```typescript
/**
 * Standard PixiJS v8 filter vertex shader
 * Use this for all effects to ensure consistency
 */
export const pixiV8VertexShader = `
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
```

**Then update all effects:**

```typescript
import { pixiV8VertexShader } from "@clypra-studio/shaders/utils";

const FRAGMENT_SHADER = `...`;

export const FilmGrainEffect: PixiEffectDefinition = {
  filterSpec: {
    create(params: ParamValues): Filter {
      return Filter.from({
        gl: {
          vertex: pixiV8VertexShader, // ✅ Single source
          fragment: FRAGMENT_SHADER,
        },
        // ...
      });
    },
  },
};
```

**Impact:**

- ✅ Eliminates ~500+ lines of duplicated code
- ✅ Single point of update if vertex shader logic changes
- ✅ Ensures all effects use correct PixiJS v8 conventions

---

### 2. **High-Value Improvements** (Medium Effort)

#### A. Modularize Fragment Shaders with Utilities

**Bad (current):**

```typescript
const FRAGMENT_SHADER = `
  // Inline utility functions
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) { /* ... */ }
  
  void main() {
    float n = noise(vTextureCoord);
    // ...
  }
`;
```

**Good (proposed):**

```typescript
import { glslUtils, noiseShaders } from "@clypra-studio/shaders";

const FRAGMENT_SHADER = `
  ${glslUtils}
  ${noiseShaders.perlin}
  
  void main() {
    float n = perlinNoise(vTextureCoord);
    // ...
  }
`;
```

**Impact:**

- ✅ Reusable, tested utility functions
- ✅ Consistent implementations across effects
- ✅ Easier to maintain and debug

#### B. Create Shader Composition Helpers

**Add to `@clypra-studio/shaders/src/utils/index.ts`:**

```typescript
/**
 * Compose a complete fragment shader from utilities and main code
 */
export function composeFragmentShader(options: { uniforms?: string[]; utils?: ("hash" | "noise" | "luminance" | "rgb2hsv" | "hsv2rgb")[]; noiseTypes?: ("perlin" | "simplex" | "cellular")[]; mainCode: string }): string {
  const parts: string[] = ["in vec2 vTextureCoord;", "out vec4 finalColor;", "uniform sampler2D uTexture;"];

  if (options.uniforms) {
    parts.push(...options.uniforms);
  }

  // Add requested utilities
  if (options.utils?.length) {
    parts.push(extractUtilities(glslUtils, options.utils));
  }

  if (options.noiseTypes?.length) {
    options.noiseTypes.forEach((type) => {
      parts.push(noiseShaders[type]);
    });
  }

  parts.push(options.mainCode);

  return parts.join("\n\n");
}
```

**Usage:**

```typescript
import { composeFragmentShader } from "@clypra-studio/shaders/utils";

const FRAGMENT_SHADER = composeFragmentShader({
  uniforms: ["uniform float uIntensity;", "uniform float uTime;"],
  utils: ["hash", "noise"],
  mainCode: `
    void main(void) {
      vec4 color = texture(uTexture, vTextureCoord);
      float grain = noise(vTextureCoord * 1000.0 + uTime);
      finalColor = vec4(color.rgb + grain * uIntensity, color.a);
    }
  `,
});
```

---

### 3. **Complete the Shader Library** (Long-term)

#### A. Implement Missing Categories

**Priority 1: Color Effects**

```typescript
// packages/shaders/src/color/index.ts
export const hueShiftShader = `...`;
export const saturationShader = `...`;
export const contrastShader = `...`;
export const brightnessShader = `...`;
export const colorGradingShader = `...`;
```

**Priority 2: Blur Effects**

```typescript
// packages/shaders/src/blur/index.ts
export const gaussianBlurShader = `...`;
export const motionBlurShader = `...`;
export const radialBlurShader = `...`;
export const bokehBlurShader = `...`;
```

**Priority 3: Distortion**

```typescript
// packages/shaders/src/distortion/index.ts
export const wavesShader = `...`;
export const rippleShader = `...`;
export const fisheyeShader = `...`;
export const bulgePinchShader = `...`;
```

#### B. Add Shader Presets

**Create `packages/shaders/src/presets/index.ts`:**

```typescript
import { composeFragmentShader } from "../utils";
import { filmGrainShader } from "../noise";

export const presets = {
  filmGrain: {
    vertex: pixiV8VertexShader,
    fragment: composeFragmentShader({
      uniforms: ["uniform float uIntensity;", "uniform float uTime;"],
      noiseTypes: ["perlin"],
      mainCode: filmGrainShader,
    }),
  },
  vignette: {
    vertex: pixiV8VertexShader,
    fragment: composeFragmentShader({
      uniforms: ["uniform float uIntensity;", "uniform float uExtent;"],
      utils: ["vignette"],
      mainCode: `
        void main() {
          vec4 color = texture(uTexture, vTextureCoord);
          float v = vignette(vTextureCoord, uIntensity, uExtent);
          finalColor = vec4(color.rgb * v, color.a);
        }
      `,
    }),
  },
};
```

---

### 4. **Quality Improvements**

#### A. Add TypeScript Types

```typescript
// packages/shaders/src/types.ts
export interface ShaderSource {
  vertex: string;
  fragment: string;
}

export interface ShaderUniforms {
  [key: string]: {
    type: "f32" | "vec2" | "vec3" | "vec4" | "mat3" | "mat4";
    value: number | number[];
  };
}

export interface ComposableShader {
  source: ShaderSource;
  uniforms: ShaderUniforms;
  requiredUtils?: string[];
}
```

#### B. Add Unit Tests

```typescript
// packages/shaders/src/__tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { glslUtils, composeFragmentShader } from "../utils";

describe("glslUtils", () => {
  it("should contain hash function", () => {
    expect(glslUtils).toContain("float hash(vec2 p)");
  });

  it("should contain noise function", () => {
    expect(glslUtils).toContain("float noise(vec2 p)");
  });
});

describe("composeFragmentShader", () => {
  it("should compose shader with utilities", () => {
    const shader = composeFragmentShader({
      utils: ["hash"],
      mainCode: "void main() { gl_FragColor = vec4(1.0); }",
    });
    expect(shader).toContain("float hash(");
    expect(shader).toContain("void main()");
  });
});
```

#### C. Add Documentation

````typescript
/**
 * Film grain shader for cinematic effects
 *
 * @example
 * ```typescript
 * import { filmGrainShader, composeFragmentShader } from '@clypra-studio/shaders';
 *
 * const shader = composeFragmentShader({
 *   uniforms: ['uniform float uIntensity;'],
 *   noiseTypes: ['perlin'],
 *   mainCode: filmGrainShader
 * });
 * ```
 *
 * @requires uniforms: uIntensity, uSize, uTime
 * @see https://en.wikipedia.org/wiki/Film_grain
 */
export const filmGrainShader = `...`;
````

---

## Migration Plan

### Phase 1: Foundation (Week 1)

- [ ] Add `@clypra-studio/shaders` as dependency to `clypra-engine`
- [ ] Export `pixiV8VertexShader` from shaders package
- [ ] Create `composeFragmentShader` helper
- [ ] Add TypeScript types

### Phase 2: Refactor Existing Effects (Week 2-3)

- [ ] Update all 15+ effects to use `pixiV8VertexShader`
- [ ] Refactor `FilmGrainEffect` to use shader library utilities
- [ ] Refactor `VignetteEffect` to use shader library utilities
- [ ] Update 5 more high-priority effects

### Phase 3: Complete Library (Week 4+)

- [ ] Implement color effects category
- [ ] Implement blur effects category
- [ ] Implement distortion effects category
- [ ] Add shader presets
- [ ] Write comprehensive tests
- [ ] Write documentation with examples

---

## Expected Benefits

### Code Quality

- ✅ **-2000+ lines** of duplicated code removed
- ✅ **Single source of truth** for all shaders
- ✅ **Tested, documented** shader utilities

### Developer Experience

- ✅ **Faster effect development** - compose from library instead of writing from scratch
- ✅ **Fewer bugs** - reuse battle-tested shader code
- ✅ **Better consistency** - all effects use same conventions

### Performance

- ✅ **No performance impact** - shaders are still inlined at build time
- ✅ **Better maintainability** - easier to optimize shared utilities

### Maintenance

- ✅ **Easier updates** - fix once, fixes everywhere
- ✅ **Better onboarding** - new developers have clear patterns to follow
- ✅ **Scalability** - easy to add new effect categories

---

## Example: Before & After

### Before (Current)

```typescript
// FilmGrainEffect.ts (120 lines)
const DEFAULT_VERTEX_SHADER = `
  in vec2 aPosition;
  out vec2 vTextureCoord;
  // ... 20 lines of boilerplate
`;

const FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;
  
  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main(void) {
    // ... implementation
  }
`;
```

### After (Proposed)

```typescript
// FilmGrainEffect.ts (40 lines)
import { pixiV8VertexShader, composeFragmentShader } from "@clypra-studio/shaders";

const FRAGMENT_SHADER = composeFragmentShader({
  uniforms: ["uniform float uIntensity;", "uniform float uSize;", "uniform float uTime;"],
  utils: ["hash"],
  mainCode: `
    void main(void) {
      vec4 color = texture(uTexture, vTextureCoord);
      vec2 uvNoise = floor(vTextureCoord * (1000.0 / uSize)) / (1000.0 / uSize);
      float noise = hash(uvNoise + uTime) * 2.0 - 1.0;
      finalColor = vec4(color.rgb + noise * uIntensity * 0.15 * color.a, color.a);
    }
  `,
});

export const FilmGrainEffect: PixiEffectDefinition = {
  filterSpec: {
    create: () =>
      Filter.from({
        gl: { vertex: pixiV8VertexShader, fragment: FRAGMENT_SHADER },
      }),
  },
};
```

**Result:** 80 lines removed, more readable, reuses tested components.

---

## Priority Ranking

1. **🔥 Critical:** Add vertex shader to library and refactor all effects (Week 1)
2. **⚡ High:** Create composition helpers and migrate 3-5 key effects (Week 2)
3. **📈 Medium:** Complete color/blur/distortion categories (Week 3-4)
4. **🎯 Nice-to-have:** Advanced presets and optimizations (Future)

---

## Questions to Consider

1. Should the shaders package be published to npm for external use?
2. Should we support both PixiJS v7 and v8 shader formats?
3. Do we need a shader validation/linting tool?
4. Should we generate shader documentation automatically from code?

---

_Generated: 2026-07-10_ _Author: Kiro AI Analysis_
