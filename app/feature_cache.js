// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { cleanDatabase } from "./url_cache.js";

// Function to open the IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GeoJSONCache', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const objectStore = db.createObjectStore('features', { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex('geometry', 'geometry', { unique: false });
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(`Error opening database: ${event.target.error}`);
    };
  });
}

export function clearFeatureCache() {
  return cleanDatabase('GeoJSONCache', 'features');
}

// Function to add GeoJSON feature to the cache
export async function addToCache(geoJSONFeature) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['features'], 'readwrite');
    const objectStore = transaction.objectStore('features');
    const request = objectStore.add(geoJSONFeature);

    request.onsuccess = () => {
      resolve('Feature added to cache');
    };

    request.onerror = (event) => {
      reject(`Error adding feature to cache: ${event.target.error}`);
    };
  });
}

// Function to get GeoJSON features near a given point
/*async function getFeaturesNearPoint(targetPoint, radius) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['features'], 'readonly');
    const objectStore = transaction.objectStore('features');
    const index = objectStore.index('geometry');

    // Define a bounding box around the target point based on the radius
    const boundingBox = {
      minX: targetPoint.coordinates[0] - radius,
      minY: targetPoint.coordinates[1] - radius,
      maxX: targetPoint.coordinates[0] + radius,
      maxY: targetPoint.coordinates[1] + radius,
    };

    const range = IDBKeyRange.bound([boundingBox.minX, boundingBox.minY], [boundingBox.maxX, boundingBox.maxY]);

    const request = index.openCursor(range);

    const result = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        // Check if the feature is within the radius of the target point
        const distance = calculateDistance(targetPoint.coordinates, cursor.value.geometry.coordinates);
        if (distance <= radius) {
          result.push(cursor.value);
        }
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

// Helper function to calculate the distance between two points
function calculateDistance(point1, point2) {
  const [x1, y1] = point1;
  const [x2, y2] = point2;
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}*/

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