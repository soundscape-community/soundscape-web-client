<template>
  <!--TODO separate views-->
  <HelpView v-if="mode == 'help'" />
  <ToolbarGPX v-else-if="mode == 'gpx'" />
  <ToolbarMain v-else />

  <main v-if="mode != 'help'">
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
import HelpView from './components/HelpView.vue';
import MapDisplay from './components/MapDisplay.vue';
import ToolbarGPX from './components/ToolbarGPX.vue';
import ToolbarMain from './components/ToolbarMain.vue';
import { beacon } from './store/beacon.js';
import { myLocation } from './store/location.js';
import { recentCallouts } from './utils/sound.js';

const mode = ref(null);

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  mode.value = params.get('mode')
});
</script>

<style>
main {
  padding: 15px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

/* Top button bar */
nav {
  display: flex;
  justify-content: space-between; /* Adjust alignment of elements */
  align-items: center;
  background-color: #2c3e50;
  color: white;
  padding: 15px;
  overflow-x: hidden; /* Prevent horizontal scrolling */
}

.nav-button,
.beacon-button,
nav input,
nav select {
  background-color: #e74c3c;
  color: #fff;
  border: none;
  padding: 10px; /* Decrease padding */
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em; /* Adjust font size */
}

nav input,
nav select {
  max-width: 30%; /* on replay_gpx, don't let file selector/slider get too big */
}
</style>