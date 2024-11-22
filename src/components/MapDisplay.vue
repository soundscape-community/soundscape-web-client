<template>
  <div id="map" ref="mapElement"></div>
</template>  

<script setup lang="ts">
import { ref, onMounted, withDefaults  } from 'vue';
import * as L from 'leaflet';
import { MappablePoint, useReactiveMapLayer } from '../composables/layer';

interface MapProps {
  location: MappablePoint,
  beacon: MappablePoint,
  follow: boolean,
  pointOfInterest: MappablePoint,
}
const props = withDefaults(defineProps<MapProps>(), {
  follow: true
});

const mapElement = ref<string>();
const leafletMap = ref<L.Map>();

onMounted(() => {
  leafletMap.value = L.map(mapElement.value!);
  // Store the map instance in the map element for Cypress access
  (mapElement.value as any)._leafletMap = leafletMap.value;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(leafletMap.value!);
});

// Plot current location
useReactiveMapLayer(leafletMap, props.location, {
  setMapView: true,
  follow: props.follow,
  className: 'my-location-icon',
  iconSize: [40, 40],
});

// Plot active beacon, if any
useReactiveMapLayer(leafletMap, props.beacon, {
  className: 'beacon-icon',
  iconSize: [20, 20],
});

// Plot point of interest, e.g. on detail page
useReactiveMapLayer(leafletMap, props.pointOfInterest, {
  setMapView: true,
  className: 'poi-icon',
  iconSize: [20, 20],
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

/* My location marker on map */
.my-location-icon {
  background-color: rgba(255, 0, 0, 0.3);
  border-radius: 50% 50% 50% 50%;
  border: 3px solid red;
}

/* Current position marker on map */
.arrow-icon {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 30px solid red;
  transform-origin: bottom center;
}

/* Current beacon marker on map */
.beacon-icon {
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

/* Detail marker on map */
.poi-icon {
  background-color: black;
  border-radius: 50% 50% 50% 50%;
  border: 3px solid #2c3e50;
}
</style>