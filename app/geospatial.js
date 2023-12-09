// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

// Function to create a half-kilometer bounding box around a point
export function createBoundingBox(latitude, longitude) {
  // Create a Turf.js point
  const point = turf.point([longitude, latitude]);

  // Buffer the point with a radius of 0.5 km
  const buffered = turf.buffer(point, 0.5, { units: 'kilometers' });

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
  // Get the user's location
  //console.log("Getting your location...")
  if (navigator.geolocation) {
    // The navigator.geolocation object is available
    navigator.geolocation.getCurrentPosition(
      // Success callback
      function (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
    
        console.log('Latitude:' + latitude);
        console.log('Longitude:' + longitude);

        callback(latitude, longitude);
      },
      // Error callback
      function (error) {
        switch (error.code) {
        case error.PERMISSION_DENIED:
            console.error('User denied the request for Geolocation.');
            break;
        case error.POSITION_UNAVAILABLE:
            console.error('Location information is unavailable.');
            break;
        case error.TIMEOUT:
            console.error('The request to get user location timed out.');
            break;
        case error.UNKNOWN_ERROR:
            console.error('An unknown error occurred.');
            break;
        }
      }
    );
  } else {
    // Geolocation is not supported by the browser
    console.error('Geolocation is not supported by this browser.');
  }
}

export function friendlyDistance(pointA, pointB) {
  // Use feet or miles, depending on how far away the point is.
  var units = 'feet';
  var value = turf.distance(pointA, pointB, { units: units }).toFixed(0);
  if (value > 2000) {
    units = 'miles'
    var value = turf.distance(pointA, pointB, { units: units }).toFixed(1);
  }
  return { value, units };
}
