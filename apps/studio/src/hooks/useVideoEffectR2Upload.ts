import { useState } from "react";

const API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

export function useVideoEffectR2Upload() {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const uploadVideoEffect = async (payload: any) => {
    setStatus("uploading");
    setMessage(null);
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
          throw new Error("Admin access required. Only administrators can publish video effects.");
        }
      } catch (e) {
        throw new Error("Invalid authentication token. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}/video-effects/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Upload failed");
      }

      setStatus("success");
      setMessage("Video effect published successfully!");
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message || "An error occurred during upload.");
    }
  };

  const reset = () => {
    setStatus("idle");
    setMessage(null);
  };

  return { uploadVideoEffect, status, message, reset };
}
