// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { addToCache, getAllFeatures, clearFeatureCache } from './feature_cache.js'
import { getLocation, createBoundingBox, enumerateTilesInBoundingBox, friendlyDistance } from './geospatial.js'
import { fetchUrlIfNotCached, clearURLCache } from './url_cache.js'
import { speakText } from './speech.js'
import config from './config.js'

const zoomLevel = 16;
const maxAge = 604800000; // 1 week, in ms

function vocalize(latitude, longitude) {
  // Create bounding box
  const boundingBox = createBoundingBox(latitude, longitude);
  //console.log('Bounding Box:', boundingBox);

  // Enumerate all tiles within that box
  const tiles = enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel);
  //console.log('Mercator Tiles:', tiles);

  // Populate any missing map tiles (without blocking)
  for (const tile of tiles) {
    const urlToFetch = `${config.tileServer}/${tile.z}/${tile.x}/${tile.y}.json`;
    fetchUrlIfNotCached(urlToFetch, maxAge)
      .then((data) => {
        for (const feature of data.features) {
          addToCache(feature);
        };
        console.log(`Loaded ${data.features.length} new features.`)
      })
      .catch((error) => {
        console.error(error);
      });
  }
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

document.addEventListener('DOMContentLoaded', function () {
  var btnNearMe = document.getElementById('btn_near_me');
  btnNearMe.addEventListener('click', function() {
    // use location from URL if specified, otherwose use location services
    var searchParams = new URLSearchParams(window.location.search);
    var lat = parseFloat(searchParams.get('lat'));
    var lon= parseFloat(searchParams.get('lon'));
    if (lat && lon) {
      vocalize(lat, lon);
    } else {
      getLocation(vocalize);
    }
  });

  var btnClear = document.getElementById('btn_clear');
  btnClear.addEventListener('click', function() {
    clearURLCache();
    clearFeatureCache();
  });
});