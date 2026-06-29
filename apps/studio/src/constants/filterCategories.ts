/**
 * Single source of truth for filter categories — must match clypra-api FILTER_CATEGORIES.
 */

export const FILTER_CATEGORY_IDS = [
  "essentials",
  "portrait",
  "landscape",
  "cinematic",
  "movies",
  "vintage",
  "vibrant",
  "mono",
  "aesthetic",
  "life",
] as const;

export type FilterCategoryId = (typeof FILTER_CATEGORY_IDS)[number];

export const FILTER_CATEGORY_OPTIONS: ReadonlyArray<{
  id: FilterCategoryId;
  name: string;
  description: string;
}> = [
  { id: "essentials", name: "Essentials", description: "Essential color adjustments" },
  { id: "portrait", name: "Portrait", description: "Skin tones and face-friendly looks" },
  { id: "landscape", name: "Landscape", description: "Scenic and outdoor grading" },
  { id: "cinematic", name: "Cinematic", description: "Film-inspired grading" },
  { id: "movies", name: "Movies", description: "Hollywood and blockbuster styles" },
  { id: "vintage", name: "Vintage", description: "Nostalgic retro filters" },
  { id: "vibrant", name: "Vibrant", description: "Bright and colorful looks" },
  { id: "mono", name: "Mono", description: "Classic monochrome filters" },
  { id: "aesthetic", name: "Aesthetic", description: "Creative stylized grades" },
  { id: "life", name: "Life", description: "Everyday lifestyle looks" },
];
