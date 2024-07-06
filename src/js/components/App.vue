<template>
  <component :is="toolbar" />    
  <main>
    <MapDisplay
      :location="location"
      :orientation="orientation"
      :beacon="currentBeacon"
    />
    <CalloutList :callouts="recentCallouts" />
  </main>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import CalloutList from './CalloutList.vue';
import MapDisplay from './MapDisplay.vue';
import ToolbarGPX from './ToolbarGPX.vue';
import ToolbarMain from './ToolbarMain.vue';
import { currentBeacon } from '../audio/notabeacon.js';
import { location, orientation } from '../spatial/location.js';
import { recentCallouts } from '../audio/sound.js';

const gpxMode = ref(false);

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  gpxMode.value = params.has('mode') && params.get('mode') === 'gpx';
});

const toolbar = computed(() => gpxMode.value ? ToolbarGPX : ToolbarMain);
</script>