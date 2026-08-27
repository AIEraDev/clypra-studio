import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ControlSectionCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function ControlSectionCard({
  id,
  title,
  icon,
  isCollapsed,
  onToggle,
  badge,
  children,
}: ControlSectionCardProps) {
  return (
    <div
      id={id}
      className="rounded-lg bg-clypra-surface border border-clypra-border overflow-hidden"
    >
      <div
        onClick={onToggle}
        className={`flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 cursor-pointer ${
          isCollapsed ? "" : "border-b border-clypra-border"
        }`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">
            {title}
          </span>
          {badge}
        </div>
        {isCollapsed ? (
          <ChevronDown size={14} className="text-clypra-muted" />
        ) : (
          <ChevronUp size={14} className="text-clypra-muted" />
        )}
      </div>

      {!isCollapsed && <div className="p-3.5 flex flex-col gap-3">{children}</div>}
    </div>
  );
}
