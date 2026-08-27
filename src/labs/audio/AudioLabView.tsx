import { Music2 } from "lucide-react";
import { AudioPublishPanel } from "../../components/AudioPublishPanel";
import { RailLabShell } from "../../components/RailLabShell";

export function AudioLabView() {
  return (
    <RailLabShell
      title="Audio Lab"
      description="Prepare, validate, and publish editor-ready audio assets."
      icon={Music2}
    >
      <div className="h-full overflow-y-auto bg-[#0B0B10]">
        <AudioPublishPanel variant="workspace" />
      </div>
    </RailLabShell>
  );
}

export default AudioLabView;

