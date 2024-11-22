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
          :data-latitude="callout.location!.geometry.coordinates[1]"
          :data-longitude="callout.location!.geometry.coordinates[0]"
        >
          🔊
        </button>
        <RouterLink :to="{ name: 'Detail', params: {
          name: callout.text,
          lat: callout.location!.geometry.coordinates[1],
          lon: callout.location!.geometry.coordinates[0],
         } }">
          {{ callout.text }}
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import BeaconController from './BeaconController.vue'
import { QueuedSpeech } from '../state/audio';
import { beacon } from '../state/beacon';

interface CalloutListProps {
  callouts: QueuedSpeech[];
}
const props = defineProps<CalloutListProps>();

const startBeacon = (e: MouseEvent) => {
  let target = e.target as HTMLButtonElement;
  beacon.set({
    name: target.getAttribute("data-name")!,
    latitude: +target.getAttribute('data-latitude')!,
    longitude: +target.getAttribute('data-longitude')!
  });
  beacon.start();
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

#recentCalloutsList a {
  text-decoration: none;
  color:#000;
}
</style>