// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio.js'
import { plotCoordinates } from './canvas.js'
import { addToCache, getAllFeatures, clearFeatureCache } from './feature_cache.js'
import { getLocation, createBoundingBox, enumerateTilesInBoundingBox, friendlyDistance, geoToXY } from './geospatial.js'
import { fetchUrlIfNotCached, clearURLCache } from './url_cache.js'
import config from './config.js'

const zoomLevel = 16;
const maxAge = 604800000; // 1 week, in ms

const audioQueue = createSpatialPlayer();

function vocalize(latitude, longitude, heading) {
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

  const myLocation = turf.point([longitude, latitude]);

  getAllFeatures()
  .then((allFeatures) => {
    if (allFeatures.length === 0) {
      audioQueue.addToQueue({ text: "No places found; try again after data has loaded.", x: 0, y: 0 });
    } else {
      //allFeatures.slice(0, 10).forEach(feature => {
      allFeatures.forEach(feature => {
        // Call out things that have names that aren't roads
        if (feature.properties.name && feature.feature_type != 'highway') {
          // Calculate the distance between the GeoJSON feature and the point
          const poiCentroid = turf.centroid(feature.geometry);
          const distance = friendlyDistance(poiCentroid, myLocation);

          // Don't mention features that are far enough away to no longer be in feet
          if (distance.units == 'miles') {
            return;
          }

          // Calculate the Cartesian coordinates to position the audio.
          const relativePosition = geoToXY(myLocation, heading, poiCentroid);
          plotCoordinates([{
            coordinates: [relativePosition.x, relativePosition.y],
            label: feature.properties.name
          }]);

          // Play sound effect (positioned spatially) and speak name
          audioQueue.addToQueue({
            soundUrl: 'app/sounds/sense_poi.wav',
            x: relativePosition.x,
            y: relativePosition.y
          });
          audioQueue.addToQueue({
            text: feature.properties.name + ' is ' + distance.value + ' ' + distance.units + ' away',
            x: relativePosition.x,
            y: relativePosition.y
          });
        }
      })
    }

    audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_exit.wav', x: 0, y: 0 });
  })
}

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
  // Draw origin point on canvase
  plotCoordinates([{
    coordinates: [0, 0], label: '(self)'
  }])

  // Hook up click event handlers
  var btnNearMe = document.getElementById('btn_near_me');
  btnNearMe.addEventListener('click', function() {
    if (audioQueue.queue.length > 0) {
    //if (btnNearMe.textContent == '(stop)') {
      audioQueue.stopAndClear();
      audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_exit.wav', x: 0, y: 0 });
      //btnNearMe.textContent = 'Places Near Me';
      return;
    }

    // indicate that clicking button again will stop audio
    //FIXME automatically change back once finished speaking
    //btnNearMe.textContent  = '(stop)';

    // play mode-enter sound
    audioQueue.addToQueue('app/sounds/mode_enter.wav');

    // use location from URL if specified, otherwise use location services
    var searchParams = new URLSearchParams(window.location.search);
    var lat = parseFloat(searchParams.get('lat'));
    var lon= parseFloat(searchParams.get('lon'));
    var head = parseFloat(searchParams.get('heading'));
    if (!isNaN(lat) && !isNaN(lon) && !isNaN(head)) {
      vocalize(lat, lon, head);
    } else {
      getLocation()
      .then(coords => {
        console.log('Latitude:' + coords.latitude);
        console.log('Longitude:' + coords.longitude);
        console.log('Heading:' + coords.heading);

        vocalize(coords.latitude, coords.longitude, coords.heading);
      })
      .catch((error) => {
        console.error(error);
      });
    }
  });

  var btnClear = document.getElementById('btn_clear');
  btnClear.addEventListener('click', function() {
    clearURLCache();
    clearFeatureCache();
  });
});