<template>
  <p v-if="beacon.name">
    <button
      id="toggleBeacon"
      class="beacon-button"
      @click="toggleBeacon"
    >
      {{ beacon.enabled ? '⏸' : '▶' }}
    </button>
    <span id="currentBeacon">{{ beacon.name }}</span>
  </p>
</template>

<script setup>
import { beacon } from '../store/beacon.js';

const toggleBeacon = () => {
  if (beacon.enabled) {
    beacon.stop();
  } else {
    beacon.start();
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