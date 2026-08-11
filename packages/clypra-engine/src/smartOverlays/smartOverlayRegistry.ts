import type { SmartOverlayPreset, SmartOverlayClip } from "./smartOverlayTypes.js";
import { SMART_OVERLAY_PRESETS } from "./presets.js";

const LOCAL_STORAGE_KEY = "clypra_smart_overlays_custom_library";

export interface SmartOverlayRegistryItem {
  id: string;
  name: string;
  category: string;
  clipData: SmartOverlayClip;
  isCustom?: boolean;
  publishedAt?: string;
}

export class SmartOverlayRegistryService {
  private static instance: SmartOverlayRegistryService;
  private customItems: SmartOverlayRegistryItem[] = [];

  private constructor() {
    this.loadLocalCustomItems();
  }

  public static getInstance(): SmartOverlayRegistryService {
    if (!SmartOverlayRegistryService.instance) {
      SmartOverlayRegistryService.instance = new SmartOverlayRegistryService();
    }
    return SmartOverlayRegistryService.instance;
  }

  private loadLocalCustomItems(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          this.customItems = JSON.parse(raw);
        }
      }
    } catch (err) {
      console.warn("[SmartOverlayRegistry] Failed to load local custom overlays:", err);
    }
  }

  private saveLocalCustomItems(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.customItems));
      }
    } catch (err) {
      console.warn("[SmartOverlayRegistry] Failed to save local custom overlays:", err);
    }
  }

  public getBuiltInPresets(): SmartOverlayPreset[] {
    return SMART_OVERLAY_PRESETS;
  }

  public getCustomItems(): SmartOverlayRegistryItem[] {
    return this.customItems;
  }

  public getAllPresets(): SmartOverlayPreset[] {
    const customPresets: SmartOverlayPreset[] = this.customItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.clipData.overlayType,
      description: "Custom user-designed smart overlay",
      previewThumbnail: "",
      defaultContent: item.clipData.content,
      style: item.clipData.style
    }));

    return [...SMART_OVERLAY_PRESETS, ...customPresets];
  }

  public saveCustomOverlay(name: string, clipData: SmartOverlayClip): SmartOverlayRegistryItem {
    const existingIdx = this.customItems.findIndex((i) => i.id === clipData.id);
    const item: SmartOverlayRegistryItem = {
      id: clipData.id,
      name,
      category: clipData.overlayType,
      clipData,
      isCustom: true,
      publishedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      this.customItems[existingIdx] = item;
    } else {
      this.customItems.push(item);
    }

    this.saveLocalCustomItems();
    return item;
  }

  public deleteCustomOverlay(id: string): void {
    this.customItems = this.customItems.filter((i) => i.id !== id);
    this.saveLocalCustomItems();
  }

  public async fetchRemoteCatalog(apiBaseUrl?: string): Promise<SmartOverlayPreset[]> {
    const url = `${apiBaseUrl || "https://clypra-worker-api.abdulkabirmusa.com"}/overlays/smart-overlays`;
    try {
      const res = await fetch(url);
      if (!res.ok) return this.getAllPresets();
      const remoteData = await res.json();
      if (Array.isArray(remoteData.overlays)) {
        return [...SMART_OVERLAY_PRESETS, ...remoteData.overlays];
      }
    } catch (err) {
      console.warn("[SmartOverlayRegistry] Could not fetch remote R2 catalog, using local presets:", err);
    }
    return this.getAllPresets();
  }
}

export const smartOverlayRegistry = SmartOverlayRegistryService.getInstance();
