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
  return {
    start() {
      watchPositionHandler = watchLocation((latitude, longitude) => {
        myLocation.setLocation(latitude, longitude);
      });
    },

    stop() {
      if (watchPositionHandler) {
        navigator.geolocation.clearWatch(watchPositionHandler);
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
export function fixedTracker(lat, lon) {
  return {
    start() {
      myLocation.setLocation(lat, lon);
      // Heading points at mouse pointer
      const mapLocation = document.getElementById("map");
      window.addEventListener('mousemove', (event) => {
        const angle = getMouseAngle(mapLocation, event);
        myLocation.setHeading(angle);
      });
    },

    stop() {},  // no-op

    async current() {
      return new Promise((resolve, reject) => {
        myLocation.setLocation(lat, lon);
        resolve({ latitude: lat, longitude: lon, heading: 0 });
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

// For testing, let heading follow mouse pointer
function getMouseAngle(node, event) {
  // Get the node's bounding rectangle
  const rect = node.getBoundingClientRect();

  // Calculate the center of the node
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Calculate the position of the mouse relative to the center of the node
  const mouseX = event.clientX - centerX;
  const mouseY = event.clientY - centerY;

  // Calculate the angle in radians
  const angleRadians = Math.atan2(mouseX, -mouseY);

  // Convert the angle to degrees
  const angleDegrees = angleRadians * (180 / Math.PI);

  return angleDegrees;
}