import { MusicTrack } from '../data/musicTracks.js';

interface StoredTrackRecord {
  id: string;
  title: string;
  artist: string;
  category: 'custom';
  categoryLabel: string;
  duration: number;
  blob: Blob;
  fileName: string;
  fileSize: number;
  createdAt: number;
}

const DB_NAME = 'studyos_music_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_tracks';

// In-memory registry of generated Blob URLs so we can reuse and cleanly revoke them
const activeBlobUrls = new Map<string, string>();

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
 * Loads all custom uploaded tracks from IndexedDB or memory fallback
 */
export async function loadStoredCustomTracks(): Promise<MusicTrack[]> {
  try {
    const db = await openDB();
    const records: StoredTrackRecord[] = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    return records
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((rec) => {
        let objectUrl = activeBlobUrls.get(rec.id);
        if (!objectUrl) {
          objectUrl = URL.createObjectURL(rec.blob);
          activeBlobUrls.set(rec.id, objectUrl);
        }

        return {
          id: rec.id,
          title: rec.title,
          artist: rec.artist || 'My Upload',
          category: 'custom',
          categoryLabel: 'My Uploads',
          duration: rec.duration || 180,
          audioUrl: objectUrl,
          isCustom: true,
        };
      });
  } catch (err) {
    console.warn('[MusicStorage] IndexedDB unavailable, using memory fallback:', err);
    return memoryFallbackTracks.map((rec) => {
      let objectUrl = activeBlobUrls.get(rec.id);
      if (!objectUrl) {
        objectUrl = URL.createObjectURL(rec.blob);
        activeBlobUrls.set(rec.id, objectUrl);
      }
      return {
        id: rec.id,
        title: rec.title,
        artist: rec.artist,
        category: 'custom',
        categoryLabel: 'My Uploads',
        duration: rec.duration,
        audioUrl: objectUrl,
        isCustom: true,
      };
    });
  }
}

/**
 * Saves an uploaded audio file (MP3, WAV, etc.) into IndexedDB and returns a playable MusicTrack
 */
export async function saveUploadedTrack(file: File): Promise<MusicTrack> {
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = sanitizeTrackTitle(file.name);
  const artist = 'My Upload';

  const blobUrl = URL.createObjectURL(file);
  activeBlobUrls.set(id, blobUrl);

  const duration = await probeAudioDuration(blobUrl);

  const record: StoredTrackRecord = {
    id,
    title,
    artist,
    category: 'custom',
    categoryLabel: 'My Uploads',
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
    title,
    artist,
    category: 'custom',
    categoryLabel: 'My Uploads',
    duration,
    audioUrl: blobUrl,
    isCustom: true,
  };
}

/**
 * Deletes a custom track by id from storage and revokes its Blob URL
 */
export async function deleteStoredCustomTrack(id: string): Promise<void> {
  const existingUrl = activeBlobUrls.get(id);
  if (existingUrl) {
    try {
      URL.revokeObjectURL(existingUrl);
    } catch {
      // ignore
    }
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
