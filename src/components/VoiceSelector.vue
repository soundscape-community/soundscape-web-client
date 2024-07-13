<template>
  <select
    class="nav-button"
    id="voice"
    v-model="selectedVoice"
    name="voice"
    title="Voice"
    required
  >
    <option 
      v-for="voice in voices"
      :key="voice.voiceIndex"
      :value="voice.voiceIndex"
    >
      🗣 {{ voice.name }}
    </option>
  </select>
</template>

<script setup>
import { audioQueue } from '../utils/sound.js';
import { ref, onMounted, watch } from 'vue';

const voices = ref([]);
const selectedVoice = ref(null);

onMounted(async () => {
  if (window.speechSynthesis) {
    // Update voices when they change (and when they initially become available)
    window.speechSynthesis.onvoiceschanged = reloadVoices;
  }
  await reloadVoices();
});

const reloadVoices = async () => {
  voices.value = await audioQueue.loadVoices();
  selectedVoice.value = audioQueue.voice.voiceIndex;
};

watch(selectedVoice, (newValue, oldValue) => {
  if (newValue !== null) {
    audioQueue.setVoice(selectedVoice.value);
  }
});
</script>