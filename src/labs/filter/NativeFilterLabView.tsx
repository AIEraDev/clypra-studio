import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NativeLabFrameRequest } from "../../services/nativeRenderClient";
import { getNativeRenderClient, NATIVE_RENDER_CONTRACT_VERSION } from "../../services/nativeRenderClient";
import { PRESET_FILTERS } from "../../components/effects/filter/FilterPresets";

const WIDTH = 960;
const HEIGHT = 540;

type NativeGrade = Record<string, unknown>;

function hexToRgb(value: string): [number, number, number] {
  const clean = value.replace("#", "").padEnd(6, "0");
  return [0, 2, 4].map(
    (offset) => Number.parseInt(clean.slice(offset, offset + 2), 16) / 255,
  ) as [number, number, number];
}

function toNativeGrade(
  preset: (typeof PRESET_FILTERS)[number] | undefined,
  intensity: number,
): NativeGrade {
  const weight = intensity / 100;
  const params = preset?.gradingParams;
  const grade: NativeGrade = {
    exposure: (params?.exposure ?? 0) * weight,
    contrast: 1 + (params?.contrast ?? 0) * weight,
    saturation: 1 + (params?.saturation ?? 0) * weight,
    temperature: (params?.temperature ?? 0) * weight,
    tint: (params?.tint ?? 0) * weight,
    brightness: (params?.brightness ?? 0) * weight,
    sepia: (params?.sepia ?? 0) * weight,
    grayscale: (params?.grayscale ?? 0) * weight,
    hueRotate: (params?.hueRotate ?? 0) * weight,
    vignette: (params?.vignette ?? 0) * weight,
    invert: (params?.invert ?? 0) * weight,
    lift: (params?.lift ?? 0) * weight,
  };

  if (params?.grain) {
    grade.grainIntensity = params.grain.intensity * weight;
    grade.grainSize = params.grain.size;
  }
  if (params?.vibrance) {
    grade.vibranceAmount = params.vibrance.amount * weight;
    if (params.vibrance.protectedHue) {
      const [r, g, b] = hexToRgb(params.vibrance.protectedHue);
      grade.vibranceProtectedHueR = r;
      grade.vibranceProtectedHueG = g;
      grade.vibranceProtectedHueB = b;
    }
  }
  if (params?.crossProcess)
    grade.crossProcessAmount = params.crossProcess.amount * weight;
  if (params?.channelMix) {
    grade.channelMixR = params.channelMix.r;
    grade.channelMixG = params.channelMix.g;
    grade.channelMixB = params.channelMix.b;
    grade.channelMixEnabled = 1;
  }
  if (params?.duotone) {
    const [dr, dg, db] = hexToRgb(params.duotone.darkColor);
    const [lr, lg, lb] = hexToRgb(params.duotone.lightColor);
    grade.duotoneDarkR = dr;
    grade.duotoneDarkG = dg;
    grade.duotoneDarkB = db;
    grade.duotoneLightR = lr;
    grade.duotoneLightG = lg;
    grade.duotoneLightB = lb;
    grade.duotoneEnabled = 1;
  }
  if (params?.splitTone) {
    const [sr, sg, sb] = hexToRgb(params.splitTone.shadowColor);
    const [hr, hg, hb] = hexToRgb(params.splitTone.highlightColor);
    grade.shadowTintR = sr;
    grade.shadowTintG = sg;
    grade.shadowTintB = sb;
    grade.shadowTintStrength = params.splitTone.shadowStrength * weight;
    grade.highlightTintR = hr;
    grade.highlightTintG = hg;
    grade.highlightTintB = hb;
    grade.highlightTintStrength = params.splitTone.highlightStrength * weight;
    grade.splitBalance = params.splitTone.balance;
  }
  return grade;
}

