/**
 * Hook for uploading text effects directly to R2 via clypra-api
 */

import { useState } from "react";

const API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

export interface TextEffectUploadPayload {
  effect: {
    id: string;
    name: string;
    category: string;
    description?: string;
    tags?: string[];
    [key: string]: any; // Full effect definition
  };
  thumbnailDataUrl?: string;
}

export interface TextEffectUploadResult {
  success: boolean;
  message: string;
  effect: {
    id: string;
    name: string;
    category: string;
    description: string;
    tags: string[];
    thumbnail: string;
  };
}

export function useTextEffectR2Upload() {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedEffect, setUploadedEffect] = useState<TextEffectUploadResult["effect"] | null>(null);

  const uploadTextEffect = async (payload: TextEffectUploadPayload): Promise<TextEffectUploadResult> => {
    setStatus("uploading");
    setMessage("Uploading text effect to R2...");
    setUploadedEffect(null);

    try {
      const response = await fetch(`${API_BASE_URL}/text-effects/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      const result: TextEffectUploadResult = await response.json();

      setStatus("success");
      setMessage(result.message);
      setUploadedEffect(result.effect);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload text effect";
      setStatus("error");
      setMessage(errorMessage);
      throw error;
    }
  };

  const reset = () => {
    setStatus("idle");
    setMessage(null);
    setUploadedEffect(null);
  };

  return {
    uploadTextEffect,
    status,
    message,
    uploadedEffect,
    reset,
  };
}
