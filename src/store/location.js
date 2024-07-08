// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { distance } from '@turf/distance';
import { point } from '@turf/helpers';
import { geoToXY } from '../utils/geo.js';
import { computed, reactive } from 'vue';

export const myLocation = reactive({
  latitude: null,
  longitude: null,
  heading: null,
  radiusMeters: 40,

  setLocation(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  },

  setHeading(heading) {
    this.heading = heading;
  },
});

export const myTurfPoint = computed(() => {
  return point([myLocation.longitude, myLocation.latitude]);
});

export const relativePositionTo = computed(() => {
  return (someLocation) => geoToXY(myTurfPoint.value, myLocation.heading, someLocation);
});

// Relative position normalized to the unit circle
// Useful for audio sources that are based on angle, not distance (like beacons)
export const normalizedRelativePositionTo = computed(() => {
  return (someLocation) => {
    let {x, y} = relativePositionTo.value(someLocation);
    let angle = Math.atan2(x, y);
    return { x: Math.sin(angle), y: Math.cos(angle) };
  };
});

export const distanceTo = computed(() => {
  return (someLocation, options) => {
    return distance(myTurfPoint.value, someLocation, options);
  };
});