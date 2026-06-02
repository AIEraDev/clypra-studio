# @clypra/engine

The core high-performance 2D Canvas text effect rendering, Lottie manipulation, and keyframe animation engine behind **Clypra Studio**.

Features a declarative configuration system to styling layers (glows, bevels, drop shadows, multi-stacks, gradients), procedural canvas brushes, timeline interpolation, and programmatic mutation of Bodymovin/Lottie files.

---

## 📦 Installation

Add `@clypra/engine` and its peer dependencies to your project:

```bash
npm install @clypra/engine jszip lottie-web
```

### Server-Side environments
If you are running the engine in Node.js or server-side environments where a native HTML5 Canvas context is unavailable, install `@napi-rs/canvas` to supply canvas capabilities:

```bash
npm install @napi-rs/canvas
```

---

## ✨ Features

- **Rich Multi-Layer Text Effects**: Combines linear/radial gradients, solid fills, multi-layer strokes, glow layers, drop shadows, and 3D bevel extrusions (both flat and perspective-skewed).
- **Procedural Canvas Brushes**: Support for custom rendering engines, such as the brush-and-drip `InkBrushEngine`.
- **Programmatic Lottie Mutation**: Load, parse, edit, inject styling, add keyframes/keyframes easing, and merge fonts into JSON-based Lottie animations.
- **Keyframe Timeline Engine**: Evaluate and animate any scene properties over time with linear, ease-in, ease-out, or ease-in-out curves.
- **Robust Font Management**: Automated loading, measurement, and custom aliasing to keep web-loaded fonts fully synchronized with canvas and Lottie layers.

---

## 🚀 Quick Start

### 1. Rendering a Text Effect

Use `renderTextEffectCore` to render standard text effects on any HTML5 2D Canvas or OffscreenCanvas context.

```typescript
import { renderTextEffectCore, defaultConfig } from "@clypra/engine";

// 1. Get your canvas and 2D context
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// 2. Customize the declarative config
const neonConfig = {
  ...defaultConfig,
  text: "HELLO CYBERPUNK",
  fontFamily: "Bebas Neue",
  fontSize: 90,
  fillType: "none", // Hollow neon effect
  strokeEnabled: true,
  strokeColor: "#FFFFFF",
  strokeWidth: 3,
  glowLayers: [
    { enabled: true, color: "#FF003C", blur: 12, opacity: 100, type: "outer" },
    { enabled: true, color: "#FF003C", blur: 35, opacity: 80, type: "outer" },
  ]
};

// 3. Render the text effect
renderTextEffectCore(ctx, neonConfig);
```

### 2. Loading Web Fonts

Initialize the font system to load standard design fonts (like Poppins or Montserrat) and dynamically generate variant rules so they render correctly in the canvas and inside Lottie compositions.

```typescript
import { initializeFontSystem, checkFontVariant } from "@clypra/engine";

async function setupFonts() {
  // Downloads Poppins + Montserrat from Google Fonts and configures @font-face aliases
  await initializeFontSystem();
  
  // Verify if a specific variant is ready for rendering
  if (checkFontVariant("Poppins-Bold")) {
    console.log("Font is ready to use!");
  }
}
```

### 3. Programmatic Lottie Mutations

Load, manipulate, and generate animations with standard shape, solid, text, or image layers.

```typescript
import { createBlankLottie, addTextLayer, addSolidLayer, addImageLayer, updateStaticProperty } from "@clypra/engine";

// Create a blank composition slate
let lottieData = createBlankLottie(1920, 1080, 30, 90); // 1920x1080, 30 FPS, 3 seconds

// Add layers
lottieData = addSolidLayer(lottieData, "Background", "#0d0d12", 1920, 1080);
lottieData = addTextLayer(lottieData, "Main Headline", "CLYPRA STUDIO");

// Adjust static properties (e.g. scale the text layer at index 0)
lottieData = updateStaticProperty(lottieData, 0, "ks.s", [120, 120, 100]);
```

### 4. Animating with Keyframes (Timeline)

Interpolate property configurations over time using the timeline engine.

