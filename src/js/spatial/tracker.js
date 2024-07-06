import { getLocation, watchLocation } from "../spatial/geo.js";
import { startCompassListener } from "../spatial/heading.js";

/*
Implementation of an interface for user position tracking:
- start(): begins updates to location/orientation state
- stop(): ends updates to location/orientation state
- current(): asynchronously retrieves a single location/orientation point
*/

// Interfaces with device geolocation/orientation sensors.
export function realTracker(locationProvider, announcer) {
  let watchPositionHandler = null;
  return {
    start() {
      startCompassListener(locationProvider.updateOrientation);
      watchPositionHandler = watchLocation(locationProvider.updateLocation);
    },

    stop() {
      if (watchPositionHandler) {
        navigator.geolocation.clearWatch(watchPositionHandler);
        window.removeEventListener(
          "deviceorientation",
          locationProvider.updateOrientation
        );
        watchPositionHandler = null;
      }
    },

    async current() {
      return new Promise((resolve, reject) => {
        getLocation()
        .then((coords) => {
          resolve({
            latitude: coords.latitude,
            longitude: coords.longitude,
            heading: 0, // only available from change event handler?
          });
        })
        .catch((error) => {
          if (error.code == error.PERMISSION_DENIED) {
            alert(
              "Could not get your location. If you did not see a permission request, make sure your browser is not configured to always block location services."
            );
          } else {
            console.error("Error getting current position: " + error.message);
          }
        });
      });
    },
  };
}

// For testing: simulates being in a fixed location.
export function fixedTracker(lat, lon, head, locationProvider) {
  return {
    start() {
      locationProvider.updateLocation(lat, lon);
      locationProvider.updateOrientation({ alpha: head });
    },

    stop() {},  // no-op

    async current() {
      return new Promise((resolve, reject) => {
        resolve({ latitude: lat, longitude: lon, heading: head });
      });
    },
  };
}