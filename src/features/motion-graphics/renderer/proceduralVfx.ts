/**
 * proceduralVfx.ts — Mathematical generators for procedural motion graphics elements.
 * Generates comic starbursts, midpoint displacement lightning arcs, and fire energy streaks.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface LightningSegment {
  p1: Point2D;
  p2: Point2D;
  depth: number;
}

/**
 * Midpoint displacement algorithm for procedural electric lightning arcs.
 * Recursively subdivides segments and displaces midpoints perpendicular to the segment.
 */
export function generateLightningArc(
  start: Point2D,
  end: Point2D,
  depth: number,
  roughness: number,
  branchChance: number,
  randomSeed: number,
): LightningSegment[] {
  const segments: LightningSegment[] = [];
  let seed = randomSeed;

  // Simple pseudo-random generator with deterministic seed
  const prng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const subdivide = (
    p1: Point2D,
    p2: Point2D,
    curDepth: number,
  ) => {
    if (curDepth >= depth) {
      segments.push({ p1, p2, depth: curDepth });
      return;
    }

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Normal vector perpendicular to the segment
    const nx = -dy / (length || 1);
    const ny = dx / (length || 1);

    // Random displacement proportional to segment length and roughness
    const displacement = (prng() - 0.5) * 2 * length * roughness;
    const mid: Point2D = {
      x: midX + nx * displacement,
      y: midY + ny * displacement,
    };

    subdivide(p1, mid, curDepth + 1);
    subdivide(mid, p2, curDepth + 1);

    // Optional branching
    if (branchChance > 0 && prng() < branchChance && curDepth < depth - 1) {
      const branchAngle = (prng() - 0.5) * Math.PI * 0.5;
      const cosA = Math.cos(branchAngle);
      const sinA = Math.sin(branchAngle);
      const branchLength = length * 0.45;
      const branchEnd: Point2D = {
        x: mid.x + (dx * cosA - dy * sinA) * 0.5 + (prng() - 0.5) * branchLength,
        y: mid.y + (dx * sinA + dy * cosA) * 0.5 + (prng() - 0.5) * branchLength,
      };
      subdivide(mid, branchEnd, curDepth + 1);
    }
  };

  subdivide(start, end, 0);
  return segments;
}

/**
 * Draws a rendered lightning arc on Canvas2D using multi-pass additive bloom.
 */
export function drawLightning(
  ctx: CanvasRenderingContext2D,
  segments: LightningSegment[],
  outerColor: string,
  coreColor: string,
  glowRadius: number,
) {
  if (segments.length === 0) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Pass 1: Wide outer glow with additive blend
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = outerColor;
  ctx.lineWidth = Math.max(3, glowRadius * 0.6);
  ctx.shadowColor = outerColor;
  ctx.shadowBlur = glowRadius;

  ctx.beginPath();
  for (const seg of segments) {
    ctx.moveTo(seg.p1.x, seg.p1.y);
    ctx.lineTo(seg.p2.x, seg.p2.y);
  }
  ctx.stroke();

  // Pass 2: Intense white-hot core
  ctx.strokeStyle = coreColor;
  ctx.lineWidth = Math.max(1.5, glowRadius * 0.15);
  ctx.shadowBlur = glowRadius * 0.3;
  ctx.shadowColor = "#ffffff";

  ctx.beginPath();
  for (const seg of segments) {
    ctx.moveTo(seg.p1.x, seg.p1.y);
    ctx.lineTo(seg.p2.x, seg.p2.y);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Parametric comic burst polygon generator.
/**
 * Parametric comic burst polygon generator.
 * Creates an alternating inner/outer spike starburst adapted to bounding dimensions.
 */
export function generateComicBurstPoints(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  points: number,
  innerRatio: number,
  jitter: number,
  seed = 42,
): Point2D[] {
  const result: Point2D[] = [];
  const totalVertices = points * 2;
  const angleStep = (Math.PI * 2) / totalVertices;

  let currentSeed = seed;
  const prng = () => {
    currentSeed = (currentSeed * 16807) % 2147483647;
    return (currentSeed - 1) / 2147483646;
  };

  for (let i = 0; i <= totalVertices; i++) {
    const isOuter = i % 2 === 0;
    const baseAngle = i * angleStep - Math.PI / 2;
    const angleJitter = (prng() - 0.5) * jitter * angleStep * 0.5;
    const angle = baseAngle + angleJitter;

    const baseRatio = isOuter ? 1.0 : innerRatio;
    const radialJitter = 1.0 + (prng() - 0.5) * jitter * 0.3;

    const rx = radiusX * baseRatio * radialJitter;
    const ry = radiusY * baseRatio * radialJitter;

    const x = centerX + Math.cos(angle) * rx;
    const y = centerY + Math.sin(angle) * ry;

    result.push({ x, y });
  }

  return result;
}

/**
 * Draws a multi-pass comic burst with a glowing background, bold stroke, and fill.
 */
export function drawComicBurst(
  ctx: CanvasRenderingContext2D,
  burstPoints: Point2D[],
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  glowColor?: string,
  glowRadius?: number,
) {
  if (burstPoints.length === 0) return;

  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(burstPoints[0]!.x, burstPoints[0]!.y);
    for (let i = 1; i < burstPoints.length; i++) {
      ctx.lineTo(burstPoints[i]!.x, burstPoints[i]!.y);
    }
    ctx.closePath();
  };

  ctx.save();

  // Glow pass
  if (glowColor && glowRadius && glowRadius > 0) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowRadius;
    ctx.fillStyle = glowColor;
    tracePath();
    ctx.fill();
  }

  // Fill pass
  ctx.shadowColor = "transparent";
  ctx.fillStyle = fillColor;
  tracePath();
  ctx.fill();

  // Stroke pass
  if (strokeWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "miter";
    ctx.miterLimit = 4;
    tracePath();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws dynamic fire/energy swooshes (sweeping flame ribbons).
 */
export function drawFireSwoosh(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  control1X: number,
  control1Y: number,
  control2X: number,
  control2Y: number,
  primaryColor: string,
  secondaryColor: string,
  width: number,
  opacity: number,
) {
  if (opacity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = "lighter";

  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  gradient.addColorStop(0.2, primaryColor);
  gradient.addColorStop(0.7, secondaryColor);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(control1X, control1Y, control2X, control2Y, endX, endY);

  ctx.strokeStyle = gradient;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = width * 1.2;
  ctx.stroke();

  // Inner hot core
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(control1X, control1Y, control2X, control2Y, endX, endY);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = width * 0.25;
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = width * 0.4;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a 5-pointed star icon.
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string,
  strokeColor?: string,
  strokeWidth = 0,
) {
  ctx.save();
  ctx.beginPath();
  const step = Math.PI / 5;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = i * step - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor && strokeWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}
