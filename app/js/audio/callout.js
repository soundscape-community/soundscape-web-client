// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import cache from '../data/cache.js'
import { enumerateTilesAround } from '../data/tile.js'

function createCalloutAnnouncer(audioQueue) {
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

  // Get names of intersecting roads by looking up each road individually
  function getRoadNames(intersectionFeature) {
    return Promise.all(
      intersectionFeature.osm_ids.map(id => cache.getFeatureByOsmId(id))
    ).then(roads => new Set(
      roads
      .filter(r => r && r.properties.name !== undefined)
      .map(r => r.properties.name)
    ));
  }

  // Annotate GeoJSON feature with attributes and methods used for spatial audio callouts
  function announceable(feature) {
    feature.centroid = turf.centroid(feature.geometry);
    feature.distance = audioQueue.locationProvider.distance(
      feature.centroid, { units: 'meters' }
    );

    //TODO for now, all callouts are POIs
    feature.soundEffect = 'sense_poi';

    feature.getAudioLabel = async function() {
      // Determine audio label from feature type
      switch (feature.feature_type) {
        case 'highway':
          switch (feature.feature_value) {
            case 'gd_intersection':
              // Speak intersections involving 2 or more named roads
              return getRoadNames(feature)
              .then(roadNames => {
                if (roadNames.size > 1) {
                  return 'Intersection: ' + [...roadNames].join(', ');
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
          return feature.properties.name;
      }
    };

    // Speaks a feature if it has a non-empty audio label (returns true if so)
    feature.announce = (options) => {
      return feature.getAudioLabel().then(label => {
        if (label) {
          spokenRecently.add(feature.osm_ids);
          playSoundAndSpeech(feature.soundEffect, label, feature.centroid, options.includeDistance);
          return true;
        } else {
          return false;
        }
      });
    };

    return feature;
  }

  const announcer = {
    nearbyFeatures: (latitude, longitude, radiusMeters) => {
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
        return tileFeatures
        .reduce((acc, cur) => acc.concat(cur), [])
        // Annotate each feature with its centroid and distance to our location
        .map(announceable)
        // Limit to features within the specified radius
        .filter(f => f.distance < radiusMeters)
        // Sort by closest features first
        .sort((a, b) => a.distance - b.distance)
      });
    },

    // Announce all speakable nearby features
    // Returns true if anything was queued for speaking
    calloutAllFeatures: (latitude, longitude) => {
      // Use 2x wider radius than standard location updates
      const radiusMeters = 2 * audioQueue.locationProvider.radiusMeters;
      return announcer.nearbyFeatures(latitude, longitude, radiusMeters)
      .then(fs => {
        return Promise.all(fs.map(f => f.announce({ includeDistance: true })))
        .then(willAnnounce => willAnnounce.some(x => x));
      });
    },

    // Announce only features not already called out (useful for continuous tracking)
    calloutNewFeatures: (latitude, longitude) => {
      const radiusMeters = audioQueue.locationProvider.radiusMeters;
      announcer.nearbyFeatures(latitude, longitude, radiusMeters)
      .then(fs => {
        // Omit features already announced
        fs.filter(f => !spokenRecently.has(f.osm_ids))
        .forEach(f => f.announce({ includeDistance: false }))
      });
    },

    locationChanged: (event) => {
      return announcer.calloutNewFeatures(event.detail.latitude, event.detail.longitude);
    },
  };

  return announcer;
}

export default createCalloutAnnouncer;