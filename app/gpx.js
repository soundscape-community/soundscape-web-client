// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio.js'
import { createCalloutAnnouncer } from './callout.js';
import {HeadingCalculator } from './heading.js'

const speedUpFactor = 5;
const proximityThresholdMeters = 80;
const headingWindowSize = 5;  // number of recent points to use for estimating heading
const audioQueue = createSpatialPlayer();

// initialize OpenStreetMap
var map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Create a custom divIcon with rotation
var arrowIcon = L.divIcon({
  className: 'arrow-icon',
  iconSize: [0, 0], // set size to 0, as it's controlled by CSS
  iconAnchor: [7, 25] // adjust anchor based on the arrow design
});

var markersLayer = new L.LayerGroup().addTo(map);

var timeoutIds = [];

function plotPointsOnMap(points) {
  // Clear existing markers
  markersLayer.clearLayers();

  // Plot each point on the map
  points.forEach(function(point) {
    // Render a circle reflecting the radius of POIs within speaking distance
    L.circle([point.latitude, point.longitude], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: proximityThresholdMeters  // drawn radius is based on proximity threshold for callouts
    }).addTo(markersLayer);

    // Also render a directional arrow showing inferred compass heading
    var arrowMarker = L.marker([point.latitude, point.longitude], {
      icon: arrowIcon,
    }).addTo(markersLayer);
    arrowMarker._icon.style.transform += ' rotate(' + point.heading + 'deg)';
  });
}

function replayGPX(file, pointCallback, errorCallback, delayBetweenPoints = 1000) {
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
        // Map should follow current point
        //map.setView([lat, lon], 17);
        plotPointsOnMap([{ latitude: lat, longitude: lon, heading: heading }]);        
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
  const inputElement = document.getElementById("gpxFileInput");
  const announcer = createCalloutAnnouncer(audioQueue, proximityThresholdMeters);

  inputElement.addEventListener("change", function (event) {
    const file = event.target.files[0];
  
    if (file) {
      replayGPX(
        file,
        function (point) {
          announcer.locationChanged(point.lat, point.lon, point.heading);
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
