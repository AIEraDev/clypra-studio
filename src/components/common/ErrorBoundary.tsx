import { Component, type ErrorInfo, type ReactNode } from "react";
import { ClypraLogo } from "./ClypraLogo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * When true the boundary renders a full-screen crash screen.
   * When false it renders a compact inline error card suited for
   * contained regions (e.g. a single route panel).
   */
  fullScreen?: boolean;
  /**
   * Optional label shown in the crash UI so users understand which surface
   * failed (e.g. "Text Effects Lab"). Falls back to "Studio".
   */
  label?: string;
  /**
   * Called after the boundary catches an error. Useful for external logging
   * (Sentry, Datadog, etc.) without coupling the boundary to a specific SDK.
   */
  onError?: (error: Error, info: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ---------------------------------------------------------------------------
// ErrorBoundary class component
// ---------------------------------------------------------------------------

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static defaultProps: Partial<ErrorBoundaryProps> = {
    fullScreen: true,
    label: "Studio",
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ errorInfo: info });
    this.props.onError?.(error, info);

    // Always log to console so the stack is visible in browser DevTools.
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  override render() {
    const { error, errorInfo } = this.state;

    if (!error) return this.props.children;

    const { fullScreen, label } = this.props;
    const isDev = import.meta.env.DEV;

    if (fullScreen) {
      return (
        <FullScreenCrash
          error={error}
          errorInfo={errorInfo}
          label={label ?? "Studio"}
          isDev={isDev}
          onReload={this.handleReload}
          onReset={this.handleReset}
        />
      );
    }

    return (
      <InlineCrash
        error={error}
        label={label ?? "Studio"}
        isDev={isDev}
        onReset={this.handleReset}
      />
    );
  }
}

// ---------------------------------------------------------------------------
// Full-screen crash UI (used at the root / global level)
// ---------------------------------------------------------------------------

function FullScreenCrash({
  error,
  errorInfo,
  label,
  isDev,
  onReload,
  onReset,
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  label: string;
  isDev: boolean;
  onReload: () => void;
  onReset: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-screen flex-col items-center justify-center bg-[#090D16] px-6 text-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
            <ClypraLogo size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {label} ran into a problem
            </h1>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              An unexpected error crashed this page. Your work may have been
              auto-saved — reload to try again.
            </p>
          </div>
        </div>

        {/* Error summary */}
        <div className="rounded-xl border border-[#2A2A38] bg-[#0E0E12] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Error
          </p>
          <p className="mt-1 break-words font-mono text-sm text-red-400">
            {error.message || String(error)}
          </p>
        </div>

        {/* Stack trace — dev only */}
        {isDev && errorInfo?.componentStack && (
          <details className="rounded-xl border border-[#2A2A38] bg-[#0E0E12]">
            <summary className="cursor-pointer select-none px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-300">
              Component stack (dev only)
            </summary>
            <pre className="overflow-x-auto px-4 pb-4 pt-2 font-mono text-[11px] leading-5 text-gray-400">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onReload}
            className="rounded-lg bg-[#7C6FFF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B5EEE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C6FFF]"
          >
            Reload page
          </button>
          <button
            onClick={onReset}
            className="rounded-lg border border-[#2A2A38] bg-[#15151C] px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-[#7C6FFF] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C6FFF]"
          >
            Try to recover
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline crash card (used inside a RouteShell to contain a single route)
// ---------------------------------------------------------------------------

function InlineCrash({
  error,
  label,
  isDev,
  onReset,
}: {
  error: Error;
  label: string;
  isDev: boolean;
  onReset: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 py-12 text-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
          <ClypraLogo size={22} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">
            {label} failed to load
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Something went wrong rendering this section.
          </p>
        </div>
        {isDev && (
          <p className="break-words rounded-lg border border-[#2A2A38] bg-[#0E0E12] px-3 py-2 font-mono text-xs text-red-400">
            {error.message || String(error)}
          </p>
        )}
        <button
          onClick={onReset}
          className="rounded-lg border border-[#2A2A38] bg-[#15151C] px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:border-[#7C6FFF] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C6FFF]"
        >
          Try to recover
        </button>
      </div>
    </div>
  );
}
