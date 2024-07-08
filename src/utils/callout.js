// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import sense_mobility_wav from "/assets/sounds/sense_mobility.wav";
import sense_poi_wav from "/assets/sounds/sense_poi.wav";

import { centroid } from '@turf/centroid';
import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import cache from "../store/cache.js";
import { enumerateTilesAround } from "../utils/tile.js";
import { watch } from 'vue';
import { myLocation, myTurfPoint, distanceTo } from '../store/location.js';

function createCalloutAnnouncer(audioQueue) {
  // Avoid repeating myself, by maintaining a list of the most recent POIs announced
  const spokenRecently = {
    keys: new Set(), // for quick lookups
    queue: [], // for first in, first out
    max_size: 100,
    // feature can have multiple osm_ids (e.g. intersections)
    key: (osm_ids) => osm_ids.join("|"),

    add: function (osm_ids) {
      if (this.keys.size > this.max_size) {
        const oldestKey = this.queue.shift();
        this.keys.delete(oldestKey);
      }
      this.keys.add(this.key(osm_ids));
      this.queue.push(this.key(osm_ids));
    },

    has: function (osm_ids) {
      return this.keys.has(this.key(osm_ids));
    },
  };

  function playSoundAndSpeech(soundUrl, text, sourceLocation, includeDistance) {
    audioQueue.addToQueue({
      soundUrl: soundUrl,
      location: sourceLocation,
    });
    audioQueue.addToQueue({
      text: text,
      location: sourceLocation,
      includeDistance: includeDistance,
    });
  }

  // Get names of intersecting roads by looking up each road individually
  function getRoadNames(intersectionFeature) {
    return Promise.all(
      intersectionFeature.osm_ids.map((id) => cache.getFeatureByOsmId(id))
    ).then(
      (roads) =>
        new Set(
          roads
            .filter((r) => r && r.properties.name !== undefined)
            .map((r) => r.properties.name)
        )
    );
  }

  // Annotate GeoJSON feature with attributes and methods used for spatial audio callouts
  function announceable(feature) {
    // Method for computing distance depends on geometry, e.g. finding nearest
    // point on a line, or to the centroid of a polygon.
    switch (feature.geometry.type) {
      case "LineString": // e.g. roads
        feature.point = nearestPointOnLine(
          feature,
          myTurfPoint.value,
          { units: "meters" }
        );
        break;
      default: // buildings, landmarks, etc.
        feature.point = centroid(feature.geometry);
    }
    feature.distance = distanceTo.value(feature.point, {
      units: "meters",
    });

    //TODO for now, all callouts are POIs
    feature.soundEffectUrl = sense_poi_wav;

    feature.getAudioLabel = async function () {
      // Determine audio label from feature type
      switch (feature.feature_type) {
        case "highway":
          switch (feature.feature_value) {
            case "gd_intersection":
              // Speak intersections involving 2 or more named roads
              return getRoadNames(feature).then((roadNames) => {
                if (roadNames.size > 1) {
                  return "Intersection: " + [...roadNames].join(", ");
                }
              });
              break;
            case "bus_stop":
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
      return feature.getAudioLabel().then((label) => {
        if (label) {
          spokenRecently.add(feature.osm_ids);
          playSoundAndSpeech(
            feature.soundEffectUrl,
            label,
            feature.point,
            options.includeDistance
          );
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
        enumerateTilesAround(latitude, longitude, radiusMeters).map((t) => {
          t.load();
          return t.getFeatures();
        })
      ).then((tileFeatures) => {
        // Flatten list of features across all nearby tiles
        return (
          tileFeatures
            .reduce((acc, cur) => acc.concat(cur), [])
            // Annotate each feature with its center and distance to our location
            .map(announceable)
            // Limit to features within the specified radius
            .filter((f) => f.distance < radiusMeters)
            // Sort by closest features first
            .sort((a, b) => a.distance - b.distance)
        );
      });
    },

    // Filter nearby features to just named roads.
    nearbyRoads: (latitude, longitude, radiusMeters) => {
      return announcer
        .nearbyFeatures(latitude, longitude, radiusMeters)
        .then((features) =>
          features.filter(
            (f) =>
              f.feature_type == "highway" &&
              f.geometry.type == "LineString" &&
              ["primary", "residential", "tertiary"].includes(
                f.feature_value
              ) &&
              f.properties.name
          )
        );
    },

    // Announce all speakable nearby features
    // Returns true if anything was queued for speaking
    calloutAllFeatures: (latitude, longitude) => {
      // Use 2x wider radius than standard location updates
      const radiusMeters = 2 * myLocation.radiusMeters;
      return announcer
        .nearbyFeatures(latitude, longitude, radiusMeters)
        .then((fs) => {
          return Promise.all(
            fs.map((f) => f.announce({ includeDistance: true }))
          ).then((willAnnounce) => willAnnounce.some((x) => x));
        });
    },

    // Same as above, but says a message if no features were announced
    calloutAllFeaturesOrSayNoneFound: (latitude, longitude) => {
      announcer
        .calloutAllFeatures(latitude, longitude)
        .then((anythingToSay) => {
          if (!anythingToSay) {
            audioQueue.addToQueue({
              text: "Nothing to call out right now",
            });
          }
        });
    },

    // Announce only features not already called out (useful for continuous tracking)
    calloutNewFeatures: (latitude, longitude) => {
      const radiusMeters = myLocation.radiusMeters;
      announcer.nearbyFeatures(latitude, longitude, radiusMeters).then((fs) => {
        // Omit features already announced
        fs.filter((f) => !spokenRecently.has(f.osm_ids)).forEach((f) =>
          f.announce({ includeDistance: false })
        );
      });
    },

    calloutNearestRoad: (latitude, longitude) => {
      const radiusMeters = myLocation.radiusMeters;
      announcer.nearbyRoads(latitude, longitude, radiusMeters).then((roads) => {
        if (roads.length > 0) {
          playSoundAndSpeech(
            sense_mobility_wav,
            `Nearest road: ${roads[0].properties.name}`,
            roads[0].point,
            true
          );
        }
      });
    },

    unwatch: null,
    startWatching: () => {
      announcer.unwatch = watch(myLocation, (newValue, oldValue) => {
        return announcer.calloutNewFeatures(
          myLocation.latitude,
          myLocation.longitude
        );
      })
    },
    stopWatching: () => {
      if (announcer.unwatch) {
        announcer.unwatch();
      };
    },
  };

  return announcer;
}

export default createCalloutAnnouncer;