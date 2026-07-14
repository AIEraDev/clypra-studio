import type { FilterCategoryId } from "../../../constants/filterCategories";
import type { GradingParams as EngineGradingParams, ColorAdjustments as EngineColorAdjustments } from "@clypra-studio/engine";

export type GradingParams = EngineGradingParams;
export type ColorAdjustments = EngineColorAdjustments;

export interface FilterPreset {
  id:          string;
  name:        string;
  category:    FilterCategoryId;
  description: string;
  cssFilter:   string;
  gradingParams?: GradingParams;
  intensity:   number;
}

export type CategoryType = "all" | FilterCategoryId;

export const INITIAL_MANUAL_ADJUSTMENTS: ColorAdjustments = {};

