/**
 * Hook for uploading text effects directly to R2 via clypra-api
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudioApiBaseUrl } from "../services/apiConfig";
import { studioQueryKeys } from "../services/studioQueryKeys";

const API_BASE_URL = getStudioApiBaseUrl();

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
  const queryClient = useQueryClient();
  const mutation = useMutation<TextEffectUploadResult, Error, TextEffectUploadPayload>({
    mutationFn: async (payload) => {
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

      return (await response.json()) as TextEffectUploadResult;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: studioQueryKeys.textEffectsCatalog,
      });
    },
  });

  const status = mutation.isPending
    ? "uploading"
    : mutation.isSuccess
      ? "success"
      : mutation.isError
        ? "error"
        : "idle";
  const message = mutation.isPending
    ? "Uploading text effect to R2..."
    : mutation.isError
      ? mutation.error.message
      : mutation.data?.message ?? null;

  return {
    uploadTextEffect: mutation.mutateAsync,
    status,
    message,
    uploadedEffect: mutation.data?.effect ?? null,
    reset: mutation.reset,
  };
}
