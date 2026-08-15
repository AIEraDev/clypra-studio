# @clypra-studio/runtime

## 0.2.2

### Patch Changes

- Phase 4R/4S — Editor subsystem, analytics, asset pipeline, visualization system, and color picker

  **@clypra-studio/types**

  - Add AnchorSide, SpatialAnchorConfig, LineNode, VideoNode, AudioNode
  - Extend LayoutMode union (stack, space-between, space-around, space-evenly)
  - Add AxisConfig, ChartBarStyle, ChartAnimationConfig, LinePoint, ArcGeometry
  - Expand MetricNode, ChartNode, GaugeNode, TimelineNode schemas

  **@clypra-studio/engine**

  - Add editor subsystem: EditorCommandSystem, TransformEngine, SelectionEngine,
    SmartGuideEngine, PropertyInspectorEngine, DataBindingAuthoringEngine
  - Add analytics subsystem: MetricEngine, SeriesEngine, GridEngine
  - Add asset pipeline: AssetRegistry, AssetResolver, ResourceCache,
    TemporalMediaEngine, ExportDependencyGraph
  - Add capability registry, behavioral motion system, VideoContext,
    spatial constraint resolver, semantic compiler, runtime evaluator
  - VisualizationEngine generator registry (bar/line/area/pie/donut)
  - Layout engine: space-evenly/stack modes, hug-content text sizing,
    calculateResizeSnap, LayoutComputedState
  - Pixi renderer consumes LayoutComputedState; glassmorphic annotation renderer
  - 22 primitive factories; PublishedOverlayArtifact schema
  - Remove percentage-based coordinate normalization

  **@clypra/ui-color-picker**

  - New package: universal color system with ClypraColorPicker, GradientEditor,
    ColorGradingWheels, ContrastAnalyzer, HarmoniesView, TokenBindingSelector
  - Hooks: useColorDrag, useColorFormat, useColorHistory
  - Utils: colorUtils, colorHarmonies, colorValidation (zero dependencies)

  **@clypra-studio/ui**

  - Re-export full @clypra/ui-color-picker public API
  - Promote usePixiRenderer to shared package

  **@clypra-studio/runtime**

  - Patch bump for internal dependency updates

- Updated dependencies
  - @clypra-studio/types@0.5.0

## 0.2.1

### Patch Changes

- Updated dependencies [090c4ed]
  - @clypra-studio/types@0.4.0

## 0.2.0

### Minor Changes

- ## Major Release: Studio Master Lab, WebGPU Runtime, and Canvas Background System

  ### 🎨 Canvas Background System

  - Add canvas background system with solid colors, gradients, and procedural shaders
  - Support transparent canvas with alpha channel rendering
  - Extend engine schema for background rendering in compositions

  ### 🔬 Studio Master Lab

  - Implement complete Studio Master Lab with PixiJS preview and real-time effects
  - Add color grading studio panel with interactive lift-gamma-gain controls
  - Add AI body effects studio panel with WebGPU processing
  - Add live WGSL shader code inspector for real-time debugging
  - Add unified studio master laboratory with mode switcher
  - Add CanvasPreview component with WebGPU frame processing
  - Integrate video/image loading and real-time WebGPU frame processing

  ### ⚡ WebGPU Runtime & Effects Pipeline

  - Implement WebGPU effect pipeline engine with IPC worker bridge
  - Add JSON Schema for .vefx plugin specification
  - Implement .vefx node graph compiler with DAG WGSL compilation
  - Add built-in shader node templates and keyframe interpolation engine
  - Export WebGPU engine and bridge SDK for external integrations
  - Add host integration bridge SDK for sandbox isolation

  ### 🎵 Audio & Spectrum Analysis

  - Add audio-reactive engine with FFT spectrum analyzer
  - Implement WebGPU 1D audio wave texture manager
  - Add procedural oscilloscope waveform visualizer
  - Implement offline audio spectrum baker for deterministic exports
  - Add Wasm SIMD audio spectrum baker bridge for performance
  - Add zero-latency shared memory spectrum buffer
  - Implement async Web Worker audio baker client
  - Add 3D holographic waterfall spectrogram node with WGSL helpers

  ### 🎬 Export & Rendering

  - Implement headless WebGPU + WebCodecs MP4 exporter
  - Add deterministic video exporter integration
  - Export async audio baker and WebCodecs APIs
  - Add WebCodecs export types for modern video encoding

  ### 🎛️ Keyframe & Animation

  - Add 2D infinite canvas multi-keyframe graph editor
  - Implement multi-segment piecewise curve evaluator
  - Add Bezier curve editor component with handle symmetry constraints
  - Implement 60FPS WebGPU playback engine

  ### 🎨 Color Grading

  - Add cube LUT loader for 3D color lookup tables
  - Implement lift-gamma-gain color grading node
  - Add color grading lab UI components and routes
  - Add GradingParams and mergeGradingParams to shared engine

  ### 🔧 Developer Experience

  - Add real-time telemetry diagnostics overlay
  - Implement .vefx preset template system
  - Add WebGPU context loss recovery manager
  - Add comprehensive unit tests for audio, effects, and runtime
  - Add tests for GPU recovery, spectrogram, and multi-keyframe
  - Add tests for async baker and WebCodecs export

  ### 🏗️ Infrastructure

  - Add @webgpu/types dependency and WebGPU build configuration
  - Add fft.js dependency for audio spectrum analysis
  - Configure proper workspace resolution and type generation
  - Update to use published @clypra-studio/engine for production
  - Add MIT LICENSE to all open-source packages
  - Update package metadata for Open Core model

  ### 🐛 Bug Fixes

  - Fix Pixi auto-render ticker to prevent text/sticker blinking
  - Fix transition lab to use engine presets instead of API calls
  - Fix transition lab parameter handling (object vs array)
  - Update shaders package to v0.1.5 with proper exports
  - Remove legacy swatch field for GPU-only filter rendering

  ### ♻️ Refactoring

  - Consolidate duplicate vertex shaders into standard pixiVertexShader
  - Remove unused @clypra/video-renderer package
  - Remove AdminEffectsPanel route and legacy references
  - Update package references from @clypra/engine to @clypra-studio/engine
  - Remove observatory-demo route and references

  ### 📚 Documentation

  - Integrate Open Core messaging in README
  - Enhance landing page with Clypra Studio achievements
  - Add smart OS detection for automatic download links

### Patch Changes

- Updated dependencies
  - @clypra-studio/types@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies [2793729]
  - @clypra-studio/types@0.2.0

## 0.1.1

### Patch Changes

- 6e8bd11: Add comprehensive README documentation to all packages

  - Added installation instructions
  - Added usage examples
  - Added feature lists
  - Added links to repository and issues

- Updated dependencies [6e8bd11]
  - @clypra-studio/types@0.1.1
