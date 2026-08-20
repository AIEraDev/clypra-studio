import type { Preset } from "@clypra-studio/engine";
import { defaultConfig } from "@clypra-studio/engine";

/**
 * Small, deterministic sample used to verify the Studio → native daemon
 * preview path. It stays inside the shared text-effect schema: gradient,
 * stroke, two controlled glows, and a drop shadow.
 */
export const nativeAuroraPreset: Preset = {
  id: "native-aurora",
  name: "Native Aurora",
  category: "Native",
  config: {
    ...defaultConfig,
    text: "NATIVE AURORA",
    effectName: "NativeAurora",
    fontFamily: "Poppins",
    fontWeight: 800,
    fontSize: 82,
    letterSpacing: 5,
    fillType: "linear",
    fillGradientAngle: 115,
    fillGradientStops: [
      { color: "#E8FFFF", offset: 0 },
      { color: "#72F6FF", offset: 38 },
      { color: "#9A7CFF", offset: 72 },
      { color: "#FF71D1", offset: 100 },
    ],
    strokeEnabled: true,
    strokeColor: "#D8FFFF",
    strokeWidth: 2,
    strokePosition: "outside",
    strokeOpacity: 90,
    glowLayers: [
      { enabled: true, color: "#32E6FF", blur: 18, opacity: 78, type: "outer", strength: 1, spread: 2 },
      { enabled: true, color: "#A66CFF", blur: 44, opacity: 48, type: "outer", strength: 1, spread: 4 },
    ],
    shadowEnabled: true,
    shadowColor: "#160B36",
    shadowBlur: 12,
    shadowOffsetX: 0,
    shadowOffsetY: 8,
    shadowOpacity: 72,
    shadowType: "drop",
  },
};

