// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createApp } from 'vue';
import ReplayGPX from './ReplayGPX.vue';

import { createSpatialPlayer, recentCallouts } from './audio/sound.js'
import createCalloutAnnouncer from './audio/callout.js';
import cache from './data/cache.js'
import createLocationProvider from './spatial/location.js'
import replayGPX from './spatial/gpx.js';
import createMap from './visual/map.js'

const maxSpeedupFactor = 9;  // max multiple for faster GPX replays

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
  const locationProvider = createLocationProvider();
  const audioQueue = createSpatialPlayer(locationProvider);
  const announcer = createCalloutAnnouncer(audioQueue);

  const app = createApp(ReplayGPX);
  app.provide('audioQueue', audioQueue);
  app.provide('locationProvider', locationProvider);
  app.mount('body');

  const map = createMap('map');
  let gpxPlayer = null;  // to be initialized on file selection

  audioQueue.loadVoices();

  // Register for updates to location
  // (no need to separately watch heading changes in GPX simulation)
  locationProvider.events.addEventListener('locationUpdated', e => {
    // Map should follow current point
    map.setView([e.detail.latitude, e.detail.longitude], 16);
    map.plotMyLocation(locationProvider);
  });

  const inputElement = document.getElementById("gpxFileInput");
  const playPauseButton = document.getElementById("playPauseButton");
  const pointSlider = document.getElementById("pointSlider");
  const decreaseSpeed = document.getElementById('decreaseSpeed');
  const increaseSpeed = document.getElementById('increaseSpeed');
  const speedDisplay = document.getElementById('speedupFactor');
  let speedupFactor = parseFloat(speedDisplay.textContent);
  let playing = false;

  inputElement.addEventListener("change", function (event) {
    const file = event.target.files[0];
  
    if (file) {
      if (gpxPlayer && playing) {
        // Clear current playing file before loading new one
        playPauseButton.click();
      }

      // Reset seek bar
      pointSlider.value = 0;

      // Clear recent callout list
      recentCallouts.value = [];

      gpxPlayer = replayGPX(file, map, {
        // When GPX file has been loadedm trigger draw map at first point
        loadedCallback: (firstPoint) => locationProvider.updateLocation(firstPoint.lat, firstPoint.lon),
        // When GPX finishes playing, toggle to paused state and reset slider
        finishedCallback: () => {
          playPauseButton.click();
          gpxPlayer.seekTo(0);
          gpxPlayer.updateSlider();
        },
        pointCallback: (point) => {
          locationProvider.updateOrientation(point.heading);
          locationProvider.updateLocation(point.lat, point.lon);

          // Update the slider when a new point is parsed
          gpxPlayer.updateSlider();
        },
        errorCallback: (error) => console.error("Error parsing GPX file:", error),
      });
    }
  });

  decreaseSpeed.addEventListener("click", function (e) {
    if (speedupFactor > 1) {
      speedDisplay.textContent = --speedupFactor;
    }
  });

  increaseSpeed.addEventListener("click", function (e) {
    if (speedupFactor < maxSpeedupFactor) {
      speedDisplay.textContent = ++speedupFactor;
    }
  });

  playPauseButton.addEventListener("click", function () {
    if (gpxPlayer) {
      // Read speed setting, and speed up speech proportionally
      gpxPlayer.speedupFactor = speedupFactor;
      audioQueue.setRate(speedupFactor);

      // Toggle play/pause
      if (!playing) {
        playPauseButton.textContent = "⏸";
        // Start triggering audio callouts
        locationProvider.events.addEventListener('locationUpdated', announcer.locationChanged)
        gpxPlayer.play();
        playing = true;
      } else {
        playPauseButton.textContent = "▶";
        // Strop triggering audio callouts
        locationProvider.events.removeEventListener('locationUpdated', announcer.locationChanged);
        audioQueue.stopAndClear();
        gpxPlayer.pause();
        playing = false;
      }
    }
  });

  pointSlider.addEventListener("input", function () {
    if (gpxPlayer) {
      // Calculate the index based on the slider value
      const totalPoints = gpxPlayer.trackPoints.length - 1;
      const newIndex = Math.round((pointSlider.value / 100) * totalPoints);
      gpxPlayer.seekTo(newIndex);
    }
  });

  var btnClear = document.getElementById('btn_clear');
  btnClear.addEventListener('click', function() {
    cache.clear();
  });
});
