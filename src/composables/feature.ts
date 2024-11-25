// Copyright (c) Daniel W. Steinbrook.

import { Feature, LineString, Point } from 'geojson';
import { centroid, nearestPointOnLine } from '@turf/turf';
import { cache, SoundscapeFeature } from '../state/cache';
import { enumerateTilesAround } from "../composables/tile";
import { myTurfPoint, distanceTo } from '../state/location';

const sense_poi_wav = new URL("/assets/sounds/sense_poi.wav", import.meta.url).href;

// Annotated GeoJSON feature with attributes and methods used for spatial audio callouts
export type SpeakableFeature = SoundscapeFeature & {
  speechOrigin: Feature<Point>;
  distance: number;
  soundEffectUrl: string;
  getAudioLabel: () => Promise<string | undefined>;
}

function speakable(feature: SoundscapeFeature): SpeakableFeature {
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

  let extendedFeature: SpeakableFeature = {
    ...feature,
    speechOrigin: point,
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
          if (feature.properties) {
            return feature.properties.name;
          }
      }
    },
  }

  return extendedFeature;
}

export function nearbyFeatures(latitude: number, longitude: number, radiusMeters: number): Promise<SpeakableFeature[]> {
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
        .map(feature => speakable(feature))
        // Limit to features within the specified radius
        .filter((f) => f.distance < radiusMeters)
        // Sort by closest features first
        .sort((a, b) => a.distance - b.distance)
    );
  });
};

// Filter nearby features to just named roads.
export function nearbyRoads(latitude: number, longitude: number, radiusMeters: number): Promise<SpeakableFeature[]> {
  return nearbyFeatures(latitude, longitude, radiusMeters)
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
};

// Get names of intersecting roads by looking up each road individually
function getRoadNames(intersectionFeature: SoundscapeFeature): Promise<Set<string>> {
  return Promise.all(
    intersectionFeature.osm_ids.map(id => cache.getFeatureByOsmId(id))
  ).then(roads => new Set(
      roads
        .filter((r) => r && r.properties && r.properties.name !== undefined)
        .map((r) => r!.properties!.name)
  ));
}