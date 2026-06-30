# @clypra/types

Single source of truth for all type definitions in Clypra Studio.

## Purpose

This package serves as the **contract** between all other packages in the Clypra monorepo. It eliminates type duplication and provides a centralized location for all shared type definitions.

## Philosophy

- **Single Source of Truth**: All shared types live here
- **Contract-First**: Types define the interface between packages
- **Zero Dependencies**: This package has no runtime dependencies
- **Immutable by Design**: Most types use `readonly` to enforce immutability

## Type Categories

### Effect Types (`effect.ts`)

Core effect system types used across all labs:

- `EffectDefinition` - Effect metadata and schema
- `EffectInstance` - Instantiated effect with parameters
- `EffectCapabilities` - What an effect can do
- `EffectRequirements` - What an effect needs
- `AppliedEffect` - Effect applied to a timeline

### Graph Types (`graph.ts`)

Media processing graph structures:

- `GraphNode` - Node in the effect graph
- `GraphEdge` - Connection between nodes
- `MediaProcessingGraph` - Complete graph structure
- `GraphHelper` - Immutable graph manipulation utilities

### Frame Types (`frame.ts`)

Frame-level rendering structures:

- `FrameGraph` - Frame dependency graph
- `RenderPass` - Single rendering pass
- `ResourceRequest` - Resource requirements

### Job Types (`job.ts`)

Immutable render job definitions:

- `RenderJob` - Complete render job (like SQL execution plan)
- `PassDescriptor` - Pass-level execution details
- `ExecutionResult` - Results after execution

### Snapshot Types (`snapshot.ts`)

Runtime observability snapshots:

- `RuntimeSnapshot` - Top-level snapshot with all subsystems
- `GraphSnapshot` - What was planned
- `ExecutionSnapshot` - What happened
- `ResourceSnapshot` - Allocation state
- `PerformanceSnapshot` - Timing and memory
- `DiagnosticSnapshot` - Errors and warnings

## Usage

Import types from this package in any other package:

```typescript
import type { EffectDefinition, RenderJob, RuntimeSnapshot } from "@clypra/types";
```

## Import Conventions

**DO** import from `@clypra/types`:

```typescript
import type { EffectDefinition, RenderJob } from "@clypra/types";
```

**DON'T** import from other packages for shared types:

```typescript
// ❌ Wrong
import type { EffectDefinition } from "@clypra/runtime";

// ✅ Correct
import type { EffectDefinition } from "@clypra/types";
```

## Type Organization

Types are organized by domain, not by usage:

- `effect.ts` - All effect-related types
- `graph.ts` - All graph-related types
- `frame.ts` - All frame-level types
- `job.ts` - All render job types
- `snapshot.ts` - All observability types

## Migration Notes

This package was created to consolidate types previously duplicated across:

- `@clypra/runtime`
- `@clypra/ui`
- `@clypra/studio`
- `@clypra/engine`

Old imports will continue to work temporarily through re-exports, but new code should import from `@clypra/types`.

## Development

```bash
# Build the package
npm run build

# Type check
npm run type-check
```

## Architecture

This package is **dependency-free** and sits at the bottom of the dependency tree:

```
@clypra/types (no dependencies)
     ↑
     ├── @clypra/runtime
     ├── @clypra/engine
     ├── @clypra/ui
     └── @clypra/studio
```
