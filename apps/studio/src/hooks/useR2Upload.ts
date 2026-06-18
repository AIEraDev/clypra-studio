/**
 * React hook for R2 audio uploads via API endpoint
 * Uploads audio through the clypra-api which handles R2 and index management
 */

import { useState } from "react";

const API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

export interface AudioUploadPayload {
  id: string;
  category: string;
  audioFile: {
    name: string;
    dataUrl: string;
  };
  coverArtDataUrl?: string;
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    author: string;
    duration: number;
    bpm?: number;
    loopable?: boolean;
    license: {
      type: string;
      url?: string;
      attributionRequired: boolean;
    };
    source: {
      provider: string;
      url: string;
    };
    safety?: {
      status: string;
      reviewedAt?: string;
      notes?: string;
    };
  };
}

export interface AudioUploadResult {
  success: boolean;
  message: string;
  audio: {
    id: string;
    name: string;
    category: string;
    description: string;
    tags: string[];
    author: string;
    duration: number;
    audioUrl: string;
    coverArtUrl?: string;
  };
}

export interface UseR2UploadReturn {
  uploadAudio: (payload: AudioUploadPayload) => Promise<AudioUploadResult>;
  uploadProgress: number | null;
}

export function useR2Upload(): UseR2UploadReturn {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const uploadAudio = async (payload: AudioUploadPayload): Promise<AudioUploadResult> => {
    setUploadProgress(0);

    try {
      // Transform payload to match API expectations
      const apiPayload = {
        audio: {
          id: payload.id,
          name: payload.metadata.name,
          category: payload.category,
          description: payload.metadata.description,
          tags: payload.metadata.tags,
          author: payload.metadata.author,
          duration: payload.metadata.duration,
          bpm: payload.metadata.bpm,
          loopable: payload.metadata.loopable,
          license: payload.metadata.license,
          source: payload.metadata.source,
          safety: payload.metadata.safety,
          fileName: payload.audioFile.name,
        },
        audioFileDataUrl: payload.audioFile.dataUrl,
        coverArtDataUrl: payload.coverArtDataUrl,
      };

      const response = await fetch(`${API_BASE_URL}/audio/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result: AudioUploadResult = await response.json();

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 2000);

      return result;
    } catch (error) {
      setUploadProgress(null);
      throw error;
    }
  };

  return {
    uploadAudio,
    uploadProgress,
  };
}
