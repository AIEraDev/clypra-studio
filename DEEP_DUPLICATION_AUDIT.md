# Deep Duplication Audit - All Packages

**Date**: 2026-06-30  
**Status**: CRITICAL - Multiple duplications found across packages

---

## Executive Summary

Beyond the type duplications already addressed in `@clypra/types`, there are **significant code duplications** across packages that need consolidation:

1. **Graph types duplicated** between `engine/v2/graph` and `runtime/graph`
2. **Effect type systems** scattered across multiple packages
3. **Utility functions** likely duplicated
4. **Constants and enums** redefined in multiple places

---

## 1. Graph Type System Duplication

### CRITICAL: MediaProcessingGraph duplicated in 3 locations

**Location 1**: `packages/runtime/src/graph/types.ts` (CANONICAL - in @clypra/types)

- Complete implementation with `GraphHelper` class
- Methods: `hasCycles()`, `topologicalSort()`, `findNode()`, `getDependencies()`
- GraphDataType includes: `Pose`, `FaceMesh` (body tracking specific)

**Location 2**: `packages/clypra-engine/src/v2/graph/types.ts` (ENGINE V2)

- Nearly identical to runtime version
- GraphDataType MISSING: `Pose`, `FaceMesh` (only video effects)
- Simpler `GraphHelper` (no `hasCycles()`, `topologicalSort()`)

**Location 3**: `packages/types/src/graph.ts` (NEW - CONSOLIDATION)

- Created to be single source of truth
- Based on runtime version (most complete)

### Recommendation:

- ✅ `packages/types/src/graph.ts` is the single source of truth
- ❌ `packages/runtime/src/graph/types.ts` should be removed (mark @deprecated, re-export from @clypra/types)
- ❌ `packages/clypra-engine/src/v2/graph/types.ts` should be removed (import from @clypra/types)

---

## 2. Effect Type System Duplication

### Problem: Three different effect type systems exist

#### System 1: Engine V1 (Text Effects)

**Location**: `packages/clypra-engine/src/types.ts`

Key types:

- `TextEffectConfig` - Massive config with 50+ properties
- `EffectFullDefinition` - Effect metadata + rendering properties
- `EffectIndexItem` - Effect catalog entry
- `EffectFill`, `EffectStroke`, `EffectShadow`, `EffectBevel`, `EffectGlow`, `EffectPanel`, `EffectStack`

**Purpose**: Text rendering engine (Lottie-based)

#### System 2: Engine V1 (Video Effects)

**Location**: `packages/clypra-engine/src/videoEffects/types.ts`

Key types:

- `OverlayAsset` - Video overlay files (smoke.mov, fire.mov)
- `EffectPreset` - JSON behavior definitions
- `FilterAsset` - Canvas filter definitions
- `EffectRenderer` - 50+ renderer names (blur, glitch, vhs, etc.)
- `AppliedEffect`, `AppliedOverlay` - Timeline clip effects

**Purpose**: Video effect rendering (PixiJS-based)

#### System 3: Types Package (V2 MPG)

**Location**: `packages/types/src/effect.ts`

Key types:

- `EffectDefinition` - V2 unified definition
- `EffectInstance` - Instantiated effect
- `EffectCapabilities` - What effect can do
- `EffectRequirements` - What effect needs
- `AppliedEffect` - Effect on timeline

**Purpose**: V2 unified effect system

### Analysis:

**These are NOT duplicates** - they serve different purposes:

- Engine V1 Text: Lottie/SVG text rendering
- Engine V1 Video: PixiJS video effects
- Types V2: Unified MPG system

**However**, there IS overlap:

- `EffectCapabilities` appears in all 3 systems
- `AppliedEffect` concept exists in V1 Video and V2
- Blend modes, easing functions redefined

### Recommendation:

- Keep all three systems (different domains)
- Extract shared types to `@clypra/types`:
  - `BlendMode` type
  - `EasingFunction` type
  - Common parameter types
- Add cross-references in documentation

---

## 3. Utility Code Duplication

### Suspected duplications (need verification):

#### Color utilities

- `packages/clypra-engine/src/videoEffects/utils/colorUtils.ts`
- Likely duplicated in other packages

#### Canvas utilities

- `packages/clypra-engine/src/canvas-utils.ts`
- `packages/clypra-engine/src/videoEffects/utils/canvasUtils.ts`
- Possibly duplicated in UI package

