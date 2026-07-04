# @clypra-studio/ui

Shared UI components for all Clypra Studio Labs. Built with React, TypeScript, and Tailwind CSS.

## Installation

```bash
npm install @clypra-studio/ui
# or
pnpm add @clypra-studio/ui
# or
yarn add @clypra-studio/ui
```

## Usage

```typescript
import { GraphInspector, PassInspector, ResourceInspector, PerformanceMonitor, PreviewCanvas, Timeline, PresetManager, ValidationPanel } from "@clypra-studio/ui";

// Use UI components in your React app
function MyApp() {
  return (
    <div>
      <PreviewCanvas width={1920} height={1080} />
      <Timeline duration={10000} />
      <GraphInspector graph={myGraph} />
    </div>
  );
}
```

## Features

- ✅ **Graph Inspector** - Visualize and debug render graphs
- ✅ **Pass Inspector** - Inspect individual render passes
- ✅ **Resource Inspector** - Monitor textures and buffers
- ✅ **Performance Monitor** - Real-time performance metrics
- ✅ **Preview Canvas** - Responsive canvas with controls
- ✅ **Timeline** - Keyframe timeline editor
- ✅ **Preset Manager** - Save and load effect presets
- ✅ **Validation Panel** - Display validation errors and warnings
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Styled with utility classes

## Components

### Core Components

- `GraphInspector` - Render graph visualization
- `PassInspector` - Render pass details
- `ResourceInspector` - Resource management UI
- `PerformanceMonitor` - FPS and performance stats

### Canvas Components

- `PreviewCanvas` - Main preview canvas
- `ResponsivePreviewCanvas` - Auto-sizing canvas

### Timeline Components

- `Timeline` - Keyframe timeline editor
- `TimelineTrack` - Individual track component

### Utility Components

- `PresetManager` - Preset management UI
- `ValidationPanel` - Error and warning display

## Styling

The package includes pre-built CSS. Import it in your app:

```typescript
import "@clypra-studio/ui/dist/index.css";
```

Or use your own Tailwind CSS configuration to style the components.

## License

MIT

## Links

- [GitHub Repository](https://github.com/AIEraDev/clypra-studio)
- [Report Issues](https://github.com/AIEraDev/clypra-studio/issues)
- [npm Package](https://www.npmjs.com/package/@clypra-studio/ui)
