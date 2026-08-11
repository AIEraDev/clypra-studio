import { propertyInterpolator } from "./propertyInterpolator.js";

export type PropertyValueType = "number" | "angle" | "color" | "discrete";

export interface PropertyAnimationDefinition {
  property: string;
  type: PropertyValueType;
  combineMode: "add" | "multiply" | "override";
  interpolate(a: any, b: any, t: number): any;
}

export class PropertyAnimationRegistry {
  private properties = new Map<string, PropertyAnimationDefinition>();

  constructor() {
    this.registerDefaults();
  }

  public register(def: PropertyAnimationDefinition): void {
    this.properties.set(def.property, def);
  }

  public get(property: string): PropertyAnimationDefinition | undefined {
    return this.properties.get(property);
  }

  public interpolate(property: string, a: any, b: any, t: number): any {
    const def = this.get(property);
    if (def) {
      return def.interpolate(a, b, t);
    }
    return propertyInterpolator.interpolate(property, a, b, t);
  }

  private registerDefaults(): void {
    this.register({
      property: "opacity",
      type: "number",
      combineMode: "multiply",
      interpolate: (a, b, t) => propertyInterpolator.interpolateNumber(a, b, t),
    });

    this.register({
      property: "translateX",
      type: "number",
      combineMode: "add",
      interpolate: (a, b, t) => propertyInterpolator.interpolateNumber(a, b, t),
    });

    this.register({
      property: "translateY",
      type: "number",
      combineMode: "add",
      interpolate: (a, b, t) => propertyInterpolator.interpolateNumber(a, b, t),
    });

    this.register({
      property: "rotation",
      type: "angle",
      combineMode: "add",
      interpolate: (a, b, t) => propertyInterpolator.interpolateAngle(a, b, t),
    });

    this.register({
      property: "scaleX",
      type: "number",
      combineMode: "multiply",
      interpolate: (a, b, t) => propertyInterpolator.interpolateNumber(a, b, t),
    });

    this.register({
      property: "scaleY",
      type: "number",
      combineMode: "multiply",
      interpolate: (a, b, t) => propertyInterpolator.interpolateNumber(a, b, t),
    });

    this.register({
      property: "blur",
      type: "number",
      combineMode: "add",
      interpolate: (a, b, t) => propertyInterpolator.interpolateNumber(a, b, t),
    });

    this.register({
      property: "fillColor",
      type: "color",
      combineMode: "override",
      interpolate: (a, b, t) => propertyInterpolator.interpolateColor(a, b, t),
    });

    this.register({
      property: "strokeColor",
      type: "color",
      combineMode: "override",
      interpolate: (a, b, t) => propertyInterpolator.interpolateColor(a, b, t),
    });
  }
}

export const propertyAnimationRegistry = new PropertyAnimationRegistry();
