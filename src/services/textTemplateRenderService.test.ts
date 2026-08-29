import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TextTemplatePreviewScheduler,
  type NativeTemplateFrame,
  type TextTemplatePreviewSchedulerRequest,
} from "./textTemplateRenderService";

const request = (time: number) => ({ time } as TextTemplatePreviewSchedulerRequest);

describe("TextTemplatePreviewScheduler", () => {
  afterEach(() => vi.restoreAllMocks());

  it("coalesces playhead updates before starting a render", async () => {
    const frame = { image: new Blob(), compiled: {} } as NativeTemplateFrame;
    const render = vi.fn(async (_options: TextTemplatePreviewSchedulerRequest, _signal?: AbortSignal) => frame);
    const onFrame = vi.fn();
    const scheduler = new TextTemplatePreviewScheduler(onFrame, undefined, render);

    scheduler.request(request(0));
    scheduler.request(request(0.1));
    scheduler.request(request(0.2));

    await new Promise((resolve) => setTimeout(resolve, 40));
    scheduler.dispose();

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0]?.[0].time).toBe(0.2);
    expect(onFrame).toHaveBeenCalledTimes(1);
  });

  it("keeps one native render in flight and renders the latest playback frame", async () => {
    const frames = [
      { image: new Blob(["first"]), compiled: {} },
      { image: new Blob(["latest"]), compiled: {} },
    ] as NativeTemplateFrame[];
    let releaseFirst!: () => void;
    const firstFinished = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const render = vi.fn(async (options: TextTemplatePreviewSchedulerRequest) => {
      if (options.time === 0) await firstFinished;
      return options.time === 0 ? frames[0] : frames[1];
    });
    const onFrame = vi.fn();
    const scheduler = new TextTemplatePreviewScheduler(onFrame, undefined, render);

    scheduler.request(request(0));
    await new Promise((resolve) => setTimeout(resolve, 20));
    scheduler.request(request(0.5));
    scheduler.request(request(0.75));
    releaseFirst();
    await new Promise((resolve) => setTimeout(resolve, 40));
    scheduler.dispose();

    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls[1]?.[0].time).toBe(0.75);
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(onFrame.mock.calls[0]?.[0]).toBe(frames[1]);
  });
});
