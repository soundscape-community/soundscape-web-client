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
      <a href="./?mode=help" title="FAQ page">
        <i class="fas fa-question" style="color: white;"></i>
      </a>
    </button>
  </nav>
</template>

<script setup>
import MainModeSelector from './MainModeSelector.vue';
import InputSpinner from './InputSpinner.vue';
import VoiceSelector from './VoiceSelector.vue';
import { onMounted, ref } from 'vue';
import { audioQueue } from '../state/audio.js';
import { useFixedPosition, useRealPosition } from '../composables/tracking.js';

var tracker = ref(null);

onMounted(() => {
  // Use fixed location if user specified URL parameters.
  const params = new URLSearchParams(window.location.search);
  var lat = parseFloat(params.get("lat"));
  var lon = parseFloat(params.get("lon"));
  if (!isNaN(lat) && !isNaN(lon)) {
    tracker.value = useFixedPosition(lat, lon);
  } else {
    tracker.value = useRealPosition();
  }
});
</script>