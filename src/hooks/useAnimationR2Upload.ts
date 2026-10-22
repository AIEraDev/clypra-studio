/**
 * useAnimationR2Upload
 *
 * Uploads an animation preset — including its thumbnail image and short
 * preview video — to the Clypra API, which stores the binaries in R2 and
 * patches the derived public URLs back into the catalog record.
 *
 * This hook mirrors the shape of `useTextEffectR2Upload` so both publish
 * flows stay consistent.
 *
 * API endpoint: POST /text-animations/upload
 * Auth: Bearer token from `getStoredAuthToken()` (admin only)
 *
 * Request body:
 *   animation            — full TextAnimationPreset definition
 *   thumbnailDataUrl?    — base64 data URL, e.g. "data:image/png;base64,…"
 *   previewVideoDataUrl? — base64 data URL, e.g. "data:video/mp4;base64,…"
 *
 * On success the React Query animation catalog cache is invalidated so
 * consumers (preset browsers, live previews) automatically refetch.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TextAnimationPreset } from "../types/animation";
import { getStudioApiBaseUrl } from "../services/apiConfig";
import { getStoredAuthToken } from "../services/authSession";
import { studioQueryKeys } from "../services/studioQueryKeys";

// ── Types ──────────────────────────────────────────────────────────────────

/** Payload sent from the Studio UI to this hook. */
export interface AnimationUploadPayload {
  /** Complete preset definition (id, name, phase, tracks, etc.). */
  preset: TextAnimationPreset;
  /**
   * Thumbnail image as a base64 data URL.
   * e.g. "data:image/png;base64,iVBORw0KGgoAAAANS..."
   */
  thumbnailDataUrl?: string;
  /**
   * Short preview video as a base64 data URL.
   * e.g. "data:video/mp4;base64,AAAAIG…"
   */
  previewVideoDataUrl?: string;
  /**
   * File extension hint for the preview video when the MIME type is ambiguous.
   * Defaults to "mp4".
   */
  previewVideoExt?: "mp4" | "webm";
}

/** Shape of the successful API response from POST /text-animations/upload. */
export interface AnimationUploadResult {
  success: boolean;
  message: string;
  /** The saved animation with thumbnailUrl and previewVideoUrl populated by the API. */
  animation: TextAnimationPreset;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAnimationR2Upload() {
  const queryClient = useQueryClient();
  const apiBase = getStudioApiBaseUrl();

  const mutation = useMutation<
    AnimationUploadResult,
    Error,
    AnimationUploadPayload
  >({
    mutationFn: async (payload) => {
      const token = getStoredAuthToken();

      const response = await fetch(`${apiBase}/text-animations/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          animation: payload.preset,
          thumbnailDataUrl: payload.thumbnailDataUrl,
          previewVideoDataUrl: payload.previewVideoDataUrl,
        }),
      });

      // Attempt to parse error details regardless of status code.
      const data = (await response.json().catch(() => ({}))) as any;

      if (!response.ok) {
        throw new Error(
          data?.error ??
            data?.message ??
            `Publish failed (HTTP ${response.status})`,
        );
      }

      return data as AnimationUploadResult;
    },

    onSuccess: async () => {
      // Bust the animation catalog cache so the preset browser reflects the
      // new/updated preset without requiring a manual page refresh.
      await queryClient.invalidateQueries({
        queryKey: studioQueryKeys.animationCatalog,
      });
    },
  });

  // ── Derived status / message helpers (consistent with useTextEffectR2Upload) ─
  const status = mutation.isPending
    ? "uploading"
    : mutation.isSuccess
      ? "success"
      : mutation.isError
        ? "error"
        : "idle";

  const message = mutation.isPending
    ? "Publishing animation preset…"
    : mutation.isError
      ? mutation.error.message
      : (mutation.data?.message ?? null);

  return {
    /**
     * Trigger the upload. Returns the saved preset (with populated media URLs)
     * on success, or throws on failure.
     */
    uploadAnimationPreset: mutation.mutateAsync,
    /** "idle" | "uploading" | "success" | "error" */
    status,
    /** Human-readable status message suitable for a toast or inline label. */
    message,
    /** The fully saved animation returned by the API, or null if not yet complete. */
    uploadedAnimation: mutation.data?.animation ?? null,
    reset: mutation.reset,
  };
}
