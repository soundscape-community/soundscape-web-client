// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio/sound.js'
import { createCalloutAnnouncer } from './audio/callout.js'
import cache from './data/cache.js'
import { getLocation, watchLocation } from './spatial/geo.js';
import { createLocationProvider } from './spatial/location.js'
import { createMap } from './spatial/map.js';

const proximityThresholdMeters = 100;

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
  var btnCallouts = document.getElementById('btn_callouts');
  var watchPositionHandler = null;
  btnCallouts.addEventListener('click', function() {
    if (watchPositionHandler) {
      // Currently watching -- clear handler
      navigator.geolocation.clearWatch(watchPositionHandler);
      btnCallouts.textContent = 'Start';
      audioQueue.stopAndClear();
      audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_exit.wav' });
    } else {
      // Not currently watching -- start handler
      btnCallouts.textContent = 'Stop';

      // play mode-enter sound
      audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_enter.wav' });

      watchPositionHandler =watchLocation(locationProvider.update);
    }
  });

  var btnNearMe = document.getElementById('btn_near_me');
  btnNearMe.addEventListener('click', function() {
    if (audioQueue.queue.length > 0) {
    //if (btnNearMe.textContent == '(stop)') {
      audioQueue.stopAndClear();
      audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_exit.wav' });
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
    cache.clear();
  });
});