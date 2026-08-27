import type { TextEffectConfig } from "@clypra-studio/engine";

export type ConfigUpdater =
  | Partial<TextEffectConfig>
  | ((config: TextEffectConfig) => TextEffectConfig);

export interface BaseControlSectionProps {
  config: TextEffectConfig;
  modifyConfig: (updater: ConfigUpdater) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}
