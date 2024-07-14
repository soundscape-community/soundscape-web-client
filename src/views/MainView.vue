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
      <RouterLink to="/help">
        <i class="fas fa-question" style="color: white;"></i>
      </RouterLink>
    </button>
  </nav>

  <main>
    <MapDisplay
      :location="myLocation"
      :beacon="beacon"
    />
    <CalloutList :callouts="recentCallouts" />
  </main>
</template>

<script setup>
import CalloutList from '../components/CalloutList.vue';
import InputSpinner from '../components/InputSpinner.vue';
import MainModeSelector from '../components/MainModeSelector.vue';
import MapDisplay from '../components/MapDisplay.vue';
import VoiceSelector from '../components/VoiceSelector.vue';
import { beacon } from '../state/beacon.js';
import { myLocation } from '../state/location.js';
import { recentCallouts } from '../state/audio.js';
import { audioQueue } from '../state/audio.js';
import { useFixedPosition, useRealPosition } from '../composables/tracking.js';
import { onMounted, ref } from 'vue';

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