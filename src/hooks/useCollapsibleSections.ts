import { useCallback, useState } from "react";

const DEFAULT_COLLAPSED_SECTIONS: Record<string, boolean> = {
  text: false,
  font: false,
  fill: false,
  stroke: false,
  glow: false,
  shadow: false,
  bevel: false,
  stack: true,
  panel: false,
  canvas: false,
};

export function useCollapsibleSections() {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
    DEFAULT_COLLAPSED_SECTIONS,
  );

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }, []);

  return { collapsedSections, toggleSection };
}
