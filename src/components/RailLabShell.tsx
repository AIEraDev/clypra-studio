import type { ReactNode, ComponentType } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ClypraLogo } from "./ClypraLogo";

export function RailLabShell({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
  children: ReactNode;
}) {
  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: "var(--studio-bg)", color: "var(--studio-text)" }}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-(--studio-border) bg-(--studio-panel) px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/studio"
            aria-label="Clypra Studio home"
            className="hidden shrink-0 items-center gap-2 border-r border-(--studio-border) pr-3 sm:flex"
          >
            <ClypraLogo size={25} />
            <span className="text-[11px] font-bold text-white">Studio</span>
          </Link>
          <Link
            to="/studio"
            aria-label="Back to Studio hub"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--studio-border) text-(--studio-muted) transition-colors hover:border-(--studio-accent) hover:text-white"
          >
            <ArrowLeft size={15} />
          </Link>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--studio-accent)/35 bg-(--studio-active-soft) text-(--studio-accent)">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-white">{title}</p>
            <p className="truncate text-[10px] text-(--studio-muted)">{description}</p>
          </div>
        </div>
        <Link
          to="/studio"
          className="hidden rounded-lg border border-(--studio-border) bg-(--studio-control) px-3 py-1.5 text-[10px] font-bold text-(--studio-muted) transition-colors hover:border-(--studio-accent) hover:text-white sm:block"
        >
          All labs
        </Link>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
