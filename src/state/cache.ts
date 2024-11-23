// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { Feature } from 'geojson';

// Tile server's custom extensions to GeoJSON Features
export type SoundscapeFeature = Feature & {
  feature_type: string;
  feature_value: string;
  osm_ids: number[];
  tile?: string;
  id?: number;
}

interface CachedURL {
  url: string;
  lastFetchTime: number;
}

interface IDBEventTargetWithResult extends EventTarget {
  result: IDBDatabase;
  error?: Error;
}

// Bump this when changing schema (e.g. adding an index)
const dbVersion = 1;
const dbName = 'TileCache';
const maxAgeMilliseconds = 1000 * 60 * 60 * 24 * 7; // 1 week

// Function to open the IndexedDB database
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Create object stores if not present
      if (!db.objectStoreNames.contains("urls")) {
        db.createObjectStore('urls', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains("features")) {
        db.createObjectStore('features', { keyPath: 'id', autoIncrement: true });
      }
      // Create feature indexes (should be harmless if they already exist)
      const objectStore = (event.currentTarget as IDBOpenDBRequest).transaction!.objectStore("features");
      objectStore.createIndex('tile', 'tile', { unique: false });
      objectStore.createIndex("osm_ids", "osm_ids", { multiEntry: true });
    };

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBEventTargetWithResult).result;
      resolve(db);
    };

    request.onerror = (event: Event) => {
      reject(`Error opening database: ${(event.target as IDBEventTargetWithResult).error}`);
    };
  });
}

async function clearObjectStore(objectStoreName: string): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([objectStoreName], 'readwrite');
  const objectStore = transaction.objectStore(objectStoreName);

  // Clear all data in the object store
  const clearRequest = objectStore.clear();

  clearRequest.onsuccess = function() {
    console.log('Data cleared successfully.');
  };

  clearRequest.onerror = function(error: Event) {
    console.error('Error clearing data:', error);
  };
}

export const cache = {
  db: null as IDBDatabase | null,  // to be populated on first request

  clear: function(): void {
    clearObjectStore('features');
    clearObjectStore('urls');
  },

  // Function to fetch a URL only if it hasn't been fetched for a certain duration
  fetch: function(url: string, tileKey: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!cache.db) {
        cache.db = await openDatabase();
      }
      const transaction = cache.db.transaction(['urls'], 'readwrite');
      const objectStore = transaction.objectStore('urls');

      // Check if the URL is in the cache
      const getRequest = objectStore.get(url);

      getRequest.onsuccess = async (event: Event) => {
        const result = (event.target as IDBRequest<CachedURL>).result;

        if (result) {
          // Check if the cached entry is still valid based on maxAgeMilliseconds
          const currentTime = new Date().getTime();
          const lastFetchTime = result.lastFetchTime || 0;

          if (currentTime - lastFetchTime < maxAgeMilliseconds) {
            // URL is still fresh, resolve with the cached data
            console.log("HIT: ", url);
            // Assume data has already been handled when it was first cached
            //resolve(result.cachedData);
            return;
          } else {
            // Delete features from stale tile before proceeding to fetch new data.
            console.log("STALE: ", url);
            cache.deleteFeatures(tileKey);
          }
        } else {
          // URL was not previously fetched
          console.log("MISS: ", url);
        }

        // Fetch the URL since it's not in the cache or has expired
        try {
          const response = await fetch(url);
          const data = await response.json();

          if (!cache.db) {
            cache.db = await openDatabase();
          }

          const newTransaction = cache.db.transaction(['urls'], 'readwrite');
          const newObjectStore = newTransaction.objectStore('urls');

          // Update or add the URL in the cache with the current timestamp
          const putRequest = newObjectStore.put({
            url: url,
            lastFetchTime: new Date().getTime(),
            // No need to keep the data (the individual features should be
            // loaded into their own object store on first fetch)
            //cachedData: data,
          });

          putRequest.onsuccess = () => {
            console.log("Fetched: ", url);
            resolve(data);
          };

          putRequest.onerror = (event: Event) => {
            reject(`Error updating cache: ${(event.target as IDBEventTargetWithResult).error}`);
          };
        } catch (error) {
          reject(`Error fetching URL: ${error}`);
        }
      };

      getRequest.onerror = (event: Event) => {
        reject(`Error checking cache: ${(event.target as IDBEventTargetWithResult).error}`);
      };
    });
  },

  // Function to add GeoJSON feature to the cache
  addFeature: function(feature: SoundscapeFeature, tile: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!cache.db) {
        cache.db = await openDatabase();
      }
      const transaction = cache.db.transaction(['features'], 'readwrite');
      const objectStore = transaction.objectStore('features');

      // Add the tile information to the feature before storing it
      feature.tile = tile;

      const request = objectStore.add(feature);

      request.onsuccess = function() {
        resolve();
      };

      request.onerror = function(event: Event) {
        reject((event.target as IDBRequest).error);
      };
    });
  },

  getFeatures: async function(tileKey: string): Promise<SoundscapeFeature[]> {
    return new Promise(async (resolve, reject) => {
      if (!cache.db) {
        cache.db = await openDatabase();
      }
      const transaction = cache.db.transaction(['features'], 'readonly');
      const objectStore = transaction.objectStore('features');
      const tileIndex = objectStore.index('tile');

      const range = IDBKeyRange.only(tileKey);
      const request = tileIndex.openCursor(range);

      const features: SoundscapeFeature[] = [];

      request.onsuccess = function(event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          features.push(cursor.value as SoundscapeFeature);
          cursor.continue();
        } else {
          resolve(features);
        }
      };

      request.onerror = function(event: Event) {
        reject((event.target as IDBRequest).error);
      };
    });
  },

  deleteFeatures: async function(tileKey: string): Promise<void> {
    if (!cache.db) {
      cache.db = await openDatabase();
    }
    const transaction = cache.db.transaction(['features'], 'readwrite');
    const objectStore = transaction.objectStore('features');
    const tileIndex = objectStore.index('tile');

    const range = IDBKeyRange.only(tileKey);
    const request = tileIndex.openCursor(range);
    let deletedCount = 0;

    request.onsuccess = function(event: Event) {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        objectStore.delete(cursor.primaryKey);
        deletedCount++;
        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      console.log(`Purged ${deletedCount} stale features from cache.`);
    };
  },

  getFeatureByOsmId: async function(osm_id: number): Promise<SoundscapeFeature | null> {
    // Returns at most one feature, matching a single OSM ID (i.e. a road, not
    // intersectionss involving that road).
    return new Promise(async (resolve, reject) => {
      if (!cache.db) {
        cache.db = await openDatabase();
      }
      const transaction = cache.db.transaction(['features'], 'readonly');
      const objectStore = transaction.objectStore('features');
      const osmIdsIndex = objectStore.index('osm_ids');

      const range = IDBKeyRange.only(osm_id);
      const request = osmIdsIndex.openCursor(range);

      request.onsuccess = function(event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const feature = cursor.value as SoundscapeFeature;
          if (feature.osm_ids?.length === 1) {
            resolve(feature);
          } else {
            cursor.continue();
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = function(event: Event) {
        reject((event.target as IDBRequest).error);
      };
    });
  }
};

export default cache;