# Duplication Analysis Summary

**Date**: 2026-06-30 23:00  
**Status**: COMPLETED - All critical duplications identified and documented

---

## ✅ RESOLVED: Name Collision

### Issue

`EffectCapabilities` and `EffectRequirements` were defined in TWO places:

- `packages/types/src/effect.ts` (Effect System)
- `packages/types/src/graph.ts` (MPG Graph System)

### Solution Applied

Renamed graph types to avoid collision:

- `EffectCapabilities` (graph) → `NodeCapabilities`
- `EffectRequirements` (graph) → `NodeRequirements`

### Files Updated

- ✅ `packages/types/src/graph.ts` - Renamed types
- ✅ `packages/types/src/index.ts` - Updated exports
- ✅ `packages/clypra-engine/src/v2/graph/NodeRegistry.ts` - Updated imports
- ✅ `packages/clypra-engine/src/v2/graph/types.ts` - Re-exports with legacy aliases
- ✅ `packages/runtime/src/graph/types.ts` - Renamed types with legacy aliases
- ✅ `packages/runtime/src/graph/index.ts` - Updated exports with legacy aliases

### Build Status

✅ All packages build successfully

---

## 🔴 CRITICAL: V2 Pipeline Duplication Between Engine and Runtime

### Problem

The V2 pipeline code is **duplicated** between two packages:

**Package 1: `@clypra/engine/v2`**

- Location: `packages/clypra-engine/src/v2/`
- Contains: Compiler, Planner, Runtime, Backends
- Purpose: **UNCLEAR** - Seems to be an older or alternative implementation

**Package 2: `@clypra/runtime`**

- Location: `packages/runtime/src/`
- Contains: Graph, Planner, Executor, State, Pixi/Null renderers
- Purpose: **PRIMARY** - This is the V2 pipeline we've been working on

### Detailed Comparison

#### Planner Types

**Engine V2** (`packages/clypra-engine/src/v2/planner/types.ts`):

```typescript
interface ResourceRequest {
  format: "rgba8" | "rgba16f" | "rgba32f" | "r8"; // ← Missing depth24
  // Missing blendMode and clearBeforeRender
}

interface RenderPass {
  // Basic implementation
}
```

**Runtime** (`packages/runtime/src/planner/types.ts`):

```typescript
interface ResourceRequest {
  format: "rgba8" | "rgba16f" | "rgba32f" | "r8" | "depth24"; // ← More complete
}

interface RenderPass {
  readonly blendMode?: string; // ← Additional properties
  readonly clearBeforeRender?: boolean;
}

interface PlannerConfig {
  // ← Only in runtime
  readonly targetWidth: number;
  readonly targetHeight: number;
  // ...
}
```

**Conclusion**: Runtime version is MORE COMPLETE

#### Runtime/Backend Types

**Engine V2** (`packages/clypra-engine/src/v2/runtime/types.ts`):

```typescript
interface RenderBackend {
  init(canvasElement?: HTMLCanvasElement): Promise<void>;
  allocateResource(...): void;
  releaseResource(...): void;
  compileShader(...): void;
  submit(commandBuffer: CommandBuffer): Promise<void>;
  readPixels(...): Promise<Uint8Array>;
  destroy(): void;
}
```

**Runtime** (`packages/runtime/src/`):

- Has `PixiRenderer` class (full implementation)
- Has `NullRenderer` class (headless validation)
- Has `Executor` (resource allocation, scheduling)
- Has `RuntimeStateTracker` (snapshot system)

**Conclusion**: Runtime has COMPLETE IMPLEMENTATIONS, engine v2 only has interfaces

### Graph Types

**Engine V2** (`packages/clypra-engine/src/v2/graph/types.ts`):

- NOW RE-EXPORTS FROM `@clypra/types` ✅
- Has legacy aliases for backward compatibility

**Runtime** (`packages/runtime/src/graph/types.ts`):

- NOW RE-EXPORTS FROM `@clypra/types` ✅
- Has legacy aliases for backward compatibility

**Conclusion**: RESOLVED - Both use `@clypra/types` as single source of truth

---

## 📊 Duplication Matrix

| Component        | Engine V2    | Runtime           | @clypra/types | Winner        |
| ---------------- | ------------ | ----------------- | ------------- | ------------- |
| Graph Types      | Re-export    | Re-export         | ✅ Source     | types         |
| NodeCapabilities | Re-export    | Re-export         | ✅ Source     | types         |
| NodeRequirements | Re-export    | Re-export         | ✅ Source     | types         |
| FrameGraph       | ✅ Has       | ✅ Has            | ✅ Source     | types         |
| RenderPass       | ⚠️ Basic     | ✅ Complete       | ✅ Source     | types/runtime |
| ResourceRequest  | ⚠️ Basic     | ✅ Complete       | ✅ Source     | types/runtime |
| RenderBackend    | ⚠️ Interface | ✅ Implementation | ❌ None       | runtime       |
| Executor         | ❌ None      | ✅ Has            | ❌ None       | runtime       |
| State Tracker    | ❌ None      | ✅ Has            | ❌ None       | runtime       |
| PixiRenderer     | ⚠️ Backend   | ✅ Full           | ❌ None       | runtime       |
| NullRenderer     | ⚠️ Backend   | ✅ Full           | ❌ None       | runtime       |

---

## 🎯 Recommendations

### Option 1: Deprecate Engine V2 (RECOMMENDED)

**Action**: Mark `packages/clypra-engine/src/v2/` as deprecated

**Rationale**:

1. Runtime has MORE COMPLETE implementations
2. Runtime has been actively developed (44 passing tests)
3. Engine V2 appears to be an older/incomplete version
4. Maintaining two V2 pipelines creates confusion

