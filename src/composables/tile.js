// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { bbox } from '@turf/bbox';
import { buffer} from '@turf/buffer';
import { point } from '@turf/helpers';
import cache from '../state/cache.js'
import config from '../config.js'

export const zoomLevel = 16;

// Track tiles that don't need to be re-requested at the moment
const tilesInProgressOrDone = new Set();

// Function to create a half-kilometer bounding box around a point
export function createBoundingBox(latitude, longitude, radiusMeters) {
  // Create a Turf.js point
  const somePint = point([longitude, latitude]);

  // Buffer the point with the specified readius
  const buffered = buffer(somePint, radiusMeters, { units: 'meters' });

  // Extract the bounding box coordinates
  const someBbox = bbox(buffered);
  
  return someBbox;
}

// Function to convert latitude and longitude to Mercator tile coordinates
export function latLonToTileCoords(latitude, longitude, zoom) {
  const tileSize = 256; // Standard size for Mercator tiles
  const scale = 1 << zoom;
  const worldSize = tileSize * scale;

  const x = Math.floor((longitude + 180) / 360 * scale);
  const y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * scale);

  return { x, y, z: zoom };
}

// Function to enumerate all Mercator tiles within a bounding box
export function enumerateTilesInBoundingBox(bbox, minZoom, maxZoom) {
  const tiles = [];

  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const topLeft = latLonToTileCoords(bbox[3], bbox[0], zoom);
    const bottomRight = latLonToTileCoords(bbox[1], bbox[2], zoom);

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
  }

  return tiles;
}

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
      cache.fetch(urlToFetch, tile.key)
        .then((data) => {
          for (const feature of data.features) {
            cache.addFeature(feature, tile.key);
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
      return cache.getFeatures(tile);
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