/**
 * R2 Publish Settings Component
 *
 * UI for configuring R2 direct publishing
 */

import { useState, useEffect } from "react";
import { getR2Config, saveR2Config, type R2UploadConfig } from "../../services/r2Service";

export function R2PublishSettings() {
  const [config, setConfig] = useState<R2UploadConfig>({
    accountId: "",
    apiToken: "",
    bucketName: "clypra-assets",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const existing = getR2Config();
    if (existing) {
      setConfig(existing);
    }
  }, []);

  const handleSave = () => {
    if (!config.accountId.trim() || !config.apiToken.trim() || !config.bucketName.trim()) {
      alert("Please fill in all fields");
      return;
    }

    saveR2Config(config);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClear = () => {
    if (confirm("Clear R2 configuration?")) {
      localStorage.removeItem("clypra_r2_config");
      setConfig({ accountId: "", apiToken: "", bucketName: "clypra-assets" });
      setIsEditing(false);
    }
  };

  const isConfigured = config.accountId && config.apiToken && config.bucketName;

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">R2 Direct Publishing</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Publish directly to Cloudflare R2 for instant updates</p>
        </div>
        <div className="flex items-center gap-2">{isConfigured && <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Configured</span>}</div>
      </div>

      {!isEditing && isConfigured ? (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account ID</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white">{config.accountId.substring(0, 8)}...</p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">API Token</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white">••••••••••••••••</p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bucket Name</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white">{config.bucketName}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setIsEditing(true)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              Edit Configuration
            </button>
            <button onClick={handleClear} className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20">
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cloudflare Account ID</label>
            <input type="text" value={config.accountId} onChange={(e) => setConfig({ ...config, accountId: e.target.value })} placeholder="Your Cloudflare account ID" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Find this in Cloudflare dashboard → R2 → Overview</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">R2 API Token</label>
            <input type="password" value={config.apiToken} onChange={(e) => setConfig({ ...config, apiToken: e.target.value })} placeholder="Your R2 API token" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create token with R2 read/write permissions</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bucket Name</label>
            <input type="text" value={config.bucketName} onChange={(e) => setConfig({ ...config, bucketName: e.target.value })} placeholder="clypra-assets" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use "clypra-assets" for the main bucket</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {isSaved ? "✓ Saved!" : "Save Configuration"}
            </button>
            {isConfigured && (
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Benefits of R2 Publishing</h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Instant publishing - no PR review needed</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Unlimited file sizes (vs 100MB on GitHub)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Faster uploads - direct to R2</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Lower costs - free egress</span>
          </li>
        </ul>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> R2 publishing bypasses GitHub PRs. Content is published instantly and directly to production. Use GitHub publishing if you need review workflows.
        </p>
      </div>
    </div>
  );
}
