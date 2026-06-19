/**
 * Runtime validation schemas for text effect definitions
 * Uses Zod for runtime type safety and validation
 */

import { z } from "zod";

// ── Gradient Stop Schema ────────────────────────────────────────────────────
export const GradientStopSchema = z.object({
  color: z.string(),
  offset: z.number().min(0).max(100),
});

// ── Effect Fill Schema ──────────────────────────────────────────────────────
export const EffectFillSchema = z.object({
  type: z.enum(["solid", "linear", "radial", "pattern", "none"]),
  color: z.string().optional(),
  gradient: z
    .object({
      angle: z.number(),
      stops: z.array(GradientStopSchema),
    })
    .optional(),
  patternType: z.string().optional(),
  perCharFillEnabled: z.boolean().optional(),
  charFillColors: z.array(z.string()).optional(),
});

// ── Effect Stroke Schema ────────────────────────────────────────────────────
export const EffectStrokeSchema = z.object({
  color: z.string(),
  width: z.number().min(0),
  position: z.enum(["outside", "center", "inside"]).optional(),
  opacity: z.number().min(0).max(100).optional(),
  lineJoin: z.enum(["round", "miter", "bevel"]).optional(),
  blur: z.number().min(0).optional(),
  type: z.enum(["solid", "gradient"]).optional(),
  colorSecondary: z.string().optional(),
  widthSecondary: z.number().min(0).optional(),
  fadeRange: z.tuple([z.number(), z.number()]).optional(),
});

// ── Effect Shadow Schema ────────────────────────────────────────────────────
// Supports both nested (current) and flat (legacy) offset structures
export const EffectShadowSchema = z
  .object({
    type: z.enum(["drop", "inner"]).optional(),
    color: z.string(),
    blur: z.number().min(0),
    offset: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
    offsetX: z.number().optional(), // Legacy flat format
    offsetY: z.number().optional(), // Legacy flat format
    opacity: z.number().min(0).max(100).optional(),
  })
  .refine((data) => data.offset !== undefined || (data.offsetX !== undefined && data.offsetY !== undefined), { message: "Shadow must have either nested 'offset' or flat 'offsetX/offsetY'" });

// ── Effect Bevel Schema ─────────────────────────────────────────────────────
// Supports both new (highlight/shadow) and legacy (highlightColor/shadowColor) property names
export const EffectBevelSchema = z
  .object({
    depth: z.number().min(0),
    highlight: z.string().optional(), // Current Studio output
    highlightColor: z.string().optional(), // Legacy format
    shadow: z.string().optional(), // Current Studio output
    shadowColor: z.string().optional(), // Legacy format
    direction: z.enum(["bottom-right", "bottom", "right"]).optional(),
    coreColor: z.string().optional(),
    edgeColor: z.string().optional(),
    edgeWidth: z.number().min(0).optional(),
    blur: z.number().min(0).optional(),
    blurColor: z.string().optional(),
    perspectiveEnabled: z.boolean().optional(),
    vanishingPointX: z.number().optional(),
    vanishingPointY: z.number().optional(),
    focalLength: z.number().optional(),
  })
  .refine((data) => data.highlight !== undefined || data.highlightColor !== undefined, { message: "Bevel must have either 'highlight' or 'highlightColor'" })
  .refine((data) => data.shadow !== undefined || data.shadowColor !== undefined, { message: "Bevel must have either 'shadow' or 'shadowColor'" });

// ── Effect Glow Schema ──────────────────────────────────────────────────────
export const EffectGlowSchema = z.object({
  color: z.string(),
  blur: z.number().min(0),
  opacity: z.number().min(0).max(100),
  type: z.enum(["outer", "inner"]).optional(),
  strength: z.number().min(0).optional(),
  spread: z.number().min(0).optional(),
});

// ── Effect Panel Schema ─────────────────────────────────────────────────────
// Supports both nested (current) and flat (legacy) padding structures
export const EffectPanelSchema = z
  .object({
    color: z.string(),
    opacity: z.number().min(0).max(100),
    radius: z.number().min(0),
    padding: z
      .object({
        x: z.number().min(0),
        y: z.number().min(0),
      })
      .optional(),
    paddingX: z.number().min(0).optional(), // Legacy flat format
    paddingY: z.number().min(0).optional(), // Legacy flat format
    stroke: z
      .object({
        color: z.string(),
        width: z.number().min(0),
      })
      .nullable()
      .optional(),
  })
  .refine((data) => data.padding !== undefined || (data.paddingX !== undefined && data.paddingY !== undefined), { message: "Panel must have either nested 'padding' or flat 'paddingX/paddingY'" });

// ── Effect Stack Schema ─────────────────────────────────────────────────────
export const EffectStackSchema = z.object({
  count: z.number().int().min(1).max(100),
  offsetX: z.number(),
  offsetY: z.number(),
  opacityDecay: z.number().min(0).max(1),
  color1: z.string().optional(),
  color2: z.string().optional(),
  color3: z.string().optional(),
  color4: z.string().optional(),
});

// ── Font Schema ─────────────────────────────────────────────────────────────
export const FontSchema = z.object({
  family: z.string().min(1),
  weight: z.number().int().min(100).max(900),
  style: z.enum(["normal", "italic"]),
  letterSpacing: z.number(),
  lineHeight: z.number().positive(),
});

// ── Animation Schema ────────────────────────────────────────────────────────
export const AnimationSchema = z.object({
  type: z.enum(["none", "typewriter", "wave", "fade", "glitch"]),
  speed: z.number().positive().optional(),
  amplitude: z.number().optional(),
  frequency: z.number().positive().optional(),
});

