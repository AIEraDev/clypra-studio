import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LoginModal, type UserInfo } from "../components/LoginModal";
import { ClypraLogo } from "../components/ClypraLogo";
import { getStudioApiBaseUrl } from "../services/apiConfig";

export interface RouteMetadata {
  canonical: string;
  description: string;
  title: string;
}

function updateHead(selector: string, attribute: "content" | "href", value: string) {
  document.head.querySelector(selector)?.setAttribute(attribute, value);
}

export function RouteShell({ children, metadata, lockScroll = true }: { children: ReactNode; metadata: RouteMetadata; lockScroll?: boolean }) {
  useEffect(() => {
    document.title = metadata.title;
    updateHead('meta[name="title"]', "content", metadata.title);
    updateHead('meta[name="description"]', "content", metadata.description);
    updateHead('meta[property="og:title"]', "content", metadata.title);
    updateHead('meta[property="og:description"]', "content", metadata.description);
    updateHead('meta[property="og:url"]', "content", metadata.canonical);
    updateHead('meta[name="twitter:title"]', "content", metadata.title);
    updateHead('meta[name="twitter:description"]', "content", metadata.description);
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
      document.body.style.overscrollBehaviorY = previous.bodyOverscrollBehaviorY;
      document.documentElement.style.overflow = previous.documentOverflow;
      document.documentElement.style.overflowX = previous.documentOverflowX;
      document.documentElement.style.overflowY = previous.documentOverflowY;
      document.documentElement.style.scrollBehavior = previous.documentScrollBehavior;
      document.documentElement.style.scrollbarGutter = previous.documentScrollbarGutter;
    };
  }, [lockScroll]);

  return <>{children}</>;
}

export function RouteLoading({ label = "Loading Studio..." }: { label?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#090D16] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#7C6FFF]" />
        <p className="text-sm text-gray-400">{label}</p>
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
    <div className="flex h-screen flex-col items-center justify-center bg-[#0E0E12] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-md space-y-5 px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 text-[#B9B2FF]">
          <ClypraLogo size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold">{adminOnly ? "Administrator access required" : "Sign in to Clypra Studio"}</h1>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            {adminOnly
              ? `Sign in with an administrator account to access ${label}.`
              : `${label} is available to registered Clypra creators. Sign in or create a normal user account to continue.`}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={onOpenAuth} className="rounded-lg bg-[#7C6FFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B5EEE]">
            {adminOnly ? "Sign in" : "Sign in / Register"}
          </button>
          <Link to="/" className="rounded-lg border border-[#2A2A38] bg-[#15151C] px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-[#7C6FFF] hover:text-white">
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

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("clypra_auth_token");

    if (!token) {
      setStatus("unauthenticated");
      return () => {
        cancelled = true;
      };
    }

    fetch(`${getStudioApiBaseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then((data: { user: UserInfo }) => {
        if (cancelled) return;
        setUser(data.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("clypra_auth_token");
        setUser(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") return <RouteLoading label="Checking your Clypra session…" />;

  if (status === "unauthenticated") {
    return (
      <>
        <AuthRequired label={label} adminOnly={adminOnly} onOpenAuth={() => setShowAuthModal(true)} />
        <LoginModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          allowRegistration={!adminOnly}
          onSuccess={(token, nextUser) => {
            localStorage.setItem("clypra_auth_token", token);
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
      <div className="flex h-screen flex-col items-center justify-center bg-[#0E0E12] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="max-w-md space-y-4 px-6 text-center">
          <h1 className="text-xl font-bold text-red-400">Admin access denied</h1>
          <p className="text-sm leading-6 text-gray-400">Your normal creator account is valid, but it does not have administrator permissions for {label}.</p>
          <Link to="/studio" className="inline-flex rounded-lg bg-[#7C6FFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B5EEE]">
            Back to Studio
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminRoute({ children, label }: { children: ReactNode; label: string }) {
  return <AuthRoute label={label} adminOnly>{children}</AuthRoute>;
}
