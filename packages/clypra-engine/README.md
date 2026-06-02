# @clypra/engine

The rendering and animation engine powering [Clypra Studio](https://github.com/AIEraDev/clypra-studio) — a high-performance Canvas 2D text effects system with full Lottie JSON tooling, keyframe animation, and CapCut-style template support.

## Installation

```bash
npm install @clypra/engine
```

## Quick Start

```ts
import { textEffectConfigToScene, evaluateScene, defaultConfig } from "@clypra/engine";

// Build a scene from a config
const scene = textEffectConfigToScene({
  ...defaultConfig,
  text: "CLYPRA",
  fontFamily: "Poppins",
  fontWeight: 900,
  fontSize: 80,
  fillType: "linear",
  fillGradientStops: [
    { color: "#FF5500", offset: 0 },
    { color: "#FF0080", offset: 100 },
  ],
  bevelEnabled: true,
  bevelDepth: 16,
  bevelShadow: "#880000",
  bevelHighlight: "#FFFFFF",
  glowLayers: [{ enabled: true, color: "#FF2200", blur: 30, opacity: 60, type: "outer", strength: 2 }],
});

// Size the canvas to match the config
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = scene.canvas.width;
canvas.height = scene.canvas.height;
const ctx = canvas.getContext("2d")!;

// Wait for fonts, then draw
const fontSpec = `${scene.text.fontWeight} ${scene.text.fontSize}px "${scene.text.fontFamily}"`;
await document.fonts.load(fontSpec);
evaluateScene(scene, 0, ctx);
```

---

## Core Concepts

### TextEffectConfig

The flat config object that describes every visual property of a text effect. Pass it to `textEffectConfigToScene()` to convert it into a `SceneDocument` for rendering.

```ts
import { type TextEffectConfig, defaultConfig } from "@clypra/engine";

const config: TextEffectConfig = {
  ...defaultConfig,
  text: "MY TEXT",
  fontFamily: "Montserrat",
  fontWeight: 900,
  fontSize: 100,

  // Fill
  fillType: "solid", // "solid" | "linear" | "radial" | "pattern" | "none"
  fillColor: "#FFFFFF",
  fillGradientAngle: 90,
  fillGradientStops: [
    { color: "#FF5500", offset: 0 },
    { color: "#FF0080", offset: 100 },
  ],
  patternType: "grunge", // "chalk" | "noise" | "grunge" | "carbon" | "stripes" | "film" | "brushed" | "marble" | "halftone" | "paper"

  // Stroke
  strokeEnabled: true,
  strokeColor: "#FFFFFF",
  strokeWidth: 3,
  strokePosition: "outside", // "outside" | "center" | "inside"
  strokeOpacity: 100,
  strokeLineJoin: "round", // "round" | "miter" | "bevel"
  strokeBlur: 4, // soft glow on stroke edge
  strokeType: "single", // "single" | "double" | "neon"
  strokeColorSecondary: "#000000",
  strokeWidthSecondary: 6,
  strokeFadeRange: 0, // 0-100, vertical fade

  // Shadow
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 12,
  shadowOffsetX: 4,
  shadowOffsetY: 6,
  shadowOpacity: 80,
  shadowType: "drop", // "drop" | "inner"

  // Glow (up to 6 layers)
  glowLayers: [{ enabled: true, color: "#FF2200", blur: 30, opacity: 60, type: "outer", strength: 2, spread: 0 }],

  // 3D Bevel / Extrusion
  bevelEnabled: true,
  bevelDepth: 20,
  bevelHighlight: "#FFFFFF",
  bevelShadow: "#1A0000",
  bevelCoreColor: "#880000",
  bevelDirection: "bottom-right", // "bottom-right" | "bottom" | "right"
  bevelEdgeColor: "#333333",
  bevelEdgeWidth: 1,
  bevelBlur: 8,
  bevelBlurColor: "#000000",
  bevelPerspectiveEnabled: false,
  bevelVanishingPointX: 40,
  bevelVanishingPointY: 80,
  bevelFocalLength: 400,

  // Multi-stack extrusion
  stackEnabled: false,
  stackCount: 4,
  stackOffsetX: 10,
  stackOffsetY: -10,
  stackOpacityDecay: 20,
  stackColor1: "#FF7C00",
  stackColor2: "#00FFDD",
  stackColor3: "#FF00AA",
  stackColor4: "#AA00FF",

  // Background panel
  panelEnabled: false,
  panelColor: "#1A1A2E",
  panelOpacity: 90,
  panelRadius: 12,
  panelPaddingX: 40,
  panelPaddingY: 20,
  panelStrokeEnabled: false,
  panelStrokeColor: "#333333",
  panelStrokeWidth: 1,

  // Canvas
  canvasWidth: 800,
  canvasHeight: 200,
  textPosX: "center", // "left" | "center" | "right"
  textPosY: "middle", // "top" | "middle" | "bottom"
  wrapText: true,
  autoFitText: false,

  // Per-character fill
  perCharFillEnabled: false,
  charFillColors: [],
};
```

---

## Rendering

### `evaluateScene(scene, time, ctx)`

The main render function. Applies timeline animation at time `t` and draws to a Canvas 2D context.

```ts
import { evaluateScene, textEffectConfigToScene, defaultConfig } from "@clypra/engine";

const scene = textEffectConfigToScene({ ...defaultConfig, text: "HELLO" });
const ctx = canvas.getContext("2d")!;

// Static render at t=0
evaluateScene(scene, 0, ctx);

// Animated render loop
let t = 0;
const fps = 30;
setInterval(() => {
  t = (t + 1 / fps) % scene.timeline.duration;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  evaluateScene(scene, t, ctx);
}, 1000 / fps);
```

### Font Loading (Critical)

Always wait for fonts before drawing. Rendering before fonts are ready produces incorrect layout and missing effects like stroke blur.

```ts
import { preloadGoogleFont } from "@clypra/engine";

// Preload specific font
preloadGoogleFont("Montserrat", [400, 700, 900]);

// Wait for a specific face before drawing
const fontSpec = `${config.fontWeight} ${config.fontSize}px "${config.fontFamily}"`;
await document.fonts.load(fontSpec);

// Now draw
evaluateScene(scene, 0, ctx);
```

### Canvas Sizing

Always set canvas dimensions to match the config **before** drawing:

```ts
canvas.width = config.canvasWidth || 800;
canvas.height = config.canvasHeight || 200;
evaluateScene(scene, 0, ctx);
```

### ctx.filter Support

Stroke blur, bevel ambient blur, and bloom effects use `ctx.filter`. Verify support in your environment:

```ts
const testCtx = document.createElement("canvas").getContext("2d")!;
testCtx.filter = "blur(4px)";
const filterSupported = testCtx.filter !== "none" && testCtx.filter !== "";
```

If `ctx.filter` is not supported (some WebViews, React Native canvas), use the `WebGLCompositor` fallback:

```ts
import { evaluateScene, WebGLCompositor } from "@clypra/engine";

const compositor = new WebGLCompositor();
if (compositor.isSupported) {
  const off = new OffscreenCanvas(canvas.width, canvas.height);
  const offCtx = off.getContext("2d")!;
  evaluateScene(scene, 0, offCtx);
  compositor.renderToContext(ctx, off, { blur: 2, bloom: 0, bloomThreshold: 0.6 });
} else {
  evaluateScene(scene, 0, ctx);
}
```

---

## Presets

```ts
import { builtInPresets, getPresetScene, blendScenes } from "@clypra/engine";

// Apply a built-in preset
const preset = builtInPresets.find((p) => p.id === "neon-crimson")!;
const scene = getPresetScene(preset);

// Blend two presets (0.0 = all A, 1.0 = all B)
const blended = blendScenes(sceneA, sceneB, 0.6);
```

---

## Timeline Animation

```ts
import { addTrack, addKeyframeAtTime, updateTimeline, ensureDefaultTimeline } from "@clypra/engine";

// Add a shadow drift animation track
let scene = addTrack(scene, shadowLayerId, "shadowOffsetY", [
  { time: 0, value: 4, easing: "easeInOut" },
  { time: 1.5, value: 16, easing: "easeInOut" },
  { time: 3, value: 4, easing: "easeInOut" },
]);

// Change timeline duration / fps
scene = updateTimeline(scene, { duration: 3, fps: 30, loop: true });

// Apply built-in demo animation (shadow drift + mask reveal)
scene = ensureDefaultTimeline(scene);
```

---

## Export

```ts
import { downloadPngSequenceZip, downloadSceneWebM, isWebMExportSupported, buildDotLottie, downloadLottieJson } from "@clypra/engine";

// PNG sequence as ZIP
downloadPngSequenceZip(scene, "my-effect", { fps: 30, duration: 2 });

// WebM video
if (isWebMExportSupported()) {
  await downloadSceneWebM(scene, "my-effect.webm", { fps: 30, duration: 2 });
}

// dotLottie (.lottie) file
await buildDotLottie(lottieJson, "animation-id", { loop: true, autoplay: true });
```

---

## Lottie Tooling

### Build Lottie from scratch

```ts
import { createBlankLottie, addTextLayer, addSolidLayer, addOrUpdateKeyframe, enableKeyframing } from "@clypra/engine";

let lottie = createBlankLottie(1920, 1080, 30, 120);
lottie = addSolidLayer(lottie, "Background", "#0A0A0F", 1920, 1080);
lottie = addTextLayer(lottie, "Title", "HELLO WORLD");

// Animate position
lottie = enableKeyframing(lottie, 0, "ks.p");
lottie = addOrUpdateKeyframe(lottie, 0, "ks.p", 0, [960, 200, 0], "easeOut");
lottie = addOrUpdateKeyframe(lottie, 0, "ks.p", 30, [960, 540, 0], "easeInOut");
```

### Inject text and styles

```ts
import { injectBatch } from "@clypra/engine";

const result = injectBatch(lottieJson, {
  textCustomization: {
    customization: { primary: "BREAKING NEWS", secondary: "Reporter", accent: "9:41 PM" },
    layers: mappedLayers,
  },
  colorOverrides: [{ layerName: "Accent Bar", color: "#FF2200" }],
  hiddenLayers: new Set([3]),
});
```

### CapCut-style animation presets (30+)

```ts
import { getAnimPreset, bakeAnimationIntoLayer } from "@clypra/engine";

const preset = getAnimPreset("zoom-in-bounce")!;
const animated = bakeAnimationIntoLayer(lottieJson, 0, preset, {
  startFrame: 0,
  endFrame: preset.defaultDurationFrames,
  totalFrames: 120,
  compW: 1920,
  compH: 1080,
});
```

Available presets — **Entrance:** `fade-in`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `zoom-in`, `zoom-in-bounce`, `pop-in`, `flip-x`, `flip-y`, `rotate-in`, `blur-in`, `drop-in`, `typewriter`, `wipe-left`, `glitch-in` — **Exit:** `fade-out`, `slide-out-up`, `slide-out-down`, `zoom-out`, `zoom-blast`, `glitch-out` — **Loop:** `pulse`, `breathe`, `float`, `shake`, `wobble`, `neon-flicker`, `wave` — **Emphasis:** `attention`, `jello`, `swing`

### Built-in templates (13)

```ts
import { getTemplatePreset } from "@clypra/engine";

const template = getTemplatePreset("neon-title")!;
const lottieJson = template.build(); // ready-to-use Lottie JSON
```

Available: `clean-lower-third`, `minimal-lower-third`, `neon-title`, `cinematic-title`, `minimal-caption`, `typewriter-caption`, `bold-callout`, `sports-score`, `social-quote`, `kinetic-text`, `glitch-title`, `vertical-story`, `drop-in-title`

---

## Per-Character Fill

```ts
import { resizeCharFillColors, setCharFillColor, rainbowCharFillColors } from "@clypra/engine";

let colors = resizeCharFillColors("HELLO", [], "#FFFFFF");
colors = setCharFillColor(colors, 0, "#FF0000"); // H → red
colors = setCharFillColor(colors, 4, "#0080FF"); // O → blue

// Or rainbow fill
const rainbow = rainbowCharFillColors("HELLO");

const config = { ...myConfig, perCharFillEnabled: true, charFillColors: colors };
```

---

## Undo / History

```ts
import { snapshotScene, parseHistorySnapshot } from "@clypra/engine";

// Save
const snapshot = snapshotScene(scene);
undoStack.push(snapshot);

// Restore
const { scene: prevScene } = parseHistorySnapshot(undoStack.pop()!);
```

---

## License

Proprietary — [Clypra](https://github.com/AIEraDev/clypra-studio)
