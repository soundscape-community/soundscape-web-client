<template>
  <component :is="toolbar" />    
  <main>
    <MapDisplay
      :location="myLocation"
      :beacon="beacon"
    />
    <CalloutList :callouts="recentCallouts" />
  </main>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import CalloutList from './components/CalloutList.vue';
import MapDisplay from './components/MapDisplay.vue';
import ToolbarGPX from './components/ToolbarGPX.vue';
import ToolbarMain from './components/ToolbarMain.vue';
import { beacon } from './store/beacon.js';
import { myLocation } from './store/location.js';
import { recentCallouts } from './utils/sound.js';

const gpxMode = ref(false);

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  gpxMode.value = params.has('mode') && params.get('mode') === 'gpx';
});

const toolbar = computed(() => gpxMode.value ? ToolbarGPX : ToolbarMain);
</script>