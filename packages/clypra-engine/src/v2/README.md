# Pipeline V2 - Deprecated

⚠️ **This directory is deprecated and will be removed in v3.0.0**

All V2 pipeline functionality has been consolidated into `@clypra/runtime`. Please migrate your imports.

---

## Migration Guide

### Project Types

**Before:**

```typescript
import type { ProjectManifestV2, TrackDefinition, ClipSegment } from "@clypra/engine/v2/project/types";
```

**After:**

```typescript
import type { ProjectManifestV2, TrackDefinition, ClipSegment } from "@clypra/runtime/project";
```

---

### Project Compiler

**Before:**

```typescript
import { ProjectCompiler } from "@clypra/engine/v2/compiler/ProjectCompiler";
```

**After:**

```typescript
import { ProjectCompiler } from "@clypra/runtime/compiler";
```

---

### Node Registry

**Before:**

```typescript
import { NodeRegistry } from "@clypra/engine/v2/graph/NodeRegistry";
```

**After:**

```typescript
import { NodeRegistry } from "@clypra/runtime/graph";
```

---

### Graph Types

**Before:**

```typescript
import type { MediaProcessingGraph, GraphNode, GraphEdge } from "@clypra/engine/v2/graph/types";
```

**After:**

```typescript
import type { MediaProcessingGraph, GraphNode, GraphEdge } from "@clypra/types";
// Graph types are now in the central types package
```

---

### Planner Types

**Before:**

```typescript
import type { FrameGraph, RenderPass, ResourceRequest } from "@clypra/engine/v2/planner/types";
```

**After:**

```typescript
import type { FrameGraph, RenderPass, ResourceRequest } from "@clypra/runtime/planner";
// Note: Runtime version includes additional properties (blendMode, clearBeforeRender, PlannerConfig)
```

---

### Frame Graph Builder

**Before:**

```typescript
import { FrameGraphBuilder } from "@clypra/engine/v2/planner/FrameGraphBuilder";
const frameGraph = FrameGraphBuilder.build(graph, timeMs, frameNum, width, height, registry);
```

**After:**

```typescript
import { FrameGraphPlanner } from "@clypra/runtime/planner";
const planner = new FrameGraphPlanner({ targetWidth: width, targetHeight: height });
const frameGraph = planner.plan(graph, frameNum, timeMs);
```

**Note:** The engine/v2 FrameGraphBuilder has MORE COMPLETE functionality including:

- NodeRegistry integration for dynamic shader planning
- Clip activation logic
- Better multipass support
- This will be merged into runtime in a future update

---

### Graph Validator

**Before:**

```typescript
import { GraphValidator } from "@clypra/engine/v2/validation/GraphValidator";
const validator = new GraphValidator(registry);
const result = validator.validate(graph);
```

**After:**

```typescript
import { GraphValidator } from "@clypra/runtime/graph";
const validator = new GraphValidator();
const result = validator.validate(graph);
```

**Note:** The engine/v2 validator has MORE COMPLETE functionality including:

- NodeRegistry integration
- Better error details with cycle path tracking
- validateEdge() helper for interactive editors
- This will be merged into runtime in a future update

---

### Render Backends

**Before:**

```typescript
import { PixiRenderBackend } from "@clypra/engine/v2/backends";
import { NullBackend } from "@clypra/engine/v2/runtime/NullBackend";
```

**After:**

```typescript
import { PixiRenderer, NullRenderer } from "@clypra/runtime/renderer";
```

---

## Architecture Changes

The V2 pipeline has been consolidated from a split architecture:

**Old (Deprecated):**

- `@clypra/engine/v2/` - Incomplete implementation, mixed concerns
- `@clypra/runtime/` - Separate implementation, some duplication

**New (Current):**

- `@clypra/types` - All shared types (single source of truth)
- `@clypra/runtime` - Complete V2 pipeline implementation
  - `/project` - Project model and types
  - `/compiler` - ProjectCompiler for NLE → MPG
  - `/graph` - Graph types, NodeRegistry, validator
  - `/planner` - Frame graph planning
  - `/renderer` - Execution backends (Pixi, Null)
  - `/job` - RenderJob system
  - `/snapshot` - Runtime state management

---

## What's Still Here?

All files in this directory remain for backward compatibility but are marked `@deprecated`. They will continue to work until v3.0.0.

**Key files:**

- Project types, compiler, and NodeRegistry: **Already migrated** to runtime
- Validator and Planner: **Pending merge** - engine/v2 versions are more complete
- Backends: Runtime has equivalent implementations

---

## Timeline

- **v2.4.0** (Current): Deprecation warnings added, runtime versions available
- **v2.5.0**: Side-by-side support (both paths work)
- **v3.0.0**: This directory will be removed entirely

---

## Why Consolidate?

1. **Single source of truth** - No more wondering which implementation to use
2. **Better imports** - `@clypra/runtime` vs `@clypra/engine/v2`
3. **Cleaner architecture** - Runtime owns the V2 pipeline
4. **Reduced duplication** - One implementation, not two
5. **Easier maintenance** - All V2 code in one place

---

## Need Help?

- See `PHASE2_MIGRATION_PLAN.md` in the project root for detailed migration strategy
- See `DUPLICATION_SUMMARY.md` for the full audit that led to this consolidation
- Check runtime documentation for API changes and new features

---

**Last Updated**: 2026-07-01
