import React from "react";
import { useNavigate } from "react-router-dom";
import { TemplateWorkspace } from "../components/TemplateWorkspace";

export function TemplateWorkspacePage() {
  const navigate = useNavigate();
  return <TemplateWorkspace onBackToDesign={() => navigate("/studio")} />;
}

export default TemplateWorkspacePage;
