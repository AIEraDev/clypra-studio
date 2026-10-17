import { MessageSquare } from "lucide-react";
import { RailLabShell } from "../../components/RailLabShell";
import { BubbleLabWorkspace } from "./BubbleLabWorkspace";

export function BubbleLabView() {
  return (
    <RailLabShell
      title="Text Bubble Studio"
      description="Author decorative text containers, paper tears, speech bubbles, and layout bounds."
      icon={MessageSquare}
    >
      <BubbleLabWorkspace />
    </RailLabShell>
  );
}

export default BubbleLabView;
