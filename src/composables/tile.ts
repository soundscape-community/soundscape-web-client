// Copyright (c) Daniel W. Steinbrook.

// So that our unit tests can run outside of a browser
import fetch from 'isomorphic-fetch';

import { point, buffer, bbox } from '@turf/turf';
import { BBox } from "geojson";
import { cache, SoundscapeFeature } from '../state/cache'
import config from '../config'

export const zoomLevel = 16;
const maxAgeMilliseconds = 1000 * 60 * 60 * 24 * 7; // 1 week

// Track tiles that don't need to be re-requested at the moment
const tilesInProgressOrDone = new Set<string>();

interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

export class Tile {
  coordinates: TileCoordinates;
  key: string;
  url: string;

  constructor(coords: TileCoordinates) {
    this.coordinates = coords;
    this.key = `${coords.z}/${coords.x}/${coords.y}`;
    this.url = `${config.tileServer}/${this.key}.json`;
  }

  async shouldRefresh(): Promise<boolean> {
    // Check if the cached entry is still valid based on maxAgeMilliseconds
    const currentTime = new Date().getTime();
    const lastFetchTime = await cache.lastFetchTime(this.url);

    return (
      lastFetchTime === null ||
      currentTime - lastFetchTime > maxAgeMilliseconds
    );
  }

  async load(): Promise<void> {
    if (tilesInProgressOrDone.has(this.key)) {
      // no need to request again
      return;
    }
    tilesInProgressOrDone.add(this.key);

    if (!await this.shouldRefresh()) {
      // Data is still fresh; no need to refresh
      return;
    }

    // Delete any stale features
    cache.deleteFeatures(this.key);

    try {
      // Fetch the URL since it's not in the cache or has expired
      const response = await fetch(this.url);
      console.log("Fetched: ", this.url);
      const data = await response.json();
      if (data?.features) {
        // Save each new feature to the cache
        await Promise.all(
          data.features.map(
            (feature: SoundscapeFeature) => cache.addFeature(feature, this.key)
          )
        );
        console.log(`Loaded ${data.features.length} new features.`);
        cache.updateLastFetch(this.url);
      }
    } catch (error) {
      console.error(error);
      // should be retried when next needed
      tilesInProgressOrDone.delete(this.key);
    }
  }

  async getFeatures(): Promise<SoundscapeFeature[]> {
    return cache.getFeatures(this.key);
  }
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

export function enumerateTilesAround(
  latitude: number,
  longitude: number,
  radiusMeters: number
): Tile[] {
  // Find all tiles within radiusMeters radius of location
  const boundingBox = createBoundingBox(latitude, longitude, radiusMeters);
  return enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel)
    .map(coords => new Tile(coords));
}