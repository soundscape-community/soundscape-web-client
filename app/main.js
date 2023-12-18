// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio.js'
import { plotCoordinates } from './canvas.js'
import { loadNearbyTiles, getAllFeatures, clearFeatureCache } from './feature_cache.js'
import { getLocation, friendlyDistance, geoToXY } from './geospatial.js'
import { clearURLCache } from './url_cache.js'

const audioQueue = createSpatialPlayer();

function placesNearMe(latitude, longitude, heading) {
  const myLocation = turf.point([longitude, latitude]);

  // Populate any missing map data
  loadNearbyTiles(latitude, longitude);

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
            //text: feature.properties.name + ' is ' + distance.value + ' ' + distance.units + ' away',
            text: feature.properties.name,
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
    audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_enter.wav', x: 0, y: 0 });

    // use location from URL if specified, otherwise use location services
    var searchParams = new URLSearchParams(window.location.search);
    var lat = parseFloat(searchParams.get('lat'));
    var lon= parseFloat(searchParams.get('lon'));
    var head = parseFloat(searchParams.get('heading'));
    if (!isNaN(lat) && !isNaN(lon) && !isNaN(head)) {
      placesNearMe(lat, lon, head);
    } else {
      getLocation()
      .then(coords => {
        console.log('Latitude:' + coords.latitude);
        console.log('Longitude:' + coords.longitude);
        console.log('Heading:' + coords.heading);

        placesNearMe(coords.latitude, coords.longitude, coords.heading);
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