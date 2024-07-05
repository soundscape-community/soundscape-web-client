<template>
  <p v-if="currentBeacon.beacon">
    <button
      id="toggleBeacon"
      class="beacon-button"
      @click="toggleBeacon"
    >
      {{ currentBeacon.playing ? '⏸' : '▶' }}
    </button>
    <span id="currentBeacon">{{ currentBeacon.beacon.name }}</span>
  </p>
</template>

<script setup>
import { currentBeacon } from '../audio/notabeacon.js';

const toggleBeacon = () => {
  if (currentBeacon.beacon) {
    if (currentBeacon.playing) {
      currentBeacon.beacon.stop();
    } else {
      currentBeacon.beacon.start();
    }
    currentBeacon.playing= currentBeacon.beacon.isEnabled();
  }
};
</script>

<style>
#recentCalloutsArea p {
  background-color: #e74c3c;
  color: #fff;
  font-weight: bold;
}

#recentCalloutsArea p button {
  background-color: #2c3e50;
}
</style>