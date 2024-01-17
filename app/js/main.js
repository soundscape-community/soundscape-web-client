// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { audioContext, createSpatialPlayer, playSpatialSpeech } from './audio/sound.js'
import { createCalloutAnnouncer } from './audio/callout.js'
import cache from './data/cache.js'
import { getLocation, watchLocation } from './spatial/geo.js';
import { startCompassListener } from './spatial/heading.js';
import { createLocationProvider } from './spatial/location.js'
import { createMap } from './spatial/map.js';

const radiusMeters = 100;

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
  const locationProvider = createLocationProvider();
  const audioQueue = createSpatialPlayer(locationProvider);
  const announcer = createCalloutAnnouncer(audioQueue, radiusMeters, true);
  const map = createMap('map');

  // iOS Safari workaround to allow audio while mute switch is on
  let allowBackgroundPlayback = true;
  let forceIOSBehavior = false;
  unmute(audioContext, allowBackgroundPlayback, forceIOSBehavior);

  // Register for updates to location
  locationProvider.events.addEventListener('updateLocation', e => {
    announcer.locationChanged(e);

    // Map should follow current point
    map.setView([e.detail.latitude, e.detail.longitude], 15);
    map.plotMyLocation(locationProvider, radiusMeters);
  });
  // Redraw location marker when compass heading changes
  locationProvider.events.addEventListener('updateOrientation', e => {
    map.plotMyLocation(locationProvider, radiusMeters);
  });

  // Fetch available voices
  const voiceSelect = document.getElementById('voice');
  const rateInput = document.getElementById('rate');

  // Populate voice selector
  function populateVoices() {
    // Populate voice list with all English voices
    audioQueue.voices = window.speechSynthesis.getVoices()
      .filter(voice => voice.lang.startsWith('en'));;
    audioQueue.voices.forEach(function(voice, index) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = voice.name;
      voiceSelect.appendChild(option);
    });
  }
  populateVoices();

  // Select the system default voice by default
  const systemDefaultVoice = audioQueue.voices.find(voice => voice.default);
  if (systemDefaultVoice) {
    voiceSelect.value = audioQueue.voices.indexOf(systemDefaultVoice);
  }

  // Update voices when they change
  window.speechSynthesis.onvoiceschanged = function() {
    voiceSelect.innerHTML = ''; // Clear existing options
    populateVoices();
  };

  // Update voice and range when user changes them
  rateInput.addEventListener('input', function(e) {
    audioQueue.setRate(parseFloat(rateInput.value));
  });

  voiceSelect.addEventListener('change', function() {
    audioQueue.setVoice(voiceSelect.value);
  });

  // Set voice and rate to match initial form values
  audioQueue.setRate(parseFloat(rateInput.value));
  audioQueue.setVoice(voiceSelect.value);

  // Use location from URL if specified, otherwise use device location services
  async function getRelevantLocation() {
    return new Promise((resolve, reject) => {
      var searchParams = new URLSearchParams(window.location.search);
      var lat = parseFloat(searchParams.get('lat'));
      var lon= parseFloat(searchParams.get('lon'));
      var head = parseFloat(searchParams.get('heading'));
      if (!isNaN(lat) && !isNaN(lon) && !isNaN(head)) {
        resolve({ latitude: lat, longitude: lon, heading: head } );
      } else {
        getLocation()
        .then(coords => {
          resolve({
            latitude: coords.latitude,
            longitude: coords.longitude,
            heading: 0  // only available from change event handler?
          });
        })
        .catch((error) => {
          reject(error);
        });
      }
    });
  }

  var btnCallouts = document.getElementById('btn_callouts');
  var btnNearMe = document.getElementById('btn_near_me');
  var watchPositionHandler = null;
  var activeMode = null;
  // When mode button is clicked:
  //   If a mode is currently active, end that mode
  //   If mode button was different from current mode, start new mode
  async function toggleMode(newMode) {
    // required for iOS Safari: first speech must be directly triggered by user action
    playSpatialSpeech(' ');

    // Reset button labels
    btnCallouts.textContent = 'Begin Tracking with Callouts';
    btnNearMe.textContent = 'Announce Places Near Me';

    // Clear queued audio
    if (activeMode) {
      audioQueue.stopAndClear();
      audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_exit.wav' });
    }

    // Remove any location and orientation change event handlers
    if (watchPositionHandler) {
      navigator.geolocation.clearWatch(watchPositionHandler);
      window.removeEventListener('deviceorientation', locationProvider.updateOrientation);
      watchPositionHandler = null;
    }

    // Stop here if the intent was to end the current mode
    if (activeMode == newMode) {
      activeMode = null;
      return;
    }

    // Button clicked was different from current mode -- start new mode
    activeMode = newMode;

    // play mode-enter sound
    audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_enter.wav' });

    switch (newMode) {
      case 'callouts':
        startCompassListener(locationProvider.updateOrientation);

        watchPositionHandler = watchLocation(locationProvider.updateLocation);
        btnCallouts.textContent = 'End Tracking with Callouts';
        break;

      case 'near_me':
        btnNearMe.textContent = 'End Announce Places Near Me';
        getRelevantLocation().then(coords => {
          console.log(coords);
          locationProvider.updateLocation(coords.latitude, coords.longitude);
          locationProvider.updateOrientation({ alpha: coords.heading });
        })
        .catch(error => {
          if (error.code == error.PERMISSION_DENIED) {
            alert("Could not get your location. If you did not see a permission request, make sure your browser is not configured to always block location services.")
          } else {
            console.error("Error getting current position: " + error.message);
          }
        });
        break;
    }
  }

  // Hook up click event handlers
  btnCallouts.addEventListener('click', function() {
    toggleMode('callouts');
  });

  btnNearMe.addEventListener('click', function() {
    toggleMode('near_me');
  });

  var btnClear = document.getElementById('btn_clear');
  btnClear.addEventListener('click', function() {
    cache.clear();
  });
});
