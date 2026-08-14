# @clypra-studio/feature-providers

Extensible feature provider architecture for Body & Masking Effects in Clypra Studio.

## Installation

```bash
pnpm add @clypra-studio/feature-providers
```

## Overview & Providers

Features providers produce real-time feature maps (segmentation masks, chroma key keys, pose tracking) that body effects consume.

- `FeatureProviderManager` — Central registry and manager for feature providers.
- `ChromaKeyProvider` — Green screen / color key mask extraction.
- `SegmentationProvider` — Person body segmentation mask provider.

## Usage

```typescript
import { createDefaultProviderManager } from "@clypra-studio/feature-providers";

// Create provider manager with built-in providers
const manager = createDefaultProviderManager();
```

## License

MIT
