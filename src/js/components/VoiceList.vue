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
import { inject, ref, onMounted, watch } from 'vue';

const audioQueue = inject('audioQueue');
const voices = ref([]);
const selectedVoice = ref(null);

onMounted(async () => {
  voices.value = await audioQueue.loadVoices();
  selectedVoice.value = audioQueue.voice.voiceIndex;
});

watch(selectedVoice, (newValue, oldValue) => {
  if (newValue !== null) {
    audioQueue.setVoice(selectedVoice.value);
  }
});
</script>