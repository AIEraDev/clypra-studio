import { useState, useRef, useEffect, useCallback } from "react";
import {
  extractAudio,
  isVideoFile,
  isAudioFile,
  NoAudioTrackError,
  FileTooLargeError,
  MAX_VIDEO_SIZE_MB,
} from "../lib/extractAudio";

export type IngestStatus =
  | "idle"
  | "loading-engine"
  | "extracting"
  | "done"
  | "error";

export interface AudioIngestMetadata {
  name: string;
  format: string;
  size: string;
  duration: number;
  durationFormatted: string;
  spec: string;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function useAudioIngest(initialDone = false) {
  const [status, setStatus] = useState<IngestStatus>(
    initialDone ? "done" : "idle",
  );
  const [isExtractedFromVideo, setIsExtractedFromVideo] = useState(initialDone);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [originalVideoFile, setOriginalVideoFile] = useState<File | null>(null);
  const [extractProgress, setExtractProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLargeFile, setIsLargeFile] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(initialDone);

  // Error details
  const [errorTitle, setErrorTitle] = useState<string>("Extraction Error");
  const [errorMessage, setErrorMessage] = useState<string>(
    "This video has no audio track or is unsupported.",
  );

  // File metadata - start with empty/placeholder values when not initialDone
  const [metadata, setMetadata] = useState<AudioIngestMetadata>(
    initialDone
      ? {
          name: "neon_horizon_synthwave_master.wav",
          format: "WAV",
          size: "24.8 MB",
          duration: 222,
          durationFormatted: "03:42",
          spec: "48kHz / 24-bit stereo",
        }
      : {
          name: "",
          format: "",
          size: "",
          duration: 0,
          durationFormatted: "00:00",
          spec: "",
        },
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const elapsedTimerRef = useRef<any>(null);
  const simTimerRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearInterval(elapsedTimerRef.current);
      clearInterval(simTimerRef.current);
    };
  }, []);

  const cancelExtraction = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearInterval(elapsedTimerRef.current);
    clearInterval(simTimerRef.current);
    setStatus("idle");
    setExtractProgress(0);
    setElapsedSeconds(0);
  }, []);

  const ingestFile = useCallback(
    async (
      file: File,
      onSuggestedDetails?: (name: string, slug: string) => void,
    ) => {
      cancelExtraction();
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const sizeMB = file.size / (1024 * 1024);

      if (isVideoFile(file)) {
        // Video file -> extract audio client-side
        setOriginalVideoFile(file);
        setIsLargeFile(sizeMB > 200);

        if (sizeMB > MAX_VIDEO_SIZE_MB) {
          setStatus("error");
          setErrorTitle("File Exceeds Limit");
          setErrorMessage(
            `This video is too large to process in the browser (${sizeMB.toFixed(
              1,
            )} MB exceeds the ${MAX_VIDEO_SIZE_MB} MB limit).`,
          );
          return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setStatus("loading-engine");
        setExtractProgress(0);
        setElapsedSeconds(0);

        const startTime = Date.now();
        elapsedTimerRef.current = setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        try {
          // If first video, loading engine takes a moment, then transitions to extracting
          const extracted = await extractAudio(file, {
            onProgress: (pct) => {
              setStatus("extracting");
              setExtractProgress(pct);
            },
            signal: controller.signal,
          });

          clearInterval(elapsedTimerRef.current);

          if (controller.signal.aborted) return;

          setAudioFile(extracted);
          setIsExtractedFromVideo(true);
          setRightsConfirmed(false);

          // Calibrate duration
          let dur = 138;
          try {
            const tempAudio = document.createElement("audio");
            const objUrl = URL.createObjectURL(extracted);
            tempAudio.src = objUrl;
            await new Promise((res) => {
              tempAudio.onloadedmetadata = () => {
                dur = tempAudio.duration || 138;
                URL.revokeObjectURL(objUrl);
                res(true);
              };
              tempAudio.onerror = () => {
                URL.revokeObjectURL(objUrl);
                res(false);
              };
            });
          } catch {}

          const extractedExt =
            extracted.name.split(".").pop()?.toUpperCase() || "M4A";
          setMetadata({
            name: extracted.name,
            format: extractedExt,
            size: `${(extracted.size / (1024 * 1024)).toFixed(1)} MB`,
            duration: dur,
            durationFormatted: formatDuration(dur),
            spec:
              extractedExt === "M4A"
                ? "48kHz / stereo AAC"
                : "48kHz / stereo MP3",
          });

          setStatus("done");

          if (onSuggestedDetails) {
            const pretty = baseName
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-");
            onSuggestedDetails(pretty, slug);
          }
        } catch (err: any) {
          clearInterval(elapsedTimerRef.current);
          if (controller.signal.aborted) return;

          setStatus("error");
          if (err instanceof NoAudioTrackError) {
            setErrorTitle("No Audio Stream Found");
            setErrorMessage("This video has no audio track.");
          } else if (err instanceof FileTooLargeError) {
            setErrorTitle("File Exceeds Limit");
            setErrorMessage(err.message);
          } else {
            setErrorTitle("Extraction Error");
            setErrorMessage(
              err?.message ||
                "Extraction failed. Try again or use a smaller file.",
            );
          }
        }
      } else {
        // Plain audio file
        setIsLargeFile(false);
        setOriginalVideoFile(null);
        setAudioFile(file);
        setIsExtractedFromVideo(false);
        setRightsConfirmed(true);

        const format = ext.toUpperCase() || "AUDIO";
        let dur = 222;

        try {
          const tempAudio = document.createElement("audio");
          const objUrl = URL.createObjectURL(file);
          tempAudio.src = objUrl;
          await new Promise((res) => {
            tempAudio.onloadedmetadata = () => {
              if (
                Number.isFinite(tempAudio.duration) &&
                tempAudio.duration > 0
              ) {
                dur = tempAudio.duration;
              }
              URL.revokeObjectURL(objUrl);
              res(true);
            };
            tempAudio.onerror = () => {
              URL.revokeObjectURL(objUrl);
              res(false);
            };
          });
        } catch {}

        setMetadata({
          name: file.name,
          format,
          size: `${sizeMB.toFixed(1)} MB`,
          duration: dur,
          durationFormatted: formatDuration(dur),
          spec: "48kHz / 24-bit stereo",
        });

        setStatus("done");

        if (onSuggestedDetails) {
          const pretty = baseName
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-");
          onSuggestedDetails(pretty, slug);
        }
      }
    },
    [cancelExtraction],
  );

  const retry = useCallback(
    (onSuggestedDetails?: (name: string, slug: string) => void) => {
      if (originalVideoFile) {
        ingestFile(originalVideoFile, onSuggestedDetails);
      } else {
        setStatus("idle");
      }
    },
    [ingestFile, originalVideoFile],
  );

  const removeFile = useCallback(() => {
    cancelExtraction();
    setAudioFile(null);
    setOriginalVideoFile(null);
    setIsExtractedFromVideo(false);
    setRightsConfirmed(false);
    setStatus("idle");
  }, [cancelExtraction]);

  const resetAll = useCallback(() => {
    removeFile();
  }, [removeFile]);

  const downloadAudio = useCallback(() => {
    if (!audioFile) {
      // Create a dummy blob download for mock data if file not yet selected
      const dummy = new Blob(["AudioLab DSP Demuxed Lossless Stream"], {
        type: metadata.format === "M4A" ? "audio/mp4" : "audio/mpeg",
      });
      const url = URL.createObjectURL(dummy);
      const a = document.createElement("a");
      a.href = url;
      a.download = metadata.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    const url = URL.createObjectURL(audioFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = metadata.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [audioFile, metadata.format, metadata.name]);

  // Simulation helpers for the interactive verification header buttons
  const simIdle = useCallback(() => {
    cancelExtraction();
    setStatus("idle");
  }, [cancelExtraction]);

  const simExtract = useCallback(
    (
      fileName = "cyberpunk_trailer_theme.mp4",
      onDone?: (name: string, slug: string) => void,
    ) => {
      cancelExtraction();
      setStatus("loading-engine");
      setElapsedSeconds(0);
      setExtractProgress(12);

      const startTime = Date.now();
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      setTimeout(() => {
        setStatus("extracting");
        simTimerRef.current = setInterval(() => {
          setExtractProgress((prev) => {
            const next = prev + 18;
            if (next >= 100) {
              clearInterval(simTimerRef.current);
              clearInterval(elapsedTimerRef.current);
              const base = fileName.replace(/\.[^/.]+$/, "");
              setMetadata({
                name: `${base}.m4a`,
                format: "M4A",
                size: "3.8 MB",
                duration: 138,
                durationFormatted: "02:18",
                spec: "48kHz / stereo AAC",
              });
              setIsExtractedFromVideo(true);
              setRightsConfirmed(true);
              setStatus("done");
              if (onDone) {
                const pretty = base
                  .replace(/[-_]/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                const slug = base.toLowerCase().replace(/[^a-z0-9]/g, "-");
                onDone(pretty, slug);
              }
              return 100;
            }
            return next;
          });
        }, 250);
      }, 400);
    },
    [cancelExtraction],
  );

  const simDone = useCallback(() => {
    cancelExtraction();
    setStatus("done");
    setIsExtractedFromVideo(true);
    setRightsConfirmed(true);
    setMetadata({
      name: "cyberpunk_trailer_theme.m4a",
      format: "M4A",
      size: "3.8 MB",
      duration: 138,
      durationFormatted: "02:18",
      spec: "48kHz / stereo AAC",
    });
  }, [cancelExtraction]);

  const simError = useCallback(() => {
    cancelExtraction();
    setStatus("error");
    setErrorTitle("No Audio Stream Found");
    setErrorMessage(
      "This video has no audio track. Please choose a video with an embedded audio track.",
    );
  }, [cancelExtraction]);

  return {
    status,
    setStatus,
    audioFile,
    originalVideoFile,
    isExtractedFromVideo,
    setIsExtractedFromVideo,
    rightsConfirmed,
    setRightsConfirmed,
    extractProgress,
    elapsedSeconds,
    isLargeFile,
    errorTitle,
    errorMessage,
    metadata,
    setMetadata,
    ingestFile,
    cancelExtraction,
    retry,
    removeFile,
    resetAll,
    downloadAudio,
    simIdle,
    simExtract,
    simDone,
    simError,
  };
}
