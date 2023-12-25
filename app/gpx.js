// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createSpatialPlayer } from './audio.js'
import { zoomLevel, loadTile, getFeaturesInTile } from './feature_cache.js'
import { createBoundingBox, enumerateTilesInBoundingBox, friendlyDistance } from './geospatial.js'

const speedUpFactor = 5;
const proximityThreshold = 250; // feet
const audioQueue = createSpatialPlayer();

// initialize OpenStreetMap
var map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
var markersLayer = new L.LayerGroup().addTo(map);
var timeoutIds = [];

function plotPointsOnMap(points) {
  // Clear existing markers
  markersLayer.clearLayers();

  // Plot each point on the map
  points.forEach(function(point) {
    L.circle([point.latitude, point.longitude], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: proximityThreshold / 3  // drawn radius is based on proximity threshold for callouts
    }).addTo(markersLayer);
  });
}

function createCalloutAnnouncer() {
  const seenTiles = new Set();
  const spokenRecently = new Set();

  function announceCallout(feature, myLocation) {
    // Call out things that have names that aren't roads
    if (feature.properties.name && feature.feature_type != 'highway') {
      if (spokenRecently.has(feature.properties.name)) {
        return;
      }
      // Calculate the distance between the GeoJSON feature and the point
      const poiCentroid = turf.centroid(feature.geometry);
      const distance = friendlyDistance(poiCentroid, myLocation);
      if (distance.units == 'miles' || distance.value > proximityThreshold) {
        return;
      }

      //TODO spatial
      console.log(feature.properties.name);
      spokenRecently.add(feature.properties.name);
      audioQueue.addToQueue({
        soundUrl: 'app/sounds/sense_poi.wav',
        x: 0,
        y: 0
      });
      audioQueue.addToQueue({
        //text: feature.properties.name + ' is ' + distance.value + ' ' + distance.units + ' away',
        text: feature.properties.name,
        x: 0,
        y: 0
      });
    }
  }

  const announcer = {
    locationChanged(latitude, longitude) {
      // Find all tiles within 0.1km radius of location
      const boundingBox = createBoundingBox(latitude, longitude, 0.1);
      const tiles = enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel);
      const myLocation = turf.point([longitude, latitude]);

      for (const tile of tiles) {
        const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
        // Prevent a flood of network requests by only fetching the tile the first time it is entered
        if (!seenTiles.has(tileKey)) {
          seenTiles.add(tileKey);
          loadTile(tile.x, tile.y, tile.z);
        }

        getFeaturesInTile(tileKey)
        .then(features => {
          features.forEach(feature => {
            announceCallout(feature, myLocation);
          })
        });
      }
    },
  };

  return announcer;
}

function replayGPX(file, pointCallback, errorCallback, delayBetweenPoints = 1000) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const gpxContent = e.target.result;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");

    // Assuming that the GPX file structure follows a standard format
    const trackPoints = xmlDoc.querySelectorAll("trkpt");

    trackPoints.forEach((point, index) => {
      const lat = parseFloat(point.getAttribute("lat"));
      const lon = parseFloat(point.getAttribute("lon"));

      // Create map centered at first point in GPX
      if (index === 0) {
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
        plotPointsOnMap([{ latitude: lat, longitude: lon }]);        
        pointCallback({ lat, lon });
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
  const announcer = createCalloutAnnouncer();

  inputElement.addEventListener("change", function (event) {
    const file = event.target.files[0];
  
    if (file) {
      replayGPX(
        file,
        function (point) {
          announcer.locationChanged(point.lat, point.lon);
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
