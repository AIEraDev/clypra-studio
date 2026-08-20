const DEFAULT_API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

/** Single source of truth for Studio API calls. */
export function getStudioApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

const DEFAULT_NATIVE_LAB_URL = "http://127.0.0.1:8788";

/** Local native daemon endpoint used by Studio labs, never by production API calls. */
export function getNativeLabUrl(): string {
  const configured = import.meta.env.VITE_CLYPRA_NATIVE_LAB_URL?.trim();
  return (configured || DEFAULT_NATIVE_LAB_URL).replace(/\/$/, "");
}
