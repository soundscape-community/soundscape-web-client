<template>
  <p v-if="beacon.location">
    <button
      id="toggleBeacon"
      class="beacon-button"
      :title="beacon.enabled ? 'Pause beacon' : 'Play beacon'"
      @click="toggleBeacon"
    >
      {{ beacon.enabled ? '⏸' : '▶' }}
    </button>
    <span id="currentBeacon">{{ beacon.location.name }}</span>
    <button
      class="beacon-button"
      id="clearBeacon"
      title="Clear beacon"
      @click="clearBeacon"
    >
      ❌
    </button>
  </p>
</template>

<script setup>
import { beacon } from '../state/beacon';

const toggleBeacon = () => {
  if (beacon.enabled) {
    beacon.stop();
  } else {
    beacon.start();
  }
};

const clearBeacon = () => {
  beacon.stop();
  beacon.clear();
};
</script>

<style>
#recentCalloutsArea p {
  background-color: #e74c3c;
  color: #fff;
  font-weight: bold;
  position: relative;
}

#recentCalloutsArea p button {
  background-color: #2c3e50;
}

#clearBeacon {
  position: absolute;
  right: 15px;
}
</style>