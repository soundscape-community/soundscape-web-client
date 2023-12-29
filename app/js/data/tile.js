// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { addToFeatureCache, fetchUrlIfNotCached, openFeatureCache } from './cache.js'
import config from '../config.js'
import { createBoundingBox, enumerateTilesInBoundingBox } from '../spatial/geo.js'

const maxAge = 604800000; // 1 week, in ms
export const zoomLevel = 16;

// Track tiles that don't need to be re-requested at the moment
const tilesInProgressOrDone = new Set();

function createTile(x, y, z) {
  var tile = {
    x: x,
    y: y,
    z: z,
    key: `${z}/${x}/${y}`,

    load: async function() {
      if (tilesInProgressOrDone.has(tile.key)) {
        // no need to request again
        return;
      }
      tilesInProgressOrDone.add(tile.key);

      const urlToFetch = `${config.tileServer}/${tile.key}.json`;
      fetchUrlIfNotCached(urlToFetch, maxAge)
        .then((data) => {
          for (const feature of data.features) {
            addToFeatureCache(feature, tile.key);
          };
          console.log(`Loaded ${data.features.length} new features.`)
        })
        .catch((error) => {
          console.error(error);
          // should be retried when next needed
          tilesInProgressOrDone.delete(tile.key);
        });
    },

    getFeatures: async function() {
      const db = await openFeatureCache();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['features'], 'readonly');
        const objectStore = transaction.objectStore('features');
        const tileIndex = objectStore.index('tile');
    
        const range = IDBKeyRange.only(tile.key);
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
    },
  }

  return tile;
}

export function enumerateTilesAround(latitude, longitude, radiusMeters) {
  // Find all tiles within radiusKM radius of location
  const boundingBox = createBoundingBox(latitude, longitude, radiusMeters);
  return enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel).map(tile => {
    return createTile(tile.x, tile.y, tile.z);
  });
}