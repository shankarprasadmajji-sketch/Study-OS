import { MusicTrack, CATEGORIES } from '../data/musicTracks.js';

export interface StoredTrackRecord {
  id: string;
  userId: string;
  title: string;
  artist: string;
  category: string;
  categoryLabel: string;
  duration: number;
  blob: Blob;
  fileName: string;
  fileSize: number;
  createdAt: number;
}

const DB_NAME = 'studyos_music_db';
const DB_VERSION = 2;
const STORE_NAME = 'custom_tracks';

// In-memory registry of generated Blob URLs so we can reuse and cleanly revoke them
const activeBlobUrls = new Map<string, string>();

function safeCreateObjectURL(blob: Blob): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      return URL.createObjectURL(blob);
    } catch {
      // ignore
    }
  }
  return `blob:studyos-audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function safeRevokeObjectURL(url: string): void {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

// Fallback in-memory store if IndexedDB is blocked or unsupported
const memoryFallbackTracks: StoredTrackRecord[] = [];

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB not supported or accessible'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } else {
        store = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORE_NAME);
      }

      if (!store.indexNames.contains('userId')) {
        store.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Extracts approximate audio duration in seconds from an audio Blob URL
 */
function probeAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve) => {
    if (typeof Audio === 'undefined') {
      return resolve(180);
    }

    try {
      const audio = new Audio();
      let resolved = false;

      const finish = (secs: number) => {
        if (!resolved) {
          resolved = true;
          audio.src = '';
          resolve(isFinite(secs) && secs > 0 ? Math.round(secs) : 180);
        }
      };

      const timeout = setTimeout(() => {
        finish(180);
      }, 3000);

      audio.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);
        finish(audio.duration);
      });

      audio.addEventListener('error', () => {
        clearTimeout(timeout);
        finish(180);
      });

      audio.preload = 'metadata';
      audio.src = audioUrl;
    } catch {
      resolve(180);
    }
  });
}

/**
 * Formats clean title from file name (removes extension and cleans up hyphens/underscores)
 */
export function sanitizeTrackTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const clean = withoutExt.replace(/[_-]+/g, ' ').trim();
  return clean.length > 0 ? clean : 'Custom Study Track';
}

/**
 * Formats file size in readable units (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Loads all custom uploaded tracks for a specific user from IndexedDB or memory fallback
 */
export async function loadStoredCustomTracks(userId: string): Promise<MusicTrack[]> {
  if (!userId) return [];

  try {
    const db = await openDB();
    const records: StoredTrackRecord[] = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Filter strictly by the current user's ID
    return records
      .filter((rec) => rec.userId === userId)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((rec) => {
        let objectUrl = activeBlobUrls.get(rec.id);
        if (!objectUrl) {
          objectUrl = safeCreateObjectURL(rec.blob);
          activeBlobUrls.set(rec.id, objectUrl);
        }

        return {
          id: rec.id,
          userId: rec.userId,
          title: rec.title,
          artist: rec.artist || 'My Upload',
          category: rec.category || 'custom',
          categoryLabel: rec.categoryLabel || 'My Uploads',
          duration: rec.duration || 180,
          audioUrl: objectUrl,
          isCustom: true,
        };
      });
  } catch (err) {
    console.warn('[MusicStorage] IndexedDB unavailable, using memory fallback:', err);
    return memoryFallbackTracks
      .filter((rec) => rec.userId === userId)
      .map((rec) => {
        let objectUrl = activeBlobUrls.get(rec.id);
        if (!objectUrl) {
          objectUrl = safeCreateObjectURL(rec.blob);
          activeBlobUrls.set(rec.id, objectUrl);
        }
        return {
          id: rec.id,
          userId: rec.userId,
          title: rec.title,
          artist: rec.artist,
          category: rec.category || 'custom',
          categoryLabel: rec.categoryLabel || 'My Uploads',
          duration: rec.duration,
          audioUrl: objectUrl,
          isCustom: true,
        };
      });
  }
}

/**
 * Saves an uploaded audio file (MP3, WAV, etc.) into IndexedDB for a specific user
 */
export async function saveUploadedTrack(
  file: File,
  userId: string,
  categoryId = 'custom'
): Promise<MusicTrack> {
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = sanitizeTrackTitle(file.name);
  const artist = 'My Upload';

  const categoryObj = CATEGORIES.find((c) => c.id === categoryId);
  const categoryLabel = categoryObj ? categoryObj.label : 'My Uploads';

  const blobUrl = safeCreateObjectURL(file);
  activeBlobUrls.set(id, blobUrl);

  const duration = await probeAudioDuration(blobUrl);

  const record: StoredTrackRecord = {
    id,
    userId: userId || 'anonymous',
    title,
    artist,
    category: categoryId === 'all' ? 'custom' : categoryId,
    categoryLabel: categoryId === 'all' ? 'My Uploads' : categoryLabel,
    duration,
    blob: file,
    fileName: file.name,
    fileSize: file.size,
    createdAt: Date.now(),
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[MusicStorage] Failed to persist to IndexedDB, keeping in memory:', err);
    memoryFallbackTracks.unshift(record);
  }

  return {
    id,
    userId: record.userId,
    title,
    artist,
    category: record.category,
    categoryLabel: record.categoryLabel,
    duration,
    audioUrl: blobUrl,
    isCustom: true,
  };
}

/**
 * Updates an uploaded track's category
 */
export async function updateStoredTrackCategory(
  id: string,
  categoryId: string,
  categoryLabel: string
): Promise<void> {
  const memTrack = memoryFallbackTracks.find((t) => t.id === id);
  if (memTrack) {
    memTrack.category = categoryId;
    memTrack.categoryLabel = categoryLabel;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result as StoredTrackRecord | undefined;
        if (record) {
          record.category = categoryId;
          record.categoryLabel = categoryLabel;
          store.put(record);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('[MusicStorage] Failed to update track category:', err);
  }
}

/**
 * Deletes a custom track by id from storage and revokes its Blob URL
 */
export async function deleteStoredCustomTrack(id: string): Promise<void> {
  const existingUrl = activeBlobUrls.get(id);
  if (existingUrl) {
    safeRevokeObjectURL(existingUrl);
    activeBlobUrls.delete(id);
  }

  const memoryIndex = memoryFallbackTracks.findIndex((t) => t.id === id);
  if (memoryIndex >= 0) {
    memoryFallbackTracks.splice(memoryIndex, 1);
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[MusicStorage] Failed to delete from IndexedDB:', err);
  }
}
