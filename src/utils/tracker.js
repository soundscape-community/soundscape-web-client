import { startCompassListener } from "./heading.js";
import { myLocation } from '../store/location.js';

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

function getLocation(callback) {
  return new Promise((resolve, reject) => {
    // Check if the Geolocation API is supported
    if ("geolocation" in navigator) {
      // Request the current position
      navigator.geolocation.getCurrentPosition(
        function (position) {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || 0,  // not available on all platforms
          });
        },
        function (error) {
          // Reject the Promise with the error message
          reject("Error getting current position: " + error.message);
        }
      );
    } else {
      // Reject the Promise if Geolocation API is not supported
      reject("Geolocation is not supported by this browser");
    }
  });
}

function watchLocation(callback) {
  return navigator.geolocation.watchPosition(
    function (position) {
      console.log(position);
      callback(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.heading,
      );
    },
    function (error) {
      if (error.code == error.PERMISSION_DENIED) {
        alert("Could not get your location. If you did not see a permission request, make sure your browser is not configured to always block location services.")
      } else {
        console.error("Error getting current position: " + error.message);
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}