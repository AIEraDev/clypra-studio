/**
 * @clypra-studio/engine — PixiRenderer
 *
 * Manages a single shared PixiJS Application instance.
 * Handles three effect subtypes:
 *   - filter   → builds filter chain on videoSprite, updates uniforms per frame
 *   - motion   → calls mount/unmount lifecycle, hooks into Ticker
 *   - composite → does both
 *
 * Used by:
 *   - Clypra Studio   (VideoEffectWorkspace preview canvas)
 *   - Clypra Desktop  (rasterizer.ts frame compositor)
 *
 * Both environments receive the same canvas output — PixiJS renders into it,
 * then the Desktop rasterizer reads the pixels for FFmpeg.
 */

import { Application, Container, Sprite, Ticker, Texture, Filter, RenderTexture } from "pixi.js";
import type { TransitionDefinition } from "../types/TransitionDefinition";

import type { EffectDefinition, PixiEffectDefinition, PixiEffectContext, ParamValues } from "./EffectDefinition";

import { isPixiEffect, isFilterEffect, isMotionEffect, isCompositeEffect } from "./EffectDefinition";

import type { GraphNode } from "./EffectGraph";

// ---------------------------------------------------------------------------
// Internal state per mounted effect
// ---------------------------------------------------------------------------

interface MountedEffect {
  node: GraphNode;
  definition: PixiEffectDefinition;
  params: ParamValues;
  /** Live filter instances (null for motion-only effects) */
  filters: Filter[] | null;
  /** Context passed to lifecycle hooks */
  ctx: PixiEffectContext;
  /** Active frame ticker function to clean up on unmount */
  tickerFn?: (ticker: Ticker) => void;
}

// ---------------------------------------------------------------------------
// PixiRenderer
// ---------------------------------------------------------------------------

export class PixiRenderer {
  private app: Application | null = null;
  private videoSprite: Sprite | null = null;
  private transitionSprite: Sprite | null = null;
  private _activeTransition: {
    definition: TransitionDefinition;
    filter: Filter;
    params: ParamValues;
  } | null = null;
  private fromRenderTexture: RenderTexture | null = null;
  private toRenderTexture: RenderTexture | null = null;
  private blitSprite: Sprite | null = null;
  private _transitionFromTex: Texture | null = null;
  private _transitionToTex: Texture | null = null;
  private overlayContainer: Container | null = null;
  private baseMediaContainer: Container | null = null;
  private mounted = new Map<string, MountedEffect>();
  private initialized = false;
  private initializing = false;
  private _activeSource: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | null = null;
  private _fitMode: "stretch" | "fit" | "crop" = "fit";

