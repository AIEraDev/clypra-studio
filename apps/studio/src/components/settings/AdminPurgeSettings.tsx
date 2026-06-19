import React, { useState } from "react";
import { Shield, Trash2, RefreshCw, AlertCircle, CheckCircle, Database, Server, Zap } from "lucide-react";

interface PurgeResult {
  success: boolean;
  message?: string;
  purged?: number;
  total?: number;
  totalDeleted?: number;
  cacheApi?: { purged: number; total: number };
  kv?: { totalDeleted: number };
}

export function AdminPurgeSettings() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [details, setDetails] = useState<PurgeResult | null>(null);

  const getAuthToken = () => localStorage.getItem("clypra_auth_token");
  const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "https://clypra-worker-api.abdulkabirmusa.com";

  const handlePurge = async (type: "all" | "kv" | "cache") => {
    setLoading(true);
    setStatus(null);
    setDetails(null);

    const token = getAuthToken();
    if (!token) {
      setStatus({
        type: "error",
        message: "No authorization token found. Please log in again.",
      });
      setLoading(false);
      return;
    }

    const endpoint = type === "all" ? "purge-all" : type === "kv" ? "purge-kv" : "purge-cache";
    const url = `${getApiBaseUrl()}/admin/${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Only administrators can clear server caches.");
        }
        if (response.status === 403) {
          throw new Error("Forbidden: You do not have permissions to perform this action.");
        }
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      const data: PurgeResult = await response.json();
      setDetails(data);
      
      let message = "Purge completed successfully.";
      if (type === "all") {
        const kvDel = data.kv?.totalDeleted ?? data.totalDeleted ?? 0;
        const cachePurged = data.cacheApi?.purged ?? data.purged ?? 0;
        message = `All server caches purged: KV (${kvDel} keys deleted), Workers Cache API (${cachePurged} endpoints cleared).`;
      } else if (type === "kv") {
        const kvDel = data.totalDeleted ?? data.kv?.totalDeleted ?? 0;
        message = `Server KV cache purged successfully. (${kvDel} keys deleted)`;
      } else {
        const cachePurged = data.purged ?? data.cacheApi?.purged ?? 0;
        message = `Server Cache API purged successfully. (${cachePurged} endpoints cleared)`;
      }

      setStatus({
        type: "success",
        message,
      });
    } catch (error: any) {
      console.error("[AdminPurgeSettings] Purge error:", error);
      setStatus({
        type: "error",
        message: error.message || "An unexpected error occurred while purging server caches.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 text-white">
      {/* Header section */}
      <div className="mb-8 flex items-start gap-4 rounded-xl border border-(--studio-border) bg-(--studio-panel) p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-(--studio-accent)/10 text-(--studio-accent)">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Admin Cache Control</h1>
          <p className="mt-1 text-xs text-(--studio-muted)">
            Manage server-side caching policies for the Clypra Family. Purging causes Clypra API to rebuild indices and lazy-load fresh templates/effects from disk and storage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Controls Column */}
        <div className="space-y-6">
          {/* Main actions card */}
          <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-6">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-(--studio-muted) mb-4">Purge Commands</h2>
            
            <div className="space-y-3">
              {/* Purge All */}
              <button
                type="button"
                onClick={() => handlePurge("all")}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 hover:border-red-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500/20 text-red-400 group-hover:scale-105 transition-transform">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-red-200">Purge All Server Caches</div>
                    <div className="text-[10px] text-red-300/70">Clear both KV store and Workers Cache API</div>
                  </div>
                </div>
                {loading ? <RefreshCw size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} className="text-red-400" />}
              </button>

              {/* Purge KV */}
              <button
                type="button"
                onClick={() => handlePurge("kv")}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-(--studio-raised) hover:bg-(--studio-hover) border border-(--studio-border) hover:border-orange-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-500/10 text-orange-400 group-hover:scale-105 transition-transform">
                    <Database size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Purge KV Store Cache</div>
                    <div className="text-[10px] text-(--studio-muted)">Deletes all cached effect definitions, templates & query indices</div>
                  </div>
                </div>
                {loading ? <RefreshCw size={14} className="animate-spin text-(--studio-muted)" /> : <Trash2 size={14} className="text-(--studio-muted) group-hover:text-orange-400" />}
              </button>

              {/* Purge Cache API */}
              <button
                type="button"
                onClick={() => handlePurge("cache")}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-(--studio-raised) hover:bg-(--studio-hover) border border-(--studio-border) hover:border-blue-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                    <Server size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Purge Workers Cache API</div>
                    <div className="text-[10px] text-(--studio-muted)">Evicts cached GET endpoints matching CDN response layers</div>
                  </div>
                </div>
                {loading ? <RefreshCw size={14} className="animate-spin text-(--studio-muted)" /> : <Trash2 size={14} className="text-(--studio-muted) group-hover:text-blue-400" />}
              </button>
            </div>
          </div>

          {/* Security alert box */}
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-yellow-200">Destructive Operational Warning</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-yellow-200/70">
                Only authenticated administrators are allowed to purge cache states. This action is instantaneous across Cloudflare Edge networks but might transiently increase initial retrieval latency.
              </p>
            </div>
          </div>
        </div>

        {/* Status / Output Column */}
        <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-6 flex flex-col min-h-[300px]">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-(--studio-muted) mb-4">Operation Status</h2>
          
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
            {loading ? (
              <div className="space-y-3">
                <RefreshCw size={32} className="animate-spin text-(--studio-accent) mx-auto" />
                <div className="text-xs font-medium text-white">Contacting Cloudflare Edge Workers...</div>
                <div className="text-[10px] text-(--studio-muted)">Executing purge sequence and waiting for response</div>
              </div>
            ) : status ? (
              <div className="w-full space-y-4">
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${status.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {status.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">{status.type === "success" ? "Purge Complete" : "Purge Failed"}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-(--studio-muted) bg-(--studio-raised) p-3 rounded-lg border border-(--studio-border) font-mono break-words select-text">{status.message}</p>
                </div>

                {details && details.success && (
                  <div className="text-left space-y-2 border-t border-(--studio-border) pt-4">
                    <div className="text-[10px] font-semibold text-(--studio-muted) uppercase">Detailed Metrics:</div>
                    
                    {details.kv && (
                      <div className="flex justify-between items-center bg-(--studio-raised) p-2 rounded text-[11px]">
                        <span className="text-(--studio-muted)">KV Keys Deleted:</span>
                        <span className="font-mono text-orange-400 font-bold">{details.kv.totalDeleted}</span>
                      </div>
                    )}
                    
                    {details.cacheApi && (
                      <div className="flex justify-between items-center bg-(--studio-raised) p-2 rounded text-[11px]">
                        <span className="text-(--studio-muted)">CDN Cache API Cleared:</span>
                        <span className="font-mono text-blue-400 font-bold">{details.cacheApi.purged} / {details.cacheApi.total}</span>
                      </div>
                    )}

                    {details.totalDeleted !== undefined && details.kv === undefined && (
                      <div className="flex justify-between items-center bg-(--studio-raised) p-2 rounded text-[11px]">
                        <span className="text-(--studio-muted)">Keys Evicted:</span>
                        <span className="font-mono text-orange-400 font-bold">{details.totalDeleted}</span>
                      </div>
                    )}

                    {details.purged !== undefined && details.cacheApi === undefined && (
                      <div className="flex justify-between items-center bg-(--studio-raised) p-2 rounded text-[11px]">
                        <span className="text-(--studio-muted)">Endpoints Cleared:</span>
                        <span className="font-mono text-blue-400 font-bold">{details.purged}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-(--studio-muted)">
                <Shield size={36} className="mx-auto stroke-1" />
                <p className="text-xs">No active operations</p>
                <p className="text-[10px]">Select a command from the left panel to execute a server purge</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
