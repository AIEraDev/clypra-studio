/**
 * Compatibility declarations for the published engine package used by the
 * Studio app. The workspace source has these fields, while the installed
 * package can lag until its next release.
 */
import "@clypra-studio/engine";

declare module "@clypra-studio/engine" {
  interface TextEffectConfig {
    fireFlameHeight?: number;
    iceIcicleHeight?: number;
    iceSnowHeight?: number;
    auraReach?: number;
  }

  interface OverlayDocument {
    schemaVersion?: number;
  }

  interface TextTemplate {
    description?: string;
    tags?: string[];
  }

  interface ColorAdjustments {
    hueRotate?: number;
    blur?: number;
    invert?: number;
  }
}
