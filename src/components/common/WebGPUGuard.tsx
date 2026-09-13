/**
 * WebGPU Hardware Guard
 *
 * Hard requirement gate for Clypra Studio Effect Builder.
 * Rejects silent fallbacks to 2D Canvas or WebGL2 to guarantee that
 * authored WGSL shaders execute identically on desktop native wgpu.
 */

import React, { useState, useEffect } from "react";
import { AlertTriangle, Cpu } from "lucide-react";

export const CLYPRA_STUDIO_REQUIRED_LIMITS = {
  maxBindGroups: 4,
  maxTextureDimension2D: 4096,
  maxSampledTexturesPerShaderStage: 16,
  maxSamplersPerShaderStage: 8,
  maxStorageBuffersPerShaderStage: 4,
  maxStorageBufferBindingSize: 134217728,
  maxUniformBuffersPerShaderStage: 8,
  maxUniformBufferBindingSize: 65536,
} as const;

export interface WebGPUGuardProps {
  children: React.ReactNode;
}

export function WebGPUGuard({ children }: WebGPUGuardProps) {
  const [status, setStatus] = useState<"checking" | "ready" | "unsupported">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkWebGpu() {
      if (typeof navigator === "undefined" || !("gpu" in navigator)) {
        if (active) {
          setStatus("unsupported");
          setErrorMessage("WebGPU is not supported in this browser. Please use Chrome 113+, Microsoft Edge, or Safari 18+.");
        }
        return;
      }

      try {
        const gpu = (navigator as any).gpu;
        const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
        if (!adapter) {
          if (active) {
            setStatus("unsupported");
            setErrorMessage("No suitable WebGPU adapter found on your machine.");
          }
          return;
        }

        // Test device request with canonical limits
        const device = await adapter.requestDevice({
          requiredLimits: CLYPRA_STUDIO_REQUIRED_LIMITS,
        });

        if (active) {
          setStatus("ready");
          device.destroy();
        }
      } catch (err) {
        if (active) {
          setStatus("unsupported");
          setErrorMessage(err instanceof Error ? err.message : "Failed to initialize WebGPU with Clypra baseline limits.");
        }
      }
    }

    checkWebGpu();

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface select-none">
        <Cpu className="w-8 h-8 text-accent animate-pulse mb-3" />
        <p className="text-xs text-text-muted">Probing WebGPU hardware limits...</p>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface select-none">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-2">WebGPU Hardware Acceleration Required</h3>
        <p className="text-xs text-text-muted max-w-md mb-4 leading-relaxed">
          Clypra Studio compiles and previews native WGSL fragment shaders. To guarantee that authored effects
          render identically on the desktop wgpu engine, 2D Canvas and WebGL2 silent fallbacks are disabled.
        </p>
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-[11px] text-red-400 font-mono max-w-md">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
