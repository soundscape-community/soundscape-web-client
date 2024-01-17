// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio/sound.js'
import { createCalloutAnnouncer } from './audio/callout.js';
import { createLocationProvider } from './spatial/location.js'
import { replayGPX } from './spatial/gpx.js';
import { createMap } from './spatial/map.js'

const radiusMeters = 80;

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
  const locationProvider = createLocationProvider();
  const audioQueue = createSpatialPlayer(locationProvider);
  const announcer = createCalloutAnnouncer(audioQueue, radiusMeters, false);
  const map = createMap('map');
  let gpxPlayer = null;  // to be initialized on file selection

  // Register for updates to location
  // (no need to separately watch heading changes in GPX simulation)
  locationProvider.events.addEventListener('updateLocation', e => {
    // Map should follow current point
    map.setView([e.detail.latitude, e.detail.longitude], 16);
    map.plotMyLocation(locationProvider, radiusMeters);
  });

  const inputElement = document.getElementById("gpxFileInput");
  const playPauseButton = document.getElementById("playPauseButton");
  const pointSlider = document.getElementById("pointSlider");
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

  playPauseButton.addEventListener("click", function () {
    if (gpxPlayer) {
      // Read speed setting, and speed up speech proportionally
      gpxPlayer.speedUpFactor = document.getElementById("speed").value;
      audioQueue.setRate(gpxPlayer.speedUpFactor);

      // Toggle play/pause
      if (!playing) {
        playPauseButton.textContent = "Pause";
        // Start triggering audio callouts
        locationProvider.events.addEventListener('updateLocation', announcer.locationChanged)
        gpxPlayer.play();
        playing = true;
      } else {
        playPauseButton.textContent = "Play";
        // Strop triggering audio callouts
        locationProvider.events.removeEventListener('updateLocation', announcer.locationChanged);
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
});
