// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { geoToXY } from './geo.js'

export function createLocationProvider() {
  // Latidue/longitude
  var location = {
    callbacks: [],

    watch: function(callback) {
      location.callbacks.push(callback);
    },

    update: function(latitude, longitude) {
      location.latitude = latitude;
      location.longitude = longitude;

      // Trigger all subscribed functions
      location.callbacks.forEach(callback => {
        callback(location.latitude, location.longitude);
      });
    },
  };

  // Device orientation (not compass heading from Geolocation API)
  var orientation = {
    callbacks: [],

    watch: function(callback) {
      orientation.callbacks.push(callback);
    },

    update: function(event) {
      // event object as triggered by Device Orientation API
      orientation.heading = event.alpha;

      // Trigger all subscribed functions
      orientation.callbacks.forEach(callback => {
        callback(orientation.heading);
      });
    },
  };

  var locationProvider = {
    location: location,
    orientation: orientation,

    turfPoint: function() {
      return turf.point([locationProvider.location.longitude, locationProvider.location.latitude]);
    },

    relativePosition: function(someLocation) {
      return geoToXY(locationProvider.turfPoint(), locationProvider.orientation.heading, someLocation);
    },

    distance: function(someLocation, options) {
      return turf.distance(locationProvider.turfPoint(), someLocation, options);
    },
  };

  return locationProvider;
}