#### Animation/Easing

- Easing functions likely defined in multiple places
- Keyframe interpolation logic

### Recommendation:

Create `@clypra/utils` package for shared utilities:

```
@clypra/utils/
├── color/
│   ├── conversions.ts
│   ├── manipulation.ts
│   └── parsing.ts
├── canvas/
│   ├── drawing.ts
│   └── transforms.ts
├── animation/
│   ├── easing.ts
│   └── interpolation.ts
└── math/
    ├── vectors.ts
    └── matrices.ts
```

---

## 4. Constants and Enums

### Suspected duplications:

#### Blend modes

- Defined in `videoEffects/types.ts`
- Likely redefined elsewhere

#### Effect categories

- Text effect categories in `engine/types.ts`
- Video effect categories in `videoEffects/types.ts`
- Body effect categories (somewhere)

### Recommendation:

Add to `@clypra/types`:

```typescript
// @clypra/types/src/constants.ts
export const BLEND_MODES = [...] as const;
export type BlendMode = typeof BLEND_MODES[number];

export const EFFECT_CATEGORIES = {
  text: [...],
  video: [...],
  body: [...],
  transition: [...]
} as const;
```

---

## 5. Package Architecture Analysis

### Current State:

```
packages/
├── types/           ✅ Created (types only)
├── runtime/         ⚠️  Has graph types (should re-export from @clypra/types)
├── clypra-engine/   ⚠️  Has v2 graph types (should import from @clypra/types)
│   ├── v2/          ⚠️  Duplicates runtime graph types
│   ├── videoEffects/ ℹ️  Unique to engine (video domain)
│   ├── textEffects/  ℹ️  Unique to engine (text domain)
│   └── transitions/  ℹ️  Unique to engine (transition domain)
├── ui/              ⚠️  Likely has duplicated utilities
├── shader-library/  ✅ Focused, minimal duplication risk
└── feature-providers/ ✅ Focused, minimal duplication risk
```

### Proposed Architecture:

```
packages/
├── types/           📦 Single source of truth for ALL shared types
├── utils/           📦 NEW: Shared utility functions
├── constants/       📦 NEW (optional): Shared constants/enums
├── runtime/         🎯 V2 pipeline (imports from types)
├── clypra-engine/   🎯 V1 engine + V2 backend (imports from types/utils)
├── ui/              🎯 React components (imports from types/utils)
├── shader-library/  🎯 Shader code
└── feature-providers/ 🎯 Feature detection
```

---

## 6. Immediate Action Items

### Phase 1: Fix Graph Type Duplication (HIGH PRIORITY)

1. ✅ `@clypra/types/src/graph.ts` already created
2. ❌ Update `packages/clypra-engine/src/v2/graph/types.ts`:
   ```typescript
   // @deprecated Import from @clypra/types instead
   export * from "@clypra/types";
   ```
3. ❌ Verify all imports and update:
   - `packages/clypra-engine/src/v2/compiler/`
   - `packages/clypra-engine/src/v2/planner/`
   - `packages/clypra-engine/src/v2/runtime/`
   - `packages/clypra-engine/src/v2/validation/`

### Phase 2: Extract Shared Constants (MEDIUM PRIORITY)

1. Extract `BlendMode` from `videoEffects/types.ts` → `@clypra/types/src/constants.ts`
2. Extract `EasingFunction` from `videoEffects/types.ts` → `@clypra/types/src/constants.ts`
3. Update all imports across packages

### Phase 3: Create @clypra/utils (LOW PRIORITY)

1. Audit all utility functions across packages
2. Create `@clypra/utils` package
3. Migrate common utilities
4. Update imports

### Phase 4: Documentation (ONGOING)

1. Update CONTRIBUTING.md with import rules
2. Add JSDoc @deprecated tags to old locations
3. Create ARCHITECTURE.md explaining package relationships

---

## 7. Breaking Changes Risk Assessment

### Low Risk (Safe to do now):

- ✅ Adding @deprecated tags
- ✅ Re-exporting from @clypra/types
- ✅ Adding new utility packages

### Medium Risk (Need testing):

- ⚠️ Removing duplicated type files
- ⚠️ Changing import paths in engine

### High Risk (Avoid):

- ❌ Merging different effect type systems
- ❌ Breaking engine V1 API

---

## 8. Verification Checklist

### Types Package

