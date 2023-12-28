// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { enumerateTilesAround } from './tile.js'

export function createCalloutAnnouncer(audioQueue, proximityThresholdMeters) {
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

  function playSoundAndSpeech(sound, text, sourceLocation) {
    console.log(text);
    audioQueue.addToQueue({
      soundUrl: `app/sounds/${sound}.wav`,
      location: sourceLocation,
    });
    audioQueue.addToQueue({
      //text: text + ' is ' + distance.value + ' ' + distance.units + ' away',
      text: text,
      location: sourceLocation,
    });
  }

  function announceCallout(feature, myLocation) {
    if (spokenRecently.has(feature.osm_ids)) {
      return;
    }

    // Calculate the distance between the GeoJSON feature and the point
    const poiCentroid = turf.centroid(feature.geometry);
    const distance =turf.distance(poiCentroid, myLocation, { units: 'meters' });
    if (distance > proximityThresholdMeters) {
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
          playSoundAndSpeech('sense_poi', feature.properties.name, poiCentroid);
        }
    }
  }

  const announcer = {
    locationChanged(latitude, longitude, heading) {
      const tiles = enumerateTilesAround(latitude, longitude, proximityThresholdMeters);
      const myLocation = turf.point([longitude, latitude]);

      // Send location info to audio queue, so it can calculate spatial positions
      audioQueue.updateLocation(myLocation, heading);

      for (const tile of tiles) {
        tile.load();
        tile.getFeatures()
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
