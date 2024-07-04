<template>
  <div id="map"></div>
</template>  

<script setup>
import { inject, ref, onMounted, watch } from 'vue';
import * as L from 'leaflet';

const locationProvider = inject('locationProvider');
// To be initialized on component mount
var map = null;
var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
})
var myLocationLayer = new L.LayerGroup();
var beaconLayer = new L.LayerGroup();

// Create a custom divIcon with rotation
var arrowIcon = L.divIcon({
  className: 'arrow-icon',
  iconSize: [0, 0], // set size to 0, as it's controlled by CSS
  iconAnchor: [7, 25] // adjust anchor based on the arrow design
});

var beaconIcon = L.divIcon({
  className: 'beacon-icon',
  iconSize: [20, 20],
});

onMounted(() => {
  map = L.map("map");
  tileLayer.addTo(map);
  myLocationLayer.addTo(map);
  beaconLayer.addTo(map);
});

const plotPoints = (points, radiusMeters) => {
  // Clear existing markers
  myLocationLayer.clearLayers();

  // Plot each point on the map
  points.forEach(function(point) {
    // Render a circle reflecting the radius of POIs within speaking distance
    L.circle([point.latitude, point.longitude], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.3,
      radius: radiusMeters  // drawn radius is based on proximity threshold for callouts
    }).addTo(myLocationLayer);

    if (point.heading !== null && !isNaN(point.heading)) {
      // Also render a directional arrow showing inferred compass heading
      var arrowMarker = L.marker([point.latitude, point.longitude], {
        icon: arrowIcon,
      }).addTo(myLocationLayer);
      arrowMarker._icon.style.transform += ' rotate(' + point.heading + 'deg)';
    }
  });
};

const plotMyLocation = (locationProvider) => {
  const lat = locationProvider.latitude;
  const lon = locationProvider.longitude;
  const head = locationProvider.heading;
  const radiusMeters = locationProvider.radiusMeters;
  // Don't try to plot points before location is available
  if (!isNaN(lat) && !isNaN(lon)) {
    plotPoints(
      [{ latitude: lat, longitude: lon, heading: head }],
      radiusMeters
    );
  }
};

// Register for updates to location
locationProvider.events.addEventListener("locationUpdated", (e) => {
  // Map should follow current point
  map.setView([e.detail.latitude, e.detail.longitude], 16);
  plotMyLocation(locationProvider);
});

// Redraw location marker when compass heading changes
locationProvider.events.addEventListener("orientationUpdated", (e) => {
  plotMyLocation(locationProvider);
});

const plotBeacon = (lat, lon) => {
  // Clear existing beacons
  beaconLayer.clearLayers();

  // Render a pulsing circle (see CSS)
  L.marker([lat, lon], {
  icon: beaconIcon,
  }).addTo(beaconLayer);
};

// Beacon pulses hwen it is active
const startBeaconPulse = () => {
  beaconLayer.eachLayer(layer => {
    layer.getElement().classList.add('pulsing');
  })
};

// Stop beacon pulsing whern it is inactive
const pauseBeaconPulse = () => {
  beaconLayer.eachLayer(layer => {
    layer.getElement().classList.remove('pulsing');
  })
};
</script>