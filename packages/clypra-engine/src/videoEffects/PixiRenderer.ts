/**
 * @clypra/engine — PixiRenderer
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

import {
  Application,
  Container,
  Sprite,
  Ticker,
  type Filter,
} from 'pixi.js'

import type {
  EffectDefinition,
  PixiEffectDefinition,
  PixiEffectContext,
  ParamValues,
} from './EffectDefinition'

import {
  isPixiEffect,
  isFilterEffect,
  isMotionEffect,
  isCompositeEffect,
} from './EffectDefinition'

import type { GraphNode } from './EffectGraph'

// ---------------------------------------------------------------------------
// Internal state per mounted effect
// ---------------------------------------------------------------------------

interface MountedEffect {
  node: GraphNode
  definition: PixiEffectDefinition
  params: ParamValues
  /** Live filter instances (null for motion-only effects) */
  filters: Filter[] | null
  /** Context passed to lifecycle hooks */
  ctx: PixiEffectContext
  /** Active frame ticker function to clean up on unmount */
  tickerFn?: (ticker: Ticker) => void
}

// ---------------------------------------------------------------------------
// PixiRenderer
// ---------------------------------------------------------------------------

export class PixiRenderer {
  private app: Application | null = null
  private videoSprite: Sprite | null = null
  private overlayContainer: Container | null = null
  private mounted = new Map<string, MountedEffect>()
  private initialized = false

  /**
   * Initialize the PixiJS Application.
   * Call once, reuse across effect changes.
   *
   * @param canvas  The target HTMLCanvasElement (Studio preview or rasterizer offscreen canvas)
   * @param width   Canvas width in pixels
   * @param height  Canvas height in pixels
   */
  async init(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    if (this.initialized) return

    this.app = new Application()
    await this.app.init({
      canvas,
      width,
      height,
      backgroundAlpha: 0,       // transparent — composited over video below
      antialias: true,
      preference: 'webgl',       // WebGL for production stability; swap to 'webgpu' later
      resolution: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
      autoDensity: true,
    })

    // Main video sprite — sits at the bottom of the scene
    this.videoSprite = new Sprite()
    this.videoSprite.width = width
    this.videoSprite.height = height

    // Overlay container — motion effects add children here (particles, sweeps, etc.)
    this.overlayContainer = new Container()

    this.app.stage.addChild(this.videoSprite)
    this.app.stage.addChild(this.overlayContainer)

    this.initialized = true
  }

  /**
   * Point the video sprite at a live HTMLVideoElement.
   * PixiJS polls the video element each frame automatically.
   */
  setVideoSource(video: HTMLVideoElement): void {
    if (!this.videoSprite || !this.app) return
    // Import dynamically to avoid pulling VideoSource into non-video builds
    import('pixi.js').then(({ VideoSource, Texture }) => {
      const source = new VideoSource({ resource: video, autoPlay: false })
      const texture = new Texture({ source })
      this.videoSprite!.texture = texture
    })
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
      throw new Error('[PixiRenderer] call init() before applyNodes()')
    }

    const incomingIds = new Set(nodes.map(n => n.id))

    // Unmount effects no longer in the graph
    for (const [id, mounted] of this.mounted) {
      if (!incomingIds.has(id)) {
        this._unmount(mounted)
        this.mounted.delete(id)
      }
    }

    // Collect all filters in graph order
    const filterChain: Filter[] = []

