// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio.js'
import { clearFeatureCache, clearURLCache } from './cache.js'
import { createCalloutAnnouncer } from './callout.js'
import { getLocation } from './geospatial.js'

const proximityThresholdMeters = 500;
const audioQueue = createSpatialPlayer();

function placesNearMe(latitude, longitude, heading) {
  const announcer = createCalloutAnnouncer(audioQueue, proximityThresholdMeters);
  announcer.locationChanged(latitude, longitude, heading)
}

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
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