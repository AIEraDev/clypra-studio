# Clypra Studio — Design & Architecture Reference

**Last Updated**: June 2026  
**Status**: Production

---

## Architecture Overview

Clypra Studio is a single-page React application with two distinct workspaces:

- **`/studio`** — Canvas 2D text effect designer, animator, and code exporter
- **`/lottie`** — Lottie JSON template editor with keyframe animation tools

Both workspaces are served by a single `index.html` via Express, with client-side routing handled in `RootApp.tsx`.

---

## URL Routing

### Studio workspace

All studio navigation uses a single path `/studio` with a `?q=` query parameter for the active left-rail panel:

| URL                   | Panel shown                         |
| --------------------- | ----------------------------------- |
| `/studio`             | Templates (default)                 |
| `/studio?q=templates` | Templates                           |
| `/studio?q=style`     | Style controls                      |
| `/studio?q=layers`    | Effect layer editor + full timeline |
| `/studio?q=export`    | Export, code generation, AI tools   |

The hook `useStudioWorkspaceState` reads/writes `?q=` on every rail item change via `window.history.pushState`. Browser back/forward navigation works correctly.

### Lottie workspace

`/lottie` — standalone route, no sub-paths.

---

## File Structure

```
src/
├── App.tsx                    Main studio workspace (text effects)
├── RootApp.tsx                Route dispatcher (studio / lottie / showcase)
├── main.tsx                   Entry point, font system init
├── renderer.ts                Canvas 2D rendering engine
├── codeGenerator.ts           TypeScript class + definition generator
├── presets.ts                 Built-in effect presets
├── types.ts                   TextEffectConfig, Preset, GlowLayer interfaces
├── constants.ts               Font lists, Google Fonts URL
├── fontLoader.ts              @font-face injection for lottie-web
├── compositor/
│   └── index.ts               WebGL2 blur + bloom post-processor
├── engine/
│   ├── schema.ts              SceneDocument, EffectLayer, Timeline types
│   ├── animate.ts             Keyframe interpolation and easing
│   ├── evaluate.ts            Scene → canvas renderer at time t
│   ├── migrate.ts             TextEffectConfig ↔ SceneDocument migration
│   ├── blend.ts               Layer-aware preset blending
│   ├── mask.ts                Reveal mask compositor
│   ├── export.ts              PNG sequence, WebM export
│   ├── history.ts             Undo/redo snapshot serialization
│   ├── textLayout.ts          Multi-line layout, auto-fit, safe area
│   ├── recipes.ts             Preset → StyleRecipe conversion
│   ├── animatableParams.ts    Per-layer animatable parameter definitions
│   ├── timelineMutations.ts   Keyframe CRUD operations
│   ├── timelineDefaults.ts    Default demo animation tracks
│   ├── perCharFill.ts         Per-character fill color rendering
│   ├── lottieEditor.ts        Lottie JSON builder (layers, shapes, keyframes)
│   ├── lottieParser.ts        Lottie JSON → metadata + text layer extraction
│   ├── lottieInjector.ts      Lottie text/style/color injection (batch API)
│   ├── lottieTextAnimations.ts  30 CapCut-style animation presets
│   ├── lottieTextStyle.ts     Per-layer text style read/write engine
│   ├── lottieTemplatePresets.ts  13 built-in Lottie template presets
│   ├── lottieExport.ts        .lottie (dotLottie), JSON, GIF export
│   ├── lottieGoogleFonts.ts   Auto Google Fonts loader for Lottie
│   └── procedural/
│       ├── InkBrushEngine.ts  Ink brush procedural text renderer
│       └── utils.ts
├── components/
│   ├── StudioChrome.tsx       LeftRail, DrawerIntro, ExportBadge
│   ├── PreviewCanvas.tsx      Canvas viewport with zoom/bg controls
│   ├── TimelinePanel.tsx      Keyframe dope sheet + transport controls
│   ├── LayerPanel.tsx         Effect layer stack editor
│   ├── InspectorPanel.tsx     Layer parameter inspector
│   ├── LegacyControlsPanel.tsx  Full typography + effect controls
│   ├── ExportLabPanel.tsx     Code output, research, blend lab
│   ├── PresetChip.tsx         Mini canvas preset thumbnail chip
│   ├── FontCompare.tsx        Side-by-side font comparison
│   ├── PerCharColorEditor.tsx Per-character color painter
│   ├── GeminiKeyModal.tsx     Gemini API key configuration
│   ├── GitHubConfigModal.tsx  GitHub PAT + repo configuration
│   ├── PublishEffectModal.tsx Effect PR submission wizard
│   ├── PublishTemplateModal.tsx Template PR submission wizard
│   ├── StudioModals.tsx       Save preset, image scan, prompt modals
│   ├── TemplateWorkspace.tsx  Full Lottie studio workspace
│   └── screens/
│       └── WebShowcase.tsx    Public landing page
├── hooks/
│   ├── useStudioWorkspaceState.ts  Rail item state + ?q= URL sync
│   ├── useResponsiveMobileTab.ts   Mobile/tablet breakpoint detection
│   ├── useCollapsibleSections.ts   Sidebar section collapse state
│   ├── useGeminiApiKey.ts          Gemini key localStorage management
│   └── useGitHubPublish.ts         GitHub API publishing logic
└── services/
    └── geminiService.ts        Gemini AI client (style, prompt, research)
```

