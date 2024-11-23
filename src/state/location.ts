// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { Feature, Point } from 'geojson';
import { distance, point } from '@turf/turf';
import { computed, reactive } from 'vue';
import { MappablePoint } from '../composables/layer';

interface MyLocation extends MappablePoint {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  radiusMeters: number;
  setLocation(latitude: number, longitude: number): void;
  setHeading(heading: number): void;
}

export const myLocation = reactive<MyLocation>({
  latitude: null,
  longitude: null,
  heading: null,
  radiusMeters: 40,

  setLocation(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  },

  setHeading(heading: number) {
    this.heading = heading;
  },
});

export const myTurfPoint = computed(() => {
  return point([myLocation.longitude!, myLocation.latitude!]);
});

export const relativePositionTo = computed(() => {
  return (someLocation: Feature<Point>) => geoToXY(myTurfPoint.value, myLocation.heading!, someLocation);
});

// Relative position normalized to the unit circle
// Useful for audio sources that are based on angle, not distance (like beacons)
export const normalizedRelativePositionTo = computed(() => {
  return (someLocation: Feature<Point>) => {
    let {x, y} = relativePositionTo.value(someLocation);
    let angle = Math.atan2(x, y);
    return { x: Math.sin(angle), y: Math.cos(angle) };
  };
});

export const distanceTo = computed(() => {
  return (someLocation: Feature<Point>, options?: object) => {
    return distance(myTurfPoint.value, someLocation, options);
  };
});

function geoToXY(myLocation: Feature<Point>, myHeading: number, poiLocation: Feature<Point>): { x: number, y: number } {
  // Convert degrees to radians
  const toRadians = (degree: number) => degree * (Math.PI / 180);

  // Earth radius in meters
  const earthRadius = 6371000;

  // Calculate the relative distance in meters
  const deltaLat = toRadians(poiLocation.geometry.coordinates[1] - myLocation.geometry.coordinates[1]);
  const deltaLon = toRadians(poiLocation.geometry.coordinates[0] - myLocation.geometry.coordinates[0]);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(myLocation.geometry.coordinates[1])) * Math.cos(toRadians(poiLocation.geometry.coordinates[1])) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  // Calculate the angle between the Y-axis and the line connecting myLocation and poiLocation
  const angleToTarget = Math.atan2(
    poiLocation.geometry.coordinates[0] - myLocation.geometry.coordinates[0],
    poiLocation.geometry.coordinates[1] - myLocation.geometry.coordinates[1]
  ) - toRadians(myHeading);

  // Calculate X and Y coordinates
  const x = distance * Math.sin(angleToTarget);
  const y = distance * Math.cos(angleToTarget);

  // Scale so that sounds are more audible, and to fit on canvas
  const scaleFactor = 0.05;
  return { x: x * scaleFactor, y: y * scaleFactor };
}