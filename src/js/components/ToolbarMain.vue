<template>
  <nav>
    <MainModeSelector />
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
import { inject } from 'vue';
import InputSpinner from './InputSpinner.vue';
import MainModeSelector from './MainModeSelector.vue';
import VoiceSelector from './VoiceSelector.vue';

const audioQueue = inject('audioQueue');
</script>