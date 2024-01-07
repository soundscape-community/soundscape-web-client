// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

// Function to create a half-kilometer bounding box around a point
export function createBoundingBox(latitude, longitude, radiusMeters) {
  // Create a Turf.js point
  const point = turf.point([longitude, latitude]);

  // Buffer the point with the specified readius
  const buffered = turf.buffer(point, radiusMeters, { units: 'meters' });

  // Extract the bounding box coordinates
  const bbox = turf.bbox(buffered);

  return bbox;
}

// Function to convert latitude and longitude to Mercator tile coordinates
function latLonToTileCoords(latitude, longitude, zoom) {
  const tileSize = 256; // Standard size for Mercator tiles
  const scale = 1 << zoom;
  const worldSize = tileSize * scale;

  const x = Math.floor((longitude + 180) / 360 * scale);
  const y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * scale);

  return { x, y, z: zoom };
}

// Function to enumerate all Mercator tiles within a bounding box
export function enumerateTilesInBoundingBox(bbox, minZoom, maxZoom) {
  const tiles = [];

  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const topLeft = latLonToTileCoords(bbox[3], bbox[0], zoom);
    const bottomRight = latLonToTileCoords(bbox[1], bbox[2], zoom);

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
  }

  return tiles;
}

export function getLocation(callback) {
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

export function watchLocation(callback) {
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

export function geoToXY(myLocation, myHeading, poiLocation) {
  // Convert degrees to radians
  const toRadians = degree => degree * (Math.PI / 180);

  // Earth radius in meters
  const earthRadius = 6371000;

  // Calculate the relative distance in meters
  const deltaLat = toRadians(poiLocation.geometry.coordinates[1] - myLocation.geometry.coordinates[1]);
  const deltaLon = toRadians(poiLocation.geometry.coordinates[0] - myLocation.geometry.coordinates[0]);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(myLocation.geometry.coordinates[1])) * Math.cos(toRadians(poiLocation.geometry.coordinates[1])) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  // Calculate the angle between the Y-axis and the line connecting myLocation and poiLocation
  const angleToTarget = Math.atan2(
    poiLocation.geometry.coordinates[0] - myLocation.geometry.coordinates[0],
    poiLocation.geometry.coordinates[1] - myLocation.geometry.coordinates[1]
  ) - toRadians(myHeading);

  // Calculate X and Y coordinates
  const x = distance * Math.sin(angleToTarget);
  const y = distance * Math.cos(angleToTarget);

  // Scale so that sounds are more audible, and to fit on canvas
  const scaleFactor = 0.05;
  return { x: x * scaleFactor, y: y * scaleFactor };
}
