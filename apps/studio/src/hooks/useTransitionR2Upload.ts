/**
 * Hook for uploading transitions directly to R2 via clypra-api
 */

import { useState } from "react";

const API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

export interface TransitionUploadPayload {
  transition: {
    id: string;
    name: string;
    category: string;
    description: string;
    renderer: string;
    params: any[];
    defaultDuration?: number;
    defaultEasing?: string;
    tags?: string[];
    isPremium?: boolean;
    published?: boolean; // Auto-publish if admin
  };
  thumbnailDataUrl: string;
  previewDataUrl: string;
}

export interface TransitionUploadResult {
  success: boolean;
  message: string;
  urls: {
    thumbnail: string;
    preview: string;
  };
}

export function useTransitionR2Upload() {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<TransitionUploadResult["urls"] | null>(null);

  const uploadTransition = async (payload: TransitionUploadPayload): Promise<TransitionUploadResult> => {
    setStatus("uploading");
    setMessage("Uploading transition to Cloudflare R2...");
    setUploadedUrls(null);

    try {
      // Get auth token
      const token = localStorage.getItem("clypra_auth_token");
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      // Validate admin status
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        if (!tokenPayload.isAdmin) {
          throw new Error("Admin access required. Only administrators can publish transitions.");
        }
      } catch (e) {
        throw new Error("Invalid authentication token. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}/transitions/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Upload failed: ${response.statusText}`);
      }

      const result: TransitionUploadResult = await response.json();

      setStatus("success");
      setMessage(result.message || "Transition uploaded successfully!");
      setUploadedUrls(result.urls);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload transition";
      setStatus("error");
      setMessage(errorMessage);
      throw error;
    }
  };

  const reset = () => {
    setStatus("idle");
    setMessage(null);
    setUploadedUrls(null);
  };

  return {
    uploadTransition,
    status,
    message,
    uploadedUrls,
    reset,
  };
}
