# Clypra Text Effect Studio — Product Specification

## 1. Problem statement

A text effect studio is not a library of presets. It is a **text rendering engine** plus a **motion graphics engine** plus a **material engine** plus a **compositing engine**. Effects are **compositions of primitives**, not hardcoded one-offs.

## 2. Ten master control domains

| # | Domain | Responsibility |
|---|--------|----------------|
| 1 | Text | Fonts, layout, per-run controls, path text (Pro+) |
| 2 | Transform | Position, scale, rotation, skew, pivot, 3D (Pro+) |
| 3 | Fill | Solid, gradients, patterns, image fill (Pro+) |
| 4 | Stroke | Width, alignment, multi-stroke, dashes (Pro+) |
| 5 | Depth | Bevel, extrusion, 3D materials (Pro+) |
| 6 | Mask | Alpha, luma, track mattes, reveals |
| 7 | Distort | Warp, wave, displacement (Pro+) |
| 8 | Animate | Keyframes, easing, stagger |
| 9 | Composite | Layers, blend modes, scene elements (Pro+) |
| 10 | Simulate | Particles, physics, fracture (Pro+) |

## 3. SceneDocument (source of truth)

Versioned JSON document. Implementation: [`src/engine/schema.ts`](../src/engine/schema.ts).

```json
{
  "version": 1,
  "effectName": "My Effect",
  "canvas": { "width": 800, "height": 200, "background": "transparent" },
  "text": { "content": "CLYPRA", "fontFamily": "Poppins", "..." },
  "effectLayers": [
    { "id": "...", "type": "panel", "enabled": true, "opacity": 1, "blendMode": "source-over", "target": "scene", "params": {} }
  ],
  "customEngineId": null,
  "compositor": { "blur": 0, "bloom": 0 },
  "timeline": { "duration": 2, "fps": 30, "tracks": [] }
}
```

### Layer type catalog (MVP)

| type | params (key fields) |
|------|---------------------|
| `panel` | panelEnabled, panelColor, panelOpacity, panelRadius, padding, stroke |
| `glow` | enabled, color, blur, opacity, type, strength, spread |
| `shadow` | enabled, color, blur, offset, opacity, shadowType |
| `extrusion` | bevelEnabled, depth, highlight, shadow, direction, perspective |
| `duplicateStack` | stackEnabled, count, offsets, colors, opacityDecay |
| `stroke` | strokeEnabled, color, width, position, opacity, type |
| `fill` | fillType, fillColor, gradient, patternType |
| `mask` | maskType: `alphaText` \| `rectReveal`, revealProgress |
| `filter` | blur, bloom (applied via WebGL compositor) |
| `customEngine` | engineId: ink \| fire \| ice \| aura |

## 4. Evaluator pipeline

```
SceneDocument + time
  → resolveAnimatedParams (timeline)
  → sceneToConfig (legacy raster path)
  → Canvas 2D TextEffectRenderer (glyphs, fills, strokes, bevel)
  → WebGL Compositor (blur, bloom) [optional]
  → output canvas
```

Single entry: `evaluateScene(doc, time, ctx, compositor?)`.

Codegen must call the same evaluator contract: `advanceSteps(n)` advances `time`; `drawFrame(ctx)` calls `evaluateScene`.

## 5. Clypra host API

| Method | Semantics |
|--------|-----------|
| `advanceSteps(steps: number)` | Advance simulation time by `steps` frames at `timeline.fps` |
| `drawFrame(ctx, ghostFrames?)` | Render frame at current time; `ghostFrames` reserved for motion blur trails (Pro+) |
| `reset()` | Reset time to 0 |

## 6. UI modes

| Mode | Surfaces |
|------|----------|
| Basic | Text, fill, stroke, shadow, one glow, presets |
| Advanced | Full layer list, reorder, opacity, blend, compositor |
| Procedural | Seeds, expressions (Ultimate) |
| AI-assisted | Gemini → partial SceneDocument / TextEffectConfig patches |

## 7. Phase non-goals

### MVP (Phase 1)
- NOT: HarfBuzz shaping, text on path, boolean ops, HDRI, ProRes, expression DSL
- YES: Layer list, migrate round-trip, preview animation, PNG sequence, WebGL blur/bloom

### Pro (Phase 2)
- Per-char transforms, displacement maps, WebM export, particle graph

### Ultimate (Phase 3)
- PBR materials, path layout, GPU batch ProRes, full expression engine

## 8. Acceptance tests (by phase)

**MVP**
- All built-in presets: `textEffectConfigToScene` → `sceneToConfig` round-trip without data loss
- `evaluateScene` renders without throw for each preset
- Layer reorder changes glow/shadow draw order (when exposed)
- Exported engine: `advanceSteps` changes at least one animated opacity/offset

**Pro**
- Timeline keyframes drive arbitrary layer params
- WebGL extrusion pass visible on bevel-enabled scenes

## 9. Style recipes

Presets are `StyleRecipe`: cloned `effectLayers` + `exposed` param paths for Basic mode. See [`src/engine/recipes.ts`](../src/engine/recipes.ts).
