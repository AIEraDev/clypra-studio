const DEFAULT_MAX_ENTRIES = 90;

export class BodyMaskCache {
  private readonly entries = new Map<string, ImageData>();

  constructor(private readonly maxEntries = DEFAULT_MAX_ENTRIES) {}

  get(key: string): ImageData | null {
    const value = this.entries.get(key);
    if (!value) return null;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  set(key: string, mask: ImageData): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    }
    this.entries.set(key, mask);

    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (!oldest) break;
      this.entries.delete(oldest);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}

export const bodyMaskCache = new BodyMaskCache();
