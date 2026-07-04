# @clypra-studio/feature-providers

Extensible feature providers for Body Effect Lab. Provides body segmentation, chroma key, and other feature extraction capabilities.

## Installation

```bash
npm install @clypra-studio/feature-providers
# or
pnpm add @clypra-studio/feature-providers
# or
yarn add @clypra-studio/feature-providers
```

## Usage

```typescript
import { createDefaultProviderManager } from "@clypra-studio/feature-providers";
import { BodySegmentationProvider } from "@clypra-studio/feature-providers/segmentation";
import { ChromaKeyProvider } from "@clypra-studio/feature-providers/chroma-key";

// Create a provider manager
const manager = createDefaultProviderManager();

// Use body segmentation
const segmentationProvider = new BodySegmentationProvider();
const mask = await segmentationProvider.segment(imageData);

// Use chroma key
const chromaProvider = new ChromaKeyProvider({ color: "#00FF00" });
const result = await chromaProvider.process(imageData);
```

## Features

- ✅ **Body Segmentation** - Segment human bodies from video frames
- ✅ **Chroma Key** - Green screen and color key effects
- ✅ **Extensible Architecture** - Plugin-based provider system
- ✅ **WebGL Acceleration** - GPU-accelerated processing
- ✅ **TypeScript Support** - Full type definitions

## Entry Points

- **`@clypra-studio/feature-providers`** - Main exports and provider manager
- **`@clypra-studio/feature-providers/types`** - TypeScript type definitions
- **`@clypra-studio/feature-providers/segmentation`** - Body segmentation provider
- **`@clypra-studio/feature-providers/chroma-key`** - Chroma key provider

## License

MIT

## Links

- [GitHub Repository](https://github.com/AIEraDev/clypra-studio)
- [Report Issues](https://github.com/AIEraDev/clypra-studio/issues)
- [npm Package](https://www.npmjs.com/package/@clypra-studio/feature-providers)
