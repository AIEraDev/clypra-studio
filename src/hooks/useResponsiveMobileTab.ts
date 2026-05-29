import { useEffect, useState } from "react";

export type MobileActiveTab = "controls" | "preview" | "code";

const getInitialIsMobile = (breakpoint: number) => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < breakpoint;
};

export function useResponsiveMobileTab(breakpoint = 1000) {
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileActiveTab>("preview");
  const [isMobile, setIsMobile] = useState<boolean>(() => getInitialIsMobile(breakpoint));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return { mobileActiveTab, setMobileActiveTab, isMobile };
}
