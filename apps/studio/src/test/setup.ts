/**
 * Vitest test setup file
 * Configures global test environment and mocks
 */

import { vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom";

// Mock HTMLCanvasElement methods that aren't available in happy-dom
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === "2d") {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1,
        })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        filter: "none",
        globalCompositeOperation: "source-over",
        fillStyle: "#000000",
        strokeStyle: "#000000",
      } as unknown as CanvasRenderingContext2D;
    }
    if (contextType === "webgl" || contextType === "webgl2") {
      return {
        getParameter: vi.fn(),
        getExtension: vi.fn(),
        createShader: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        createProgram: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        useProgram: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        createTexture: vi.fn(),
        bindTexture: vi.fn(),
        texImage2D: vi.fn(),
        texParameteri: vi.fn(),
        viewport: vi.fn(),
        clear: vi.fn(),
        clearColor: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        blendFunc: vi.fn(),
        drawArrays: vi.fn(),
        drawElements: vi.fn(),
      } as unknown as WebGLRenderingContext;
    }
    return null;
  }) as any;
}

const rafTimers = new Map<number, ReturnType<typeof setTimeout>>();
let nextFrameId = 0;

afterEach(() => {
  for (const timer of rafTimers.values()) clearTimeout(timer);
  rafTimers.clear();
});

beforeEach(() => { // Type assertion to bypass strict type checking

  // Mock canvas toDataURL
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,mock");

  // Mock HTMLVideoElement
  Object.defineProperty(HTMLVideoElement.prototype, "readyState", {
    get: vi.fn(() => 4), // HAVE_ENOUGH_DATA
    configurable: true,
  });

  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
    get: vi.fn(() => 1920),
    configurable: true,
  });

  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
    get: vi.fn(() => 1080),
    configurable: true,
  });

  Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
    get: vi.fn(() => 0),
    set: vi.fn(),
    configurable: true,
  });

  Object.defineProperty(HTMLVideoElement.prototype, "duration", {
    get: vi.fn(() => 10),
    configurable: true,
  });

  HTMLVideoElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLVideoElement.prototype.pause = vi.fn();
  HTMLVideoElement.prototype.load = vi.fn();

  // Mock HTMLImageElement
  Object.defineProperty(HTMLImageElement.prototype, "width", {
    get: vi.fn(() => 1920),
    configurable: true,
  });

  Object.defineProperty(HTMLImageElement.prototype, "height", {
    get: vi.fn(() => 1080),
    configurable: true,
  });

  // Mock URL.createObjectURL and revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = vi.fn();

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });

  // Mock window.devicePixelRatio
  Object.defineProperty(window, "devicePixelRatio", {
    get: vi.fn(() => 1),
    configurable: true,
  });

  // Mock requestAnimationFrame / cancelAnimationFrame
  global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const frameId = ++nextFrameId;
    const timer = setTimeout(() => {
      rafTimers.delete(frameId);
      callback(Date.now());
    }, 16);
    rafTimers.set(frameId, timer);
    return frameId;
  });
  global.cancelAnimationFrame = vi.fn((frameId: number) => {
    const timer = rafTimers.get(frameId);
    if (timer) {
      clearTimeout(timer);
      rafTimers.delete(frameId);
    }
  });
});
