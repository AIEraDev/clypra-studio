# Changelog

All notable changes to @clypra/video-renderer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-06

### Added

- Initial release of @clypra/video-renderer
- VideoRenderer core class with PixiJS integration
- LayerManager for managing video, image, text, and sticker overlays
- FilterManager for GPU-accelerated filters
- TransitionManager for dual-source video transitions
- TexturePool for efficient memory management
- VideoLayer, ImageLayer, TextLayer, and StickerLayer implementations
- Frame-based lifecycle with automatic garbage collection
- WebGL context loss recovery
- Performance tracking and statistics
- Full TypeScript support
- Comprehensive API documentation

### Features

- Unified video rendering across Editor and Studio
- GPU-accelerated filters (blur, brightness, contrast, saturation, pixelate, vignette)
- Media overlay composition (text, stickers via Lottie)
- Professional transition engine
- Multiple fit modes (stretch, fit, cover)
- High-DPI display support
- Memory-efficient texture pooling
- Automatic sprite cleanup after inactivity
