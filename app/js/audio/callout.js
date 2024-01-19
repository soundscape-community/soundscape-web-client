// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import cache from '../data/cache.js'
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
    switch (feature.feature_type) {
      case 'highway':
        switch (feature.feature_value) {
          case 'gd_intersection':
            // Look up names of each intersecting road
            Promise.all(
              feature.osm_ids.map(id => cache.getFeatureByOsmId(id))
            ).then(roads => {
              // Announce intersection if it involves 2 or more named roads
              const roadNames = new Set(
                roads
                .filter(r => r && r.properties.name !== undefined)
                .map(r => r.properties.name)
              );
              if (roadNames.size > 1) {
                // Memorialize callout by name in addition to IDs (the same
                // intersection can be represented by multiple road segments
                // with different OSM IDs)
                if (spokenRecently.has([...roadNames])) {
                  return;
                }
                spokenRecently.add([...roadNames]);
                spokenRecently.add(feature.osm_ids);
                playSoundAndSpeech('sense_poi', 'intersection: ' + [...roadNames].join(', '), feature.centroid, includeDistance);
              }
            });
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
          playSoundAndSpeech('sense_poi', feature.properties.name, feature.centroid, includeDistance);
        }
    }
  }

  const announcer = {
    calloutFeatures: function(latitude, longitude) {
      return Promise.all(
        // Get all features from nearby tiles
        enumerateTilesAround(latitude, longitude, radiusMeters)
        .map(t => {
          t.load();
          return t.getFeatures();
        })
      )
      .then(tileFeatures => {
        // Flatten list of features across all nearby tiles
        tileFeatures
        .reduce((acc, cur) => acc.concat(cur), [])
        // Omit features already announced
        .filter(feature => !spokenRecently.has(feature.osm_ids))
        // Annotate each feature with its centroid and distance to our location
        .map(feature => {
          feature.centroid = turf.centroid(feature.geometry);
          feature.distance = audioQueue.locationProvider.distance(
            feature.centroid, { units: 'meters' }
          );
          return feature;
        })
        // Limit to features within the specified radius
        .filter(feature => feature.distance < radiusMeters)
        // Call out closest features first
        .sort((a, b) => a.distance - b.distance)
        .forEach(feature => {
          announceCallout(feature, includeDistance);
        })
      });
    },

    locationChanged: function(event) {
      return announcer.calloutFeatures(event.detail.latitude, event.detail.longitude);
    },
  };

  return announcer;
}
