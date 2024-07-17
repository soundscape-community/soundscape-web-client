<template>
  <div v-if="isVisible" class="wall-overlay">
    <div class="wall-content">
      <div>
        <img src="/assets/icon-foreground.png" alt="Soundscape logo" title="Welcome to Soundscape" />
        <p>Soundscape Web Client</p>
      </div>
      <button class="nav-button" @click="removewall">Start exploring</button>
    </div>
  </div>
</template>
  
<script setup>
import { beacon } from '../state/beacon.js';
import { useDeviceOrientation } from "../composables/compass.js";
import { myLocation } from '../state/location.js';
import { initializeAudioQueue, playSpatialSpeech } from '../state/audio.js';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const emit = defineEmits(['initialized']);
const isVisible = ref(true);
const router = useRoute();

const removewall = () => {
  // Start audio context, load voices, ...
  initializeAudioQueue();

  // required for iOS Safari: first speech must be directly triggered by user action
  playSpatialSpeech(" ");
  // ...as well as device orientation tracking
  useDeviceOrientation((h) => myLocation.setHeading(h));

  // Start geolocation services, unless we're in fixed-location mode
  if (router.name != "Fixed") {
    watchLocation((latitude, longitude) => {
      myLocation.setLocation(latitude, longitude);
    });
  }

  // Start audio context for beacon effects
  beacon.initialize();

  // Report to parent that we're ready
  isVisible.value = false;
  emit('initialized');
};

const watchLocation = (callback) => {
  return navigator.geolocation.watchPosition(
    function (position) {
      console.log(position);
      callback(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.heading,
      );
    },
    function (error) {
      if (error.code == error.PERMISSION_DENIED) {
        alert("Could not get your location. If you did not see a permission request, make sure your browser is not configured to always block location services.")
      } else {
        console.error("Error getting current position: " + error.message);
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 0,
    }
  );
};
</script>

<style scoped>
.wall-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #243a66;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.wall-content {
  background: #243a66;
  color: white;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
}
.wall-content button {
  margin-top: 10px;
  padding: 10px 20px;
}
</style>