// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { geoToXY } from './geo.js'

export function createLocationProvider() {
  var locationProvider = {
    heading: null,
    events: new EventTarget(),

    updateLocation: function(latitude, longitude) {
      locationProvider.latitude = latitude;
      locationProvider.longitude = longitude;

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

      // Trigger all event listeners
      const updateEvent = new CustomEvent('orientationUpdated', {
        detail: { heading: locationProvider.heading, }
      });
      locationProvider.events.dispatchEvent(updateEvent);
    },

    turfPoint: function() {
      return turf.point([locationProvider.longitude, locationProvider.latitude]);
    },

    relativePosition: function(someLocation) {
      return geoToXY(locationProvider.turfPoint(), locationProvider.heading, someLocation);
    },

    distance: function(someLocation, options) {
      return turf.distance(locationProvider.turfPoint(), someLocation, options);
    },
  };

  return locationProvider;
}