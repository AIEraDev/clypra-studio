const DEFAULT_API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

/** Single source of truth for Studio API calls. */
export function getStudioApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

