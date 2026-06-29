import { describe, it, expect } from "vitest";
import { ProjectHelper, type TrackDefinition } from "../project/types";
import { ProjectCompiler } from "../compiler/ProjectCompiler";
import { FrameGraphBuilder } from "../planner/FrameGraphBuilder";
import { CommandBufferBuilder } from "./CommandBufferBuilder";

describe("CommandBufferBuilder", () => {
  it("builds command buffers from frame graph passes", () => {
    const manifest = ProjectHelper.withTrack(
      ProjectHelper.createEmpty("cmd", "Command Buffer Test"),
      {
        id: "track-1",
        name: "Track",
        type: "video",
        enabled: true,
        clips: [
          {
            id: "clip-1",
            assetId: "a1",
            timelineStartMs: 0,
            timelineEndMs: 5000,
            sourceStartMs: 0,
            speed: 1,
            enabled: true,
          },
        ],
        effectStack: [{ id: "b1", type: "Brightness", params: { brightness: 0.1 } }],
      } satisfies TrackDefinition,
    );

    const graph = ProjectCompiler.compile(manifest);
    const frameGraph = FrameGraphBuilder.build(graph, 500, 0, 1280, 720);
    const cmd = CommandBufferBuilder.fromFrameGraph(frameGraph);

    expect(cmd.frameNumber).toBe(0);
    expect(cmd.passes.length).toBe(frameGraph.passes.length);
    expect(cmd.passes[0].commands.some((c) => c.op === "draw")).toBe(true);
    expect(cmd.passes[cmd.passes.length - 1].pass.shaderId).toBe("copy");
  });
});
