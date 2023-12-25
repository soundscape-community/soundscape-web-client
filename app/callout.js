// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { zoomLevel, loadTile, getFeaturesInTile } from './feature_cache.js'
import { createBoundingBox, enumerateTilesInBoundingBox, friendlyDistance } from './geospatial.js'

export function createCalloutAnnouncer(audioQueue, proximityThreshold) {
  const seenTiles = new Set();
  const spokenRecently = new Set();

  function announceCallout(feature, myLocation) {
    // Call out things that have names that aren't roads
    if (feature.properties.name && feature.feature_type != 'highway') {
      if (spokenRecently.has(feature.properties.name)) {
        return;
      }
      // Calculate the distance between the GeoJSON feature and the point
      const poiCentroid = turf.centroid(feature.geometry);
      const distance = friendlyDistance(poiCentroid, myLocation);
      if (distance.units == 'miles' || distance.value > proximityThreshold) {
        return;
      }

      //TODO spatial
      console.log(feature.properties.name);
      spokenRecently.add(feature.properties.name);
      audioQueue.addToQueue({
        soundUrl: 'app/sounds/sense_poi.wav',
        x: 0,
        y: 0
      });
      audioQueue.addToQueue({
        //text: feature.properties.name + ' is ' + distance.value + ' ' + distance.units + ' away',
        text: feature.properties.name,
        x: 0,
        y: 0
      });
    }
  }

  const announcer = {
    locationChanged(latitude, longitude) {
      // Find all tiles within 0.1km radius of location
      const boundingBox = createBoundingBox(latitude, longitude, 0.1);
      const tiles = enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel);
      const myLocation = turf.point([longitude, latitude]);

      for (const tile of tiles) {
        const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
        // Prevent a flood of network requests by only fetching the tile the first time it is entered
        if (!seenTiles.has(tileKey)) {
          seenTiles.add(tileKey);
          loadTile(tile.x, tile.y, tile.z);
        }

        getFeaturesInTile(tileKey)
        .then(features => {
          features.forEach(feature => {
            announceCallout(feature, myLocation);
          })
        });
      }
    },
  };

  return announcer;
}