**Steps**:

1. Add `@deprecated` JSDoc to all engine/v2 files
2. Update engine/v2 to re-export from `@clypra/runtime` where possible
3. Document migration path in README
4. Remove engine/v2 in next major version

**Files to deprecate**:

```
packages/clypra-engine/src/v2/
├── backends/          → Use @clypra/runtime/pixi or @clypra/runtime/null
├── compiler/          → Unclear if needed, audit usage
├── contract/          → Move to @clypra/types if shared
├── graph/             → Already re-exports from @clypra/types ✅
├── planner/           → Use @clypra/runtime/planner
├── project/           → Audit for unique types
├── runtime/           → Use @clypra/runtime/executor
└── validation/        → Use @clypra/runtime/validation
```

### Option 2: Merge Engine V2 into Runtime

**Action**: Move unique engine/v2 code into runtime package

**Rationale**:

1. Consolidate all V2 pipeline code in one place
2. Avoid maintaining two parallel implementations

**Steps**:

1. Audit engine/v2 for unique functionality
2. Move unique code to runtime
3. Update imports across codebase
4. Delete engine/v2 directory

### Option 3: Keep Both (NOT RECOMMENDED)

**Action**: Maintain two separate V2 implementations

**Rationale**: None - creates maintenance burden and confusion

---

## 📋 Action Items

### Immediate (High Priority)

1. ✅ **COMPLETED**: Fix `EffectCapabilities`/`NodeCapabilities` name collision
2. ✅ **COMPLETED**: Ensure engine/v2/graph re-exports from @clypra/types
3. ✅ **COMPLETED**: Ensure runtime/graph re-exports from @clypra/types
4. ✅ **COMPLETED**: All packages build successfully
5. ❌ **TODO**: Audit engine/v2 usage in codebase
6. ❌ **TODO**: Decide on Option 1 or Option 2
7. ❌ **TODO**: Create migration plan

### Short-term (Medium Priority)

1. ❌ Extract `BlendMode` type to @clypra/types
2. ❌ Extract `EasingFunction` type to @clypra/types
3. ❌ Document V2 pipeline architecture
4. ❌ Add deprecation warnings if choosing Option 1

### Long-term (Low Priority)

1. ❌ Create @clypra/utils for shared utilities
2. ❌ Extract color/canvas utilities
3. ❌ Add linting rules to prevent duplication
4. ❌ Remove deprecated code in next major version

---

## 🔍 Files That Need Auditing

### Engine V2 Files

**Potentially Unique**:

- `packages/clypra-engine/src/v2/compiler/ProjectCompiler.ts` - May have unique logic
- `packages/clypra-engine/src/v2/project/types.ts` - May have unique types
- `packages/clypra-engine/src/v2/validation/GraphValidator.ts` - May differ from runtime validator

**Likely Duplicates**:

- `packages/clypra-engine/src/v2/planner/FrameGraphBuilder.ts` - Compare with runtime planner
- `packages/clypra-engine/src/v2/runtime/CommandBufferBuilder.ts` - Compare with runtime executor
- `packages/clypra-engine/src/v2/backends/PixiRenderBackend.ts` - Compare with runtime/pixi/renderer

**Already Resolved**:

- ✅ `packages/clypra-engine/src/v2/graph/types.ts` - Re-exports from @clypra/types
- ✅ `packages/clypra-engine/src/v2/planner/types.ts` - Imports from @clypra/types

---

## 📈 Progress Tracking

### Phase 1: Type Consolidation (COMPLETED ✅)

- [x] Created @clypra/types package
- [x] Fixed name collision (EffectCapabilities → NodeCapabilities)
- [x] Updated engine/v2/graph to use @clypra/types
- [x] Updated runtime/graph to use @clypra/types
- [x] All packages build successfully

### Phase 2: V2 Pipeline Deduplication (IN PROGRESS 🔄)

- [x] Identified engine/v2 vs runtime duplication
- [x] Documented differences in detail
- [ ] Audit engine/v2 usage in codebase
- [ ] Make decision: deprecate or merge
- [ ] Execute chosen option
- [ ] Update all imports

### Phase 3: Utility Consolidation (NOT STARTED ⏸️)

- [ ] Create @clypra/utils package
- [ ] Extract shared utilities
- [ ] Update imports across packages

### Phase 4: Documentation (ONGOING 📝)

- [x] Created DEEP_DUPLICATION_AUDIT.md
- [x] Created DUPLICATION_SUMMARY.md
- [x] Updated CONTRIBUTING.md with import rules
- [ ] Create ARCHITECTURE.md
- [ ] Document V2 pipeline architecture
- [ ] Add migration guides

---

## ✅ Verification Checklist

### Type System

- [x] @clypra/types package created
- [x] @clypra/types builds successfully
- [x] No name collisions in exports
- [x] Engine imports from @clypra/types
- [x] Runtime imports from @clypra/types
- [x] Legacy aliases provided for backward compatibility

### Build System

- [x] types package builds
- [x] runtime package builds
- [x] engine package builds
- [x] ui package builds
- [x] All workspaces install correctly
- [x] No circular dependencies

### Next Steps

- [ ] Audit engine/v2 actual usage
- [ ] Search codebase for `import.*from.*v2/` patterns
- [ ] Make deprecation/merge decision
- [ ] Implement chosen solution
- [ ] Run full test suite
- [ ] Update documentation

---

**Generated**: 2026-06-30 23:00  
**Last Updated**: 2026-06-30 23:00  
**Status**: Phase 1 COMPLETE ✅ | Phase 2 IN PROGRESS 🔄
