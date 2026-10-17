import { Sparkles } from "lucide-react";
import { RailLabShell } from "../../components/RailLabShell";
import { AnimationLabWorkspace } from "./AnimationLabWorkspace";

export function AnimationLabView() {
  return (
    <RailLabShell
      title="Animation Lab"
      description="Author, fine-tune, preview, and publish CapCut-parity In, Out, and Loop text animations."
      icon={Sparkles}
    >
      <AnimationLabWorkspace />
    </RailLabShell>
  );
}

export default AnimationLabView;
