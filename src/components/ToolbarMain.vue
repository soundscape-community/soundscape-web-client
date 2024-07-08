<template>
  <nav>
    <MainModeSelector :tracker="tracker" />
    <VoiceSelector />
    <InputSpinner
      title="Speaking rate"
      :min="1" :max="5" :initial="audioQueue.rate"
      :incAction="audioQueue.increaseRate"
      :decAction="audioQueue.decreaseRate"
    />
    <button class="nav-button">
      <a href="./help.html" title="FAQ page">
        <i class="fas fa-question" style="color: white;"></i>
      </a>
    </button>
  </nav>
</template>

<script setup>
import MainModeSelector from './MainModeSelector.vue';
import InputSpinner from './InputSpinner.vue';
import VoiceSelector from './VoiceSelector.vue';
import { inject, onMounted, ref } from 'vue';
import { fixedTracker, realTracker } from '../utils/tracker.js';

const audioQueue = inject('audioQueue');

var tracker = ref(null);

onMounted(() => {
  // Use fixed location if user specified URL parameters.
  const params = new URLSearchParams(window.location.search);
  var lat = parseFloat(params.get("lat"));
  var lon = parseFloat(params.get("lon"));
  var head = parseFloat(params.get("heading"));
  if (!isNaN(lat) && !isNaN(lon) && !isNaN(head)) {
    tracker.value = fixedTracker(lat, lon, head);
  } else {
    tracker.value = realTracker();
  }
});
</script>