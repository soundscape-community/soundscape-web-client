// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio.js'
import { clearFeatureCache, clearURLCache } from './cache.js'
import { createCalloutAnnouncer } from './callout.js'
import { getLocation, createLocationProvider } from "./geospatial.js";
import { createMap } from './map.js';

const proximityThresholdMeters = 500;

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
  const locationProvider = createLocationProvider();
  const audioQueue = createSpatialPlayer(locationProvider);
  const announcer = createCalloutAnnouncer(audioQueue, proximityThresholdMeters, true);
  const map = createMap('map');

  // Register for updates to location
  locationProvider.subscribe(announcer.locationChanged);
  locationProvider.subscribe((latitude, longitude, heading) => {
    // Map should follow current point
    map.setView([latitude, longitude], 15);
    map.plotPoints([{ latitude: latitude, longitude: longitude, heading: heading }], proximityThresholdMeters);        
  });

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
    audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_enter.wav' });

    // use location from URL if specified, otherwise use location services
    var searchParams = new URLSearchParams(window.location.search);
    var lat = parseFloat(searchParams.get('lat'));
    var lon= parseFloat(searchParams.get('lon'));
    var head = parseFloat(searchParams.get('heading'));
    if (!isNaN(lat) && !isNaN(lon) && !isNaN(head)) {
      locationProvider.update(lat, lon, heading);
    } else {
      getLocation()
      .then(coords => {
        console.log('Latitude:' + coords.latitude);
        console.log('Longitude:' + coords.longitude);
        console.log('Heading:' + coords.heading);

        locationProvider.update(coords.latitude, coords.longitude, coords.heading);
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