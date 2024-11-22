// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { Feature, LineString, Point } from 'geojson';
import { centroid, nearestPointOnLine } from '@turf/turf';
import { cache, SoundscapeFeature } from "../state/cache";
import { audioQueue } from '../state/audio';
import { enumerateTilesAround } from "../composables/tile";
import { watch } from 'vue';
import { myLocation, myTurfPoint, distanceTo } from '../state/location';

const sense_mobility_wav = new URL("/assets/sounds/sense_mobility.wav", import.meta.url).href;
const sense_poi_wav = new URL("/assets/sounds/sense_poi.wav", import.meta.url).href;

type AnnounceableFeature = SoundscapeFeature & {
  point: Feature<Point>;
  distance: number;
  soundEffectUrl: string;
  getAudioLabel: () => Promise<string | undefined>;
  announce: (options: { includeDistance: boolean }) => Promise<boolean>;
}

interface Announcer {
  nearbyFeatures: (latitude: number, longitude: number, radiusMeters: number) => Promise<AnnounceableFeature[]>;
  nearbyRoads: (latitude: number, longitude: number, radiusMeters: number) => Promise<AnnounceableFeature[]>;
  calloutAllFeatures: (latitude: number, longitude: number) => Promise<boolean>;
  calloutAllFeaturesOrSayNoneFound: (latitude: number, longitude: number) => void;
  calloutNewFeatures: (latitude:number, longitude:number) => void;
  calloutNearestRoad: (latitude: number, longitude: number) => void;
  startWatching: () => void;
  stopWatching: () => void;
  unwatch?: () => void;
}

// Avoid repeating myself, by maintaining a list of the most recent POIs announced
class RecentQueue {
  keys: Set<string>;  // for quick lookups
  queue: string[];  // for first in, first out
  maxSize: number;

  constructor(max_size: number) {
    this.keys = new Set();
    this.queue = [];
    this.maxSize = max_size;
  }

  // feature can have multiple osm_ids (e.g. intersections)
  key(osm_ids: number[]) {
    return osm_ids.join("|");
  }

  add(osm_ids: number[]) {
    if (this.keys.size > this.maxSize) {
      const oldestKey = this.queue.shift()!;
      this.keys.delete(oldestKey);
    }
    this.keys.add(this.key(osm_ids));
    this.queue.push(this.key(osm_ids));
  }

  has(osm_ids: number[]): boolean {
    return this.keys.has(this.key(osm_ids));
  }
}

function useAnnouncer() {
  const spokenRecently = new RecentQueue(100);

  function playSoundAndSpeech(soundUrl: string, text: string, sourceLocation: Feature<Point>, includeDistance: boolean) {
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
  function getRoadNames(intersectionFeature: SoundscapeFeature): Promise<Set<string>> {
    return Promise.all(
      intersectionFeature.osm_ids.map((id: number) => cache.getFeatureByOsmId(String(id)))
    ).then(
      (roads) =>
        new Set(
          roads
            .filter((r) => r && r.properties && r.properties.name !== undefined)
            .map((r) => r!.properties!.name)
        )
    );
  }

  // Annotate GeoJSON feature with attributes and methods used for spatial audio callouts
  function announceable(feature: SoundscapeFeature): AnnounceableFeature {
    // Method for computing distance depends on geometry, e.g. finding nearest
    // point on a line, or to the centroid of a polygon.
    let point = centroid(feature.geometry);
    if (feature.geometry.type === "LineString") { // e.g. roads
      point = nearestPointOnLine(
        feature as Feature<LineString>,
        myTurfPoint.value,
        { units: "meters" }
      );
    }

    let extendedFeature: AnnounceableFeature = {
      ...feature,
      point: point,
      distance: distanceTo.value(point, { units: "meters" }),

      //TODO for now, all callouts are POIs
      soundEffectUrl: sense_poi_wav,

      getAudioLabel: async function (): Promise<string | undefined> {
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
                }) || "";
                break;
              case "bus_stop":
                //TODO
                break;
              //TODO case ...
            }
            break;
          default:
            // Speak anything else with a name
            if (feature.properties) {
              return feature.properties.name;
            }
        }
      },

      // Speaks a feature if it has a non-empty audio label (returns true if so)
      announce: (options: { includeDistance: boolean }): Promise<boolean> => {
        return extendedFeature.getAudioLabel().then((label) => {
          if (label) {
            spokenRecently.add(feature.osm_ids);
            playSoundAndSpeech(
              extendedFeature.soundEffectUrl,
              label,
              extendedFeature.point,
              options.includeDistance
            );
            return true;
          } else {
            return false;
          }
        });
      },
    }

    return extendedFeature;
  }

  const announcer: Announcer = {
    nearbyFeatures: (latitude: number, longitude: number, radiusMeters: number): Promise<AnnounceableFeature[]> => {
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
            .map(feature => announceable(feature))
            // Limit to features within the specified radius
            .filter((f) => f.distance < radiusMeters)
            // Sort by closest features first
            .sort((a, b) => a.distance - b.distance)
        );
      });
    },

    // Filter nearby features to just named roads.
    nearbyRoads: (latitude: number, longitude: number, radiusMeters: number): Promise<AnnounceableFeature[]> => {
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
              f.properties &&
              f.properties.name
          )
        );
    },

    // Announce all speakable nearby features
    // Returns true if anything was queued for speaking
    calloutAllFeatures: (latitude: number, longitude: number): Promise<boolean> => {
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
    calloutAllFeaturesOrSayNoneFound: (latitude: number, longitude: number): void => {
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
    calloutNewFeatures: (latitude: number, longitude: number) => {
      const radiusMeters = myLocation.radiusMeters;
      announcer.nearbyFeatures(latitude, longitude, radiusMeters).then((fs) => {
        // Omit features already announced
        fs.filter((f) => !spokenRecently.has(f.osm_ids)).forEach((f) =>
          f.announce({ includeDistance: false })
        );
      });
    },

    calloutNearestRoad: (latitude: number, longitude: number) => {
      const radiusMeters = myLocation.radiusMeters;
      announcer.nearbyRoads(latitude, longitude, radiusMeters).then((roads) => {
        if (roads.length > 0 && roads[0].properties) {
          playSoundAndSpeech(
            sense_mobility_wav,
            `Nearest road: ${roads[0].properties.name}`,
            roads[0].point,
            true
          );
        }
      });
    },

    startWatching: () => {
      announcer.unwatch = watch(myLocation, (newValue, oldValue) => {
        if (newValue.latitude && newValue.longitude) {
          return announcer.calloutNewFeatures(
            newValue.latitude,
            newValue.longitude
          );
        }
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

export default useAnnouncer;