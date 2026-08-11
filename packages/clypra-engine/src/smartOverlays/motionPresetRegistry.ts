import type { MotionPreset, KeyframeTrack } from "./overlayDocumentSchema.js";

export interface MotionPresetParameter {
  key: string;
  label: string;
  type: "number" | "select" | "boolean";
  default: any;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
}

export interface MotionPresetDefinition {
  id: string;
  name: string;
  category: "entrance" | "exit" | "attention" | "emphasis";
  /** Which node types this preset applies to. '*' = all. */
  supportedNodeTypes?: string[];
  /** Schema-driven parameter list — enables auto-generated config UI */
  parameters?: MotionPresetParameter[];
  buildTracks(preset: MotionPreset, clipDuration: number): KeyframeTrack[];
}

export class MotionPresetRegistry {
  private presets = new Map<string, MotionPresetDefinition>();

  constructor() {
    this.registerBuiltIns();
  }

  public register(definition: MotionPresetDefinition): void {
    this.presets.set(definition.id, definition);
  }

  public get(id: string): MotionPresetDefinition | undefined {
    return this.presets.get(id);
  }

  public list(category?: "entrance" | "exit" | "attention"): MotionPresetDefinition[] {
    const all = Array.from(this.presets.values());
    if (!category) return all;
    return all.filter((p) => p.category === category);
  }

  private registerBuiltIns(): void {
    // 1. Fade
    this.register({
      id: "fade",
      name: "Fade",
      category: "entrance",
      buildTracks(preset) {
        return [
          {
            property: "opacity",
            keyframes: [
              { time: 0, value: 0 },
              { time: 1, value: 1, easing: preset.easing },
            ],
          },
        ];
      },
    });

    // 2. Slide Up
    this.register({
      id: "slide-up",
      name: "Slide Up",
      category: "entrance",
      buildTracks(preset) {
        return [
          {
            property: "opacity",
            keyframes: [
              { time: 0, value: 0 },
              { time: 1, value: 1, easing: preset.easing },
            ],
          },
          {
            property: "translateY",
            keyframes: [
              { time: 0, value: 40 },
              { time: 1, value: 0, easing: preset.easing },
            ],
          },
        ];
      },
    });

    // 3. Slide Down
    this.register({
      id: "slide-down",
      name: "Slide Down",
      category: "entrance",
      buildTracks(preset) {
        return [
          {
            property: "opacity",
            keyframes: [
              { time: 0, value: 0 },
              { time: 1, value: 1, easing: preset.easing },
            ],
          },
          {
            property: "translateY",
            keyframes: [
              { time: 0, value: -40 },
              { time: 1, value: 0, easing: preset.easing },
            ],
          },
        ];
      },
    });

    // 4. Slide Left
    this.register({
      id: "slide-left",
      name: "Slide Left",
      category: "entrance",
      buildTracks(preset) {
        return [
          {
            property: "opacity",
            keyframes: [
              { time: 0, value: 0 },
              { time: 1, value: 1, easing: preset.easing },
            ],
          },
          {
            property: "translateX",
            keyframes: [
              { time: 0, value: 40 },
              { time: 1, value: 0, easing: preset.easing },
            ],
          },
        ];
      },
    });

    // 5. Slide Right
    this.register({
      id: "slide-right",
      name: "Slide Right",
      category: "entrance",
      buildTracks(preset) {
        return [
          {
            property: "opacity",
            keyframes: [
              { time: 0, value: 0 },
              { time: 1, value: 1, easing: preset.easing },
            ],
          },
          {
            property: "translateX",
            keyframes: [
              { time: 0, value: -40 },
              { time: 1, value: 0, easing: preset.easing },
            ],
          },
        ];
      },
    });

    // 6. Pop / Scale
    this.register({
      id: "pop",
      name: "Pop",
      category: "entrance",
      buildTracks(preset) {
        return [
          {
            property: "opacity",
            keyframes: [
              { time: 0, value: 0 },
              { time: 1, value: 1 },
            ],
          },
          {
            property: "scaleX",
            keyframes: [
              { time: 0, value: 0.5 },
              { time: 1, value: 1, easing: "elastic" },
            ],
          },
          {
            property: "scaleY",
            keyframes: [
              { time: 0, value: 0.5 },
              { time: 1, value: 1, easing: "elastic" },
            ],
          },
        ];
      },
    });

    // 7. Glow Pulse
    this.register({
      id: "glow-pulse",
      name: "Glow Pulse",
      category: "entrance",
      buildTracks(preset) {
        return [
          {
            property: "opacity",
            keyframes: [
              { time: 0, value: 0 },
              { time: 1, value: 1 },
            ],
          },
          {
            property: "blur",
            keyframes: [
              { time: 0, value: 8 },
              { time: 1, value: 0 },
            ],
          },
        ];
      },
    });
  }
}

export const motionPresetRegistry = new MotionPresetRegistry();
