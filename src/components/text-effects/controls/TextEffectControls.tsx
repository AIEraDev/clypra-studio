import type { TextEffectConfig } from "@clypra-studio/engine";
import type { ConfigUpdater } from "./common/types";
import { TextConfigSection } from "./sections/TextConfigSection";
import { FontSpecimenSection } from "./sections/FontSpecimenSection";
import { FillGradientSection } from "./sections/FillGradientSection";
import { StrokeSection } from "./sections/StrokeSection";
import { GlowSection } from "./sections/GlowSection";
import { ShadowSection } from "./sections/ShadowSection";
import { BevelSection } from "./sections/BevelSection";
import { StackExtrusionSection } from "./sections/StackExtrusionSection";
import { BoundingPlateSection } from "./sections/BoundingPlateSection";
import { CanvasLayoutSection } from "./sections/CanvasLayoutSection";

export interface TextEffectControlsProps {
  visible?: boolean;
  config: TextEffectConfig;
  activeEffectId: string;
  collapsedSections: Record<string, boolean>;
  isGeneratingName: boolean;
  modifyConfig: (updater: ConfigUpdater) => void;
  toggleSection: (section: string) => void;
  handleGenerateAiEffectName: () => void;
  applyCompositionPreset: (presetId: string) => void;
  fitTextToComposition: () => void;
}

export function TextEffectControls({
  visible = true,
  config,
  activeEffectId,
  collapsedSections,
  isGeneratingName,
  modifyConfig,
  toggleSection,
  handleGenerateAiEffectName,
  applyCompositionPreset,
  fitTextToComposition,
}: TextEffectControlsProps) {
  if (!visible) return null;

  return (
    <div className="flex flex-col gap-2 mt-4">
      {/* 1. Text Configuration */}
      <TextConfigSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.text}
        onToggle={() => toggleSection("text")}
        activeEffectId={activeEffectId}
        isGeneratingName={isGeneratingName}
        handleGenerateAiEffectName={handleGenerateAiEffectName}
      />

      {/* 2. Font Specimen */}
      <FontSpecimenSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.font}
        onToggle={() => toggleSection("font")}
      />

      {/* 3. Text Fill Color & Gradients */}
      <FillGradientSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.fill}
        onToggle={() => toggleSection("fill")}
      />

      {/* 4. Stroke Border */}
      <StrokeSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.stroke}
        onToggle={() => toggleSection("stroke")}
      />

      {/* 5. Outer / Inner Glows */}
      <GlowSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.glow}
        onToggle={() => toggleSection("glow")}
      />

      {/* 6. Back Shadow */}
      <ShadowSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.shadow}
        onToggle={() => toggleSection("shadow")}
      />

      {/* 7. 3D Extrusion Bevel */}
      <BevelSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.bevel}
        onToggle={() => toggleSection("bevel")}
      />

      {/* 7.5. Multi-Stack Layers */}
      <StackExtrusionSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.stack}
        onToggle={() => toggleSection("stack")}
      />

      {/* 8. Bounding Plate */}
      <BoundingPlateSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.panel}
        onToggle={() => toggleSection("panel")}
      />

      {/* 9. Studio Canvas Layout */}
      <CanvasLayoutSection
        config={config}
        modifyConfig={modifyConfig}
        isCollapsed={!!collapsedSections.canvas}
        onToggle={() => toggleSection("canvas")}
        applyCompositionPreset={applyCompositionPreset}
        fitTextToComposition={fitTextToComposition}
      />
    </div>
  );
}

// Re-export subcomponents for granular composability
export {
  TextConfigSection,
  FontSpecimenSection,
  FillGradientSection,
  StrokeSection,
  GlowSection,
  ShadowSection,
  BevelSection,
  StackExtrusionSection,
  BoundingPlateSection,
  CanvasLayoutSection,
};