    for (const node of nodes) {
      const def = node.effect
      if (!isPixiEffect(def)) continue

      const params = globalParams?.get(node.id) ?? this._defaultParams(def)

      if (this.mounted.has(node.id)) {
        // Already mounted — just refresh uniforms in-place
        const m = this.mounted.get(node.id)!
        Object.assign(m.params, params)
        Object.assign(m.ctx.params, params)
        if (m.filters && m.definition.filterSpec?.updateUniforms) {
          m.definition.filterSpec.updateUniforms(
            m.filters.length === 1 ? m.filters[0] : m.filters,
            m.params,
            0,
          )
        }
        if (m.filters) filterChain.push(...m.filters)
        continue
      }

      // Build context
      const ctx: PixiEffectContext = {
        app: this.app!,
        container: this.overlayContainer!,
        ticker: this.app!.ticker,
        params,
        width: this.app!.screen.width,
        height: this.app!.screen.height,
      }

      let filters: Filter[] | null = null
      let tickerFn: ((ticker: Ticker) => void) | undefined = undefined

      // Create filter(s) for filter and composite subtypes
      if ((isFilterEffect(def) || isCompositeEffect(def)) && def.filterSpec) {
        const result = def.filterSpec.create(params)
        filters = Array.isArray(result) ? result : [result]
        filterChain.push(...filters)

        // Register per-frame uniform updater if provided
        if (def.filterSpec.updateUniforms) {
          const spec = def.filterSpec
          const elapsed = { value: 0 }
          tickerFn = (ticker: Ticker) => {
            elapsed.value += ticker.deltaMS
            if (filters) {
              spec.updateUniforms!(
                filters.length === 1 ? filters[0] : filters,
                params,
                elapsed.value,
              )
            }
          }
          this.app!.ticker.add(tickerFn)
        }
      }

      // Call mount lifecycle for motion and composite subtypes
      if ((isMotionEffect(def) || isCompositeEffect(def)) && def.mount) {
        def.mount(ctx)
      }

      this.mounted.set(node.id, { node, definition: def, params, filters, ctx, tickerFn })
    }

    // Apply assembled filter chain to the video sprite
    this.videoSprite.filters = filterChain.length > 0 ? filterChain : null
  }

  /**
   * Update a single param on a mounted effect.
   * Triggers uniform refresh and calls onParamChange lifecycle hook.
   */
  updateParam(nodeId: string, key: string, value: number | string | boolean): void {
    const m = this.mounted.get(nodeId)
    if (!m) return

    m.params[key] = value
    m.ctx.params[key] = value

    // Refresh filter uniforms immediately
    if (m.filters && m.definition.filterSpec?.updateUniforms) {
      m.definition.filterSpec.updateUniforms(
        m.filters.length === 1 ? m.filters[0] : m.filters,
        m.params,
        0,
      )
    }

    // Notify effect for motion param changes
    m.definition.onParamChange?.(m.ctx, key, value)
  }

  /**
   * Capture the current rendered frame as an ImageData.
   * Used by the Desktop rasterizer to extract pixels for FFmpeg.
   */
  captureFrame(): ImageData | null {
    if (!this.app) return null
    const canvas = this.app.canvas as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  /**
   * Resize the renderer (e.g. when project resolution changes).
   */
  resize(width: number, height: number): void {
    if (!this.app) return
    this.app.renderer.resize(width, height)
    if (this.videoSprite) {
      this.videoSprite.width = width
      this.videoSprite.height = height
    }
  }

  /**
   * Full teardown — unmounts all effects, destroys the PixiJS Application.
   * Call when the editor session ends or the Studio workspace unmounts.
   */
  destroy(): void {
    for (const mounted of this.mounted.values()) {
      this._unmount(mounted)
    }
    this.mounted.clear()
    this.app?.destroy(false, { children: true, texture: true })
    this.app = null
    this.videoSprite = null
    this.overlayContainer = null
    this.initialized = false
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _unmount(m: MountedEffect): void {
    // Lifecycle unmount hook
    if ((isMotionEffect(m.definition) || isCompositeEffect(m.definition)) && m.definition.unmount) {
      m.definition.unmount(m.ctx)
    }
    // Remove ticker listener if registered
    if (m.tickerFn && this.app) {
      this.app.ticker.remove(m.tickerFn)
    }
    // Destroy filter instances
    if (m.filters) {
      for (const f of m.filters) f.destroy()
    }
  }

  private _defaultParams(def: PixiEffectDefinition): ParamValues {
    return Object.fromEntries(def.params.map(p => [p.key, p.value]))
  }

  get isReady(): boolean {
    return this.initialized
  }
}
