import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastNotificationProps {
  message: string | null;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

/**
 * Modern floating Toast Notification (react-hot-toast / sonner aesthetic)
 */
export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = "success",
  onClose
}) => {
  if (!message) return null;

  const isError = type === "error" || message.toLowerCase().includes("failed") || message.toLowerCase().includes("error");

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl border border-white/10 bg-[#12121A]/95 px-4 py-3 font-sans text-xs font-semibold text-white shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="flex items-center gap-2.5">
        {isError ? (
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
        ) : (
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        )}
        <span className="leading-tight">{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 rounded-md p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        title="Dismiss toast"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ToastNotification;
