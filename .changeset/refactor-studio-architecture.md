---
"@clypra-studio/engine": major
"@clypra-studio/types": minor
"@clypra-studio/shaders": patch
"@clypra-studio/ui": patch
---

Complete migration to unified PixiJS rendering pipeline with comprehensive fixes

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
