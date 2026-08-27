import { Sticker } from "lucide-react";
import { StickerPublishPanel } from "../../components/StickerPublishPanel";
import { RailLabShell } from "../../components/RailLabShell";

export function StickerLabView() {
  return (
    <RailLabShell
      title="Sticker Lab"
      description="Preview, validate, and publish animated sticker assets."
      icon={Sticker}
    >
      <div className="h-full overflow-y-auto bg-[#0B0B10]">
        <StickerPublishPanel variant="workspace" />
      </div>
    </RailLabShell>
  );
}

export default StickerLabView;

