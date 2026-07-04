import { ProjectHelper, type ProjectManifestV2, type AssetHandle, type TrackDefinition } from "@clypra-studio/engine";
import type { SourceMedia, StackNode } from "./types";

export function buildManifestFromStack(
  stack: StackNode[],
  source: SourceMedia,
  viewport: { w: number; h: number },
): ProjectManifestV2 {
  const vw = viewport.w > 0 ? viewport.w : 1920;
  const vh = viewport.h > 0 ? viewport.h : 1080;

  const asset: AssetHandle = {
    id: source.id,
    kind: source.kind,
    sourceUri: source.url,
    hash: source.id,
    durationMs: 5000,
  };

  const track: TrackDefinition = {
    id: "track-1",
    name: "Image Track",
    type: "video",
    enabled: true,
    clips: [
      {
        id: "clip-1",
        assetId: source.id,
        timelineStartMs: 0,
        timelineEndMs: 5000,
        sourceStartMs: 0,
        speed: 1,
        enabled: true,
      },
    ],
    effectStack: stack.map((node) => ({
      id: node.id,
      type: node.type,
      params: node.params,
    })),
  };

  let manifest = ProjectHelper.createEmpty("mpg-playground", "MPG Playground Project");
  manifest = { ...manifest, width: vw, height: vh };
  manifest = ProjectHelper.withAsset(manifest, asset);
  return ProjectHelper.withTrack(manifest, track);
}
