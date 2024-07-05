<template>
  <section id="recentCalloutsArea">
    <!-- Beacon controls -->
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

    <!-- List of 25 most recent callouts (newest first) -->
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
import { createBeacon, currentBeacon } from '../audio/notabeacon.js';
import { inject } from 'vue';

const audioQueue = inject('audioQueue');
const locationProvider = inject('locationProvider');

const calloutsList = recentCallouts;

const startBeacon = (e) => {
  // Stop old beacon
  if (currentBeacon.beacon) {
    currentBeacon.beacon.stop();
  }

  // Create and start new beacon
  currentBeacon.beacon = createBeacon(
    e.target.getAttribute("data-name"),
    e.target.getAttribute('data-latitude'),
    e.target.getAttribute('data-longitude'),
    locationProvider,
    audioQueue
  );
  currentBeacon.beacon.start();
  currentBeacon.playing= currentBeacon.beacon.isEnabled();
};

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
#recentCalloutsArea {
  height: calc(100vh - 435px);
  overflow-y: auto;
  flex-basis: 100%;
}

#recentCalloutsList {
  padding: 0;
  margin: 0;
}

#recentCalloutsList li,
#recentCalloutsArea p {
  list-style: none;
  border-bottom: 2px solid #000;
  padding: 15px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Active beacon controls */
#recentCalloutsArea p {
  background-color: #e74c3c;
  color: #fff;
  font-weight: bold;
}

#recentCalloutsArea p button {
  background-color: #2c3e50;
}

#recentCalloutsArea button {
  width: 60px;
}
</style>