# Architecture Audit: Type Duplication Issues

## 🚨 Critical Problem

We have **NO single source of truth** for core types. The same interfaces are duplicated across multiple packages, leading to:

- ❌ Inconsistent definitions
- ❌ Maintenance nightmare (change in 3 places)
- ❌ Version mismatch bugs
- ❌ TypeScript errors when types drift
- ❌ Confusing import paths

---

## 📊 Duplication Analysis

### 1. **Effect-Related Types** (20+ duplicates!)

**Found in:**

- `clypra-studio/packages/runtime/src/graph/builder.ts` → `EffectDefinition`
- `clypra-studio/packages/runtime/src/graph/types.ts` → `EffectCapabilities`, `EffectRequirements`
- `clypra-studio/packages/runtime/src/validation/effectValidator.ts` → `EffectDefinition`
- `clypra-studio/packages/clypra-engine/src/runtimeContract.ts` → `EffectCapabilities`, `EffectProfile`
- `clypra-studio/packages/clypra-engine/src/v2/graph/types.ts` → `EffectCapabilities`, `EffectRequirements`
- `clypra-studio/packages/clypra-engine/src/v2/project/types.ts` → `EffectInstance`
- `clypra-studio/packages/clypra-engine/src/videoEffects/types.ts` → `EffectPreset`, `EffectParameters`, `AppliedEffect`
- `clypra-studio/packages/clypra-engine/src/types.ts` → Multiple `Effect*` interfaces
- `clypra/src/features/video-effects/types.ts` → `EffectPreset`, `EffectParameters`, `AppliedEffect`
- `clypra/src/types/index.ts` → `ClipEffect`, `VideoEffectClip`, `BodyEffectClip`

**Status:** 🔴 **CRITICAL** - Same concepts, different definitions

---

### 2. **Graph Types** (3 duplicates)

**`MediaProcessingGraph`:**

- `packages/runtime/src/graph/types.ts`
- `packages/clypra-engine/src/v2/graph/types.ts`

**Status:** 🔴 **CRITICAL** - Core pipeline type duplicated

---

### 3. **Frame Graph Types** (3 duplicates)

**`FrameGraph`:**

- `packages/runtime/src/planner/types.ts`
- `packages/clypra-engine/src/runtimeContract.ts`
- `packages/clypra-engine/src/v2/planner/types.ts`

**Status:** 🔴 **CRITICAL** - Core pipeline type duplicated

---

### 4. **Snapshot Types** (Unique - ✅ Good!)

**`RuntimeSnapshot`:**

- `packages/runtime/src/state/types.ts` ← **Single source of truth**

**Status:** ✅ **GOOD** - Only one definition

---

### 5. **Job Types** (Unique - ✅ Good!)

**`RenderJob`, `ExecutionResult`:**

- `packages/runtime/src/job/types.ts` ← **Single source of truth**

**Status:** ✅ **GOOD** - Only one definition

---

## 🎯 Root Cause Analysis

### Why did this happen?

1. **Multiple packages evolved independently**
   - `@clypra/clypra-engine` was built first
   - `@clypra/runtime` was added later for V2 pipeline
   - Types were copied instead of imported

2. **No clear package boundaries**
   - Unclear which package owns which types
   - No enforced dependency direction

3. **V2 migration incomplete**
   - Old types in `clypra-engine`
   - New types in `runtime`
   - Both being used simultaneously

---

## 🏗️ Proposed Architecture

### Package Hierarchy (Single Source of Truth)

```
@clypra/types (NEW)
├── effect.ts           ← Effect definitions
├── graph.ts            ← MediaProcessingGraph
├── frame.ts            ← FrameGraph
├── job.ts              ← RenderJob (move from runtime)
├── snapshot.ts         ← RuntimeSnapshot (move from runtime)
└── index.ts

@clypra/runtime
├── depends on: @clypra/types
├── graph/              ← Builds MediaProcessingGraph
├── planner/            ← Generates FrameGraph
├── executor/           ← Executes RenderJob
├── state/              ← Generates RuntimeSnapshot
└── pixi/               ← Renders

@clypra/clypra-engine
├── depends on: @clypra/types, @clypra/runtime
├── effects/            ← Effect implementations
└── nodes/              ← Node registry

@clypra/ui
├── depends on: @clypra/types, @clypra/runtime
├── PreviewCanvas       ← Uses RuntimeSnapshot
└── RuntimeObservatory  ← Displays RuntimeSnapshot

@clypra/feature-providers
├── depends on: @clypra/types
└── segmentation/       ← Body tracking

apps/studio
├── depends on: ALL packages
└── Integration layer
```