- [x] Created @clypra/types
- [x] Copied graph types
- [x] Copied snapshot types
- [x] Copied job types
- [x] Copied frame types
- [x] Copied effect types
- [x] Added to build pipeline
- [ ] Engine v2 imports from @clypra/types
- [ ] Removed duplicated graph types from engine

### Utils Package (Future)

- [ ] Created @clypra/utils
- [ ] Extracted color utilities
- [ ] Extracted canvas utilities
- [ ] Extracted animation utilities
- [ ] All packages updated to use @clypra/utils

### Constants (Future)

- [ ] Extracted blend modes
- [ ] Extracted easing functions
- [ ] Extracted effect categories
- [ ] Added to @clypra/types or separate package

---

## 9. Package Dependency Rules

### MUST FOLLOW:

1. **@clypra/types** → No dependencies (bottom of tree)
2. **@clypra/utils** → Only depends on @clypra/types
3. **@clypra/runtime** → Imports from @clypra/types
4. **@clypra/engine** → Imports from @clypra/types, @clypra/utils
5. **@clypra/ui** → Imports from @clypra/types, @clypra/runtime
6. **Apps** → Can import from any package

### NEVER:

- ❌ @clypra/types importing from other packages
- ❌ Circular dependencies
- ❌ Duplicating types in multiple packages

---

## 10. Next Steps

**Immediate (Today)**:

1. Update `packages/clypra-engine/src/v2/graph/types.ts` to re-export from @clypra/types
2. Add @clypra/types dependency to engine package.json
3. Run build and tests to verify no breakage

**Short-term (This Week)**:

1. Extract BlendMode and EasingFunction to @clypra/types
2. Audit utility functions for duplications
3. Update CONTRIBUTING.md with strict import rules

**Long-term (Next Sprint)**:

1. Create @clypra/utils package
2. Migrate common utilities
3. Add linting rules to prevent duplication

---

**Generated**: 2026-06-30  
**Last Updated**: 2026-06-30  
**Status**: IN PROGRESS - Phase 1 (Type consolidation)

---

## 11. CRITICAL FINDING: Name Collision in @clypra/types

**Date**: 2026-06-30 22:45  
**Severity**: CRITICAL

### Problem:

`EffectCapabilities` and `EffectRequirements` are defined in TWO places with DIFFERENT properties:

**Location 1**: `packages/types/src/effect.ts` (Effect System)

```typescript
interface EffectCapabilities {
  readonly temporal: boolean;
  readonly stateful: boolean;
  readonly requiresFrameHistory: number; // ← Different
  readonly requiresGPU: boolean; // ← Different
}

interface EffectRequirements {
  readonly temporalRadius: number;
  readonly preferredPrecision: "fp8" | "fp16" | "fp32";
  readonly minTextureSize: number; // ← Different
  readonly maxTextureSize: number; // ← Different
}
```

**Location 2**: `packages/types/src/graph.ts` (MPG Graph System)

```typescript
interface EffectCapabilities {
  readonly temporal: boolean;
  readonly stateful: boolean;
  readonly spatial: boolean; // ← Different
  readonly geometry: boolean; // ← Different
  readonly inputsCount: number; // ← Different
}

interface EffectRequirements {
  readonly temporalRadius: number;
  readonly preferredPrecision: "fp8" | "fp16" | "fp32";
  readonly multipass: boolean; // ← Different
  readonly supportsHalfResolution: boolean; // ← Different
}
```

### Impact:

When importing from `@clypra/types`, TypeScript resolves to the FIRST export in index.ts, which is from `effect.ts`. This breaks all code expecting the `graph.ts` version.

### Solution:

Rename the types to be domain-specific:

**Effect System** (`effect.ts`):

- `EffectCapabilities` → Keep as is (most common usage)
- `EffectRequirements` → Keep as is

**Graph/MPG System** (`graph.ts`):

- `EffectCapabilities` → Rename to `NodeCapabilities` or `GraphNodeCapabilities`
- `EffectRequirements` → Rename to `NodeRequirements` or `GraphNodeRequirements`

### Action Items:

1. ✅ Identified the collision
2. ❌ Rename graph types to `NodeCapabilities` and `NodeRequirements`
3. ❌ Update all imports in runtime package
4. ❌ Update all imports in engine v2 package
5. ❌ Update @clypra/types index.ts exports
6. ❌ Rebuild and test all packages

---
