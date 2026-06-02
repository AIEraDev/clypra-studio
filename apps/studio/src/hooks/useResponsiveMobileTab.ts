import { useEffect, useState } from "react";

export type MobileActiveTab = "controls" | "preview" | "code";

// Breakpoints:
//   mobile  — < 768px   (phones, single-column tab view)
//   tablet  — 768–1199px (two-column: left panel + canvas, right panel hidden behind tab)
//   desktop — ≥ 1200px  (full three-column layout)
const MOBILE_BP = 768;
const DESKTOP_BP = 1200;

const getInitialIsMobile = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BP;
};

const getInitialIsTablet = () => {
  if (typeof window === "undefined") return false;
  const w = window.innerWidth;
  return w >= MOBILE_BP && w < DESKTOP_BP;
};

export function useResponsiveMobileTab() {
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileActiveTab>("preview");
  const [isMobile, setIsMobile] = useState<boolean>(getInitialIsMobile);
  const [isTablet, setIsTablet] = useState<boolean>(getInitialIsTablet);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < MOBILE_BP);
      setIsTablet(w >= MOBILE_BP && w < DESKTOP_BP);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // On mobile default to "preview"; on tablet default to "preview" as well
  const isNarrow = isMobile || isTablet;

  return { mobileActiveTab, setMobileActiveTab, isMobile, isTablet, isNarrow };
}
