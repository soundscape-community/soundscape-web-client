// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { audioContext, createSpatialPlayer, playSpatialSpeech } from './audio/sound.js'
import createCalloutAnnouncer from './audio/callout.js'
import { getLocation, watchLocation } from './spatial/geo.js';
import { startCompassListener } from './spatial/heading.js';
import createLocationProvider from './spatial/location.js'
import createMap from './visual/map.js';
import createRecentCalloutList from './visual/recentlist.js';
import createVoiceControls from './visual/voicecontrols.js';

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
  const locationProvider = createLocationProvider();
  const audioQueue = createSpatialPlayer(locationProvider);
  const announcer = createCalloutAnnouncer(audioQueue);
  const map = createMap('map');
  const recentCalloutsList = createRecentCalloutList(locationProvider, audioQueue);

  //XXX disabled to debug beacons on iOS
  // iOS Safari workaround to allow audio while mute switch is on
  //let allowBackgroundPlayback = true;
  //let forceIOSBehavior = false;
  //unmute(audioContext, allowBackgroundPlayback, forceIOSBehavior);

  // Register for updates to location
  locationProvider.events.addEventListener('locationUpdated', e => {
    // Map should follow current point
    map.setView([e.detail.latitude, e.detail.longitude], 16);
    map.plotMyLocation(locationProvider);
  });
  // Redraw location marker when compass heading changes
  locationProvider.events.addEventListener('orientationUpdated', e => {
    map.plotMyLocation(locationProvider);
  });

  // Add callouts to visual list as they are announced
  audioQueue.events.addEventListener('speechPlayed', e => {
    if (e.detail.location) {
      recentCalloutsList.add(
        e.detail.text,
        e.detail.location.geometry.coordinates[1],
        e.detail.location.geometry.coordinates[0]
      );
    }
  });

  createVoiceControls(audioQueue);

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
  var wakeLock = null;
  const selectedColor = '#18b3c3';
  const unselectedColor = '#e74c3c';
  // When mode button is clicked:
  //   If a mode is currently active, end that mode
  //   If mode button was different from current mode, start new mode
  async function toggleMode(newMode) {
    // required for iOS Safari: first speech must be directly triggered by user action
    playSpatialSpeech(' ');

    // Reset button colors
    btnCallouts.style.backgroundColor = unselectedColor;
    btnNearMe.style.backgroundColor = unselectedColor;

    // Clear queued audio
    if (activeMode) {
      audioQueue.stopAndClear();
      audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_exit.wav' });
    }

    // Remove any location and orientation change event handlers
    locationProvider.events.removeEventListener('locationUpdated', announcer.locationChanged);
    if (watchPositionHandler) {
      navigator.geolocation.clearWatch(watchPositionHandler);
      window.removeEventListener('deviceorientation', locationProvider.updateOrientation);
      watchPositionHandler = null;
    }

    // Stop here if the intent was to end the current mode
    if (activeMode == newMode) {
      activeMode = null;

      if (wakeLock) {
        // Release the Wake Lock
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }

      return;
    }

    // Button clicked was different from current mode -- start new mode
    activeMode = newMode;

    // Request a Wake Lock
    if ("wakeLock" in navigator && !wakeLock){
      try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Wake Lock is active!");

        // Listen for Wake Lock being released
        //   (when no active modes OR when page loses focus)
        wakeLock.addEventListener('release', () => {
          console.log('Wake Lock released.');
        });

      } catch (err) {
        // The Wake Lock request has failed - usually system related, such as battery.
        console.log(err);
      }
    }


    // play mode-enter sound
    audioQueue.addToQueue({ soundUrl: 'app/sounds/mode_enter.wav' });

    switch (newMode) {
      case 'callouts':
        locationProvider.events.addEventListener('locationUpdated', announcer.locationChanged);
        startCompassListener(locationProvider.updateOrientation);

        watchPositionHandler = watchLocation(locationProvider.updateLocation);
        btnCallouts.style.backgroundColor = selectedColor;
        break;

      case 'near_me':
        btnNearMe.style.backgroundColor = selectedColor;
        getRelevantLocation().then(coords => {
          console.log(coords);
          locationProvider.updateLocation(coords.latitude, coords.longitude);
          locationProvider.updateOrientation({ alpha: coords.heading });

          // Call out nearby features once
          announcer.calloutAllFeatures(coords.latitude, coords.longitude)
          .then(anythingToSay => {
            if (!anythingToSay) {
              audioQueue.addToQueue({ text: "Nothing to call out right now" });
            }
          });
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

  // Reacquire Wake Lock when page regains focus
  document.addEventListener("visibilitychange", async () => {
    if (wakeLock !== null && document.visibilityState === "visible") {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake Lock reacquired.")
    }
  });

});
