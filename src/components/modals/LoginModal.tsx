import React, { useState, useEffect, useRef } from "react";
import { Lock, Mail, X, Loader2, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { getStudioApiBaseUrl } from "../../services/apiConfig";

const API_BASE_URL = getStudioApiBaseUrl();

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: UserInfo) => void;
  allowRegistration?: boolean;
}

export function LoginModal({
  open,
  onClose,
  onSuccess,
  allowRegistration = true,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setUsername("");
      setMode("login");
      setLoading(false);
    }
  }, [open]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Handle click outside to close
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = `${API_BASE_URL}/auth/${mode}`;
      const payload =
        mode === "register"
          ? { username, email, password }
          : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Authentication failed. Please check your credentials.",
        );
      }

      toast.success(
        mode === "register"
          ? "Account created successfully!"
          : "Signed in successfully!",
      );

      setTimeout(() => {
        onSuccess(data.token, data.user);
        onClose();
      }, 800);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="login-modal-overlay"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-[#2A2A38] bg-[#1E1E26] p-6 shadow-2xl transition-all duration-300 transform scale-100 select-none"
      >
        {/* Glow effect header decorator */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-[#7C6FFF] to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-[#2A2A38] hover:text-white transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Modal Branding Header */}
        <div className="mb-6 mt-2 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C6FFF]/10 text-[#7C6FFF] shadow-[0_0_15px_rgba(124,111,255,0.15)]">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <h3 className="font-sans text-lg font-bold tracking-tight text-white">
            {mode === "register"
              ? "Create your Clypra account"
              : "Access Clypra Studio"}
          </h3>
          <p className="mt-1 font-sans text-xs text-gray-400">
            {mode === "register"
              ? "Create a normal creator account to access every Studio lab."
              : "Sign in to sync your presets and templates"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
          {mode === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <UserRound size={14} />
                </span>
                <input
                  type="text"
                  required
                  minLength={3}
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your creator name"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#0E0E12] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-600 focus:border-[#7C6FFF] focus:outline-none focus:ring-1 focus:ring-[#7C6FFF] transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. design@clypra.com"
                className="w-full rounded-lg border border-[#2A2A38] bg-[#0E0E12] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-600 focus:border-[#7C6FFF] focus:outline-none focus:ring-1 focus:ring-[#7C6FFF] transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#2A2A38] bg-[#0E0E12] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-600 focus:border-[#7C6FFF] focus:outline-none focus:ring-1 focus:ring-[#7C6FFF] transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-9 items-center justify-center gap-2 rounded-lg bg-[#7C6FFF] text-xs font-semibold text-white transition-all hover:bg-[#6859FF] hover:shadow-[0_0_15px_rgba(124,111,255,0.3)] disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600 cursor-pointer"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <span>{mode === "register" ? "Create account" : "Sign In"}</span>
            )}
          </button>

          {allowRegistration && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMode((current) =>
                  current === "login" ? "register" : "login",
                );
              }}
              className="text-[11px] font-semibold text-[#B9B2FF] transition-colors hover:text-white disabled:opacity-50"
            >
              {mode === "register"
                ? "Already have an account? Sign in"
                : "New to Clypra? Create a normal user account"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
