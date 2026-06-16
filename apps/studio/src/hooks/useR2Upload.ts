/**
 * React hook for R2 audio uploads
 * Provides direct upload functionality to Cloudflare R2 bucket
 */

import { useState } from "react";
import { uploadAudioToR2, getR2Config, saveR2Config, type R2UploadConfig, type R2UploadResult } from "../services/r2UploadService";

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

export interface UseR2UploadReturn {
  uploadAudio: (payload: AudioUploadPayload) => Promise<R2UploadResult>;
  isConfigured: boolean;
  getConfig: () => R2UploadConfig | null;
  setConfig: (config: R2UploadConfig) => void;
  uploadProgress: number | null;
}

export function useR2Upload(): UseR2UploadReturn {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const uploadAudio = async (payload: AudioUploadPayload): Promise<R2UploadResult> => {
    setUploadProgress(0);
    try {
      const result = await uploadAudioToR2(payload);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 2000);
      return result;
    } catch (error) {
      setUploadProgress(null);
      throw error;
    }
  };

  const isConfigured = !!getR2Config();

  return {
    uploadAudio,
    isConfigured,
    getConfig: getR2Config,
    setConfig: saveR2Config,
    uploadProgress,
  };
}
