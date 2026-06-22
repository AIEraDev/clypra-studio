import React, { useState, useEffect } from "react";
import { Shield, RefreshCw, AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

interface Transition {
  id: string;
  name: string;
  category: string;
  description?: string;
  published: boolean;
  tags?: string[];
}

export function AdminTransitionsSettings() {
  const [loading, setLoading] = useState(false);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getAuthToken = () => localStorage.getItem("clypra_auth_token");
  const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "https://clypra-worker-api.abdulkabirmusa.com";

  // Load all transitions
  const loadTransitions = async () => {
    setLoading(true);
    setStatus(null);

    const token = getAuthToken();
    if (!token) {
      setStatus({
        type: "error",
        message: "No authorization token found. Please log in again.",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/transitions/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Only administrators can access this resource.");
        }
        if (response.status === 403) {
          throw new Error("Forbidden: You do not have permissions to perform this action.");
        }
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setTransitions(data.transitions || []);
    } catch (error: any) {
      console.error("[AdminTransitionsSettings] Load error:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to load transitions.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle published status
  const handleTogglePublished = async (category: string, id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    setStatus(null);

    const token = getAuthToken();
    if (!token) {
      setStatus({
        type: "error",
        message: "No authorization token found.",
      });
      setUpdatingId(null);
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/transitions/${category}/${id}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          published: !currentStatus,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Only administrators can modify transitions.");
        }
        if (response.status === 403) {
          throw new Error("Forbidden: You do not have permissions to perform this action.");
        }
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update local state
      setTransitions((prev) => prev.map((t) => (t.id === id ? { ...t, published: !currentStatus } : t)));

      setStatus({
        type: "success",
        message: data.message || `Transition "${id}" ${!currentStatus ? "published" : "unpublished"} successfully.`,
      });
    } catch (error: any) {
      console.error("[AdminTransitionsSettings] Toggle error:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to update transition status.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Load transitions on mount
  useEffect(() => {
    loadTransitions();
  }, []);

  // Group transitions by category
  const transitionsByCategory = transitions.reduce(
    (acc, transition) => {
      if (!acc[transition.category]) {
        acc[transition.category] = [];
      }
      acc[transition.category].push(transition);
      return acc;
    },
    {} as Record<string, Transition[]>,
  );

  const categories = Object.keys(transitionsByCategory).sort();

  return (
    <div className="mx-auto max-w-6xl p-6 text-white">
      {/* Header section */}
      <div className="mb-8 flex items-start gap-4 rounded-xl border border-(--studio-border) bg-(--studio-panel) p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-(--studio-accent)/10 text-(--studio-accent)">
          <Shield size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Transition Management</h1>
              <p className="mt-1 text-xs text-(--studio-muted)">Manage published status for all transitions. Only published transitions are visible in the Clypra app.</p>
            </div>
            <button type="button" onClick={loadTransitions} disabled={loading} className="flex items-center gap-2 rounded-lg border border-(--studio-border) bg-(--studio-raised) px-4 py-2 text-xs font-medium hover:bg-(--studio-hover) disabled:opacity-50">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Status message */}
      {status && (
        <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${status.type === "success" ? "border-green-500/20 bg-green-500/5 text-green-200" : "border-red-500/20 bg-red-500/5 text-red-200"}`}>
          {status.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div className="text-xs leading-relaxed">{status.message}</div>
        </div>
      )}

      {/* Loading state */}
      {loading && transitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 size={32} className="animate-spin text-(--studio-accent) mb-4" />
          <div className="text-xs font-medium text-white">Loading transitions...</div>
          <div className="text-[10px] text-(--studio-muted) mt-1">Fetching data from server</div>
        </div>
      ) : transitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-(--studio-border) bg-(--studio-panel)">
          <AlertCircle size={32} className="text-(--studio-muted) mb-4" />
          <div className="text-xs font-medium text-white">No transitions found</div>
          <div className="text-[10px] text-(--studio-muted) mt-1">Upload transitions from the Transitions workspace</div>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryTransitions = transitionsByCategory[category];
            const publishedCount = categoryTransitions.filter((t) => t.published).length;
            const totalCount = categoryTransitions.length;

            return (
              <div key={category} className="rounded-xl border border-(--studio-border) bg-(--studio-panel) overflow-hidden">
                {/* Category header */}
                <div className="border-b border-(--studio-border) bg-(--studio-raised) px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold capitalize text-white">{category}</h2>
                      <p className="text-[10px] text-(--studio-muted) mt-0.5">
                        {publishedCount} of {totalCount} published
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-medium text-green-400">{publishedCount} published</div>
                      <div className="rounded-full bg-(--studio-raised) border border-(--studio-border) px-3 py-1 text-[10px] font-medium text-(--studio-muted)">{totalCount - publishedCount} unpublished</div>
                    </div>
                  </div>
                </div>

                {/* Transitions list */}
                <div className="divide-y divide-(--studio-border)">
                  {categoryTransitions.map((transition) => (
                    <div key={transition.id} className="flex items-center justify-between px-6 py-4 hover:bg-(--studio-raised) transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-white text-sm">{transition.name}</div>
                          <div className="text-[10px] text-(--studio-muted) font-mono bg-(--studio-raised) px-2 py-0.5 rounded">{transition.id}</div>
                        </div>
                        {transition.description && <div className="text-xs text-(--studio-muted) mt-1">{transition.description}</div>}
                        {transition.tags && transition.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {transition.tags.slice(0, 5).map((tag) => (
                              <span key={tag} className="text-[10px] bg-(--studio-raised) border border-(--studio-border) px-2 py-0.5 rounded text-(--studio-muted)">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Toggle button */}
                      <button type="button" onClick={() => handleTogglePublished(transition.category, transition.id, transition.published)} disabled={updatingId === transition.id} className={`ml-4 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${transition.published ? "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/15" : "bg-(--studio-raised) text-(--studio-muted) border border-(--studio-border) hover:bg-(--studio-hover)"}`}>
                        {updatingId === transition.id ? <Loader2 size={14} className="animate-spin" /> : transition.published ? <Eye size={14} /> : <EyeOff size={14} />}
                        {transition.published ? "Published" : "Unpublished"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
