// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { enumerateTilesAround } from '../data/tile.js'

export function createCalloutAnnouncer(audioQueue, radiusMeters, includeDistance) {
  // Avoid repeating myself, by maintaining a list of the most recent POIs announced
  const spokenRecently = {
    keys: new Set(),  // for quick lookups
    queue: [],        // for first in, first out
    max_size: 100,
    // feature can have multiple osm_ids (e.g. intersections)
    key: osm_ids => osm_ids.join("|"),

    add: function(osm_ids) {
      if (this.keys.size > this.max_size) {
        const oldestKey = this.queue.shift();
        this.keys.delete(oldestKey);
      }
      this.keys.add(this.key(osm_ids));
      this.queue.push(this.key(osm_ids));
    },

    has: function(osm_ids) {
      return this.keys.has(this.key(osm_ids));
    }
  }

  function playSoundAndSpeech(sound, text, sourceLocation, includeDistance) {
    console.log(text);
    audioQueue.addToQueue({
      soundUrl: `app/sounds/${sound}.wav`,
      location: sourceLocation,
    });
    audioQueue.addToQueue({
      text: text,
      location: sourceLocation,
      includeDistance: includeDistance
    });
  }

  function announceCallout(feature, includeDistance) {
    if (spokenRecently.has(feature.osm_ids)) {
      return;
    }

    // Calculate the distance between the GeoJSON feature and the point
    const poiCentroid = turf.centroid(feature.geometry);
    const distance = audioQueue.locationProvider.distance(poiCentroid, { units: 'meters' });
    if (distance > radiusMeters) {
      return;
    }

    switch (feature.feature_type) {
      case 'highway':
        switch (feature.feature_value) {
          case 'gd_intersection':
            //TODO
            break;
          case 'bus_stop':
            //TODO
            break;
          //TODO case ...
        }
        break;
      default:
        // Speak anything else with a name
        if (feature.properties.name) {
          spokenRecently.add(feature.osm_ids);
          playSoundAndSpeech('sense_poi', feature.properties.name, poiCentroid, includeDistance);
        }
    }
  }

  const announcer = {
    locationChanged(latitude, longitude) {
      const tiles = enumerateTilesAround(latitude, longitude, radiusMeters);
      for (const tile of tiles) {
        tile.load();
        tile.getFeatures()
        .then(features => {
          features.forEach(feature => {
            announceCallout(feature, includeDistance);
          })
        });
      }
    },
  };

  return announcer;
}
