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
useReactiveMapLayer(map, props.location, {
  setMapView: true,
  follow: props.follow,
  className: 'my-location-icon',
  iconSize: [40, 40],
});

// Plot active beacon, if any
useReactiveMapLayer(map, props.beacon, {
  className: 'beacon-icon',
  iconSize: [20, 20],
});

// Plot point of interest, e.g. on detail page
useReactiveMapLayer(map, props.pointOfInterest, {
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