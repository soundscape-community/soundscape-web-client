// Copyright (c) Daniel W. Steinbrook.

import { Feature, Point } from 'geojson';
import { audioQueue } from '../state/audio';
import { watch } from 'vue';
import { myLocation } from '../state/location';
import { SpeakableFeature, nearbyFeatures, nearbyRoads } from "./feature";

const sense_mobility_wav = new URL("/assets/sounds/sense_mobility.wav", import.meta.url).href;

interface Announcer {
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

  // Speaks a feature if it has a non-empty audio label (returns true if so)
  function announce(feature: SpeakableFeature, options: { includeDistance: boolean }): Promise<boolean> {
    return feature.getAudioLabel().then((label) => {
      if (label) {
        spokenRecently.add(feature.osm_ids);
        playSoundAndSpeech(
          feature.soundEffectUrl,
          label,
          feature.speechOrigin,
          options.includeDistance
        );
        return true;
      } else {
        return false;
      }
    });
  }

  const announcer: Announcer = {
    // Announce all speakable nearby features
    // Returns true if anything was queued for speaking
    calloutAllFeatures: (latitude: number, longitude: number): Promise<boolean> => {
      // Use 2x wider radius than standard location updates
      const radiusMeters = 2 * myLocation.radiusMeters;
      return nearbyFeatures(latitude, longitude, radiusMeters)
        .then((fs) => {
          return Promise.all(
            fs.map((f) => announce(f, { includeDistance: true }))
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
      nearbyFeatures(latitude, longitude, radiusMeters).then((fs) => {
        // Omit features already announced
        fs.filter((f) => !spokenRecently.has(f.osm_ids)).forEach((f) =>
          announce(f, { includeDistance: false })
        );
      });
    },

    calloutNearestRoad: (latitude: number, longitude: number) => {
      const radiusMeters = myLocation.radiusMeters;
      nearbyRoads(latitude, longitude, radiusMeters).then((roads) => {
        if (roads.length > 0 && roads[0].properties) {
          playSoundAndSpeech(
            sense_mobility_wav,
            `Nearest road: ${roads[0].properties.name}`,
            roads[0].speechOrigin,
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