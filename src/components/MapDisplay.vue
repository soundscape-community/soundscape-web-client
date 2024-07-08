<template>
  <div id="map"></div>
</template>  

<script setup>
import { inject, ref, onMounted, watch } from 'vue';
import * as L from 'leaflet';

const props = defineProps({
  location: Object,
  beacon: Object,
})

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

const plotMyLocation = () => {
  const radiusMeters = 40; //FIXME import form location
  plotPoints(
    [{
      latitude: props.location.latitude,
      longitude: props.location.longitude,
      heading: props.location.heading,
    }],
    radiusMeters
  );
};

// Register for updates to location
watch(props.location, (newValue, oldValue) => {
  // Map should follow current point
  if (newValue.latitude && newValue.longitude) {
    map.setView([newValue.latitude, newValue.longitude], 16);
    plotMyLocation();
  }
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

watch(props.beacon, (newValue, oldValue) => {
  if (newValue.beacon) {
    plotBeacon(newValue.beacon.latitude, newValue.beacon.longitude);
  }
  if (newValue.playing) {
    startBeaconPulse();
  } else {
    pauseBeaconPulse();
  }
});
</script>

<style>
#map {
  width: 100%;
  height: 300px;
  border: 2px solid #000;
  margin-bottom: 15px;
}

/* display map + recent callouts side-by-side on sufficiently wide screens */
@media screen and (min-width: 600px) {
  #map {
      height: calc(100vh - 140px);
      width: 48%;
  }
}

/* Current position marker on map */
.arrow-icon {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 40px solid red;
  transform-origin: bottom center;
}

/* Current beacon marker on map */
.beacon-icon {
  position: relative;
  width: 20px;
  height: 20px;
  background-color: #e74c3c;
  border-radius: 50% 50% 50% 50%;
  border: 3px solid #2c3e50;
}

.pulsing {
  animation: pulse 0.75s infinite;
}

@keyframes pulse {
  0%, 100% {
      opacity: 0.1;
  }
  50% {
      opacity: 1.0;
  }
}
</style>