export function NativeFilterLabView() {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [presetId, setPresetId] = useState(PRESET_FILTERS[0]?.id ?? "");
  const [intensity, setIntensity] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [nativeState, setNativeState] = useState<"idle" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const generationRef = useRef(0);

  const preset = useMemo(
    () => PRESET_FILTERS.find((item) => item.id === presetId),
    [presetId],
  );

  const renderNative = useCallback(async () => {
    const source = sourceRef.current;
    const output = outputRef.current;
    if (!source || !output) return;
    const sourceContext = source.getContext("2d", { willReadFrequently: true });
    const outputContext = output.getContext("2d");
    if (!sourceContext || !outputContext) return;

    const video = videoRef.current;
    const image = imageRef.current;
    if (isVideo) {
      if (!video || video.readyState < 2) return;
      sourceContext.drawImage(video, 0, 0, WIDTH, HEIGHT);
    } else if (image?.complete && image.naturalWidth > 0) {
      sourceContext.drawImage(image, 0, 0, WIDTH, HEIGHT);
    } else {
      return;
    }

    const generation = ++generationRef.current;
    try {
      const pixels = sourceContext.getImageData(0, 0, WIDTH, HEIGHT);
      const request: NativeLabFrameRequest = {
        contractVersion: NATIVE_RENDER_CONTRACT_VERSION,
        requestId: `studio-filter:${generation}`,
        frameTime: {
          frameIndex: frame,
          ticks: Math.round((frame * 1_000_000) / 60),
          timescale: 1_000_000,
        },
        project: {
          schemaVersion: 1,
          projectRevision: `studio-filter:${presetId}:${intensity}`,
          canvasWidth: WIDTH,
          canvasHeight: HEIGHT,
          clearColor: [0, 0, 0, 1],
          videoLayers: [],
          rasterLayers: [
            {
              assetId: "studio-filter-source",
              rgba: Array.from(pixels.data),
              width: WIDTH,
              height: HEIGHT,
              x: 0,
              y: 0,
              rotation: 0,
              opacity: 1,
              zIndex: 0,
              blendMode: "normal",
              colorGrade: toNativeGrade(preset, intensity),
            },
          ],
          transition: null,
        },
        outputWidth: WIDTH,
        outputHeight: HEIGHT,
        quality: "full",
        colorPolicy: {
          version: 1,
          workingSpace: "linear-rec709",
          outputFormat: "rgba8Srgb",
          toneMapHdrToSdr: true,
          displayProfile: "srgb-reference",
        },
        renderGraphVersion: 1,
      };
      const result = await getNativeRenderClient().renderFrame(request);
      if (generation !== generationRef.current) return;
      const bitmap = await createImageBitmap(result.image);
      outputContext.clearRect(0, 0, WIDTH, HEIGHT);
      outputContext.drawImage(bitmap, 0, 0, WIDTH, HEIGHT);
      bitmap.close();
      setNativeState("ready");
      setError(null);
    } catch (renderError) {
      if (generation !== generationRef.current) return;
      setNativeState("error");
      setError(
        renderError instanceof Error
          ? renderError.message
          : String(renderError),
      );
    }
  }, [frame, intensity, isVideo, preset, presetId]);

  useEffect(() => {
    void renderNative();
  }, [renderNative, mediaUrl]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      setFrame((value) => value + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play();
    else video.pause();
  }, [playing, isVideo]);

  const loadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setMediaUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
    const video = file.type.startsWith("video/");
    setIsVideo(video);
    setPlaying(false);
    setNativeState("idle");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#7c6fff]">
              Native Lab
            </p>
            <h1 className="text-2xl font-semibold">Filter Lab</h1>
            <p className="mt-1 text-sm text-slate-400">
              Raster upload at the browser boundary, color grading and
              composition in Rust/wgpu.
            </p>
          </div>
          <span
            className={`rounded border px-3 py-1 text-xs font-mono ${
              nativeState === "ready"
                ? "border-emerald-500/40 text-emerald-300"
                : nativeState === "error"
                ? "border-amber-500/40 text-amber-300"
                : "border-slate-700 text-slate-400"
            }`}
          >
            {nativeState === "ready"
              ? "NATIVE GPU READY"
              : nativeState === "error"
              ? "NATIVE RENDER ERROR"
              : "WAITING FOR LOCAL DAEMON"}
          </span>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <canvas
                ref={outputRef}
                width={WIDTH}
                height={HEIGHT}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded bg-[#7c6fff] px-3 py-2 text-sm font-medium hover:bg-[#6859ff]">
                Load image/video
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) loadFile(file);
                  }}
                />
              </label>
              {isVideo && (
                <button
                  type="button"
                  onClick={() => setPlaying((value) => !value)}
                  className="rounded border border-slate-700 px-3 py-2 text-sm"
                >
                  {playing ? "Pause" : "Play"}
                </button>
              )}
              <span className="text-xs text-slate-500">Frame {frame}</span>
            </div>
            {error && (
              <p className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                {error}
              </p>
            )}
          </section>

          <aside className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
              Native preset
            </label>
            <select
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              {PRESET_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
              Intensity: {intensity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
              className="w-full"
            />
            <div className="rounded border border-slate-800 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-400">
              This workspace does not load a compatibility renderer. Unsupported
              native capabilities return an explicit daemon error.
            </div>
          </aside>
        </div>

        <video
          ref={videoRef}
          src={isVideo ? mediaUrl ?? undefined : undefined}
          className="hidden"
          muted
          playsInline
          onLoadedData={() => void renderNative()}
          onTimeUpdate={() =>
            setFrame(Math.floor((videoRef.current?.currentTime ?? 0) * 60))
          }
        />
        <img
          ref={imageRef}
          src={!isVideo ? mediaUrl ?? undefined : undefined}
          alt=""
          className="hidden"
          onLoad={() => void renderNative()}
        />
        <canvas
          ref={sourceRef}
          width={WIDTH}
          height={HEIGHT}
          className="hidden"
        />
      </div>
    </div>
  );
}

export default NativeFilterLabView;
