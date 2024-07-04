<template>
  <section id="recentCalloutsArea">
    <p v-if="currentBeacon">
      <button
        id="toggleBeacon"
        class="beacon-button"
        @click="toggleBeacon"
      >
        {{ beaconIsPlaying ? '⏸' : '▶' }}
      </button>
      <span id="currentBeacon">{{ currentBeacon.name }}</span>
    </p>

    <ul id="recentCalloutsList">
      <li v-for="callout in calloutsList.slice(0, 25)">
        <button
          title="Start beacon"
          class="beacon-button"
          @click="startBeacon"
          :data-name="callout.text"
          :data-latitude="callout.location.geometry.coordinates[1]"
          :data-longitude="callout.location.geometry.coordinates[0]"
        >
          🔊
        </button>
        {{ callout.text }}
      </li>
    </ul>
  </section>
</template>

<script setup>
import { recentCallouts } from '../audio/sound.js';
import { createBeacon } from '../audio/notabeacon.js';
import { inject, ref, onMounted, watch } from 'vue';

const audioQueue = inject('audioQueue');
const locationProvider = inject('locationProvider');

const calloutsList = recentCallouts;
const currentBeacon = ref(null);
const beaconIsPlaying = ref(false);

const startBeacon = (e) => {
  // Stop old beacon
  if (currentBeacon.value) {
    currentBeacon.value.stop();
  }

  // Create and start new beacon
  currentBeacon.value = createBeacon(
    e.target.getAttribute("data-name"),
    e.target.getAttribute('data-latitude'),
    e.target.getAttribute('data-longitude'),
    locationProvider,
    audioQueue
  );
  currentBeacon.value.start();
  beaconIsPlaying.value = currentBeacon.value.isEnabled();
};

const toggleBeacon = () => {
  if (currentBeacon.value) {
    if (currentBeacon.value.isEnabled()) {
      currentBeacon.value.stop();
    } else {
      currentBeacon.value.start();
    }
    beaconIsPlaying.value = currentBeacon.value.isEnabled();
  }
};
</script>