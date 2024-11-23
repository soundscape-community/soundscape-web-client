// Copyright (c) Daniel W. Steinbrook.

import { point } from '@turf/turf';
import { computed, reactive } from 'vue';
import { distanceTo, normalizedRelativePositionTo } from '../state/location';
import { MappablePoint } from '../composables/layer';

const onCourseAngle = 30; // degrees +/- Y axis
const foundProximityMeters = 10; // proximity to auto-stop beacon

interface BeaconState extends MappablePoint {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  lastAnnouncedDistance: number | null;
  enabled: boolean;

  set: (name: string, latitude: number, longitude: number) => void;
  clear: () => void;
  enable: () => void;
  disable: () => void;
}
export const beacon = reactive<BeaconState>({
  name: null,
  latitude: null,
  longitude: null,
  lastAnnouncedDistance: null,
  enabled: false,

  set(name: string, latitude: number, longitude: number) {
    this.name = name;
    this.longitude = longitude;
    this.latitude = latitude;
    this.lastAnnouncedDistance = null;
  },

  clear() {
    this.name = null;
    this.longitude = null;
    this.latitude = null;
  },

  enable() {
    this.enabled = true;
  },

  disable() {
    this.enabled = false;
  },
});

// Turf.js point of the beacon's location
const sourceLocation = computed(() => {
  if (beacon.longitude && beacon.latitude) {
    return point([beacon.longitude, beacon.latitude]);
  }
});

// Distance we are currently from the beacon
export const distanceMeters = computed(() => {
  if (sourceLocation.value) {
    return distanceTo.value(sourceLocation.value, { units: "meters", });
  }
});

// Beacon's X/Y coordinates relative to us (standing at the origin, looking up Y axis)
export const relativePosition = computed(() => {
  if (sourceLocation.value) {
    return normalizedRelativePositionTo.value(sourceLocation.value);
  }
});

// True if we are roughly facing the beacon, +/- onCourseAngle
export const isOnCourse = computed(() => {
  return (
    relativePosition.value &&
    onCourseAngle > Math.abs(
      Math.atan2(
        relativePosition.value.x,
        relativePosition.value.y
      ) * 180 / Math.PI
    )
  );
});

// True if we are within foundProximityMeters of beacon
export const isNearby = computed(() => {
  return (
    distanceMeters.value !== undefined &&
    distanceMeters.value < foundProximityMeters
  );
});