import { describe, it, expect, vi } from "vitest"
import { ColorAdjustmentsEffect } from "../../effects/light/ColorAdjustmentsEffect.js"
import { EFFECTS_REGISTRY, getEffectRenderer } from "../effectsRegistry.js"

describe("ColorAdjustmentsEffect Unit Tests", () => {
  it("should be defined with correct metadata", () => {
    expect(ColorAdjustmentsEffect).toBeDefined()
    expect(ColorAdjustmentsEffect.id).toBe("color-adjustments")
    expect(ColorAdjustmentsEffect.name).toBe("Color Adjustments")
    expect(ColorAdjustmentsEffect.category).toBe("light")
  })

  it("should define all expected parameters with correct default values", () => {
    const params = ColorAdjustmentsEffect.params
    expect(params).toBeDefined()

    const expectedKeys = [
      "exposure",
      "brightness",
      "contrast",
      "saturation",
      "temperature",
      "tint",
      "sepia",
      "grayscale",
      "hueRotate",
      "vignette",
      "invert"
    ]

    expectedKeys.forEach(key => {
      const param = params.find(p => p.key === key)
      expect(param).toBeDefined()
      expect(param?.type).toBe("range")
      expect(param?.value).toBe(0.0)
    })
  })

  it("should be registered in the central EFFECTS_REGISTRY", () => {
    const registered = EFFECTS_REGISTRY["color-adjustments"]
    expect(registered).toBeDefined()
    expect(registered.name).toBe("Color Adjustments")
    expect(registered.category).toBe("light")
  })

  describe("Canvas 2D Fallback Renderer", () => {
    const createMockCtx = () => {
      const mockCanvas = { width: 1920, height: 1080 }
      const mockGradient = {
        addColorStop: vi.fn()
      }
      return {
        canvas: mockCanvas,
        filter: "none",
        globalAlpha: 1.0,
        globalCompositeOperation: "source-over",
        fillStyle: "",
        save: vi.fn(),
        restore: vi.fn(),
        clearRect: vi.fn(),
        rect: vi.fn(),
        beginPath: vi.fn(),
        clip: vi.fn(),
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        createRadialGradient: vi.fn().mockReturnValue(mockGradient)
      } as any
    }

    it("should compile filter string and apply it when params are set", () => {
      const ctx = createMockCtx()
      // Mock global document if createElement is used inside context filter fallback
      const mockCanvasElement = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn()
        })
      }
      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvasElement)
      } as any

      const renderer = getEffectRenderer("color-adjustments")
      expect(renderer).toBeDefined()

      const params = {
        brightness: 0.1,
        contrast: 0.2,
        saturation: -0.3,
        sepia: 0.5,
        grayscale: 0.1,
        hueRotate: 0.5,
        invert: 0.0
      }

      renderer!(ctx, params, 1.0)

      expect(global.document.createElement).toHaveBeenCalledWith("canvas")
      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.restore).toHaveBeenCalled()
    })

    it("should apply temperature, tint and vignette overlays when enabled", () => {
      const ctx = createMockCtx()
      const renderer = getEffectRenderer("color-adjustments")

      const params = {
        temperature: 0.5,
        tint: -0.3,
        vignette: 0.8
      }

      renderer!(ctx, params, 1.0)

      // Verify vignette radial gradient creation
      expect(ctx.createRadialGradient).toHaveBeenCalled()
      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.restore).toHaveBeenCalled()
    })
  })
})