  /**
   * Initialize the PixiJS Application.
   * Call once, reuse across effect changes.
   *
   * @param canvas  The target HTMLCanvasElement (Studio preview or rasterizer offscreen canvas)
   * @param width   Canvas width in pixels
   * @param height  Canvas height in pixels
   */
  async init(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    if (this.initialized || this.initializing) return;
    this.initializing = true;

    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault(); // REQUIRED — without this, the browser will never attempt to restore it
      console.warn("[PixiRenderer] WebGL context lost — attempting recovery");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      console.log("[PixiRenderer] WebGL context restored");
    });

    const app = new Application();
    try {
      await app.init({
        canvas,
        width,
        height,
        backgroundAlpha: 0, // transparent — composited over video below
        antialias: true,
        preference: "webgl", // WebGL for production stability; swap to 'webgpu' later
        resolution: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        autoDensity: true,
        preserveDrawingBuffer: true,
        // CRITICAL: disable the auto-render ticker.
        // The compositor calls renderer.render() at the END of every composeFrame(),
        // after all sprite states are finalized. If Pixi's own ticker fires between
        // beginTextFrame() (which hides all sprites) and the awaited
        // renderTextLayerBridged() / renderStickerLayerBridged() calls that re-show
        // them, it renders a fully-invisible frame → visible blink of text and stickers.
        autoStart: false,
      });
    } catch (e) {
      this.initializing = false;
      throw e;
    }

    if (!this.initializing) {
      app.destroy(true);
      return;
    }

    this.app = app;

    // Main video sprite — sits at the bottom of the scene
    this.videoSprite = new Sprite();
    this.videoSprite.width = width;
    this.videoSprite.height = height;

    // Transition sprite for dual-clip rendering
    this.transitionSprite = new Sprite();
    this.transitionSprite.width = width;
    this.transitionSprite.height = height;
    this.transitionSprite.visible = false;

    // Overlay container — motion effects add children here (particles, sweeps, etc.)
    this.overlayContainer = new Container();

    // Base media container — sits at the very bottom of the stage
    this.baseMediaContainer = new Container();
    this.baseMediaContainer.sortableChildren = true;
    this.app.stage.addChildAt(this.baseMediaContainer, 0);

    this.app.stage.addChild(this.videoSprite);
    this.app.stage.addChild(this.transitionSprite);
    this.app.stage.addChild(this.overlayContainer);

    this.initialized = true;
    this.initializing = false;
  }

  setVideoSource(video: HTMLVideoElement): void {
    if (this._activeSource === video) {
      this.resizeSprites();
      return;
    }
    this._activeSource = video;
    if (!this.videoSprite || !this.app) return;
    const texture = Texture.from(video);
    this.videoSprite.texture = texture;
    this.resizeSprites();
  }

  setImageSource(image: HTMLImageElement | HTMLCanvasElement): void {
    if (this._activeSource === image) {
      this.resizeSprites();
      return;
    }
    this._activeSource = image;
    if (!this.videoSprite || !this.app) return;
    const texture = Texture.from(image);
    this.videoSprite.texture = texture;
    this.resizeSprites();
  }

  // -------------------------------------------------------------------------
  // Effect lifecycle
  // -------------------------------------------------------------------------

  /**
   * Mount a resolved set of PixiJS graph nodes.
   * Builds filter chains and initialises motion effects.
   * Previously mounted effects NOT in the new list are unmounted.
   */
  applyNodes(nodes: GraphNode[], globalParams?: Map<string, ParamValues>): void {
    if (!this.app || !this.videoSprite || !this.overlayContainer) {
      throw new Error("[PixiRenderer] call init() before applyNodes()");
    }

    const incomingIds = new Set(nodes.map((n) => n.id));

    // Unmount effects no longer in the graph
    for (const [id, mounted] of this.mounted) {
      if (!incomingIds.has(id)) {
        this._unmount(mounted);
        this.mounted.delete(id);
      }
    }

    // Collect all filters in graph order
    const filterChain: Filter[] = [];

    for (const node of nodes) {
      const def = node.effect;
      if (!isPixiEffect(def)) continue;

      const params = globalParams?.get(node.id) ?? this._defaultParams(def);

      if (this.mounted.has(node.id)) {
        // Already mounted — just refresh uniforms in-place
        const m = this.mounted.get(node.id)!;
        Object.assign(m.params, params);
        Object.assign(m.ctx.params, params);
        if (m.filters && m.definition.filterSpec?.updateUniforms) {
          m.definition.filterSpec.updateUniforms(m.filters.length === 1 ? m.filters[0] : m.filters, m.params, 0);
        }
        if (m.filters) filterChain.push(...m.filters);
        continue;
      }

      // Build context
      const ctx: PixiEffectContext = {
        app: this.app!,
        container: this.overlayContainer!,
        ticker: this.app!.ticker,
        params,
        width: this.app!.screen.width,
        height: this.app!.screen.height,
      };

      let filters: Filter[] | null = null;
      let tickerFn: ((ticker: Ticker) => void) | undefined = undefined;

      // Create filter(s) for filter and composite subtypes
      if ((isFilterEffect(def) || isCompositeEffect(def)) && def.filterSpec) {
        const result = def.filterSpec.create(params);
        filters = Array.isArray(result) ? result : [result];
        filterChain.push(...filters);

        // Register per-frame uniform updater if provided
        if (def.filterSpec.updateUniforms) {
          const spec = def.filterSpec;
          const elapsed = { value: 0 };
          tickerFn = (ticker: Ticker) => {
            elapsed.value += ticker.deltaMS;
            if (filters) {
              spec.updateUniforms!(filters.length === 1 ? filters[0] : filters, params, elapsed.value);
            }
          };
          this.app!.ticker.add(tickerFn);
        }
      }

      // Call mount lifecycle for motion and composite subtypes
      if ((isMotionEffect(def) || isCompositeEffect(def)) && def.mount) {
        def.mount(ctx);
      }

      this.mounted.set(node.id, { node, definition: def, params, filters, ctx, tickerFn });
    }

    // Apply assembled filter chain to the video sprite
    this.videoSprite.filters = filterChain.length > 0 ? filterChain : null;
  }

  /**
   * Update multiple params on a mounted effect in one pass.
   */
  updateParams(nodeId: string, params: ParamValues): void {
    const m = this.mounted.get(nodeId);
    if (!m) return;

    Object.assign(m.params, params);
    Object.assign(m.ctx.params, params);

    if (m.filters && m.definition.filterSpec?.updateUniforms) {
      m.definition.filterSpec.updateUniforms(m.filters.length === 1 ? m.filters[0] : m.filters, m.params, 0);
    }
  }

  /**
   * Force a render pass (required for static image previews after uniform changes).
   */
  render(): void {
    if (!this.app) return;
    this.app.renderer.render({ container: this.app.stage });
  }

  /**
   * Update a single param on a mounted effect.
   * Triggers uniform refresh and calls onParamChange lifecycle hook.
   */
  updateParam(nodeId: string, key: string, value: number | string | boolean): void {
    const m = this.mounted.get(nodeId);
    if (!m) return;

    m.params[key] = value;
    m.ctx.params[key] = value;

    if (m.filters && m.definition.filterSpec?.updateUniforms) {
      m.definition.filterSpec.updateUniforms(m.filters.length === 1 ? m.filters[0] : m.filters, m.params, 0);
    }

    m.definition.onParamChange?.(m.ctx, key, value);
  }

  /**
   * Capture the current rendered frame as an ImageData.
   * Used by the Desktop rasterizer to extract pixels for FFmpeg.
   */
  captureFrame(): ImageData | null {
    if (!this.app) return null;
    const canvas = this.app.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Resize the renderer (e.g. when project resolution changes).
   */
  resize(width: number, height: number): void {
    if (!this.app) return;
    this.app.renderer.resize(width, height);
    this.resizeSprites();
  }

  setFitMode(mode: "stretch" | "fit" | "crop"): void {
    if (this._fitMode === mode) return;
    this._fitMode = mode;
    this.resizeSprites();
  }

  resizeSprites(): void {
    if (this.videoSprite && this.videoSprite.texture) {
      this._resizeSprite(this.videoSprite, this.videoSprite.texture, this._fitMode);
    }
    if (this.transitionSprite) {
      if (this._activeTransition) {
        this.transitionSprite.width = this.app?.screen.width ?? 1280;
        this.transitionSprite.height = this.app?.screen.height ?? 720;
        this.transitionSprite.position.set(0, 0);
      } else if (this.transitionSprite.texture) {
        this._resizeSprite(this.transitionSprite, this.transitionSprite.texture, this._fitMode);
      }
    }
  }

  private _getElementDimensions(texture: Texture): { width: number; height: number } {
    // 1. Try to read from single active source element if available
    const sourceEl = this._activeSource as any;
    if (sourceEl) {
      const tagName = sourceEl.tagName;
      if ((tagName === "VIDEO" || sourceEl.videoWidth !== undefined) && sourceEl.videoWidth > 0) {
        return { width: sourceEl.videoWidth, height: sourceEl.videoHeight };
      }
      if ((tagName === "IMG" || sourceEl.naturalWidth !== undefined) && sourceEl.naturalWidth > 0) {
        return { width: sourceEl.naturalWidth, height: sourceEl.naturalHeight };
      }
      if ((tagName === "CANVAS" || sourceEl.getContext !== undefined) && sourceEl.width > 0) {
        return { width: sourceEl.width, height: sourceEl.height };
      }
    }

    // 2. Fall back to texture source element references (supports both PixiJS v7 and v8)
    const resource = (texture.source?.resource || texture.source?.source) as any;
    if (resource) {
      const tagName = resource.tagName;
      if ((tagName === "VIDEO" || resource.videoWidth !== undefined) && resource.videoWidth > 0) {
        return { width: resource.videoWidth, height: resource.videoHeight };
      }
      if ((tagName === "IMG" || resource.naturalWidth !== undefined) && resource.naturalWidth > 0) {
        return { width: resource.naturalWidth, height: resource.naturalHeight };
      }
      if ((tagName === "CANVAS" || resource.getContext !== undefined) && resource.width > 0) {
        return { width: resource.width, height: resource.height };
      }
    }

    // 3. Fall back to logical texture dimensions which carry orientation/rotation states
    if (texture.width > 0) {
      return { width: texture.width, height: texture.height };
    }
    return { width: 1280, height: 720 };
  }

  private _resizeSprite(sprite: Sprite, texture: Texture, fitMode: "stretch" | "fit" | "crop"): void {
    if (!this.app) return;
    // Use app.screen (logical CSS pixels) not renderer.width/height (physical pixels).
    // renderer.width is multiplied by devicePixelRatio (e.g. 2560 on a 2× Retina display),
    // but sprites are positioned in logical space — using physical pixels makes them
    // 2× too large and overflow the canvas on HiDPI screens.
    const canvasWidth = this.app.screen.width;
    const canvasHeight = this.app.screen.height;

    const { width: texWidth, height: texHeight } = this._getElementDimensions(texture);

    if (fitMode === "stretch") {
      sprite.width = canvasWidth;
      sprite.height = canvasHeight;
      sprite.position.set(0, 0);
    } else {
      const scaleX = canvasWidth / texWidth;
      const scaleY = canvasHeight / texHeight;

      const scale = fitMode === "fit" ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);

      sprite.width = texWidth * scale;
      sprite.height = texHeight * scale;

      sprite.position.set((canvasWidth - sprite.width) / 2, (canvasHeight - sprite.height) / 2);
    }
  }

  /**
   * Full teardown — unmounts all effects, destroys the PixiJS Application.
   * Call when the editor session ends or the Studio workspace unmounts.
   */
  destroy(): void {
    this.initializing = false;
    for (const mounted of this.mounted.values()) {
      this._unmount(mounted);
    }
    this.mounted.clear();
    if (this.app) {
      try {
        const gl = (this.app.renderer as any).gl as WebGLRenderingContext | undefined;
        this.app.destroy(true, { children: true, texture: true });
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch (e) {
        console.warn("Error destroying Pixi application:", e);
      }
      this.app = null;
    }
    this.videoSprite = null;
    this.transitionSprite = null;
    this.overlayContainer = null;
    this.baseMediaContainer = null;
    this.initialized = false;
    this._activeTransition = null;
    this._activeSource = null;
    if (this.fromRenderTexture) {
      this.fromRenderTexture.destroy(true);
      this.fromRenderTexture = null;
    }
    if (this.toRenderTexture) {
      this.toRenderTexture.destroy(true);
      this.toRenderTexture = null;
    }
    if (this.blitSprite) {
      this.blitSprite.destroy();
      this.blitSprite = null;
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _unmount(m: MountedEffect): void {
    // Lifecycle unmount hook
    if ((isMotionEffect(m.definition) || isCompositeEffect(m.definition)) && m.definition.unmount) {
      m.definition.unmount(m.ctx);
    }
    // Remove ticker listener if registered
    if (m.tickerFn && this.app) {
      this.app.ticker.remove(m.tickerFn);
    }
    // Destroy filter instances
    if (m.filters) {
      for (const f of m.filters) f.destroy();
    }
  }

  private _defaultParams(def: PixiEffectDefinition): ParamValues {
    return Object.fromEntries(def.params.map((p) => [p.key, p.value]));
  }

  getApp(): Application | null {
    return this.app;
  }

  getVideoSprite(): Sprite | null {
    return this.videoSprite;
  }

  getTransitionSprite(): Sprite | null {
    return this.transitionSprite;
  }

  getBaseMediaContainer(): Container | null {
    return this.baseMediaContainer;
  }

  getOverlayContainer(): Container | null {
    return this.overlayContainer;
  }

  get isReady(): boolean {
    return this.initialized;
  }

  private _ensureRenderTextures(width: number, height: number): void {
    if (!this.fromRenderTexture || this.fromRenderTexture.width !== width || this.fromRenderTexture.height !== height) {
      if (this.fromRenderTexture) this.fromRenderTexture.destroy(true);
      this.fromRenderTexture = RenderTexture.create({ width, height });
    }
    if (!this.toRenderTexture || this.toRenderTexture.width !== width || this.toRenderTexture.height !== height) {
      if (this.toRenderTexture) this.toRenderTexture.destroy(true);
      this.toRenderTexture = RenderTexture.create({ width, height });
    }
    if (!this.blitSprite) {
      this.blitSprite = new Sprite();
    }
  }

  private _blitTransitionFrames(): void {
    if (!this.app || !this._transitionFromTex || !this._transitionToTex || !this.fromRenderTexture || !this.toRenderTexture || !this.blitSprite) {
      return;
    }

    const currentFitMode = this._fitMode;

    // 1. Blit fromTexture
    this.blitSprite.texture = this._transitionFromTex;
    this._resizeSprite(this.blitSprite, this._transitionFromTex, currentFitMode);
    this.app.renderer.render({
      container: this.blitSprite,
      target: this.fromRenderTexture,
      clear: true,
    });

    // 2. Blit toTexture
    this.blitSprite.texture = this._transitionToTex;
    this._resizeSprite(this.blitSprite, this._transitionToTex, currentFitMode);
    this.app.renderer.render({
      container: this.blitSprite,
      target: this.toRenderTexture,
      clear: true,
    });

    // Reset blitSprite texture to release it
    this.blitSprite.texture = Texture.EMPTY;
  }

  mountTransition(definition: TransitionDefinition, fromTexture: Texture, toTexture: Texture, params: ParamValues): void {
    if (!this.transitionSprite || !this.videoSprite || !this.app) return;
    this._activeSource = null;

    if (this._activeTransition?.filter) {
      this._activeTransition.filter.destroy();
    }

    this._transitionFromTex = fromTexture;
    this._transitionToTex = toTexture;

    const canvasWidth = this.app.screen.width;
    const canvasHeight = this.app.screen.height;
    this._ensureRenderTextures(canvasWidth, canvasHeight);

    // Initial blit
    this._blitTransitionFrames();

    const fromRT = this.fromRenderTexture!;
    const toRT = this.toRenderTexture!;

    // Temporarily patch Filter.from to inject uFrom and uTo into resources
    // so PixiJS v8 compiles the pipeline layout with bindings for these textures.
    const originalFilterFrom = Filter.from;
    Filter.from = function (options: any) {
      if (options && options.resources) {
        if (!options.resources.uFrom) {
          options.resources.uFrom = fromRT.source;
        }
        if (!options.resources.uTo) {
          options.resources.uTo = toRT.source;
        }
      }
      return originalFilterFrom.call(this, options);
    };

    let filter: Filter;
    try {
      filter = definition.create(params);
    } finally {
      Filter.from = originalFilterFrom;
    }

    (filter as any).resources.uFrom = fromRT.source;
    (filter as any).resources.uTo = toRT.source;

    this.transitionSprite.texture = fromRT;
    this.transitionSprite.filters = [filter];
    this.transitionSprite.visible = true;
    this.videoSprite.visible = false;
    if (this.baseMediaContainer) {
      this.baseMediaContainer.visible = false;
    }

    this._activeTransition = { definition, filter, params };
    this.resizeSprites();
  }

  getActiveTransitionId(): string | null {
    return this._activeTransition?.definition.id || null;
  }

  updateTransitionProgress(id: string, progress: number, params?: ParamValues): void {
    if (!this._activeTransition) return;
    if (params) {
      this._activeTransition.params = params;
    }

    // Refresh intermediate render textures with latest video frames
    this._blitTransitionFrames();

    this._activeTransition.definition.updateProgress(this._activeTransition.filter, progress, this._activeTransition.params);
  }

  unmountTransition(): void {
    if (this.transitionSprite) {
      this.transitionSprite.visible = false;
      this.transitionSprite.filters = null;
    }
    if (this.videoSprite) {
      this.videoSprite.visible = true;
    }
    if (this.baseMediaContainer) {
      this.baseMediaContainer.visible = true;
    }
    if (this._activeTransition?.filter) {
      this._activeTransition.filter.destroy();
    }
    this._activeTransition = null;
    this._transitionFromTex = null;
    this._transitionToTex = null;
  }
}
