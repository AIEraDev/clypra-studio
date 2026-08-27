import React from "react";

export type ControlType =
  | "text"
  | "number"
  | "color"
  | "select"
  | "font"
  | "typography"
  | "appearance"
  | "constraint"
  | "layout"
  | "asset";

export interface ControlProps<T = any> {
  value: T;
  onChange: (val: T) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: any }>;
  disabled?: boolean;
}

type ControlComponent = React.ComponentType<ControlProps>;

class PropertyControlRegistry {
  private registry = new Map<ControlType, ControlComponent>();

  public register(type: ControlType, component: ControlComponent) {
    this.registry.set(type, component);
  }

  public get(type: ControlType): ControlComponent | undefined {
    return this.registry.get(type);
  }
}

export const propertyControlRegistry = new PropertyControlRegistry();
