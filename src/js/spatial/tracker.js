import { getLocation, watchLocation } from "../spatial/geo.js";
import { startCompassListener } from "../spatial/heading.js";
import { myLocation } from '../spatial/location.js';

/*
Implementation of an interface for user position tracking:
- start(): begins updates to location/orientation state
- stop(): ends updates to location/orientation state
- current(): asynchronously retrieves a single location/orientation point
*/

// Interfaces with device geolocation/orientation sensors.
export function realTracker() {
  let watchPositionHandler = null;
  let headingHandler = (heading) => {
    console.log(heading);
    myLocation.sstHeading(heading.alpha)
  };
  return {
    start() {
      startCompassListener(headingHandler);
      watchPositionHandler = watchLocation((latitude, longitude) => {
        myLocation.setLocation(latitude, longitude);
    });
    },

    stop() {
      if (watchPositionHandler) {
        navigator.geolocation.clearWatch(watchPositionHandler);
        window.removeEventListener("deviceorientation", headingHandler);
        watchPositionHandler = null;
      }
    },

    async current() {
      // Need compass for positional audio regardless of location tracking
      startCompassListener(headingHandler);

      return new Promise((resolve, reject) => {
        getLocation()
        .then((coords) => {
          myLocation.setLocation(coords.latitude, coords.longitude);
          //myLocation.setHeading(0);
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
export function fixedTracker(lat, lon, head) {
  return {
    start() {
      myLocation.setLocation(lat, lon);
      myLocation.setHeading(head);
    },

    stop() {},  // no-op

    async current() {
      return new Promise((resolve, reject) => {
        myLocation.setLocation(lat, lon);
        myLocation.setHeading(head);
        resolve({ latitude: lat, longitude: lon, heading: head });
      });
    },
  };
}