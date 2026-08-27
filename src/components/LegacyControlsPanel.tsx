import {
  TextEffectControls,
  type TextEffectControlsProps,
} from "./text-effects/controls/TextEffectControls";

export type { TextEffectControlsProps as LegacyControlsPanelProps };

export function LegacyControlsPanel(props: TextEffectControlsProps) {
  return <TextEffectControls {...props} />;
}

export { TextEffectControls };
