import { useNavigate } from "react-router-dom";
import { OverlayStudioWorkspace } from "../../components/OverlayStudioWorkspace";

export function OverlayLabView() {
  const navigate = useNavigate();
  return <OverlayStudioWorkspace onExit={() => navigate("/studio")} />;
}

export default OverlayLabView;

