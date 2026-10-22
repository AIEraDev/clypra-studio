/**
 * In-browser client-side audio extraction from video files using ffmpeg.wasm.
 * Runs single-threaded core by default for maximum browser compatibility without COOP/COEP headers.
 */

export class NoAudioTrackError extends Error {
  constructor(message = "This video has no audio track.") {
    super(message);
    this.name = "NoAudioTrackError";
  }
}

export class FileTooLargeError extends Error {
  constructor(
    message = "This video is too large to process in the browser (limit: 500 MB)."
  ) {
    super(message);
    this.name = "FileTooLargeError";
  }
}

export const MAX_VIDEO_SIZE_MB = 500;

export interface ExtractAudioOptions {
  onProgress(pct: number): void;
  signal: AbortSignal;
}

// Singleton FFmpeg instance
let ffmpegInstance: any = null;
let loadPromise: Promise<any> | null = null;

export async function getFFmpeg(signal?: AbortSignal): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const instance = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";

    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    await instance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegInstance = instance;
    return instance;
  })();

  try {
    return await loadPromise;
  } catch (err) {
    loadPromise = null;
    ffmpegInstance = null;
    throw err;
  }
}

export function isVideoFile(file: File): boolean {
  if (file.type && file.type.startsWith("video/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ["mp4", "mov", "webm", "mkv", "avi", "wmv", "m4v"].includes(ext);
}

export function isAudioFile(file: File): boolean {
  if (file.type && file.type.startsWith("audio/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ["mp3", "wav", "m4a", "aac", "flac", "ogg", "wma", "aiff"].includes(ext);
}

/**
 * Extracts audio from a video file in-browser without sending data to any server.
 */
export async function extractAudio(
  file: File,
  opts: ExtractAudioOptions
): Promise<File> {
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_VIDEO_SIZE_MB) {
    throw new FileTooLargeError(
      `This video is too large to process in the browser (${sizeMB.toFixed(
        1
      )} MB exceeds the ${MAX_VIDEO_SIZE_MB} MB limit).`
    );
  }

  if (opts.signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const ffmpeg = await getFFmpeg(opts.signal);

  const safeExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const inputFileName = `input_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}.${safeExt}`;
  const outputM4a = `output_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}.m4a`;
  const outputMp3 = `output_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}.mp3`;

  const { fetchFile } = await import("@ffmpeg/util");

  let logOutput = "";
  let hasAudioStream = false;

  const logHandler = ({ message }: { message: string }) => {
    logOutput += message + "\n";
    if (/Audio:\s*([a-zA-Z0-9_]+)/i.test(message)) {
      hasAudioStream = true;
    }
  };

  const progressHandler = ({ progress }: { progress: number }) => {
    if (typeof progress === "number" && !isNaN(progress)) {
      const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
      opts.onProgress(pct);
    }
  };

  const abortHandler = () => {
    if (ffmpegInstance) {
      try {
        ffmpegInstance.terminate();
      } catch {}
      ffmpegInstance = null;
      loadPromise = null;
    }
  };

  opts.signal.addEventListener("abort", abortHandler, { once: true });
  ffmpeg.on("log", logHandler);
  ffmpeg.on("progress", progressHandler);

  let extractedFile: File | null = null;
  let lastError: Error | null = null;

  try {
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    if (opts.signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    // Try fast stream copy to .m4a if container is mp4/mov
    const canTryCopy = ["mp4", "mov", "m4a"].includes(safeExt);
    if (canTryCopy) {
      try {
        const exitCode = await ffmpeg.exec([
          "-i",
          inputFileName,
          "-vn",
          "-c:a",
          "copy",
          "-y",
          outputM4a,
        ]);
        if (exitCode === 0) {
          const data = await ffmpeg.readFile(outputM4a);
          if (data && data.length > 500) {
            extractedFile = new File([data], `${baseName}.m4a`, {
              type: "audio/mp4",
            });
          }
        }
      } catch {
        // Stream copy failed (e.g. not AAC or incompatible), fallback to MP3
      }
    }

    // If stream copy was not possible or failed, transcode audio stream to MP3
    if (!extractedFile) {
      if (opts.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      try {
        const exitCode = await ffmpeg.exec([
          "-i",
          inputFileName,
          "-vn",
          "-c:a",
          "libmp3lame",
          "-q:a",
          "2",
          "-y",
          outputMp3,
        ]);
        if (exitCode === 0) {
          const data = await ffmpeg.readFile(outputMp3);
          if (data && data.length > 500) {
            extractedFile = new File([data], `${baseName}.mp3`, {
              type: "audio/mpeg",
            });
          }
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (opts.signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    if (!extractedFile) {
      if (
        !hasAudioStream ||
        /Output file does not contain any stream/i.test(logOutput) ||
        /matches no streams/i.test(logOutput) ||
        /does not contain any stream/i.test(logOutput)
      ) {
        throw new NoAudioTrackError("This video has no audio track.");
      }
      throw (
        lastError ||
        new Error("Extraction failed. Try again or use a smaller file.")
      );
    }

    opts.onProgress(100);
    return extractedFile;
  } finally {
    try {
      ffmpeg.off("log", logHandler);
      ffmpeg.off("progress", progressHandler);
      opts.signal.removeEventListener("abort", abortHandler);
    } catch {}

    // Free virtual filesystem files to prevent memory leaks
    await ffmpeg.deleteFile(inputFileName).catch(() => {});
    await ffmpeg.deleteFile(outputM4a).catch(() => {});
    await ffmpeg.deleteFile(outputMp3).catch(() => {});
  }
}
