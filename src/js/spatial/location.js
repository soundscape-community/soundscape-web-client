// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { distance } from '@turf/distance';
import { point } from '@turf/helpers';
import { geoToXY } from './geo.js'

import { reactive } from 'vue';
export const location = reactive({
  latitude: null,
  longitude: null,
});
export const orientation = reactive({
  heading: null,
});

function createLocationProvider() {
  var locationProvider = {
    radiusMeters: 40,  //TODO make this dynamic based on speed
    heading: null,
    events: new EventTarget(),

    updateLocation: function(latitude, longitude) {
      locationProvider.latitude = latitude;
      locationProvider.longitude = longitude;
      Object.assign(location, {longitude: longitude, latitude: latitude})

      // Trigger all event listeners
      const updateEvent = new CustomEvent('locationUpdated', {
        detail: {
          latitude: locationProvider.latitude,
          longitude: locationProvider.longitude,
        }
      });
      locationProvider.events.dispatchEvent(updateEvent);
    },

    updateOrientation: function(heading) {
      locationProvider.heading = heading;
      Object.assign(orientation, {heading: heading})

      // Trigger all event listeners
      const updateEvent = new CustomEvent('orientationUpdated', {
        detail: { heading: locationProvider.heading, }
      });
      locationProvider.events.dispatchEvent(updateEvent);
    },

    turfPoint: function() {
      return point([locationProvider.longitude, locationProvider.latitude]);
    },

    relativePosition: function(someLocation) {
      return geoToXY(locationProvider.turfPoint(), locationProvider.heading, someLocation);
    },

    // Relative position normalized to the unit circle
    // Useful for audio sources that are based on angle, not distance (like beacons)
    normalizedRelativePosition: function(someLocation) {
      let {x, y} = locationProvider.relativePosition(someLocation);
      let angle = Math.atan2(x, y);
      return { x: Math.sin(angle), y: Math.cos(angle) };
    },

    distance: function(someLocation, options) {
      return distance(locationProvider.turfPoint(), someLocation, options);
    },
  };

  return locationProvider;
}

export default createLocationProvider;