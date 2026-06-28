import React, { useState, useEffect, useRef } from "react";
import { Check, Trash2, ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface PendingEffect {
  id: string;
  name: string;
  description: string;
  code: string;
  params: any;
  prompt: string;
  userId: string;
  timestamp: number;
}

export function AdminEffectsPanel() {
  const [effects, setEffects] = useState<PendingEffect[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<PendingEffect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const getApiBaseUrl = () => {
    const host = window.location.hostname;
    return (host === "localhost" || host === "127.0.0.1") 
      ? "http://localhost:8787" 
      : "https://clypra-worker-api.abdulkabirmusa.com";
  };

  const fetchPendingEffects = async () => {
    setIsLoading(true);
    try {
      const base = getApiBaseUrl();
      const token = localStorage.getItem("clypra_auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${base}/admin/pending-effects`, { headers });
      if (!res.ok) throw new Error("Failed to fetch pending effects");
      const data = await res.json();
      setEffects(data.effects || []);
      if (data.effects?.length > 0) {
        setSelectedEffect(data.effects[0]);
      } else {
        setSelectedEffect(null);
      }
    } catch (error) {
      console.error("Error loading pending effects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEffects();
  }, []);

  // Animation Loop for selected effect preview
  useEffect(() => {
    if (!selectedEffect || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let ClassConstructor: any;
    try {
      ClassConstructor = new Function(`return ${selectedEffect.code}`)();
    } catch (e) {
      console.error("Failed to compile effect class:", e);
      return;
    }

    let instance: any;
    try {
      instance = new ClassConstructor();
    } catch (e) {
      console.error("Failed to instantiate effect:", e);
      return;
    }

    let startTime = performance.now();

    const render = (timestamp: number) => {
      const elapsed = (timestamp - startTime) / 1000;
      
      // Draw background
      ctx.fillStyle = "#0E0E12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw base placeholder shape so effect has a visual subject
      ctx.fillStyle = "#1E1E26";
      ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.fillStyle = "#7C6FFF";
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PREVIEW FRAME", canvas.width / 2, canvas.height / 2 + 8);

      // Extract default parameter values
      const defaultParams: Record<string, any> = {};
      if (selectedEffect.params) {
        Object.entries(selectedEffect.params).forEach(([k, def]: [string, any]) => {
          defaultParams[k] = def.value;
        });
      }

      // Execute dynamic drawFrame
      try {
        if (instance && typeof instance.drawFrame === "function") {
          instance.drawFrame(ctx, canvas.width, canvas.height, elapsed, defaultParams);
        }
      } catch (err) {
        console.error("drawFrame execution error:", err);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [selectedEffect]);

  const handleApprove = async (id: string) => {
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      const base = getApiBaseUrl();
      const token = localStorage.getItem("clypra_auth_token");
      const res = await fetch(`${base}/admin/approve-effect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Approval failed");
      }

      alert("Effect approved and published to editor!");
      await fetchPendingEffects();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (isActionLoading) return;
    if (!confirm("Are you sure you want to reject and delete this effect?")) return;
    setIsActionLoading(true);
    try {
      const base = getApiBaseUrl();
      const token = localStorage.getItem("clypra_auth_token");
      const res = await fetch(`${base}/admin/reject-effect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Rejection failed");
      alert("Effect rejected and deleted.");
      await fetchPendingEffects();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Rejection failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0E0E12]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="h-14 border-b border-[#2A2A38] bg-[#1E1E26] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => (window.location.href = "/studio")} 
            className="p-1.5 hover:bg-[#2A2A38] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#7C6FFF]" />
              AI Effects Moderator Portal
            </h1>
            <p className="text-[10px] text-gray-400">Review pending generated effects</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left list */}
        <div className="w-80 bg-[#1E1E26] border-r border-[#2A2A38] flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-[#2A2A38]">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Pending Queue ({effects.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="animate-spin text-[#7C6FFF] mb-3" size={24} />
                <span className="text-xs">Loading queue...</span>
              </div>
            ) : effects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center px-4">
                <AlertCircle size={24} className="mb-2 opacity-55" />
                <span className="text-xs font-medium">All clear! No pending reviews.</span>
              </div>
            ) : (
              effects.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEffect(e)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedEffect?.id === e.id
                      ? "bg-[#7C6FFF]/15 border-[#7C6FFF]/40 text-white"
                      : "bg-[#161620] border-transparent hover:border-[#2A2A38] text-gray-300"
                  }`}
                >
                  <div className="font-semibold text-xs truncate">{e.name}</div>
                  <div className="text-[10px] text-gray-400 mt-1 truncate">Prompt: "{e.prompt}"</div>
                  <div className="text-[9px] text-gray-500 mt-2 font-mono">
                    {new Date(e.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right side sandbox and metadata */}
        {selectedEffect ? (
          <div className="flex-1 flex min-w-0">
            {/* Live Canvas Preview */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0E0E12] border-r border-[#2A2A38]">
              <div className="p-4 border-b border-[#2A2A38] flex justify-between items-center bg-[#1E1E26]">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400">LIVE COMPILED WORKSPACE</h3>
                  <div className="text-[11px] text-gray-300 font-mono mt-0.5">Effect ID: {selectedEffect.id}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(selectedEffect.id)}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E24B4A]/10 hover:bg-[#E24B4A]/25 border border-[#E24B4A]/30 text-[#E24B4A] rounded text-xs font-medium transition-colors"
                  >
                    <Trash2 size={14} />
                    Reject & Delete
                  </button>
                  <button
                    onClick={() => handleApprove(selectedEffect.id)}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4CAF82]/10 hover:bg-[#4CAF82]/25 border border-[#4CAF82]/30 text-[#4CAF82] rounded text-xs font-medium transition-colors"
                  >
                    {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Approve & Publish
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-6 relative">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="rounded-xl border border-[#2A2A38] bg-[#0A0A10] shadow-2xl max-w-full max-h-full"
                />
              </div>
            </div>

            {/* Sidebar metadata review */}
            <div className="w-80 bg-[#1E1E26] overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Metadata</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-500 block">Effect Name</label>
                    <span className="text-xs text-white font-semibold">{selectedEffect.name}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">Creator ID</label>
                    <span className="text-xs text-white font-mono">{selectedEffect.userId}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">Description</label>
                    <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{selectedEffect.description}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">Original User Prompt</label>
                    <p className="text-xs text-[#7C6FFF] italic mt-0.5 font-medium">"{selectedEffect.prompt}"</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Extracted Sliders</h3>
                <div className="space-y-2 bg-[#0E0E12] rounded-lg p-3 border border-[#2A2A38]">
                  {Object.entries(selectedEffect.params || {}).map(([k, def]: [string, any]) => (
                    <div key={k} className="flex justify-between items-center text-xs py-1">
                      <span className="text-gray-400 font-medium">{def.label || k}</span>
                      <span className="text-[#7C6FFF] font-mono font-semibold">{String(def.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Generated Source</h3>
                <pre className="text-[10px] font-mono text-gray-400 bg-[#0E0E12] rounded-lg p-3 border border-[#2A2A38] overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {selectedEffect.code}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Sparkles size={32} className="opacity-35 mb-2" />
            <span className="text-xs font-medium">Select an item from the queue to start reviewing</span>
          </div>
        )}
      </div>
    </div>
  );
}
