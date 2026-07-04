# @clypra-studio/types

Shared TypeScript type definitions for all Clypra Studio packages - Single source of truth.

## Installation

```bash
npm install @clypra-studio/types
# or
pnpm add @clypra-studio/types
# or
yarn add @clypra-studio/types
```

## Usage

```typescript
import type { Effect, Frame, Graph, Job, Snapshot } from "@clypra-studio/types";

// Use individual type modules
import type { EffectDefinition, EffectMetadata } from "@clypra-studio/types/effect";
import type { GraphNode, GraphEdge } from "@clypra-studio/types/graph";
import type { FrameData } from "@clypra-studio/types/frame";
import type { JobConfig } from "@clypra-studio/types/job";
import type { SnapshotData } from "@clypra-studio/types/snapshot";
```

## Exports

- **`effect`** - Effect-related types and interfaces
- **`graph`** - Graph node and edge definitions
- **`frame`** - Frame data structures
- **`job`** - Job configuration types
- **`snapshot`** - Snapshot data types

## Features

- ✅ Comprehensive TypeScript definitions
- ✅ Modular exports for tree-shaking
- ✅ Zero runtime dependencies
- ✅ Shared across all Clypra Studio packages

## License

MIT

## Links

- [GitHub Repository](https://github.com/AIEraDev/clypra-studio)
- [Report Issues](https://github.com/AIEraDev/clypra-studio/issues)
- [npm Package](https://www.npmjs.com/package/@clypra-studio/types)