---

## 🔧 Migration Plan

### Phase 1: Create @clypra/types package ✅

```bash
mkdir -p packages/types/src
npm init -w packages/types
```

**Files to create:**

- `packages/types/src/effect.ts` - All effect-related types
- `packages/types/src/graph.ts` - MediaProcessingGraph, GraphNode, etc.
- `packages/types/src/frame.ts` - FrameGraph, RenderPass, ResourceRequest
- `packages/types/src/job.ts` - RenderJob, ExecutionResult
- `packages/types/src/snapshot.ts` - RuntimeSnapshot and subsystems
- `packages/types/src/index.ts` - Barrel export

### Phase 2: Move types from runtime → types ✅

- Move `packages/runtime/src/job/types.ts` → `packages/types/src/job.ts`
- Move `packages/runtime/src/state/types.ts` → `packages/types/src/snapshot.ts`
- Move `packages/runtime/src/graph/types.ts` → `packages/types/src/graph.ts`
- Move `packages/runtime/src/planner/types.ts` → `packages/types/src/frame.ts`

### Phase 3: Update runtime imports ✅

```typescript
// Before:
import type { RenderJob } from "./job/types";

// After:
import type { RenderJob } from "@clypra/types";
```

### Phase 4: Deduplicate clypra-engine ⚠️

- Remove duplicate types from `packages/clypra-engine/src/v2/`
- Import from `@clypra/types` instead
- Keep only engine-specific implementation types

### Phase 5: Update UI package ✅

- Change imports from `@clypra/runtime/state` to `@clypra/types`
- Change imports from `@clypra/runtime/job` to `@clypra/types`

### Phase 6: Update studio app ⚠️

- Remove duplicate types from `apps/studio/src/types/`
- Import from `@clypra/types`

### Phase 7: Deprecate old locations 🚫

- Add `@deprecated` JSDoc comments
- Set up ESLint rule to prevent imports from old locations

---

## ✅ Benefits

1. **Single source of truth** - One place to change types
2. **Type safety** - No version drift between packages
3. **Clear ownership** - Types package is the contract
4. **Easier refactoring** - Change once, works everywhere
5. **Better DX** - Clearer import paths
6. **Smaller bundles** - No duplicate type definitions

---

## 📝 Import Convention

```typescript
// ✅ CORRECT - Import from @clypra/types
import type { RenderJob, ExecutionResult, RuntimeSnapshot, MediaProcessingGraph, FrameGraph } from "@clypra/types";

// ❌ WRONG - Don't import from implementation packages
import type { RenderJob } from "@clypra/runtime/job";
import type { FrameGraph } from "@clypra/runtime/planner";
```

---

## 🚀 Next Steps

1. [ ] Create `@clypra/types` package
2. [ ] Move core types to types package
3. [ ] Update all imports in runtime
4. [ ] Update all imports in ui
5. [ ] Deduplicate clypra-engine
6. [ ] Update studio app
7. [ ] Add ESLint rule to enforce imports
8. [ ] Document in CONTRIBUTING.md
9. [ ] Update README with package architecture
10. [ ] Remove old type files

---

## 📚 Related Issues

- Type inconsistency bugs
- Circular dependency risks
- Confusing import paths
- Duplicate maintenance work

---

## 🎓 Lessons Learned

1. **Define package boundaries early** - Don't let types drift
2. **Types package is essential** - Should be created from day 1
3. **Enforce import rules** - Use ESLint to prevent violations
4. **Document architecture** - Clear package hierarchy
5. **Regular audits** - Check for duplication monthly
