# @clypra-studio/ui

## 0.2.1

### Patch Changes

- 090c4ed: Phase 4O: compositional primitive node types and smart-overlay runtime expansion

  **@clypra-studio/types**

  - Add `primitives.ts` with 16 new node types: RichTextNode, GradientNode, IconNode, DividerNode, MetricNode, ProgressNode, ChartNode, TableNode, ContainerNode, CalloutNode, AvatarNode + extended ShapeKind union
  - Add `overlay.ts` declarative authoring document schema (OverlayDocument, SceneNode, Breakpoints, Assets)
  - Add `export.ts` production export pipeline contract types (ExportConfig, ExportJobRecord, MediaEncoder)
  - Expose new `./primitives`, `./overlay`, `./export` subpath entry points

  **@clypra-studio/engine**

  - Add full `smartOverlays` subsystem: renderer, layout, animation runtime, data binding, pixi scene projection, snap engine, command history, validation, migrations, asset/font registry, export pipeline
  - Add `overlayBridge` for PixiJS overlay layer rendering
  - Extend `overlayDocumentSchema` and runtime with all 11 Phase 4O primitive node types
  - Add `primitiveRegistry` with typed default-node factories for all 16 primitives
  - Resolve `AssetKind` DTS ambiguity with v2 project types

  **@clypra-studio/ui**

  - Promote `usePixiRenderer` hook to shared package; remove per-lab duplicates

- Updated dependencies [090c4ed]
  - @clypra-studio/types@0.4.0
  - @clypra-studio/engine@1.2.0
  - @clypra-studio/runtime@0.2.1

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
  - @clypra-studio/runtime@0.2.0

## 0.1.2

### Patch Changes

- 2793729: Complete migration to unified PixiJS rendering pipeline with comprehensive fixes

  ## BREAKING CHANGES

  - Removed legacy Canvas 2D rendering pipeline and FrameScheduler
  - All preview and export rendering now uses PixiJS WebGL compositor
  - Requires WebGL support (no Canvas 2D fallback)

  ## Major Features

  - **Unified rendering**: Perfect visual parity between preview and export
  - **Headless PixiJS export**: All 21 GPU transitions now work in exports
  - **Professional sticker tracking**: Stickers no longer pollute media assets bin
  - **Self-contained sticker clips** with embedded metadata

  ## Critical Fixes

  - Fixed compositor initialization race condition on session load
  - Fixed blank preview when loading existing projects
  - Fixed aspect ratio layout jump during video metadata load
  - Fixed text layer z-index stacking and position alignment
  - Fixed sticker transform overlay bounding box
  - Fixed Lottie DPR sizing causing continuous texture recreation
  - Fixed PixiJS v8 texture destruction order preventing crashes

  ## Performance Improvements

  - Eliminated compositor destroy/recreate cycles during resize
  - Proper WebGL context loss handling with cleanup
  - Transition-aware scheduling prevents premature clip pausing
  - Removed ~6,000 lines of dead code

  ## Rendering Enhancements

  - Text sprites positioned in project space with track-based z-index
  - gradingParams wired to ColorAdjustmentsEffect with automatic fallback
  - Store reference tracking for instant conform updates
  - Video element recycling with proper seek state management

  ## Developer Experience

  - Comprehensive lifecycle diagnostics and logging
  - 1,345+ tests passing with full coverage
  - Clean TypeScript compilation
  - Zero WebGL context loss during normal operation

  ## Studio Architecture Refactor

  - Added new labs views for filter, video, and transition workflows
  - Created PublishFilterModal and HalationEffect
  - Enhanced transition presets and rendering
  - Improved color adjustments and effect pipeline
  - Updated engine backends for better performance
  - Restructured workspace components for better modularity

- Updated dependencies [2793729]
  - @clypra-studio/types@0.2.0
  - @clypra-studio/runtime@0.1.2

## 0.1.1

### Patch Changes

- 6e8bd11: Add comprehensive README documentation to all packages

  - Added installation instructions
  - Added usage examples
  - Added feature lists
  - Added links to repository and issues

- Updated dependencies [6e8bd11]
  - @clypra-studio/types@0.1.1
  - @clypra-studio/runtime@0.1.1
