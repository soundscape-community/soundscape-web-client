// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { point, buffer, bbox } from '@turf/turf';
import { BBox, Feature } from "geojson";
import cache from '../state/cache'
import config from '../config'

export const zoomLevel = 16;

// Track tiles that don't need to be re-requested at the moment
const tilesInProgressOrDone = new Set<string>();

interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

interface Tile extends TileCoordinates {
  key: string;
  load: () => Promise<void>;
  getFeatures: () => Promise<Feature[]>;
}

// Function to create a half-kilometer bounding box around a point
export function createBoundingBox(
  latitude: number,
  longitude: number,
  radiusMeters: number
): BBox {
  // Create a Turf.js point
  const somePoint = point([longitude, latitude]);
  // Buffer the point with the specified radius
  const buffered = buffer(somePoint, radiusMeters, { units: 'meters' });

  // Explicitly check that buffered is not undefined
  if (!buffered) {
    throw new Error('Failed to create buffer around point');
  }

  // Extract the bounding box coordinates
  const someBbox = bbox(buffered);
  
  return someBbox;
}

// Function to convert latitude and longitude to Mercator tile coordinates
export function latLonToTileCoords(
  latitude: number,
  longitude: number,
  zoom: number
): TileCoordinates {
  const tileSize = 256; // Standard size for Mercator tiles
  const scale = 1 << zoom;
  const worldSize = tileSize * scale;

  const x = Math.floor((longitude + 180) / 360 * scale);
  const y = Math.floor(
    (1 - Math.log(
      Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)
    ) / Math.PI) / 2 * scale
  );

  return { x, y, z: zoom };
}

// Function to enumerate all Mercator tiles within a bounding box
export function enumerateTilesInBoundingBox(
  bbox: BBox,
  minZoom: number,
  maxZoom: number
): TileCoordinates[] {
  const tiles: TileCoordinates[] = [];

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

function createTile(x: number, y: number, z: number): Tile {
  const tile: Tile = {
    x,
    y,
    z,
    key: `${z}/${x}/${y}`,
    load: async function(): Promise<void> {
      if (tilesInProgressOrDone.has(tile.key)) {
        // no need to request again
        return;
      }
      tilesInProgressOrDone.add(tile.key);

      const urlToFetch = `${config.tileServer}/${tile.key}.json`;
      try {
        const data = await cache.fetch(urlToFetch, tile.key);
        if (data?.features) {
          for (const feature of data.features) {
            await cache.addFeature(feature, tile.key);
          }
          console.log(`Loaded ${data.features.length} new features.`);
        }
      } catch (error) {
        console.error(error);
        // should be retried when next needed
        tilesInProgressOrDone.delete(tile.key);
      }
    },
    getFeatures: async function(): Promise<Feature[]> {
      return cache.getFeatures(tile.key);
    },
  };

  return tile;
}

export function enumerateTilesAround(
  latitude: number,
  longitude: number,
  radiusMeters: number
): Tile[] {
  // Find all tiles within radiusMeters radius of location
  const boundingBox = createBoundingBox(latitude, longitude, radiusMeters);
  return enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel)
    .map(tile => createTile(tile.x, tile.y, tile.z));
}