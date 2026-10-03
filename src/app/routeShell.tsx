import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LoginModal, type UserInfo } from "../components/LoginModal";
import { ClypraLogo } from "../components/ClypraLogo";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { getStudioApiBaseUrl } from "../services/apiConfig";
import {
  AUTH_TOKEN_KEY,
  getStoredAuthToken,
  getTokenExpiry,
  getUserFromToken,
  isTokenExpired,
  refreshAuthSession,
} from "../services/authSession";

export interface RouteMetadata {
  canonical: string;
  description: string;
  title: string;
}

function updateHead(
  selector: string,
  attribute: "content" | "href",
  value: string,
) {
  document.head.querySelector(selector)?.setAttribute(attribute, value);
}

export function RouteShell({
  children,
  metadata,
  lockScroll = true,
}: {
  children: ReactNode;
  metadata: RouteMetadata;
  lockScroll?: boolean;
}) {
  useEffect(() => {
    document.title = metadata.title;
    updateHead('meta[name="title"]', "content", metadata.title);
    updateHead('meta[name="description"]', "content", metadata.description);
    updateHead('meta[property="og:title"]', "content", metadata.title);
    updateHead(
      'meta[property="og:description"]',
      "content",
      metadata.description,
    );
    updateHead('meta[property="og:url"]', "content", metadata.canonical);
    updateHead('meta[name="twitter:title"]', "content", metadata.title);
    updateHead(
      'meta[name="twitter:description"]',
      "content",
      metadata.description,
    );
    updateHead('meta[name="twitter:url"]', "content", metadata.canonical);
    updateHead('link[rel="canonical"]', "href", metadata.canonical);
  }, [metadata]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const previous = {
      bodyOverflow: document.body.style.overflow,
      bodyOverflowX: document.body.style.overflowX,
      bodyOverflowY: document.body.style.overflowY,
      bodyOverscrollBehaviorY: document.body.style.overscrollBehaviorY,
      documentOverflow: document.documentElement.style.overflow,
      documentOverflowX: document.documentElement.style.overflowX,
      documentOverflowY: document.documentElement.style.overflowY,
      documentScrollBehavior: document.documentElement.style.scrollBehavior,
      documentScrollbarGutter: document.documentElement.style.scrollbarGutter,
    };

    if (lockScroll) {
      document.body.style.overflow = "hidden";
      document.body.style.overflowX = "hidden";
      document.body.style.overflowY = "hidden";
      document.body.style.overscrollBehaviorY = "none";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.overflowX = "hidden";
      document.documentElement.style.overflowY = "hidden";
    } else {
      // Public pages use the document as their scroll container. Explicitly
      // restore it because the app routes lock html/body for editor labs.
      document.body.style.overflow = "visible";
      document.body.style.overflowX = "hidden";
      document.body.style.overflowY = "visible";
      document.body.style.overscrollBehaviorY = "auto";
      document.documentElement.style.overflow = "visible";
      document.documentElement.style.overflowX = "hidden";
      document.documentElement.style.overflowY = "visible";
      document.documentElement.style.scrollBehavior = "smooth";
      document.documentElement.style.scrollbarGutter = "stable";
    }

    return () => {
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.overflowX = previous.bodyOverflowX;
      document.body.style.overflowY = previous.bodyOverflowY;
      document.body.style.overscrollBehaviorY =
        previous.bodyOverscrollBehaviorY;
      document.documentElement.style.overflow = previous.documentOverflow;
      document.documentElement.style.overflowX = previous.documentOverflowX;
      document.documentElement.style.overflowY = previous.documentOverflowY;
      document.documentElement.style.scrollBehavior =
        previous.documentScrollBehavior;
      document.documentElement.style.scrollbarGutter =
        previous.documentScrollbarGutter;
    };
  }, [lockScroll]);

  // Derive a short label from the page title, e.g.
  // "Clypra Studio - Text Effects Lab" → "Text Effects Lab"
  const label = metadata.title.includes(" - ")
    ? metadata.title.split(" - ").pop()!
    : metadata.title;

  return (
    <ErrorBoundary fullScreen={false} label={label}>
      {children}
    </ErrorBoundary>
  );
}

