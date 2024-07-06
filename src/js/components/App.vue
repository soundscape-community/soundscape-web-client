<template>
  <component :is="toolbar" />    
  <main>
    <MapDisplay />
    <CalloutList />
  </main>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import CalloutList from './CalloutList.vue';
import MapDisplay from './MapDisplay.vue';
import ToolbarGPX from './ToolbarGPX.vue';
import ToolbarMain from './ToolbarMain.vue';

const gpxMode = ref(false);

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  console.log(params);
  gpxMode.value = params.has('mode') && params.get('mode') === 'gpx';
  console.log(gpxMode.value)
});

const toolbar = computed(() => gpxMode.value ? ToolbarGPX : ToolbarMain);
</script>