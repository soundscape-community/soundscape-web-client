// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const tileServer = 'https://tiles.soundscape.services'
//const tileServer = 'http://localhost:8080/tiles'

function logToPage(message) {
  // Create a new paragraph element
  var para = document.createElement("p");
  
  // Create a text node with the log message
  var node = document.createTextNode(message);
  
  // Append the text node to the paragraph element
  para.appendChild(node);
  
  // Append the paragraph element to the log container
  document.getElementById("log-container").appendChild(para);
}

function vocalize(latitude, longitude) {
  // Create bounding box
  const boundingBox = createBoundingBox(latitude, longitude);
  //console.log('Bounding Box:', boundingBox);

  // Enumerate all tiles within that box
  const tiles = enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel);
  //console.log('Mercator Tiles:', tiles);

  // Pick one tile to fetch
  const tile = tiles[0];
  const urlToFetch = `${tileServer}/${tile.z}/${tile.x}/${tile.y}.json`;
  const maxAge = 604800000; // 1 week, in ms
  fetchUrlIfNotCached(urlToFetch, maxAge)
    .then((data) => {
      data.features.forEach(feature => {
        addToCache(feature);
      })
    })
    .catch((error) => {
      console.error(error);
    });
  
  /*
  const myLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };*/
  getAllFeatures()
  .then((allFeatures) => {
    if (allFeatures.length === 0) {
      speakText("No places found; try again after data has loaded.");
    } else {
      allFeatures.forEach(feature => {
        // Call out things that have names that aren't roads
        if (feature.properties.name && feature.feature_type != 'highway') {
          // Calculate the distance between the GeoJSON feature and the point
          const distance = friendlyDistance(
            turf.centroid(feature.geometry),
            turf.point([longitude, latitude]),
          );
          speakText(feature.properties.name + ' is ' + distance.value + ' ' + distance.units + ' away');
        }
      })
    }
  })
}
