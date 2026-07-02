/**
 * Browser-native IndexedDB utility for offline data persistence
 */

const DB_NAME = 'ProgOfficeDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export const initDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[IndexedDB] Database failed to open");
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Object store to cache full arrays of register and settings data
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache');
      }
      // Object store to keep track of dirty registers that need syncing to Dropbox
      if (!db.objectStoreNames.contains('sync-needed')) {
        db.createObjectStore('sync-needed');
      }
    };
  });
};

const getStore = async (storeName: 'cache' | 'sync-needed', mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  const db = await initDb();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const store = await getStore('cache', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[IndexedDB] Error reading key "${key}":`, error);
    return null;
  }
};

export const setCachedData = async <T>(key: string, value: T): Promise<void> => {
  try {
    const store = await getStore('cache', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[IndexedDB] Error writing key "${key}":`, error);
  }
};

export const clearCachedData = async (key: string): Promise<void> => {
  try {
    const store = await getStore('cache', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[IndexedDB] Error clearing key "${key}":`, error);
  }
};

export const getSyncNeeded = async (key: string): Promise<boolean> => {
  try {
    const store = await getStore('sync-needed', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return false;
  }
};

export const setSyncNeeded = async (key: string, needed: boolean): Promise<void> => {
  try {
    const store = await getStore('sync-needed', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = needed ? store.put(true, key) : store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[IndexedDB] Error setting sync state for "${key}":`, error);
  }
};

export const getAllUnsyncedKeys = async (): Promise<string[]> => {
  try {
    const store = await getStore('sync-needed', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result.map(k => k.toString()));
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
};
