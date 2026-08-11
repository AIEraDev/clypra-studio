/**
 * Property Interpolation Registry
 * Handles type-aware interpolation for numbers, angles, colors, and discrete values.
 */

export class PropertyInterpolator {
  /**
   * Linear interpolation for standard numbers
   */
  public interpolateNumber(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Shortest rotational path angle interpolation in degrees.
   * E.g., 350° → 10° rotates forward +20°, not backwards -340°.
   */
  public interpolateAngle(a: number, b: number, t: number): number {
    const diff = ((b - a + 540) % 360) - 180;
    const result = a + diff * t;
    return (result % 360 + 360) % 360;
  }

  /**
   * RGBA color lerp between hex/rgb strings
   */
  public interpolateColor(colorA: string, colorB: string, t: number): string {
    const rgbaA = this.parseColor(colorA);
    const rgbaB = this.parseColor(colorB);

    const r = Math.round(this.interpolateNumber(rgbaA.r, rgbaB.r, t));
    const g = Math.round(this.interpolateNumber(rgbaA.g, rgbaB.g, t));
    const b = Math.round(this.interpolateNumber(rgbaA.b, rgbaB.b, t));
    const a = this.interpolateNumber(rgbaA.a, rgbaB.a, t);

    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }

  /**
   * Discrete switch at t >= 0.5 for non-continuous values (e.g. strings, booleans)
   */
  public interpolateDiscrete(a: any, b: any, t: number): any {
    return t >= 0.5 ? b : a;
  }

  /**
   * Dispatch interpolation based on property name or value types
   */
  public interpolate(property: string, a: any, b: any, t: number): any {
    if (typeof a === "number" && typeof b === "number") {
      if (property === "rotation" || property.toLowerCase().includes("angle")) {
        return this.interpolateAngle(a, b, t);
      }
      return this.interpolateNumber(a, b, t);
    }

    if (typeof a === "string" && typeof b === "string") {
      if (this.isColorString(a) && this.isColorString(b)) {
        return this.interpolateColor(a, b, t);
      }
    }

    return this.interpolateDiscrete(a, b, t);
  }

  private isColorString(val: string): boolean {
    return val.startsWith("#") || val.startsWith("rgb");
  }

  private parseColor(val: string): { r: number; g: number; b: number; a: number } {
    if (val.startsWith("#")) {
      let hex = val.slice(1);
      if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
      const num = parseInt(hex, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
        a: 1
      };
    }
    const match = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1
      };
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
}

export const propertyInterpolator = new PropertyInterpolator();
