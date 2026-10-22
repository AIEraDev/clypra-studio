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
 * Transport strategy:
 *   - When a video file is present, the payload is sent as multipart/form-data
 *     so the binary video is streamed directly without base64 inflation.
 *   - When only a thumbnail (image) is present, the payload falls back to
 *     a JSON body with a base64 data URL for the thumbnail — consistent with
 *     the text-effects upload flow.
 *
 * Request body (JSON fallback — no video):
 *   animation            — full TextAnimationPreset definition
 *   thumbnailDataUrl?    — base64 data URL, e.g. "data:image/png;base64,…"
 *
 * Request body (multipart/form-data — with video):
 *   animation            — JSON string of the TextAnimationPreset
 *   thumbnailFile?       — binary image part (PNG/JPEG/WebP)
 *   videoFile?           — binary video part (WebM/MP4)
 *   previewVideoExt?     — "webm" | "mp4" hint for R2 key extension
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
   * e.g. "data:video/webm;base64,AAAAIG…"
   */
  previewVideoDataUrl?: string;
  /**
   * File extension hint for the preview video when the MIME type is ambiguous.
   * Defaults to "webm" (the browser MediaRecorder output format).
   */
  previewVideoExt?: "mp4" | "webm";
  /**
   * Optional raw video File object. When provided, the upload uses
   * multipart/form-data instead of base64-in-JSON to avoid payload inflation.
   * If both videoFile and previewVideoDataUrl are provided, videoFile wins.
   */
  videoFile?: File;
  /**
   * Optional raw thumbnail File object. Used alongside videoFile in the
   * multipart path.
   */
  thumbnailFile?: File;
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
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      let response: Response;

      // ── Multipart path: use when a raw video File is available ─────────
      // Streams the binary directly — avoids 1.33× base64 size inflation.
      if (payload.videoFile || payload.thumbnailFile) {
        const form = new FormData();
        form.append("animation", JSON.stringify(payload.preset));
        if (payload.thumbnailFile) {
          form.append("thumbnailFile", payload.thumbnailFile);
        } else if (payload.thumbnailDataUrl) {
          form.append("thumbnailDataUrl", payload.thumbnailDataUrl);
        }
        if (payload.videoFile) {
          form.append("videoFile", payload.videoFile);
          const ext =
            payload.previewVideoExt ??
            (payload.videoFile.name.endsWith(".mp4") ? "mp4" : "webm");
          form.append("previewVideoExt", ext);
        }

        response = await fetch(`${apiBase}/text-animations/upload`, {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: form,
        });
      } else {
        // ── JSON path: no raw File objects — use base64 data URLs ─────────
        response = await fetch(`${apiBase}/text-animations/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          credentials: "include",
          body: JSON.stringify({
            animation: payload.preset,
            thumbnailDataUrl: payload.thumbnailDataUrl,
            previewVideoDataUrl: payload.previewVideoDataUrl,
            previewVideoExt: payload.previewVideoExt,
          }),
        });
      }

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
