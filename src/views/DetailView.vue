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
    :beacon="beacon.location"
    :pointOfInterest="pointOfInterest"
    :follow="false"
  />
</template>

<script setup lang="ts">
import MapDisplay from '../components/MapDisplay.vue';
import SubpageTopbar from '../components/SubpageTopbar.vue';
import { beacon } from '../state/beacon';
import { myLocation, distanceTo } from '../state/location'
import { point } from '@turf/helpers';
import { computed, onMounted, reactive, ref } from 'vue';

interface DetailProps {
  lat: number;
  lon: number;
  name: string;
}
const props = defineProps<DetailProps>();

const fullUrl = ref<string>('');
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
    beacon.disable();
  } else {
    beacon.set({
      name: props.name,
      latitude: props.lat,
      longitude: props.lon
    });
    beacon.enable();
  }
}
</script>