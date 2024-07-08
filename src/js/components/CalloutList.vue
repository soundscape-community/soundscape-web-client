<template>
  <section id="recentCalloutsArea">
    <BeaconController />

    <ul id="recentCalloutsList">
      <li v-for="callout in callouts.slice(0, 25)">
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
import BeaconController from './BeaconController.vue'
import { createBeacon, currentBeacon } from '../audio/notabeacon.js';
import { inject } from 'vue';

const audioQueue = inject('audioQueue');

const props = defineProps({
  callouts: Array,
})

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
    audioQueue
  );
  currentBeacon.beacon.start();
  currentBeacon.playing= currentBeacon.beacon.isEnabled();
};
</script>

<style>
#recentCalloutsArea {
  height: calc(100vh - 435px);
  overflow-y: auto;
  flex-basis: 100%;
}

/* display map + recent callouts side-by-side on sufficiently wide screens */
@media screen and (min-width: 600px) {
  #recentCalloutsArea {
    height: calc(100vh - 140px);
    flex-basis: 48%;
  }
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

#recentCalloutsArea button {
  width: 60px;
}
</style>