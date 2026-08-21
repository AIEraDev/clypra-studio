import { useState } from "react";
import { AdminPurgeSettings } from "../settings/AdminPurgeSettings";
import { AdminTransitionsSettings } from "../settings/AdminTransitionsSettings";

export function AdminSettingsTabs() {
  const [activeTab, setActiveTab] = useState<"cache" | "transitions">("cache");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-(--studio-border) bg-(--studio-panel) px-6">
        <div className="flex gap-6">
          <button onClick={() => setActiveTab("cache")} className={`relative px-1 py-4 text-sm font-medium transition-colors ${activeTab === "cache" ? "text-white" : "text-(--studio-muted) hover:text-white"}`}>
            Cache Control
            {activeTab === "cache" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--studio-accent)" />}
          </button>
          <button onClick={() => setActiveTab("transitions")} className={`relative px-1 py-4 text-sm font-medium transition-colors ${activeTab === "transitions" ? "text-white" : "text-(--studio-muted) hover:text-white"}`}>
            Transitions
            {activeTab === "transitions" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--studio-accent)" />}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "cache" ? <AdminPurgeSettings /> : <AdminTransitionsSettings />}
      </div>
    </div>
  );
}
