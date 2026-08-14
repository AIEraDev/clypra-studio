# @clypra-studio/types

Single source of truth for TypeScript type definitions across all Clypra Studio packages. Zero runtime dependencies.

## Installation

```bash
pnpm add @clypra-studio/types
```

## Domain Modules

- **`./overlay`** — Overlay Document schema, base scene node types, responsive breakpoints, & layout constraints.
- **`./primitives`** — Compositional primitives (RichText, Gradient, Icon, Metric, Progress, Chart, Table, Callout, Avatar).
- **`./export`** — Production export pipeline contracts, media encoder interfaces, and job descriptors.
- **`./effect`** — Effect definitions, capabilities, requirements, and preset manifests.
- **`./graph`** — Media processing graph nodes, edges, pin definitions, and `GraphHelper`.
- **`./frame`** — Frame graph, render pass descriptors, and planner configuration.
- **`./job`** — Render job contracts, execution policies, resource usage, and evaluation contexts.
- **`./snapshot`** — Runtime state snapshots, execution timelines, and diagnostic messages.
- **`./vefx`** — `.vefx` plugin bridge specifications, shader nodes, keyframe easing curves, audio bindings, CDL color wheel, and body effect states.

## Usage

```typescript
import type { 
  OverlayDocument, 
  RichTextNode, 
  EffectDefinition, 
  RenderJob, 
  RuntimeSnapshot 
} from "@clypra-studio/types";
```

## License

MIT
