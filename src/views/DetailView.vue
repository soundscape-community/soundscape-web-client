<template>
  <SubpageTopbar title="Location" />

  <h2>{{ props.name }}</h2>

  <p v-if="myLocation.latitude">
    {{ distance }} {{ units }}
  </p>

  <button class="nav-button" @click="toggleBeacon">
    {{ beacon.enabled ? '⏸ Pause beacon' : '▶ Start beacon' }}
  </button>

  <div>
    <button class="nav-button" @click="copyToClipboard">
      🗐 Copy URL
    </button>
    <p v-if="copySuccess">URL copied to clipboard!</p>
  </div>

  <MapDisplay
    :location="myLocation"
    :beacon="beacon"
    :pointOfInterest="pointOfInterest"
    :follow="false"
  />
</template>

<script setup>
import MapDisplay from '../components/MapDisplay.vue';
import SubpageTopbar from '../components/SubpageTopbar.vue';
import { beacon } from '../state/beacon.js';
import { myLocation, distanceTo } from '../state/location.js'
import { point } from '@turf/helpers';
import { computed, onMounted, reactive, ref } from 'vue';

const props = defineProps({
  lat: Number,
  lon: Number,
  name: String,
});

const fullUrl = ref('');
const pointOfInterest = reactive({
  latitude: props.lat,
  longitude: props.lon,
});

const turfPoint = computed(
  () => point([props.lon, props.lat])
);
const units = "feet";
const distance = computed(
  () => distanceTo.value(turfPoint.value, { units: units }).toFixed(0)
);

onMounted(() => {
  fullUrl.value = window.location.href;
});

const copySuccess = ref(false);
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(fullUrl.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000); // Hide the success message after 2 seconds
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const toggleBeacon = () => {
  //FIXME if this link was visited directly, need to start tracking position + orientation
  //useDeviceOrientation((h) => myLocation.setHeading(h));
  //tracker.start();

  if (beacon.enabled) {
    beacon.stop();
  } else {
    beacon.set(props.name, props.lat, props.lon);
    beacon.start();
  }
}
</script>