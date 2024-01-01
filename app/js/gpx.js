// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio/sound.js'
import { createCalloutAnnouncer } from './audio/callout.js';
import { createLocationProvider } from './spatial/location.js'
import { HeadingCalculator } from './spatial/heading.js'
import { createMap } from './spatial/map.js'

const speedUpFactor = 5;
const proximityThresholdMeters = 80;
const headingWindowSize = 5;  // number of recent points to use for estimating heading

var timeoutIds = [];

function replayGPX(file, map, pointCallback, errorCallback, delayBetweenPoints = 1000) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const gpxContent = e.target.result;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");

    // Assuming that the GPX file structure follows a standard format
    const trackPoints = xmlDoc.querySelectorAll("trkpt");

    const headingCalculator = new HeadingCalculator(headingWindowSize);

    trackPoints.forEach((point, index) => {
      const lat = parseFloat(point.getAttribute("lat"));
      const lon = parseFloat(point.getAttribute("lon"));

      headingCalculator.addPoint(lat, lon);
      const heading = headingCalculator.computeHeading();

      if (index === 0) {
        // Initialize map to starting position
        map.setView([lat, lon], 17);
        // Clear out any previously-scheduled point rendering
        // (e.g. if we're loading a new GPX while one is already playing)
        timeoutIds.forEach(clearTimeout);
        timeoutIds = [];
      }

      // Extract time information if available
      const timeElement = point.querySelector("time");
      const time = timeElement ? new Date(timeElement.textContent).getTime() : 0;

      // Calculate delay based on the relative time between points
      const delay = index === 0 ? 0 : time - new Date(trackPoints[index - 1].querySelector("time").textContent).getTime();

      // Invoke the callback with a delay
      var timeoutId = setTimeout(() => {
        pointCallback({ lat, lon, heading });
      }, delay + delayBetweenPoints * index);
      timeoutIds.push(timeoutId);
    });
  };

  reader.onerror = function (e) {
    errorCallback(e.target.error);
  };

  reader.readAsText(file);
}

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
  const locationProvider = createLocationProvider();
  const audioQueue = createSpatialPlayer(locationProvider);
  const announcer = createCalloutAnnouncer(audioQueue, proximityThresholdMeters, false);
  const map = createMap('map');

  // Speed up speech proportionally
  audioQueue.setRate(speedUpFactor);

  // Register for updates to location
  locationProvider.subscribe(announcer.locationChanged);
  locationProvider.subscribe((latitude, longitude, heading) => {
    // Map should follow current point
    //map.setView([lat, lon], 17);
    map.plotPoints([{ latitude: latitude, longitude: longitude, heading: heading }], proximityThresholdMeters);        
  });

  const inputElement = document.getElementById("gpxFileInput");
  inputElement.addEventListener("change", function (event) {
    const file = event.target.files[0];
  
    if (file) {
      replayGPX(
        file,
        map,
        function (point) {
          locationProvider.update(point.lat, point.lon, point.heading);
        },
        function (error) {
          // Error callback
          console.error("Error parsing GPX file:", error);
        },
        1000 / speedUpFactor // Delay between points in milliseconds
      );
    }
  });
});