```typescript
import { evaluateScene, createEmptyScene, resolveAnimatedScalar } from "@clypra/engine";

const scene = createEmptyScene({
  effectName: "Animated Glow",
  timeline: {
    duration: 3, // 3 seconds
    fps: 30,
    loop: true,
    tracks: [
      {
        layerId: "layer-logo-glow",
        paramPath: "layerOpacity",
        keyframes: [
          { time: 0, value: 0.2, easing: "easeInOut" },
          { time: 1.5, value: 1.0, easing: "easeInOut" },
          { time: 3, value: 0.2, easing: "easeInOut" },
        ],
      },
    ],
  },
});

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Evaluate the scene status at t = 1.5 seconds and draw it
evaluateScene(scene, 1.5, ctx);
```

---

## 🛠️ API Reference & Interfaces

### `TextEffectConfig`

The standard configuration interface controlling visual rendering properties on the canvas:

```typescript
export interface TextEffectConfig {
  text: string;
  effectName: string;

  // Typography
  fontFamily: string;
  fontWeight: number; // 400 - 900
  fontStyle: "normal" | "italic";
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;

  // Fills & Patterns
  fillType: "solid" | "linear" | "radial" | "pattern" | "none";
  fillColor: string;
  fillGradientAngle: number;
  fillGradientStops: { color: string; offset: number }[];
  patternType?: "chalk" | "noise" | "grunge" | "carbon" | "stripes" | "film" | "brushed" | "marble" | "halftone" | "paper";
  
  // Strokes
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  strokePosition: "outside" | "center" | "inside";
  strokeOpacity: number;
  strokeLineJoin: "round" | "miter" | "bevel";
  strokeBlur?: number;
  strokeType?: "single" | "double" | "neon";
  strokeColorSecondary?: string;
  strokeWidthSecondary?: number;
  strokeFadeRange?: number;

  // Glow & Shadow layers
  glowLayers: GlowLayer[];
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  shadowType: "drop" | "inner";

  // 3D Bevel Extrusion
  bevelEnabled: boolean;
  bevelDepth: number;
  bevelHighlight: string;
  bevelShadow: string;
  bevelDirection: "bottom-right" | "bottom" | "right";
  bevelCoreColor?: string;
  bevelEdgeColor?: string;
  bevelEdgeWidth?: number;
  bevelBlur?: number;
  bevelBlurColor?: string;
  bevelPerspectiveEnabled?: boolean;
  bevelVanishingPointX?: number;
  bevelVanishingPointY?: number;
  bevelFocalLength?: number;

  // Overlay stacks
  stackEnabled?: boolean;
  stackCount?: number;
  stackOffsetX?: number;
  stackOffsetY?: number;
  stackOpacityDecay?: number;
  stackColor1?: string;
  stackColor2?: string;
  stackColor3?: string;
  stackColor4?: string;

  // Canvas dimensions
  canvasWidth: number;
  canvasHeight: number;
  textPosX: "left" | "center" | "right";
  textPosY: "top" | "middle" | "bottom";
  autoFitText?: boolean;
  wrapText?: boolean;
}
```

### Core Functions

- **`renderTextEffectCore(ctx, cfg)`**: Evaluates and draws the static text configuration directly onto the canvas.
- **`initializeFontSystem()`**: Preloads standard Google Web Fonts and registers alias CSS mappings.
- **`evaluateScene(doc, time, ctx, options?)`**: Performs timeline track evaluations at a specific frame timestamp, applies mask transitions, and outputs the frames.
- **`evaluateConfig(cfg, time, ctx, options?)`**: Similar to `evaluateScene`, but migrates and runs static configs as unified scene assets.

### Lottie Mutations

- **`createBlankLottie(w, h, fps, durationFrames)`**: Generates a skeleton Bodymovin JSON setup.
- **`addSolidLayer(lottieData, name, color, w, h)`**: appends a solid color canvas/scene backing.
- **`addTextLayer(lottieData, name, text)`**: Appends an editable text node equipped with standard Poppins-Bold typography.
- **`addImageLayer(lottieData, name, base64Data, w, h)`**: Bundles base64-encoded image sources into Lottie assets.
- **`addOrUpdateKeyframe(lottieData, layerIndex, path, frame, value, easing)`**: Sets keyframe points on transform tracks (`"ks.p"`, `"ks.s"`, `"ks.o"`, `"ks.r"`, `"ks.a"`) with bezier curves (`"linear"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`).

---

## 🛠️ Development

Install root development tools:

```bash
npm install
```

### Build the Package
Transpile the typescript sources using `tsup`:

```bash
npm run build
```

### Test
Run unit tests verifying migrations, layout computations, and mutations:

```bash
npm run test
```

### Type Checking & Lint
Verify type safety:

```bash
npm run lint
```
