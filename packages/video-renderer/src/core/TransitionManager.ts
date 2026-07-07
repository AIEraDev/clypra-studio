/**
 * @clypra/video-renderer — TransitionManager
 *
 * Manages video transitions
 * Handles dual-source rendering and WebGL composition
 */

import * as PIXI from "pixi.js";
import { STANDARD_VERTEX_SHADER } from "./shaders.js";

export interface TransitionConfig {
  type: string;
  duration: number;
  fromSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  toSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  params?: Record<string, any>;
}

export interface Transition {
  id: string;
  config: TransitionConfig;
  filter: PIXI.Filter;
  fromTexture: PIXI.Texture;
  toTexture: PIXI.Texture;
  progress: number;
  active: boolean;
}

export class TransitionManager {
  private app: PIXI.Application;
  private container: PIXI.Container | null = null;
  private activeTransition: Transition | null = null;
  private transitionSprite: PIXI.Sprite | null = null;

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  /**
   * Set container for transitions
   */
  setContainer(container: PIXI.Container): void {
    this.container = container;
  }

  /**
   * Create a transition
   */
  createTransition(config: TransitionConfig): string {
    if (this.activeTransition) {
      this.destroyTransition(this.activeTransition.id);
    }

    const id = `transition-${Date.now()}`;

    // Create textures from sources
    const fromTexture = PIXI.Texture.from(config.fromSource);
    const toTexture = PIXI.Texture.from(config.toSource);

    // Create transition filter
    const filter = this._createTransitionFilter(config.type, config.params || {});

    // Create sprite if needed
    if (!this.transitionSprite && this.container) {
      this.transitionSprite = new PIXI.Sprite();
      this.container.addChild(this.transitionSprite);
    }

    if (this.transitionSprite) {
      this.transitionSprite.texture = fromTexture;
      this.transitionSprite.filters = [filter];
      this.transitionSprite.visible = true;
    }

    const transition: Transition = {
      id,
      config,
      filter,
      fromTexture,
      toTexture,
      progress: 0,
      active: true,
    };

    this.activeTransition = transition;

    if (this.container) {
      this.container.visible = true;
    }

    console.debug(`[TransitionManager] Created transition ${id} (${config.type})`);
    return id;
  }

  /**
   * Update transition progress (0.0 to 1.0)
   */
  setProgress(transitionId: string, progress: number): void {
    if (!this.activeTransition || this.activeTransition.id !== transitionId) {
      return;
    }

    this.activeTransition.progress = Math.max(0, Math.min(1, progress));

    // Update filter uniform
    if (this.activeTransition.filter) {
      (this.activeTransition.filter as any).uniforms.uProgress = this.activeTransition.progress;
    }
  }

  /**
   * Destroy a transition
   */
  destroyTransition(transitionId: string): void {
    if (!this.activeTransition || this.activeTransition.id !== transitionId) {
      return;
    }

    this.activeTransition.fromTexture.destroy(true);
    this.activeTransition.toTexture.destroy(true);
    this.activeTransition.filter.destroy();

    if (this.transitionSprite) {
      this.transitionSprite.visible = false;
      this.transitionSprite.filters = null;
    }

    if (this.container) {
      this.container.visible = false;
    }

    console.debug(`[TransitionManager] Destroyed transition ${transitionId}`);
    this.activeTransition = null;
  }

  /**
   * Create transition filter based on type
   */
  private _createTransitionFilter(type: string, params: Record<string, any>): PIXI.Filter {
    switch (type) {
      case "cross-dissolve":
        return this._createCrossDissolveFilter();
      case "fade":
        return this._createFadeFilter();
      default:
        return this._createCrossDissolveFilter();
    }
  }

  /**
   * Create cross-dissolve transition filter
   */
  private _createCrossDissolveFilter(): PIXI.Filter {
    const fragmentShader = `
      precision mediump float;
      in vec2 vTextureCoord;
      out vec4 fragColor;
      uniform sampler2D uSampler;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      uniform float uProgress;

      void main(void) {
        vec4 fromColor = texture(uFrom, vTextureCoord);
        vec4 toColor = texture(uTo, vTextureCoord);
        fragColor = mix(fromColor, toColor, uProgress);
      }
    `;

    return PIXI.Filter.from({
      gl: {
        vertex: STANDARD_VERTEX_SHADER,
        fragment: fragmentShader,
      },
      resources: {
        customUniforms: {
          uProgress: { value: 0.0, type: "f32" },
        },
      },
    });
  }

  /**
   * Create fade transition filter
   */
  private _createFadeFilter(): PIXI.Filter {
    const fragmentShader = `
      precision mediump float;
      in vec2 vTextureCoord;
      out vec4 fragColor;
      uniform sampler2D uSampler;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      uniform float uProgress;

      void main(void) {
        vec4 fromColor = texture(uFrom, vTextureCoord);
        vec4 toColor = texture(uTo, vTextureCoord);
        
        float fadeOut = 1.0 - smoothstep(0.0, 0.5, uProgress);
        float fadeIn = smoothstep(0.5, 1.0, uProgress);
        
        vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
        vec4 midColor = mix(fromColor, black, 1.0 - fadeOut);
        fragColor = mix(midColor, toColor, fadeIn);
      }
    `;

    return PIXI.Filter.from({
      gl: {
        vertex: STANDARD_VERTEX_SHADER,
        fragment: fragmentShader,
      },
      resources: {
        customUniforms: {
          uProgress: { value: 0.0, type: "f32" },
        },
      },
    });
  }

  /**
   * Get active transition
   */
  getActiveTransition(): Transition | null {
    return this.activeTransition;
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.activeTransition) {
      this.destroyTransition(this.activeTransition.id);
    }
  }
}
