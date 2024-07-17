<template>
  <div id="map"></div>
</template>  

<script setup>
import { ref, onMounted } from 'vue';
import * as L from 'leaflet';
import { useReactiveMapLayer } from '../composables/layer.js';

const props = defineProps({
  location: Object,
  beacon: Object,
  follow: {
    type: Boolean,
    default: true,
  },
  pointOfInterest: Object,
});

const map = ref(null);

onMounted(() => {
  map.value = L.map("map");
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value);
});

// Plot current location
useReactiveMapLayer(map, props.location, props.follow, (x) => L.circle(
  [x.latitude, x.longitude],
  {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.3,
    radius: 40
  }
));
// Plot active beacon, if any
useReactiveMapLayer(map, props.beacon, props.follow, (x) => L.marker(
  [x.latitude, x.longitude],
  {
    icon: L.divIcon({
      className: 'beacon-icon',
      iconSize: [20, 20],
    })
  }
));
// Plot point of interest, e.g. on detail page
useReactiveMapLayer(map, props.pointOfInterest, props.follow, (x) => L.marker(
  [x.latitude, x.longitude],
  {
    icon: L.divIcon({
      className: 'poi-icon',
      iconSize: [20, 20],
    })
  }
));
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
  border-bottom: 30px solid red;
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

/* Detail marker on map */
.poi-icon {
  position: relative;
  width: 20px;
  height: 20px;
  background-color: black;
  border-radius: 50% 50% 50% 50%;
  border: 3px solid #2c3e50;
}
</style>