export function RouteLoading({
  label = "Loading Clypra Studio...",
}: {
  label?: string;
}) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clypra_theme");
      if (saved === "light") return false;
      if (saved === "dark") return true;
      return !window.matchMedia("(prefers-color-scheme: light)").matches;
    }
    return true;
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "clypra_theme") {
        setIsDark(e.newValue !== "light");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-[#120d1a] text-stone-100" : "bg-[#fbf9f6] text-stone-900"
      }`}
      style={{
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.055\'/%3E%3C/svg%3E")',
      }}
    >
      <div className="flex flex-col items-center gap-4 p-8 text-center animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400/40 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ClypraLogo size={32} className="animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-sm tracking-tight">
            Clypra Studio
          </span>
          <p
            className={`text-xs font-mono tracking-wide ${
              isDark ? "text-stone-400" : "text-stone-500"
            }`}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

function AuthRequired({
  label,
  adminOnly,
  onOpenAuth,
}: {
  label: string;
  adminOnly: boolean;
  onOpenAuth: () => void;
}) {
  return (
    <div
      className="flex h-screen flex-col items-center justify-center bg-[#0E0E12] text-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-md space-y-5 px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 text-[#B9B2FF]">
          <ClypraLogo size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold">
            {adminOnly
              ? "Administrator access required"
              : "Sign in to Clypra Studio"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            {adminOnly
              ? `Sign in with an administrator account to access ${label}.`
              : `${label} is available to registered Clypra creators. Sign in or create a normal user account to continue.`}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onOpenAuth}
            className="rounded-lg bg-[#7C6FFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B5EEE]"
          >
            {adminOnly ? "Sign in" : "Sign in / Register"}
          </button>
          <Link
            to="/"
            className="rounded-lg border border-[#2A2A38] bg-[#15151C] px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-[#7C6FFF] hover:text-white"
          >
            Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AuthRoute({
  children,
  label,
  adminOnly = false,
}: {
  children: ReactNode;
  label: string;
  adminOnly?: boolean;
}) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    getStoredAuthToken(),
  );

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | undefined;

    const clearSession = () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setSessionToken(null);
      setUser(null);
      setStatus("unauthenticated");
    };

    if (!sessionToken) {
      setStatus("unauthenticated");
      return () => {
        cancelled = true;
      };
    }

    const fallbackUser = getUserFromToken(sessionToken);
    const refreshWindowMs = 60 * 60 * 1000;
    const MIN_REFRESH_DELAY_MS = 15 * 60 * 1000; // Never refresh more often than every 15 minutes

    const scheduleRefresh = (token: string, retryDelayMs?: number) => {
      const expiry = getTokenExpiry(token);
      const delay =
        retryDelayMs ??
        (expiry
          ? Math.max(MIN_REFRESH_DELAY_MS, expiry - Date.now() - refreshWindowMs)
          : MIN_REFRESH_DELAY_MS);

      refreshTimer = window.setTimeout(async () => {
        const outcome = await refreshAuthSession();
        if (cancelled) return;

        if (outcome.ok) {
          scheduleRefresh(outcome.token);
          return;
        }

        const currentToken = getStoredAuthToken();
        if (
          !outcome.ok &&
          (("definitive" in outcome && outcome.definitive) ||
            !currentToken ||
            isTokenExpired(currentToken))
        ) {
          clearSession();
          return;
        }

        // Preserve the session through temporary API/network failures.
        scheduleRefresh(currentToken, MIN_REFRESH_DELAY_MS);
      }, delay);
    };

    if (isTokenExpired(sessionToken)) {
      clearSession();
      return () => {
        cancelled = true;
      };
    }

    scheduleRefresh(sessionToken);

    let lastResumeRefresh = 0;
    const refreshOnResume = async () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastResumeRefresh < MIN_REFRESH_DELAY_MS) return;

      const currentToken = getStoredAuthToken();
      const expiry = currentToken ? getTokenExpiry(currentToken) : null;
      if (
        !currentToken ||
        (expiry !== null && expiry > now + refreshWindowMs)
      )
        return;

      lastResumeRefresh = now;
      const outcome = await refreshAuthSession();
      if (cancelled) return;
      if (outcome.ok) {
        setSessionToken(outcome.token);
      } else if (
        ("definitive" in outcome && outcome.definitive) ||
        isTokenExpired(currentToken)
      ) {
        clearSession();
      }
    };

    window.addEventListener("focus", refreshOnResume);
    document.addEventListener("visibilitychange", refreshOnResume);

    fetch(`${getStudioApiBaseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then(async (response) => {
        if (response.status === 401) throw new Error("AUTH_EXPIRED");
        if (!response.ok) throw new Error("AUTH_TRANSIENT");
        return response.json();
      })
      .then((data: { user: UserInfo }) => {
        if (cancelled) return;
        setUser(data.user);
        setStatus("authenticated");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        if (error.message === "AUTH_EXPIRED" || isTokenExpired(sessionToken)) {
          clearSession();
          return;
        }

        // A temporary outage must not log out a creator with a valid token.
        if (fallbackUser) {
          setUser(fallbackUser);
          setStatus("authenticated");
        } else {
          clearSession();
        }
      });

    return () => {
      cancelled = true;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", refreshOnResume);
      document.removeEventListener("visibilitychange", refreshOnResume);
    };
  }, [sessionToken]);

  if (status === "checking")
    return <RouteLoading label="Checking your Clypra session…" />;

  if (import.meta.env.DEV && (status === "unauthenticated" || (adminOnly && !user?.isAdmin))) {
    return <>{children}</>;
  }

  if (status === "unauthenticated") {
    return (
      <>
        <AuthRequired
          label={label}
          adminOnly={adminOnly}
          onOpenAuth={() => setShowAuthModal(true)}
        />
        <LoginModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          allowRegistration={!adminOnly}
          onSuccess={(token, nextUser) => {
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            setSessionToken(token);
            setUser(nextUser);
            setStatus("authenticated");
            setShowAuthModal(false);
          }}
        />
      </>
    );
  }

  if (adminOnly && !user?.isAdmin) {
    return (
      <div
        className="flex h-screen flex-col items-center justify-center bg-[#0E0E12] text-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="max-w-md space-y-4 px-6 text-center">
          <h1 className="text-xl font-bold text-red-400">
            Admin access denied
          </h1>
          <p className="text-sm leading-6 text-gray-400">
            Your normal creator account is valid, but it does not have
            administrator permissions for {label}.
          </p>
          <Link
            to="/studio"
            className="inline-flex rounded-lg bg-[#7C6FFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B5EEE]"
          >
            Back to Studio
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminRoute({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <AuthRoute label={label} adminOnly>
      {children}
    </AuthRoute>
  );
}
