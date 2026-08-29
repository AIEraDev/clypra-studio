import {
  canonicalTemplateHash,
  normalizeTextTemplateArtifact,
  type TextTemplateArtifact,
} from "@clypra-studio/engine";

export interface TextTemplateDraftRecord {
  id: string;
  name: string;
  savedAt: number;
  checksum: string;
  artifact: TextTemplateArtifact;
  controlValues?: Record<string, unknown>;
  thumbnailFrame?: number;
}

const DB_NAME = "clypra-text-template-drafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const INDEX_KEY = "clypra_text_template_draft_index";

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open draft database"));
  });
}

function fallbackIndex(): TextTemplateDraftRecord[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFallbackIndex(records: TextTemplateDraftRecord[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(records.map((record) => ({
    id: record.id,
    name: record.name,
    savedAt: record.savedAt,
    checksum: record.checksum,
  }))));
}

export async function saveTextTemplateDraft(
  record: Omit<TextTemplateDraftRecord, "checksum" | "savedAt"> & Partial<Pick<TextTemplateDraftRecord, "savedAt">>,
): Promise<TextTemplateDraftRecord> {
  const artifact = normalizeTextTemplateArtifact(record.artifact);
  const saved: TextTemplateDraftRecord = {
    ...record,
    artifact,
    savedAt: record.savedAt ?? Date.now(),
    checksum: canonicalTemplateHash(artifact),
  };
  if (!hasIndexedDb()) {
    const next = fallbackIndex().filter((item) => item.id !== saved.id).concat(saved);
    localStorage.setItem(`clypra_text_template_draft_${saved.id}`, JSON.stringify(saved));
    writeFallbackIndex(next);
    return saved;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(saved);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Unable to save template draft"));
  });
  db.close();
  return saved;
}

export async function loadTextTemplateDraft(id: string): Promise<TextTemplateDraftRecord | null> {
  if (!hasIndexedDb()) {
    try {
      const raw = localStorage.getItem(`clypra_text_template_draft_${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  const db = await openDb();
  const result = await new Promise<TextTemplateDraftRecord | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Unable to load template draft"));
  });
  db.close();
  return result;
}

export async function listTextTemplateDrafts(): Promise<Array<Pick<TextTemplateDraftRecord, "id" | "name" | "savedAt" | "checksum">>> {
  if (!hasIndexedDb()) return fallbackIndex();
  const db = await openDb();
  const result = await new Promise<TextTemplateDraftRecord[]>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error("Unable to list template drafts"));
  });
  db.close();
  return result.map(({ id, name, savedAt, checksum }) => ({ id, name, savedAt, checksum }));
}

export async function deleteTextTemplateDraft(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    localStorage.removeItem(`clypra_text_template_draft_${id}`);
    writeFallbackIndex(fallbackIndex().filter((item) => item.id !== id));
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Unable to delete template draft"));
  });
  db.close();
}
