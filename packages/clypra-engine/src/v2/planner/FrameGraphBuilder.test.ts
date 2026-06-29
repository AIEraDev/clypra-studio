import { describe, it, expect } from "vitest";
import { ProjectHelper, type TrackDefinition } from "../project/types";
import { ProjectCompiler } from "../compiler/ProjectCompiler";
import { FrameGraphBuilder } from "./FrameGraphBuilder";
import { NodeRegistry } from "../graph/NodeRegistry";

function buildBrightnessTrack(): ReturnType<typeof ProjectCompiler.compile> {
  const manifest = ProjectHelper.withTrack(
    ProjectHelper.createEmpty("pass-order", "Pass Order Test"),
    {
      id: "track-1",
      name: "Video Track",
      type: "video",
      enabled: true,
      clips: [
        {
          id: "clip-1",
          assetId: "asset-1",
          timelineStartMs: 0,
          timelineEndMs: 5000,
          sourceStartMs: 0,
          speed: 1,
          enabled: true,
        },
      ],
      effectStack: [{ id: "eff-brightness", type: "Brightness", params: { brightness: 0.2 } }],
    } satisfies TrackDefinition,
  );
  return ProjectCompiler.compile(manifest);
}

describe("FrameGraphBuilder pass order", () => {
  it("executes blit-source before effects and copy last", () => {
    const graph = buildBrightnessTrack();
    const frameGraph = FrameGraphBuilder.build(graph, 500, 0, 1920, 1080);

    const shaderIds = frameGraph.passes.map((p) => p.shaderId);
    expect(shaderIds[0]).toBe("blit-source");
    expect(shaderIds[shaderIds.length - 1]).toBe("copy");
    expect(shaderIds).toContain("brightness");

    const copyIndex = shaderIds.indexOf("copy");
    const brightnessIndex = shaderIds.indexOf("brightness");
    expect(brightnessIndex).toBeGreaterThan(0);
    expect(copyIndex).toBeGreaterThan(brightnessIndex);
  });

  it("uses NodeRegistry planners for GaussianBlur multipass", () => {
    const manifest = ProjectHelper.withTrack(
      ProjectHelper.createEmpty("blur-order", "Blur Order"),
      {
        id: "track-1",
        name: "Video Track",
        type: "video",
        enabled: true,
        clips: [
          {
            id: "clip-1",
            assetId: "asset-1",
            timelineStartMs: 0,
            timelineEndMs: 5000,
            sourceStartMs: 0,
            speed: 1,
            enabled: true,
          },
        ],
        effectStack: [{ id: "eff-blur", type: "GaussianBlur", params: { blur: 10 } }],
      } satisfies TrackDefinition,
    );

    const graph = ProjectCompiler.compile(manifest);
    const frameGraph = FrameGraphBuilder.build(graph, 500, 0, 1920, 1080, NodeRegistry.createDefault());

    const shaderIds = frameGraph.passes.map((p) => p.shaderId);
    expect(shaderIds).toEqual(["blit-source", "gaussian-blur-h", "gaussian-blur-v", "copy"]);
  });
});
