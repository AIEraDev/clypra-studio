/**
 * @clypra/video-renderer — FilterManager
 *
 * Manages GPU filter chains
 * Creates, updates, and destroys PixiJS filters
 */

import * as PIXI from "pixi.js";
import { AdjustmentFilter } from "pixi-filters";
import { STANDARD_VERTEX_SHADER } from "./shaders.js";

export interface FilterRecord {
  id: string;
  type: string;
  filter: PIXI.Filter;
  params: Record<string, any>;
}

export class FilterManager {
  private filters = new Map<string, FilterRecord>();
  private nextFilterId = 1;

  /**
   * Add a filter
   */
  addFilter(type: string, params: Record<string, any>): string {
    const id = `filter-${this.nextFilterId++}`;
    const filter = this._createFilter(type, params);

    if (!filter) {
      throw new Error(`[FilterManager] Unknown filter type: ${type}`);
    }

    const record: FilterRecord = {
      id,
      type,
      filter,
      params,
    };

    this.filters.set(id, record);
    console.debug(`[FilterManager] Added filter ${id} (${type})`);

    return id;
  }

  /**
   * Remove a filter
   */
  removeFilter(filterId: string): void {
    const record = this.filters.get(filterId);
    if (!record) return;

    record.filter.destroy();
    this.filters.delete(filterId);
    console.debug(`[FilterManager] Removed filter ${filterId}`);
  }

  /**
   * Update filter parameters
   */
  updateFilter(filterId: string, params: Record<string, any>): void {
    const record = this.filters.get(filterId);
    if (!record) return;

    Object.assign(record.params, params);
    this._updateFilterUniforms(record);
  }

  /**
   * Get all active filters
   */
  getFilters(): PIXI.Filter[] {
    return Array.from(this.filters.values()).map((r) => r.filter);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    for (const filterId of this.filters.keys()) {
      this.removeFilter(filterId);
    }
  }

  /**
   * Create a filter based on type
   */
  private _createFilter(type: string, params: Record<string, any>): PIXI.Filter | null {
    switch (type) {
      case "blur":
        return this._createBlurFilter(params.strength || 8);

      case "brightness":
        return new AdjustmentFilter({
          brightness: params.value || 1.0,
        });

      case "contrast":
        return new AdjustmentFilter({
          contrast: params.value || 1.0,
        });

      case "saturation":
        return new AdjustmentFilter({
          saturation: params.value || 1.0,
        });

      case "pixelate":
        return this._createPixelateFilter(params.size || 10);

      case "vignette":
        return this._createVignetteFilter(params.radius || 0.7, params.intensity || 0.5);

      default:
        return null;
    }
  }

  /**
   * Update filter uniforms based on params
   */
  private _updateFilterUniforms(record: FilterRecord): void {
    const { filter, params, type } = record;

    switch (type) {
      case "blur":
        (filter as any).resources.customUniforms.uStrength.value = params.strength;
        break;

      case "brightness":
      case "contrast":
      case "saturation":
        if (type === "brightness") {
          (filter as AdjustmentFilter).brightness = params.value;
        } else if (type === "contrast") {
          (filter as AdjustmentFilter).contrast = params.value;
        } else {
          (filter as AdjustmentFilter).saturation = params.value;
        }
        break;

      case "pixelate":
        (filter as any).resources.customUniforms.uPixelSize.value = params.size;
        break;

      case "vignette":
        (filter as any).resources.customUniforms.uRadius.value = params.radius * 0.5;
        (filter as any).resources.customUniforms.uIntensity.value = params.intensity;
        break;
    }
  }

  /**
   * Create blur filter
   */
  private _createBlurFilter(strength: number): PIXI.Filter {
    const fragmentShader = `
      precision mediump float;
      in vec2 vTextureCoord;
      out vec4 fragColor;
      uniform sampler2D uSampler;
      uniform float uStrength;
      uniform vec4 uInputSize;

      void main(void) {
        vec4 color = vec4(0.0);
        float total = 0.0;
        vec2 offset = vec2(uStrength) * uInputSize.zw;
        
        for (float x = -2.0; x <= 2.0; x += 1.0) {
          for (float y = -2.0; y <= 2.0; y += 1.0) {
            vec2 samplePos = vTextureCoord + vec2(x, y) * offset;
            float weight = (3.0 - abs(x)) * (3.0 - abs(y));
            color += texture(uSampler, samplePos) * weight;
            total += weight;
          }
        }
        
        fragColor = color / total;
      }
    `;

    return PIXI.Filter.from({
      gl: {
        vertex: STANDARD_VERTEX_SHADER,
        fragment: fragmentShader,
      },
      resources: {
        customUniforms: {
          uStrength: { value: strength, type: "f32" },
        },
      },
    });
  }

  /**
   * Create pixelate filter
   */
  private _createPixelateFilter(pixelSize: number): PIXI.Filter {
    const fragmentShader = `
      precision mediump float;
      in vec2 vTextureCoord;
      out vec4 fragColor;
      uniform sampler2D uSampler;
      uniform float uPixelSize;
      uniform vec4 uInputSize;

      void main(void) {
        vec2 pixelSize = vec2(uPixelSize) * uInputSize.zw;
        vec2 coord = floor(vTextureCoord / pixelSize) * pixelSize + pixelSize * 0.5;
        fragColor = texture(uSampler, coord);
      }
    `;

    return PIXI.Filter.from({
      gl: {
        vertex: STANDARD_VERTEX_SHADER,
        fragment: fragmentShader,
      },
      resources: {
        customUniforms: {
          uPixelSize: { value: pixelSize, type: "f32" },
        },
      },
    });
  }

  /**
   * Create vignette filter
   */
  private _createVignetteFilter(radius: number, intensity: number): PIXI.Filter {
    const fragmentShader = `
      precision mediump float;
      in vec2 vTextureCoord;
      out vec4 fragColor;
      uniform sampler2D uSampler;
      uniform float uRadius;
      uniform float uIntensity;

      void main(void) {
        vec4 color = texture(uSampler, vTextureCoord);
        vec2 uv = vTextureCoord - 0.5;
        float dist = length(uv);
        float vignette = smoothstep(uRadius, uRadius + 0.5, dist);
        fragColor = vec4(color.rgb * (1.0 - vignette * uIntensity), color.a);
      }
    `;

    return PIXI.Filter.from({
      gl: {
        vertex: STANDARD_VERTEX_SHADER,
        fragment: fragmentShader,
      },
      resources: {
        customUniforms: {
          uRadius: { value: radius * 0.5, type: "f32" },
          uIntensity: { value: intensity, type: "f32" },
        },
      },
    });
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.clearFilters();
  }
}
