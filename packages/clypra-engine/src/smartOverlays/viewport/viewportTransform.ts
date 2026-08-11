export interface ViewportState {
  zoom: number;       // e.g. 100 = 100%, 50 = 50%, 150 = 150%
  panX: number;       // px
  panY: number;       // px
  canvasWidth: number;  // Document base width (1280)
  canvasHeight: number; // Document base height (720)
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface DocumentPoint {
  x: number;
  y: number;
}

export class ViewportTransform {
  /**
   * Convert Document Point (1280x720) to Screen Canvas Point
   */
  public documentToScreen(point: DocumentPoint, viewport: ViewportState): ScreenPoint {
    const scale = viewport.zoom / 100;
    return {
      x: point.x * scale + viewport.panX,
      y: point.y * scale + viewport.panY
    };
  }

  /**
   * Convert Screen Canvas Mouse Point to Document Point (1280x720)
   */
  public screenToDocument(point: ScreenPoint, viewport: ViewportState): DocumentPoint {
    const scale = viewport.zoom / 100;
    return {
      x: (point.x - viewport.panX) / scale,
      y: (point.y - viewport.panY) / scale
    };
  }

  /**
   * Snap point to grid increment (e.g. 8px grid or 16px grid)
   */
  public snapToGrid(val: number, gridSize = 8): number {
    return Math.round(val / gridSize) * gridSize;
  }
}

export const viewportTransform = new ViewportTransform();
