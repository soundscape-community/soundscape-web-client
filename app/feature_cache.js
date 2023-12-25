// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import config from './config.js'
import { createBoundingBox, enumerateTilesInBoundingBox } from './geospatial.js'
import { cleanDatabase, fetchUrlIfNotCached } from './url_cache.js'

export const zoomLevel = 16;
const maxAge = 604800000; // 1 week, in ms

// Function to open the IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GeoJSONCache', 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      const objectStore = db.createObjectStore('features', { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex('tile', 'tile', { unique: false });
    };

    request.onsuccess = function (event) {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

export function clearFeatureCache() {
  return cleanDatabase('GeoJSONCache', 'features');
}

// Function to add GeoJSON feature to the cache
async function addToCache(feature, tile) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['features'], 'readwrite');
    const objectStore = transaction.objectStore('features');

    // Add the tile information to the feature before storing it
    feature.tile = tile;

    const request = objectStore.add(feature);

    request.onsuccess = function () {
      resolve();
    };

    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

export function loadTile(x, y, z) {
  const urlToFetch = `${config.tileServer}/${z}/${x}/${y}.json`;
  fetchUrlIfNotCached(urlToFetch, maxAge)
    .then((data) => {
      for (const feature of data.features) {
        addToCache(feature, `${z}/${x}/${y}`);
      };
      console.log(`Loaded ${data.features.length} new features.`)
    })
    .catch((error) => {
      console.error(error);
    });
}

export function loadNearbyTiles(latitude, longitude) {
  // Enumerate all tiles within a half-kilometer radius
  const boundingBox = createBoundingBox(latitude, longitude, 0.5);
  const tiles = enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel);

  // Populate any missing map tiles (without blocking)
  for (const tile of tiles) {
    loadTile(tile.x, tile.y, tile.z);
  }
}

// Function to fetch all features within a given tile
async function getFeaturesInTile(tile) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['features'], 'readonly');
    const objectStore = transaction.objectStore('features');
    const tileIndex = objectStore.index('tile');

    const range = IDBKeyRange.only(tile);
    const request = tileIndex.openCursor(range);

    const features = [];

    request.onsuccess = function (event) {
      const cursor = event.target.result;

      if (cursor) {
        features.push(cursor.value);
        cursor.continue();
      } else {
        resolve(features);
      }
    };

    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

export async function getAllFeatures(targetPoint, radius) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['features'], 'readonly');
    const objectStore = transaction.objectStore('features');

    const request = objectStore.openCursor();

    const result = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        resolve(result);
      }
    };

    request.onerror = (event) => {
      reject(`Error getting features from cache: ${event.target.error}`);
    };
  });
}