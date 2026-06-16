/**
 * Canvas Utility Functions
 */

/**
 * Add noise to canvas
 */
export function addNoise(ctx: CanvasRenderingContext2D, amount: number): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * amount;
    data[i] += noise; // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Clear canvas with optional color
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, color?: string): void {
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  } else {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

/**
 * Save and restore canvas context for isolated transforms
 */
export function withContext<T>(ctx: CanvasRenderingContext2D, fn: (ctx: CanvasRenderingContext2D) => T): T {
  ctx.save();
  try {
    return fn(ctx);
  } finally {
    ctx.restore();
  }
}
