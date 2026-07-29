import React, { useEffect, useState } from "react";
import { StudioMasterApp } from "@clypra-studio/ui";

export const StudioMasterLabView: React.FC = () => {
  const [device, setDevice] = useState<GPUDevice | undefined>(undefined);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.gpu) {
      navigator.gpu
        .requestAdapter()
        .then((adapter) => adapter?.requestDevice())
        .then((gpuDevice) => {
          if (gpuDevice) setDevice(gpuDevice);
        })
        .catch((err) => console.warn("WebGPU initialization fallback:", err));
    }
  }, []);

  return <StudioMasterApp device={device} />;
};