// ── Effect Index Item Schema ────────────────────────────────────────────────
export const EffectIndexItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPremium: z.boolean().optional(),
  previewType: z.enum(["static", "video", "lottie"]).optional(),
  thumbnailUrl: z.string().url().optional(),
  thumbnail: z.string().optional(),
  previewUrl: z.string().url().optional(),
  durationMs: z.number().positive().optional(),
});

// ── Bounding Box Schema ─────────────────────────────────────────────────────
export const BoundingBoxSchema = z.object({
  paddingX: z.number().min(0),
  paddingY: z.number().min(0),
  mode: z.enum(["ink", "panel"]).optional(),
});

// ── Effect Full Definition Schema ───────────────────────────────────────────
export const EffectFullDefinitionSchema = EffectIndexItemSchema.extend({
  version: z.string().optional(),
  description: z.string(),
  tags: z.array(z.string()),
  font: FontSchema,
  fills: z.array(EffectFillSchema),
  strokes: z.array(EffectStrokeSchema),
  shadows: z.array(EffectShadowSchema),
  bevel: EffectBevelSchema.optional(),
  glow: EffectGlowSchema.optional(), // Legacy single glow
  glows: z.array(EffectGlowSchema).optional(), // Current multi-layer glows
  panel: EffectPanelSchema.optional(),
  glitch: z.any().optional(), // TODO: Define proper schema when glitch effects are implemented
  animation: AnimationSchema.optional(),
  background: z.any().optional(), // DEPRECATED: kept for backward compatibility
  stack: EffectStackSchema.optional(),
  boundingBox: BoundingBoxSchema.optional(),
});

// ── Text Effect Definition Schema ───────────────────────────────────────────
export const TextEffectDefinitionSchema = EffectFullDefinitionSchema.extend({
  text: z.string().optional(),
});

// ── Validation Helper Functions ─────────────────────────────────────────────

/**
 * Validates an effect definition with detailed error reporting
 * @param data - The effect definition to validate
 * @returns Validation result with success/error details
 */
export function validateEffectDefinition(data: unknown) {
  return EffectFullDefinitionSchema.safeParse(data);
}

/**
 * Validates an effect definition and throws on error
 * @param data - The effect definition to validate
 * @returns The validated effect definition
 * @throws {z.ZodError} If validation fails
 */
export function validateEffectDefinitionStrict(data: unknown) {
  return EffectFullDefinitionSchema.parse(data);
}

/**
 * Validates a text effect definition with detailed error reporting
 * @param data - The text effect definition to validate
 * @returns Validation result with success/error details
 */
export function validateTextEffectDefinition(data: unknown) {
  return TextEffectDefinitionSchema.safeParse(data);
}

/**
 * Validates a text effect definition and throws on error
 * @param data - The text effect definition to validate
 * @returns The validated text effect definition
 * @throws {z.ZodError} If validation fails
 */
export function validateTextEffectDefinitionStrict(data: unknown) {
  return TextEffectDefinitionSchema.parse(data);
}

/**
 * Formats Zod validation errors into human-readable messages
 * @param error - The Zod error object
 * @returns Array of formatted error messages
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((err) => {
    const path = err.path.join(".");
    return `${path ? `${path}: ` : ""}${err.message}`;
  });
}

// ── Export Types ────────────────────────────────────────────────────────────

export type ValidatedEffectDefinition = z.infer<typeof EffectFullDefinitionSchema>;
export type ValidatedTextEffectDefinition = z.infer<typeof TextEffectDefinitionSchema>;

// ── Text Template Schemas ───────────────────────────────────────────────────

export const TemplateCategorySchema = z.enum([
  "lower-third",
  "title-card",
  "caption",
  "callout",
  "social",
  "countdown"
]);

export const AnimationPresetSchema = z.enum([
  "fade",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale-in",
  "scale-out",
  "blur-in",
  "blur-out",
  "typewriter",
  "none"
]);

export const LayerAnimationSchema = z.object({
  in: AnimationPresetSchema,
  out: AnimationPresetSchema,
  inDuration: z.number().nonnegative(),
  outDuration: z.number().nonnegative(),
  hold: z.union([z.enum(["full"]), z.number().nonnegative()])
});

export const TextLayerSchema = z.object({
  kind: z.literal("text"),
  id: z.string().min(1),
  content: z.string(),
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  color: z.string(),
  align: z.enum(["left", "center", "right"]),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  animation: LayerAnimationSchema,
  role: z.enum(["primary", "secondary", "accent"]).optional()
});

export const ShapeLayerSchema = z.object({
  kind: z.literal("shape"),
  id: z.string().min(1),
  shape: z.enum(["rect", "line", "circle"]),
  fill: z.string(),
  stroke: z.object({
    color: z.string(),
    width: z.number().nonnegative()
  }).optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  animation: LayerAnimationSchema
});

export const ImageLayerSchema = z.object({
  kind: z.literal("image"),
  id: z.string().min(1),
  url: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  animation: LayerAnimationSchema
});

export const TemplateLayerSchema = z.discriminatedUnion("kind", [
  TextLayerSchema,
  ShapeLayerSchema,
  ImageLayerSchema
]);

export const TextTemplateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  category: TemplateCategorySchema,
  duration: z.number().positive(),
  canvasWidth: z.number().positive(),
  canvasHeight: z.number().positive(),
  thumbnail: z.string().optional(),
  preview: z.string().optional(),
  layers: z.array(TemplateLayerSchema)
});

export function validateTextTemplate(data: unknown) {
  return TextTemplateSchema.safeParse(data);
}

export function validateTextTemplateStrict(data: unknown) {
  return TextTemplateSchema.parse(data);
}

export type ValidatedTextTemplate = z.infer<typeof TextTemplateSchema>;