---

## Navigation Model

### Left Rail (`?q=` param)

The left rail has 4 items — selecting any one updates `?q=` and switches the left drawer content:

| Rail      | `?q=`       | Left drawer                              | Right panel    |
| --------- | ----------- | ---------------------------------------- | -------------- |
| Templates | `templates` | Preset library + blank slate             | Inspector      |
| Style     | `style`     | Typography/fill/stroke controls          | Inspector      |
| Layers    | `layers`    | Effect layer stack + timeline (advanced) | Inspector      |
| Export    | `export`    | Export shortcuts + AI tools              | ExportLabPanel |

The right panel shows `ExportLabPanel` only when `activeRailItem === "export"`, otherwise `InspectorPanel`.

### No mode switching

There is no workspace mode switcher (Design/Animate/Export tabs were removed). All functionality is accessible via rail items and `?q=` params.

---

## Engine Architecture

### Text Effect Pipeline

```
TextEffectConfig → textEffectConfigToScene() → SceneDocument
                                                    ↓
                              applyTimelineAtTime(doc, t)
                                                    ↓
                              sceneToConfig(animated)
                                                    ↓
                              renderTextEffectCore(ctx, cfg)
                                                    ↓
                              WebGLCompositor (blur/bloom post-fx)
```

### Lottie Pipeline

```
Lottie JSON → parseLottieJson() → LottieFileInfo + text layers
                                         ↓
                              injectBatch() — text/style/color/visibility
                                         ↓
                              lottie-web SVG renderer
```

---

## Lottie Studio Features (added June 2026)

### Animation Presets (`lottieTextAnimations.ts`)

30 CapCut-style presets across 4 categories:

- **Entrance** (16): fade-in, slide up/down/left/right, zoom-in, zoom-bounce, pop-in, flip-x/y, rotate-in, blur-in, drop-in, typewriter, wipe-left, glitch-in
- **Exit** (6): fade-out, slide-out-up/down, zoom-out, zoom-blast, glitch-out
- **Loop** (7): pulse, breathe, float, shake, wobble, neon-flicker, wave
- **Emphasis** (3): attention, jello, swing

All presets bake directly into Lottie keyframes via `bakeAnimationIntoLayer()`.

### Text Style Engine (`lottieTextStyle.ts`)

- `readStyleFromLottieLayer()` — extract full style from any text layer
- `applyStyleToLottie()` — apply font, size, color, stroke, tracking, alignment, opacity, scale, rotation
- 30+ supported font families with `preloadGoogleFont()` auto-loading

### Template Presets (`lottieTemplatePresets.ts`)

13 built-in templates: lower-thirds, cinematic titles, captions, callouts, sports, social quotes, kinetic text, glitch titles, vertical stories.

### Export (`lottieExport.ts`)

- `.lottie` — dotLottie ZIP format (standard for LottieFiles)
- `.json` — raw Lottie JSON
- Animated GIF — pure-JS LZW encoder

### Batch Injection (`lottieInjector.ts`)

Single-pass `injectBatch()` applies text, style overrides, color overrides, solid colors, and layer visibility in one deep clone.

### Google Fonts (`lottieGoogleFonts.ts`)

`loadLottieFonts()` scans a Lottie JSON, injects Google Fonts `<link>` tags and `@font-face` aliases automatically.

---

## Data Flows

### Path 1: Parameter change → canvas re-render

`LegacyControlsPanel` onChange → `modifyConfig` → `setConfig` → `useEffect` → `textEffectConfigToScene` → `evaluateScene(scene, t, ctx)` → `renderTextEffectCore` → optional WebGL compositor

### Path 2: Rail item click → URL update

`LeftRail` onClick → `setActiveRailItem(item)` → `window.history.pushState({q: item}, "", "/studio?q=item")` → state updates → left drawer/right panel re-renders

### Path 3: Preset apply → scene update

`handleApplyPreset` → `getPresetScene(preset)` → `setScene(nextScene)` → `setConfig(nextCfg)` → canvas re-renders

### Path 4: Lottie JSON load → live preview

Drop JSON → `parseLottieJson` → `loadLottieFonts` → `setRawJson` → `injectBatch` (useMemo) → `lottie.loadAnimation` (useEffect)

### Path 5: Export → download

`handleExportDotLottie` → `buildDotLottie(rawJson, id)` → ZIP blob → `<a download>` trigger

---

## Test Coverage

8 test files, 54 tests (all passing as of June 2026):

| File                           | Tests |
| ------------------------------ | ----- |
| `perCharFill.test.ts`          | 3     |
| `timelineMutations.test.ts`    | 3     |
| `migrate.test.ts`              | 4     |
| `export.test.ts`               | 3     |
| `render.test.ts`               | 1     |
| `lottieTextAnimations.test.ts` | 11    |
| `lottieInjector.test.ts`       | 19    |
| `lottieExport.test.ts`         | 10    |

---

## Session Persistence

Both workspaces auto-save to `localStorage`:

- Studio: `clypra_studio_creator_session` — config, scene, activePresetId, rail item, tabs, zoom, blend settings
- Lottie: `clypra_lottie_studio_session` — rawJson, mappedLayers, customTexts, colorOverrides, metadata

The `?q=` URL param takes priority over session on initial load.
