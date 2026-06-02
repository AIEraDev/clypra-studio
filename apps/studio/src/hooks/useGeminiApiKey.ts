const GEMINI_KEY_STORAGE_KEY = "clypra_studio_gemini_api_key";

export function getGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function saveGeminiApiKey(apiKey: string): void {
  localStorage.setItem(GEMINI_KEY_STORAGE_KEY, apiKey.trim());
}

export function clearGeminiApiKey(): void {
  localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
}

export function getGeminiRequestHeaders(): Record<string, string> {
  const apiKey = getGeminiApiKey();
  return apiKey ? { "X-Clypra-Gemini-Key": apiKey } : {};
}
