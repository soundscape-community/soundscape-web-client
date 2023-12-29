// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { geoToXY } from './geo.js'

export function createLocationProvider() {
  var locationProvider = {
    subscribed: [],

    // Register a function to be called whenever location changes
    subscribe: function(callback) {
      locationProvider.subscribed.push(callback);
    },

    update: function(latitude, longitude, heading) {
      locationProvider.latitude = latitude;
      locationProvider.longitude = longitude;
      locationProvider.heading = heading;

      // Trigger all subscribed functions
      locationProvider.subscribed.forEach(callback => {
        callback(latitude, longitude, heading);
      });
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