import {
  ChevronDown,
  HelpCircle,
  LayoutGrid,
  MoreHorizontal,
  Redo2,
  Shield,
  Undo2,
  User,
  Video,
} from "lucide-react";
import type { RefObject } from "react";

export type TextEffectsNativePreviewState = "idle" | "rendering" | "ready" | "error";
export type TextEffectsSaveStatus = "idle" | "saving" | "saved";

export interface TextEffectsHeaderUser {
  username: string;
  email: string;
}

interface TextEffectsHeaderProps {
  activeRailItem: string;
  creatorSaveStatus: TextEffectsSaveStatus;
  nativePreviewState: TextEffectsNativePreviewState;
  nativePreviewError: string | null;
  user: TextEffectsHeaderUser | null;
  isAdmin: boolean;
  canUndo: boolean;
  canRedo: boolean;
  showUserDropdown: boolean;
  dropdownRef: RefObject<HTMLDivElement | null>;
  onUndo: () => void;
  onRedo: () => void;
  onOpenTutorial: () => void;
  onToggleUserDropdown: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export function TextEffectsHeader({
  activeRailItem,
  creatorSaveStatus,
  nativePreviewState,
  nativePreviewError,
  user,
  isAdmin,
  canUndo,
  canRedo,
  showUserDropdown,
  dropdownRef,
  onUndo,
  onRedo,
  onOpenTutorial,
  onToggleUserDropdown,
  onLogout,
  onOpenLogin,
}: TextEffectsHeaderProps) {
  return (
    <header id="studio-header" className="studio-header">
      <div className="flex min-w-0 items-center">
        <a
          href="/studio"
          aria-label="Back to Clypra Studio hub"
          className="group flex shrink-0 items-center gap-2"
        >
          <img src="/clypra.svg" alt="Clypra" className="h-7 w-7 select-none transition-transform group-hover:scale-105" />
          <span className="hidden text-[13px] font-bold tracking-tight text-white sm:block">
            Clypra <span style={{ color: "var(--studio-accent)" }}>Studio</span>
          </span>
        </a>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 sm:flex">
        <button id="global-undo-btn" aria-label="Undo" title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} className="studio-header-btn">
          <Undo2 size={14} />
        </button>
        <button id="global-redo-btn" aria-label="Redo" title="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} className="studio-header-btn">
          <Redo2 size={14} />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <span className={`autosave-pill hidden sm:inline-flex${creatorSaveStatus === "saving" ? " saving" : ""}`}>
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              background: creatorSaveStatus === "saving" ? "#fbbf24" : "var(--gpu-ready)",
              boxShadow: creatorSaveStatus === "saving" ? "none" : "0 0 5px var(--gpu-ready)",
            }}
          />
          {creatorSaveStatus === "saving" ? "Saving…" : "Autosaved"}
        </span>

        {activeRailItem === "text-effects" && (
          <span
            className={`studio-gpu-pill hidden md:inline-flex ${nativePreviewState === "ready" ? "ready" : nativePreviewState === "error" ? "error" : "live"}`}
            title={nativePreviewError ?? "Clypra native lab daemon · Metal GPU"}
          >
            <span className="studio-gpu-pill-dot" />
            {nativePreviewState === "ready" ? "GPU · Ready" : nativePreviewState === "error" ? "GPU · Error" : "GPU · Live"}
          </span>
        )}

        <div className="mx-1 hidden h-4 w-px shrink-0 sm:block" style={{ background: "var(--studio-border)" }} />
        <button id="open-tutorial-btn" onClick={onOpenTutorial} className="studio-header-btn" title="Help & Shortcuts">
          <HelpCircle size={14} />
        </button>
        <div className="mx-1 h-4 w-px shrink-0" style={{ background: "var(--studio-border)" }} />

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button onClick={onToggleUserDropdown} className="flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-[11px] font-semibold text-white transition-colors" style={{ background: "var(--studio-raised)", border: "1px solid var(--studio-border)" }} title={`Logged in as ${user.username}`}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase text-white" style={{ background: "var(--studio-accent)" }}>
                {user.username.charAt(0)}
              </span>
              <span className="hidden sm:inline">{user.username}</span>
            </button>
            {showUserDropdown && (
              <div className="absolute right-0 z-50 mt-1.5 w-40 rounded-lg p-1.5 shadow-xl" style={{ background: "var(--studio-raised)", border: "1px solid var(--studio-border)" }}>
                <div className="mb-1 truncate border-b px-2 py-1.5 text-[9px]" style={{ color: "var(--studio-muted)", borderColor: "var(--studio-border)" }}>
                  {user.email}
                </div>
                <button onClick={onLogout} className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs transition-colors" style={{ color: "var(--gpu-error)" }}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onOpenLogin} className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-colors" style={{ background: "var(--studio-active-soft)", border: "1px solid rgba(124,111,255,0.25)", color: "var(--studio-accent)" }} title="Sign In / Register">
            <User size={13} />
            Sign In
          </button>
        )}

        <details className="relative">
          <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 text-[11px] font-semibold text-(--studio-muted) transition-colors hover:border-(--studio-accent) hover:text-white [&::-webkit-details-marker]:hidden">
            <MoreHorizontal size={15} />
            <span className="hidden md:inline">Navigate</span>
            <ChevronDown size={12} />
          </summary>
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-xl border border-(--studio-border) bg-(--studio-raised) p-1.5 shadow-2xl">
            <p className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-(--studio-subtle)">Studio navigation</p>
            <a href="/studio" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-white no-underline transition-colors hover:bg-(--studio-hover)">
              <LayoutGrid size={13} className="text-(--studio-accent)" /> All labs
            </a>
            <a href="/studio/text-template" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-white no-underline transition-colors hover:bg-(--studio-hover)">
              <Video size={13} className="text-violet-300" /> Text Templates
            </a>
            {isAdmin && (
              <a href="/studio/admin" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-white no-underline transition-colors hover:bg-(--studio-hover)">
                <Shield size={13} className="text-blue-300" /> Admin Console
              </a>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
